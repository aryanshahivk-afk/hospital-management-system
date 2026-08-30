import { api } from "./client";

export const loginAdminApi = (username, password) =>
  api.post("/auth/login/admin", { username, password }, { auth: false });

export const loginFrontDeskApi = (username, password) =>
  api.post("/auth/login/frontdesk", { username, password }, { auth: false });

export const loginDoctorApi = (username, password) =>
  api.post("/auth/login/doctor", { username, password }, { auth: false });

export const loginPatientApi = (username, password) =>
  api.post("/auth/login/patient", { username, password }, { auth: false });
