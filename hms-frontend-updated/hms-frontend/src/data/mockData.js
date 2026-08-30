// Seed data for the DataContext. Every array here is what a real fetch()
// call to the ASP.NET Core API should eventually return.

export const initialDoctors = [
  { id: "DR-201", name: "Dr. Sabina Basnet", specialty: "Cardiology", phone: "970-112-0021", patientsToday: 8, status: "Available", password: "doctor123" },
  { id: "DR-202", name: "Dr. Arjun Karki", specialty: "Orthopedics", phone: "970-334-9012", patientsToday: 5, status: "In Surgery", password: "doctor123" },
  { id: "DR-203", name: "Dr. Manisha Poudel", specialty: "General Medicine", phone: "970-556-4423", patientsToday: 12, status: "Available", password: "doctor123" },
  { id: "DR-204", name: "Dr. Rajan Shakya", specialty: "ENT", phone: "970-778-6634", patientsToday: 3, status: "Off Duty", password: "doctor123" },
];

export const initialPatients = [
  { id: "PT-1042", name: "Sujata Koirala", age: 34, gender: "Female", phone: "980-112-4456", department: "Cardiology", doctorId: "DR-201", lastVisit: "2026-07-28", status: "Admitted", password: "patient123" },
  { id: "PT-1041", name: "Bikash Thapa", age: 51, gender: "Male", phone: "981-223-9981", department: "Orthopedics", doctorId: "DR-202", lastVisit: "2026-07-26", status: "Discharged", password: "patient123" },
  { id: "PT-1040", name: "Anita Rai", age: 27, gender: "Female", phone: "984-556-2210", department: "General Medicine", doctorId: "DR-203", lastVisit: "2026-07-25", status: "Outpatient", password: "patient123" },
  { id: "PT-1039", name: "Ramesh Yadav", age: 63, gender: "Male", phone: "985-778-3312", department: "Cardiology", doctorId: "DR-201", lastVisit: "2026-07-22", status: "Admitted", password: "patient123" },
  { id: "PT-1038", name: "Nirmala Shrestha", age: 45, gender: "Female", phone: "986-441-7765", department: "ENT", doctorId: "DR-204", lastVisit: "2026-07-20", status: "Discharged", password: "patient123" },
  { id: "PT-1037", name: "Prakash Limbu", age: 39, gender: "Male", phone: "982-334-5590", department: "Orthopedics", doctorId: "DR-202", lastVisit: "2026-07-18", status: "Outpatient", password: "patient123" },
];

export const initialDepartments = [
  { id: "DP-01", name: "Cardiology", head: "Dr. Sabina Basnet", doctors: 4, beds: 20, occupied: 14 },
  { id: "DP-02", name: "Orthopedics", head: "Dr. Arjun Karki", doctors: 3, beds: 16, occupied: 9 },
  { id: "DP-03", name: "General Medicine", head: "Dr. Manisha Poudel", doctors: 6, beds: 30, occupied: 22 },
  { id: "DP-04", name: "ENT", head: "Dr. Rajan Shakya", doctors: 2, beds: 8, occupied: 3 },
];

export const initialAppointments = [
  { id: "AP-3301", patientId: "PT-1042", patient: "Sujata Koirala", doctorId: "DR-201", doctor: "Dr. Sabina Basnet", date: "2026-08-04", time: "10:30 AM", type: "Follow-up", status: "Confirmed" },
  { id: "AP-3302", patientId: "PT-1037", patient: "Prakash Limbu", doctorId: "DR-202", doctor: "Dr. Arjun Karki", date: "2026-08-04", time: "11:15 AM", type: "Consultation", status: "Confirmed" },
  { id: "AP-3303", patientId: "PT-1040", patient: "Anita Rai", doctorId: "DR-203", doctor: "Dr. Manisha Poudel", date: "2026-08-04", time: "1:00 PM", type: "New Patient", status: "Pending" },
  { id: "AP-3304", patientId: "PT-1039", patient: "Ramesh Yadav", doctorId: "DR-201", doctor: "Dr. Sabina Basnet", date: "2026-08-05", time: "9:00 AM", type: "Follow-up", status: "Confirmed" },
  { id: "AP-3305", patientId: "PT-1038", patient: "Nirmala Shrestha", doctorId: "DR-204", doctor: "Dr. Rajan Shakya", date: "2026-08-05", time: "2:30 PM", type: "Consultation", status: "Cancelled" },
];

export const initialBills = [
  { id: "BL-5501", patientId: "PT-1042", patient: "Sujata Koirala", date: "2026-07-28", amount: 145000, paid: 45000, status: "EMI Active" },
  { id: "BL-5500", patientId: "PT-1039", patient: "Ramesh Yadav", date: "2026-07-22", amount: 620000, paid: 620000, status: "Paid" },
  { id: "BL-5499", patientId: "PT-1041", patient: "Bikash Thapa", date: "2026-07-26", amount: 82000, paid: 20000, status: "EMI Pending Approval" },
  { id: "BL-5498", patientId: "PT-1040", patient: "Anita Rai", date: "2026-07-25", amount: 12500, paid: 12500, status: "Paid" },
  { id: "BL-5497", patientId: "PT-1038", patient: "Nirmala Shrestha", date: "2026-07-20", amount: 28000, paid: 8000, status: "Overdue" },
];

// Keyed by bill id. Populated by approveEmi() in DataContext once a plan is approved.
export const initialEmiPlans = {
  "BL-5501": {
    billId: "BL-5501",
    patientId: "PT-1042",
    patient: "Sujata Koirala",
    totalAmount: 145000,
    downPayment: 45000,
    remainingAmount: 100000,
    tenureMonths: 5,
    monthlyAmount: 20000,
    approvedBy: "R. Sharma (Front Desk)",
    approvedOn: "2026-07-29",
    installments: [
      { number: 1, dueDate: "2026-08-05", amount: 20000, status: "Paid", paidOn: "2026-08-03" },
      { number: 2, dueDate: "2026-09-05", amount: 20000, status: "Upcoming" },
      { number: 3, dueDate: "2026-10-05", amount: 20000, status: "Upcoming" },
      { number: 4, dueDate: "2026-11-05", amount: 20000, status: "Upcoming" },
      { number: 5, dueDate: "2026-12-05", amount: 20000, status: "Upcoming" },
    ],
  },
};

export const initialEmiApplications = [
  {
    id: "EMI-901",
    patientId: "PT-1042",
    patient: "Sujata Koirala",
    billId: "BL-5501",
    amount: 100000,
    tenure: 5,
    status: "Approved",
    identityVerified: true,
    appliedOn: "2026-07-28",
  },
  {
    id: "EMI-902",
    patientId: "PT-1041",
    patient: "Bikash Thapa",
    billId: "BL-5499",
    amount: 62000,
    tenure: 4,
    status: "Pending Verification",
    identityVerified: false,
    appliedOn: "2026-07-27",
  },
];

// Simple visit/report records patients can view.
export const initialReports = [
  { id: "RPT-701", patientId: "PT-1042", date: "2026-07-28", doctor: "Dr. Sabina Basnet", title: "Cardiac follow-up", summary: "Blood pressure stable at 128/82. Continue current medication, review in 4 weeks." },
  { id: "RPT-702", patientId: "PT-1042", date: "2026-06-14", doctor: "Dr. Sabina Basnet", title: "ECG review", summary: "ECG within normal limits. No arrhythmia detected." },
  { id: "RPT-703", patientId: "PT-1041", date: "2026-07-26", doctor: "Dr. Arjun Karki", title: "Fracture assessment", summary: "Left tibia fracture healing as expected. X-ray shows good alignment, cast to remain 3 more weeks." },
  { id: "RPT-704", patientId: "PT-1040", date: "2026-07-25", doctor: "Dr. Manisha Poudel", title: "General checkup", summary: "Routine bloodwork normal. Advised to increase water intake and follow up in 6 months." },
];

export const dashboardStats = {
  totalPatients: 1284,
  todayAppointments: 23,
  activeDoctors: 15,
  pendingEmiApprovals: 2,
  revenueThisMonth: 4820000,
  outstandingBalance: 612000,
};

export const revenueTrend = [
  { month: "Mar", revenue: 3200000, emi: 420000 },
  { month: "Apr", revenue: 3650000, emi: 510000 },
  { month: "May", revenue: 3980000, emi: 480000 },
  { month: "Jun", revenue: 4210000, emi: 560000 },
  { month: "Jul", revenue: 4820000, emi: 640000 },
];

export const departmentLoad = [
  { name: "Cardiology", value: 14 },
  { name: "Orthopedics", value: 9 },
  { name: "General Medicine", value: 22 },
  { name: "ENT", value: 3 },
];

export const EMI_MIN = 30001;
export const EMI_MAX = 1000000;

export const ADMIN_ACCOUNT = { username: "admin", password: "admin123", name: "R. Sharma", role: "Front Desk Admin" };
