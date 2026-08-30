import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ allow, children }) {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;
  if (!allow.includes(user.role)) {
    const home = user.role === "admin" ? "/" : user.role === "frontdesk" ? "/frontdesk" : user.role === "doctor" ? "/doctor" : "/patient";
    return <Navigate to={home} replace />;
  }
  return children;
}
