import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ allow, children }) {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;
  // Belt-and-suspenders: even if someone types a dashboard URL directly instead of
  // going through the post-login redirect, an account that still needs to set a
  // real password can't reach any protected page until it does.
  if (user.mustChangePassword) return <Navigate to="/change-password" replace />;
  if (!allow.includes(user.role)) {
    const home = user.role === "admin" ? "/" : user.role === "frontdesk" ? "/frontdesk" : user.role === "doctor" ? "/doctor" : "/patient";
    return <Navigate to={home} replace />;
  }
  return children;
}
