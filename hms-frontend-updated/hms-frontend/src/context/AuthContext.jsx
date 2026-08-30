import { createContext, useContext, useState, useCallback, useEffect } from "react";
import {
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

  useEffect(() => {
    try {
      if (user) localStorage.setItem(SESSION_KEY, JSON.stringify(user));
      else localStorage.removeItem(SESSION_KEY);
    } catch {
      // localStorage unavailable — session just won't survive a refresh
    }
  }, [user]);

  // Every login function returns { ok, user } (not just ok) so the Login page can
  // decide immediately whether to route to /change-password, without waiting on a
  // separate render for context state to catch up.
  const loginAdmin = useCallback(async (username, password) => {
    try {
      const { token, user: apiUser } = await loginAdminApi(username, password);
      setToken(token);
      setUser(apiUser);
      return { ok: true, user: apiUser };
    } catch (err) {
      return { ok: false, error: err instanceof ApiError ? err.message : "Sign in failed." };
    }
  }, []);

  const loginFrontDesk = useCallback(async (username, password) => {
    try {
      const { token, user: apiUser } = await loginFrontDeskApi(username, password);
      setToken(token);
      setUser(apiUser);
      return { ok: true, user: apiUser };
    } catch (err) {
      return { ok: false, error: err instanceof ApiError ? err.message : "Sign in failed." };
    }
  }, []);

  const loginDoctor = useCallback(async (username, password) => {
    try {
      const { token, user: apiUser } = await loginDoctorApi(username, password);
      setToken(token);
      setUser(apiUser);
      return { ok: true, user: apiUser };
    } catch (err) {
      return { ok: false, error: err instanceof ApiError ? err.message : "Sign in failed." };
    }
  }, []);

  const loginPatient = useCallback(async (username, password) => {
    try {
      const { token, user: apiUser } = await loginPatientApi(username, password);
      setToken(token);
      setUser(apiUser);
      return { ok: true, user: apiUser };
    } catch (err) {
      return { ok: false, error: err instanceof ApiError ? err.message : "Sign in failed." };
    }
  }, []);

  // Called after a successful forced password change, so the rest of the app
  // immediately stops treating this session as needing one.
  const clearMustChangePassword = useCallback(() => {
    setUser((u) => (u ? { ...u, mustChangePassword: false } : u));
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loginAdmin,
        loginFrontDesk,
        loginDoctor,
        loginPatient,
        clearMustChangePassword,
        logout,
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
