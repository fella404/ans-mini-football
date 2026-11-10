import { useEffect } from "react";
import { Navigate, Outlet } from "react-router-dom";
import FullPageSpinner from "../components/ui/FullPageSpinner";
import { useAuthStore } from "../stores/useAuthStore";

const ProtectedRoute = () => {
  const user = useAuthStore((s) => s.user);
  const status = useAuthStore((s) => s.status);
  const fetchMe = useAuthStore((s) => s.fetchMe);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  if (status === "idle" || status === "loading") return <FullPageSpinner />;

  if (!user) return <Navigate to="/login" replace />;

  return <Outlet />;
};

export default ProtectedRoute;
