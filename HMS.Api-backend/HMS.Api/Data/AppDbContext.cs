using HMS.Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

namespace HMS.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Doctor> Doctors => Set<Doctor>();
    public DbSet<Patient> Patients => Set<Patient>();
    public DbSet<Department> Departments => Set<Department>();
    public DbSet<Appointment> Appointments => Set<Appointment>();
    public DbSet<Bill> Bills => Set<Bill>();
    public DbSet<EmiApplication> EmiApplications => Set<EmiApplication>();
    public DbSet<EmiPlan> EmiPlans => Set<EmiPlan>();
    public DbSet<Installment> Installments => Set<Installment>();
    public DbSet<Report> Reports => Set<Report>();
    public DbSet<AdminAccount> AdminAccounts => Set<AdminAccount>();
    public DbSet<IdCounter> IdCounters => Set<IdCounter>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();

    protected override void OnModelCreating(ModelBuilder b)
    {
        // SQLite has no native timezone-aware datetime type — EF Core round-trips a
        // DateTime through it as a plain string and loses DateTimeKind on the way back
        // out (it comes back "Unspecified" even though we wrote UtcNow). That made
        // System.Text.Json skip the trailing "Z" when serializing timestamps, so the
        // browser silently reinterpreted a UTC time as if it were already local —
        // this is why the audit log showed actions as hours old right after they
        // happened. This converter forces every DateTime read back out of SQLite to be
        // explicitly re-tagged as UTC, so it always serializes correctly.
        var utcConverter = new ValueConverter<DateTime, DateTime>(
            toDb => toDb.Kind == DateTimeKind.Utc ? toDb : toDb.ToUniversalTime(),
            fromDb => DateTime.SpecifyKind(fromDb, DateTimeKind.Utc)
        );
        foreach (var entityType in b.Model.GetEntityTypes())
        {
            foreach (var property in entityType.GetProperties())
            {
                if (property.ClrType == typeof(DateTime))
                    property.SetValueConverter(utcConverter);
            }
        }

        b.Entity<Doctor>().HasKey(x => x.Id);
        b.Entity<Patient>().HasKey(x => x.Id);
        b.Entity<Patient>()
            .HasOne(p => p.Doctor)
            .WithMany(d => d.Patients)
            .HasForeignKey(p => p.DoctorId)
            .OnDelete(DeleteBehavior.SetNull);

        b.Entity<Department>().HasKey(x => x.Id);

        b.Entity<Appointment>().HasKey(x => x.Id);

        b.Entity<Bill>().HasKey(x => x.Id);
        b.Entity<Bill>().Property(x => x.Amount).HasPrecision(12, 2);
        b.Entity<Bill>().Property(x => x.Paid).HasPrecision(12, 2);

        b.Entity<EmiApplication>().HasKey(x => x.Id);
        b.Entity<EmiApplication>().Property(x => x.Amount).HasPrecision(12, 2);

        b.Entity<EmiPlan>().HasKey(x => x.BillId);
        b.Entity<EmiPlan>()
            .HasOne(p => p.Bill)
            .WithOne(bill => bill.EmiPlan)
            .HasForeignKey<EmiPlan>(p => p.BillId)
            .OnDelete(DeleteBehavior.Cascade);
        b.Entity<EmiPlan>().Property(x => x.TotalAmount).HasPrecision(12, 2);
        b.Entity<EmiPlan>().Property(x => x.DownPayment).HasPrecision(12, 2);
        b.Entity<EmiPlan>().Property(x => x.RemainingAmount).HasPrecision(12, 2);
        b.Entity<EmiPlan>().Property(x => x.MonthlyAmount).HasPrecision(12, 2);

        b.Entity<Installment>().HasKey(x => x.Id);
        b.Entity<Installment>().Property(x => x.Amount).HasPrecision(12, 2);
        b.Entity<Installment>()
            .HasOne(i => i.EmiPlan)
            .WithMany(p => p.Installments)
            .HasForeignKey(i => i.EmiPlanBillId)
            .OnDelete(DeleteBehavior.Cascade);

        b.Entity<Report>().HasKey(x => x.Id);

        b.Entity<AdminAccount>().HasKey(x => x.Username);

        b.Entity<IdCounter>().HasKey(x => x.Prefix);

        b.Entity<AuditLog>().HasKey(x => x.Id);
    }
}
