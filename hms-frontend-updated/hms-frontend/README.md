# BIC SmartCare — Hospital Management System (Frontend)

React + Vite + Tailwind CSS v4 frontend for the Hospital Management System with EMI
Management, built for the Summer Enrichment Programme project.

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:5173 — lands on the sign-in screen.

## Logging in (demo credentials)

There are three separate logins, each landing on a different view:

| Role              | How to sign in                          | Password     |
|-------------------|------------------------------------------|--------------|
| Front Desk Admin  | username `admin`                         | `admin123`   |
| Doctor            | pick any doctor from the dropdown        | `doctor123`  |
| Patient           | pick any patient from the dropdown       | `patient123` |

- **Admin** sees everything: patients, doctors, departments, appointments, billing, EMI
  approvals, reports.
- **Doctor** only sees their own patients and appointments (filtered by `doctorId`).
- **Patient** only sees their own appointments, bills, EMI plan, and report card
  (filtered by `patientId`).

## What's clickable

- **Admin → Patients**: "Register patient" opens a form that adds a real patient to the list.
- **Admin → Billing**: each row has a "Payment" toggle to record a payment or a
  refund/correction — updates the paid amount and status live.
- **Admin → Appointments**: pending appointments can be confirmed or cancelled.
- **Admin → EMI Management**: for each application, verify identity first (required),
  then approve (optionally with a down payment) or reject. Approving generates the
  installment plan automatically.
- **Patient → My Bills**: bills with an eligible outstanding balance show "Apply for EMI",
  which opens a tenure picker and submits an application.
- **Patient → My EMI Plan**: shows the application working through Identity Verification →
  Admin Approval → Installment Plan, and once approved, lets the patient pay each
  installment.
- **Doctor → My Appointments**: confirm, mark completed, or cancel their own appointments.

## Structure

- `src/context/AuthContext.jsx` — role-based login/logout (admin/doctor/patient)
- `src/context/DataContext.jsx` — all app state + mutators (add patient, adjust payment,
  apply/verify/approve/reject EMI, pay installment, update appointment status)
- `src/components/AdminLayout.jsx` / `DoctorLayout.jsx` / `PatientLayout.jsx` — role-scoped
  shells, each wrapped in `ProtectedRoute` so a doctor can't browse to `/patients`, etc.
- `src/pages/` — Admin*, Doctor*, Patient* screens
- `src/components/InstallmentLadder.jsx` — the EMI progress visualization
- `src/components/WorkflowStepper.jsx` — Applied → Identity Verification → Admin Approval →
  Installment Plan → Payment Tracking
- `src/data/mockData.js` — seed data standing in for the ASP.NET Core Web API. Swap each
  `initial*` array for a real fetch() once backend endpoints exist; the shapes already
  match what the context expects.

## Connecting to the backend (done)

The frontend now talks to a real ASP.NET Core + SQL Server API (see `../HMS.Api`) instead
of in-memory mock data:

1. Start the backend first — see `HMS.Api/README.md` for the exact `dotnet ef` /
   `dotnet run` commands.
2. Copy `.env.example` to `.env` and set `VITE_API_BASE_URL` to the port the backend
   printed on startup (e.g. `https://localhost:7000/api`).
3. `npm run dev` — the app now fetches everything from SQL Server via JWT-authenticated
   requests (`src/api/client.js`, `auth.js`, `data.js`). Refreshing the page no longer
   wipes your data.
4. EMI eligibility (NPR 30,001–1,000,000) is validated in both places: client-side in
   `PatientBills.jsx` for instant feedback, and server-side in `EmiController.cs` so it
   can't be bypassed by calling the API directly.

If a request fails (backend not running, wrong URL, expired session), every mutator
returns `{ ok: false, error }` instead of throwing — pages show that message inline
rather than crashing.

## Notes

- Data now lives in SQL Server via `HMS.Api` — see that project's README for setup.
- Currency formatting assumes NPR (`formatNPR` in `src/components/ui.jsx`).
- Design tokens (colors, fonts) live in `src/index.css` under `@theme`.
- `src/data/mockData.js` is no longer imported anywhere — kept only for reference; safe
  to delete once you've confirmed the backend integration works end to end.
