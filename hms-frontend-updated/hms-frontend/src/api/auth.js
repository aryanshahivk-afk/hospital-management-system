import { api } from "./client";

export const getDoctorOptions = () => api.get("/auth/doctor-options", { auth: false });
export const getPatientOptions = () => api.get("/auth/patient-options", { auth: false });

export const loginAdminApi = (username, password) =>
  api.post("/auth/login/admin", { username, password }, { auth: false });

export const loginFrontDeskApi = (username, password) =>
  api.post("/auth/login/frontdesk", { username, password }, { auth: false });

export const loginDoctorApi = (doctorId, password) =>
  api.post("/auth/login/doctor", { doctorId, password }, { auth: false });

export const loginPatientApi = (patientId, password) =>
  api.post("/auth/login/patient", { patientId, password }, { auth: false });
