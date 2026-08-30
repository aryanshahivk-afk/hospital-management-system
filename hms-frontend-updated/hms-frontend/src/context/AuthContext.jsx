import { createContext, useContext, useState, useCallback, useEffect } from "react";
import {
  getDoctorOptions,
  getPatientOptions,
  loginAdminApi,
  loginFrontDeskApi,
  loginDoctorApi,
  loginPatientApi,
} from "../api/auth";
import { setToken, getToken, ApiError } from "../api/client";

const AuthContext = createContext(null);

const SESSION_KEY = "hms:session";

function loadSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw === null ? null : JSON.parse(raw);
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  // Restore the logged-in session on refresh instead of bouncing back to /login.
  // Session is only trusted if we also still have a JWT — otherwise force re-login.
  const [user, setUser] = useState(() => (getToken() ? loadSession() : null));
  const [doctorOptions, setDoctorOptions] = useState([]);
  const [patientOptions, setPatientOptions] = useState([]);
  const [optionsError, setOptionsError] = useState("");

  // Password-free dropdown lists for the login screen — fetched once, unauthenticated.
  const loadLoginOptions = useCallback(async () => {
    try {
      setOptionsError("");
      const [doctors, patients] = await Promise.all([getDoctorOptions(), getPatientOptions()]);
      setDoctorOptions(doctors);
      setPatientOptions(patients);
    } catch (err) {
      setOptionsError(
        err instanceof ApiError ? err.message : "Couldn't load the login list. Is the backend running?"
      );
    }
  }, []);

  useEffect(() => {
    loadLoginOptions();
  }, [loadLoginOptions]);

  useEffect(() => {
    try {
      if (user) localStorage.setItem(SESSION_KEY, JSON.stringify(user));
      else localStorage.removeItem(SESSION_KEY);
    } catch {
      // localStorage unavailable — session just won't survive a refresh
    }
  }, [user]);

  const loginAdmin = useCallback(async (username, password) => {
    try {
      const { token, user: apiUser } = await loginAdminApi(username, password);
      setToken(token);
      setUser(apiUser);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err instanceof ApiError ? err.message : "Sign in failed." };
    }
  }, []);

  const loginFrontDesk = useCallback(async (username, password) => {
    try {
      const { token, user: apiUser } = await loginFrontDeskApi(username, password);
      setToken(token);
      setUser(apiUser);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err instanceof ApiError ? err.message : "Sign in failed." };
    }
  }, []);

  const loginDoctor = useCallback(async (doctor, password) => {
    if (!doctor) return { ok: false, error: "Select your name to continue." };
    try {
      const { token, user: apiUser } = await loginDoctorApi(doctor.id, password);
      setToken(token);
      setUser(apiUser);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err instanceof ApiError ? err.message : "Sign in failed." };
    }
  }, []);

  const loginPatient = useCallback(async (patient, password) => {
    if (!patient) return { ok: false, error: "Select your name to continue." };
    try {
      const { token, user: apiUser } = await loginPatientApi(patient.id, password);
      setToken(token);
      setUser(apiUser);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err instanceof ApiError ? err.message : "Sign in failed." };
    }
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    // Refresh the login dropdown lists right away — otherwise a patient/doctor added
    // during this session wouldn't show up until a manual page reload.
    loadLoginOptions();
  }, [loadLoginOptions]);

  return (
    <AuthContext.Provider
      value={{
        user,
        loginAdmin,
        loginFrontDesk,
        loginDoctor,
        loginPatient,
        logout,
        doctorOptions,
        patientOptions,
        optionsError,
        reloadLoginOptions: loadLoginOptions,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
