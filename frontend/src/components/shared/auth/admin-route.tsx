import { Navigate, Outlet } from "react-router";
import { useAuthStore } from "@/stores/auth-store";

/** Blocks direct navigation to admin-only routes for an `instructor`-role user, even though those routes are already hidden from their sidebar. */
export function AdminRoute() {
  const isAdmin = useAuthStore((s) => s.user?.role === "admin");
  if (!isAdmin) {
    return <Navigate to="/home" replace />;
  }
  return <Outlet />;
}
