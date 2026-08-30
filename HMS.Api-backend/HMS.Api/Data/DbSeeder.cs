using HMS.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace HMS.Api.Data;

public static class DbSeeder
{
    public static async Task SeedAsync(AppDbContext db)
    {
        // This project ships with no EF Core migrations, so MigrateAsync() would be a
        // no-op and leave the DB schema-less on a fresh machine — EnsureCreated is what
        // actually builds the tables from the current model on first run.
        await db.Database.EnsureCreatedAsync();

        // SQLite's default journal mode holds an exclusive lock for the full duration of
        // any write, so two near-simultaneous writes (very common here — most actions
        // write an entity AND a separate audit log row) can trip a transient "database is
        // locked" error on the first attempt. WAL mode lets reads and writes proceed
        // concurrently and is far less prone to this; it's a one-time setting stored in
        // the database file itself, so this only needs to run once per file, not per
        // connection.
        await db.Database.ExecuteSqlRawAsync("PRAGMA journal_mode=WAL;");

        if (!await db.AdminAccounts.AnyAsync())
        {
            db.AdminAccounts.AddRange(
                new AdminAccount
                {
                    Username = "admin",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("admin123"),
                    Name = "R. Sharma",
                    Title = "Administrator",
                    SecurityRole = "Admin",
                },
                new AdminAccount
                {
                    Username = "frontdesk",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("frontdesk123"),
                    Name = "Bipana Rai",
                    Title = "Front Desk",
                    SecurityRole = "FrontDesk",
                }
            );
        }

        if (!await db.Doctors.AnyAsync())
        {
            var doctorPw = BCrypt.Net.BCrypt.HashPassword("doctor123");
            db.Doctors.AddRange(
                new Doctor { Id = "DR-201", Name = "Dr. Sabina Basnet", Specialty = "Cardiology", Phone = "970-112-0021", PatientsToday = 8, Status = "Available", Username = "sabina.basnet", MustChangePassword = false, PasswordHash = doctorPw },
                new Doctor { Id = "DR-202", Name = "Dr. Arjun Karki", Specialty = "Orthopedics", Phone = "970-334-9012", PatientsToday = 5, Status = "In Surgery", Username = "arjun.karki", MustChangePassword = false, PasswordHash = doctorPw },
                new Doctor { Id = "DR-203", Name = "Dr. Manisha Poudel", Specialty = "General Medicine", Phone = "970-556-4423", PatientsToday = 12, Status = "Available", Username = "manisha.poudel", MustChangePassword = false, PasswordHash = doctorPw },
                new Doctor { Id = "DR-204", Name = "Dr. Rajan Shakya", Specialty = "ENT", Phone = "970-778-6634", PatientsToday = 3, Status = "Off Duty", Username = "rajan.shakya", MustChangePassword = false, PasswordHash = doctorPw }
            );
        }

        if (!await db.Departments.AnyAsync())
        {
            db.Departments.AddRange(
                new Department { Id = "DP-01", Name = "Cardiology", Head = "Dr. Sabina Basnet", Doctors = 4, Beds = 20, Occupied = 14 },
                new Department { Id = "DP-02", Name = "Orthopedics", Head = "Dr. Arjun Karki", Doctors = 3, Beds = 16, Occupied = 9 },
                new Department { Id = "DP-03", Name = "General Medicine", Head = "Dr. Manisha Poudel", Doctors = 6, Beds = 30, Occupied = 22 },
                new Department { Id = "DP-04", Name = "ENT", Head = "Dr. Rajan Shakya", Doctors = 2, Beds = 8, Occupied = 3 }
            );
        }

        if (!await db.Patients.AnyAsync())
        {
            var patientPw = BCrypt.Net.BCrypt.HashPassword("patient123");
            db.Patients.AddRange(
                new Patient { Id = "PT-1042", Name = "Sujata Koirala", Age = 34, Gender = "Female", Phone = "980-112-4456", Department = "Cardiology", DoctorId = "DR-201", LastVisit = "2026-07-28", Status = "Admitted", Username = "sujata.koirala", MustChangePassword = false, PasswordHash = patientPw },
                new Patient { Id = "PT-1041", Name = "Bikash Thapa", Age = 51, Gender = "Male", Phone = "981-223-9981", Department = "Orthopedics", DoctorId = "DR-202", LastVisit = "2026-07-26", Status = "Discharged", Username = "bikash.thapa", MustChangePassword = false, PasswordHash = patientPw },
                new Patient { Id = "PT-1040", Name = "Anita Rai", Age = 27, Gender = "Female", Phone = "984-556-2210", Department = "General Medicine", DoctorId = "DR-203", LastVisit = "2026-07-25", Status = "Outpatient", Username = "anita.rai", MustChangePassword = false, PasswordHash = patientPw },
                new Patient { Id = "PT-1039", Name = "Ramesh Yadav", Age = 63, Gender = "Male", Phone = "985-778-3312", Department = "Cardiology", DoctorId = "DR-201", LastVisit = "2026-07-22", Status = "Admitted", Username = "ramesh.yadav", MustChangePassword = false, PasswordHash = patientPw },
                new Patient { Id = "PT-1038", Name = "Nirmala Shrestha", Age = 45, Gender = "Female", Phone = "986-441-7765", Department = "ENT", DoctorId = "DR-204", LastVisit = "2026-07-20", Status = "Discharged", Username = "nirmala.shrestha", MustChangePassword = false, PasswordHash = patientPw },
                new Patient { Id = "PT-1037", Name = "Prakash Limbu", Age = 39, Gender = "Male", Phone = "982-334-5590", Department = "Orthopedics", DoctorId = "DR-202", LastVisit = "2026-07-18", Status = "Outpatient", Username = "prakash.limbu", MustChangePassword = false, PasswordHash = patientPw }
            );
        }

        if (!await db.Appointments.AnyAsync())
        {
            // AP-3306 is dated relative to whenever the app is actually run (2 days out),
            // so the "upcoming appointment" reminder banner always has something real to
            // show on demo day, instead of relying on a hardcoded date that goes stale.
            var upcomingDemoDate = DateTime.Now.AddDays(2).ToString("yyyy-MM-dd");

            db.Appointments.AddRange(
                new Appointment { Id = "AP-3301", PatientId = "PT-1042", Patient = "Sujata Koirala", DoctorId = "DR-201", Doctor = "Dr. Sabina Basnet", Date = "2026-08-04", Time = "10:30 AM", Type = "Follow-up", Status = "Confirmed" },
                new Appointment { Id = "AP-3302", PatientId = "PT-1037", Patient = "Prakash Limbu", DoctorId = "DR-202", Doctor = "Dr. Arjun Karki", Date = "2026-08-04", Time = "11:15 AM", Type = "Consultation", Status = "Confirmed" },
                new Appointment { Id = "AP-3303", PatientId = "PT-1040", Patient = "Anita Rai", DoctorId = "DR-203", Doctor = "Dr. Manisha Poudel", Date = "2026-08-04", Time = "1:00 PM", Type = "New Patient", Status = "Pending" },
                new Appointment { Id = "AP-3304", PatientId = "PT-1039", Patient = "Ramesh Yadav", DoctorId = "DR-201", Doctor = "Dr. Sabina Basnet", Date = "2026-08-05", Time = "9:00 AM", Type = "Follow-up", Status = "Confirmed" },
                new Appointment { Id = "AP-3305", PatientId = "PT-1038", Patient = "Nirmala Shrestha", DoctorId = "DR-204", Doctor = "Dr. Rajan Shakya", Date = "2026-08-05", Time = "2:30 PM", Type = "Consultation", Status = "Cancelled" },
                new Appointment { Id = "AP-3306", PatientId = "PT-1042", Patient = "Sujata Koirala", DoctorId = "DR-201", Doctor = "Dr. Sabina Basnet", Date = upcomingDemoDate, Time = "3:00 PM", Type = "Follow-up", Status = "Confirmed" }
            );
        }

        if (!await db.Bills.AnyAsync())
        {
            db.Bills.AddRange(
                new Bill { Id = "BL-5501", PatientId = "PT-1042", Patient = "Sujata Koirala", Date = "2026-07-28", Amount = 145000, Paid = 45000, Status = "EMI Active" },
                new Bill { Id = "BL-5500", PatientId = "PT-1039", Patient = "Ramesh Yadav", Date = "2026-07-22", Amount = 620000, Paid = 620000, Status = "Paid" },
                new Bill { Id = "BL-5499", PatientId = "PT-1041", Patient = "Bikash Thapa", Date = "2026-07-26", Amount = 82000, Paid = 20000, Status = "EMI Pending Approval" },
                new Bill { Id = "BL-5498", PatientId = "PT-1040", Patient = "Anita Rai", Date = "2026-07-25", Amount = 12500, Paid = 12500, Status = "Paid" },
                new Bill { Id = "BL-5497", PatientId = "PT-1038", Patient = "Nirmala Shrestha", Date = "2026-07-20", Amount = 28000, Paid = 8000, Status = "Overdue" }
            );
        }

        await db.SaveChangesAsync();

        if (!await db.EmiApplications.AnyAsync())
        {
            db.EmiApplications.AddRange(
                new EmiApplication { Id = "EMI-901", PatientId = "PT-1042", Patient = "Sujata Koirala", BillId = "BL-5501", Amount = 100000, Tenure = 5, Status = "Approved", IdentityVerified = true, AppliedOn = "2026-07-28", FullLegalName = "Sujata Koirala", Address = "Ward 4, Baneshwor, Kathmandu", CitizenshipNumber = "12-01-76-04521" },
                new EmiApplication { Id = "EMI-902", PatientId = "PT-1041", Patient = "Bikash Thapa", BillId = "BL-5499", Amount = 62000, Tenure = 4, Status = "Pending Verification", IdentityVerified = false, AppliedOn = "2026-07-27", FullLegalName = "Bikash Thapa", Address = "Ward 9, Biratnagar, Morang", CitizenshipNumber = "23-01-69-08834" }
            );
        }

        if (!await db.EmiPlans.AnyAsync())
        {
            var plan = new EmiPlan
            {
                BillId = "BL-5501",
                PatientId = "PT-1042",
                Patient = "Sujata Koirala",
                TotalAmount = 145000,
                DownPayment = 45000,
                RemainingAmount = 100000,
                TenureMonths = 5,
                MonthlyAmount = 20000,
                ApprovedBy = "R. Sharma (Front Desk)",
                ApprovedOn = "2026-07-29",
            };
            plan.Installments = new List<Installment>
            {
                new() { Number = 1, DueDate = "2026-08-05", Amount = 20000, Status = "Paid", PaidOn = "2026-08-03" },
                new() { Number = 2, DueDate = "2026-09-05", Amount = 20000, Status = "Upcoming" },
                new() { Number = 3, DueDate = "2026-10-05", Amount = 20000, Status = "Upcoming" },
                new() { Number = 4, DueDate = "2026-11-05", Amount = 20000, Status = "Upcoming" },
                new() { Number = 5, DueDate = "2026-12-05", Amount = 20000, Status = "Upcoming" },
            };
            db.EmiPlans.Add(plan);
        }

        if (!await db.Reports.AnyAsync())
        {
            db.Reports.AddRange(
                new Report { Id = "RPT-701", PatientId = "PT-1042", Date = "2026-07-28", Doctor = "Dr. Sabina Basnet", Title = "Cardiac follow-up", Summary = "Blood pressure stable at 128/82. Continue current medication, review in 4 weeks." },
                new Report { Id = "RPT-702", PatientId = "PT-1042", Date = "2026-06-14", Doctor = "Dr. Sabina Basnet", Title = "ECG review", Summary = "ECG within normal limits. No arrhythmia detected." },
                new Report { Id = "RPT-703", PatientId = "PT-1041", Date = "2026-07-26", Doctor = "Dr. Arjun Karki", Title = "Fracture assessment", Summary = "Left tibia fracture healing as expected. X-ray shows good alignment, cast to remain 3 more weeks." },
                new Report { Id = "RPT-704", PatientId = "PT-1040", Date = "2026-07-25", Doctor = "Dr. Manisha Poudel", Title = "General checkup", Summary = "Routine bloodwork normal. Advised to increase water intake and follow up in 6 months." }
            );
        }

        if (!await db.IdCounters.AnyAsync())
        {
            db.IdCounters.AddRange(
                new IdCounter { Prefix = "PT", Value = 1042 },
                new IdCounter { Prefix = "DR", Value = 204 },
                new IdCounter { Prefix = "AP", Value = 3305 },
                new IdCounter { Prefix = "BL", Value = 5501 },
                new IdCounter { Prefix = "EMI", Value = 902 },
                new IdCounter { Prefix = "RPT", Value = 704 }
            );
        }

        await db.SaveChangesAsync();
    }
}
