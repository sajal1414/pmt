import { useNavigate } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/auth-store";

export function useLogout() {
  const navigate = useNavigate();
  const clear = useAuthStore((s) => s.clear);
  const queryClient = useQueryClient();

  return () => {
    clear();
    queryClient.clear();
    navigate("/login", { replace: true });
  };
}
