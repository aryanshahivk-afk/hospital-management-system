import { api } from "./client";

export const loginAdminApi = (username, password) =>
  api.post("/auth/login/admin", { username, password }, { auth: false });

export const loginFrontDeskApi = (username, password) =>
  api.post("/auth/login/frontdesk", { username, password }, { auth: false });

export const loginDoctorApi = (username, password) =>
  api.post("/auth/login/doctor", { username, password }, { auth: false });

export const loginPatientApi = (username, password) =>
  api.post("/auth/login/patient", { username, password }, { auth: false });

// Called right after login when the account still has a first-time password —
// requires an auth token, works for either Doctor or Patient sessions.
export const changePasswordApi = (newPassword) =>
  api.post("/auth/change-password", { newPassword });
