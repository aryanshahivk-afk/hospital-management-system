namespace HMS.Api.Services;

public record CatalogItem(string Id, string Description, string Category, decimal Price, string? Department = null);

// A fixed, published price list — this is what makes a bill traceable to real charges
// instead of an arbitrary number. Front desk picks quantities of these; the server looks
// up the authoritative price by Id, never trusting a client-supplied amount for anything
// except the one deliberately flexible "Pharmacy" line (medicines vary too much to
// catalog exhaustively, so that line stays free-text/amount but is clearly labeled and
// capped, rather than the entire bill being one unlabeled number).
public static class BillingCatalog
{
    public const decimal PharmacyMaxPerLine = 50_000m;

    public static readonly List<CatalogItem> Items = new()
    {
        // Consultation fees — vary by department, exactly like a real hospital's fee schedule.
        new("consult-cardiology", "Cardiology Consultation", "Consultation", 1500m, "Cardiology"),
        new("consult-orthopedics", "Orthopedics Consultation", "Consultation", 1200m, "Orthopedics"),
        new("consult-general-medicine", "General Medicine Consultation", "Consultation", 800m, "General Medicine"),
        new("consult-ent", "ENT Consultation", "Consultation", 1000m, "ENT"),

        // Diagnostics / lab tests — department-agnostic, standard fixed prices.
        new("lab-cbc", "Complete Blood Count (CBC)", "Lab Test", 500m),
        new("lab-blood-sugar", "Blood Sugar Test", "Lab Test", 300m),
        new("lab-urine", "Urine Routine Test", "Lab Test", 350m),
        new("lab-xray", "X-Ray", "Lab Test", 1200m),
        new("lab-ecg", "ECG", "Lab Test", 800m),
        new("lab-ultrasound", "Ultrasound", "Lab Test", 2500m),
        new("lab-ct-scan", "CT Scan", "Lab Test", 6000m),
        new("lab-mri", "MRI Scan", "Lab Test", 8000m),

        // Procedures.
        new("proc-minor-surgery", "Minor Surgery", "Procedure", 15000m),
        new("proc-physio", "Physiotherapy Session", "Procedure", 1000m),
        new("proc-dressing", "Wound Dressing", "Procedure", 300m),
        new("proc-injection", "Injection Administration", "Procedure", 200m),
        new("proc-cast", "Cast Application", "Procedure", 2500m),

        // Room charges, per day.
        new("room-general", "General Ward (per day)", "Room Charge", 1000m),
        new("room-private", "Private Room (per day)", "Room Charge", 3000m),
        new("room-icu", "ICU (per day)", "Room Charge", 8000m),
    };

    public static CatalogItem? Find(string id) => Items.FirstOrDefault(i => i.Id == id);
}
