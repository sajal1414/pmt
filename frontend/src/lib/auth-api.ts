import { apiPost } from "@/lib/api";

export interface LoginResponse {
  token: string;
  id: number;
  role: "admin" | "instructor";
  full_name: string | null;
  instructor_id: number | null;
  must_change_password: boolean;
}

export function loginRequest(email: string, password: string) {
  return apiPost<LoginResponse>("/v1/auth/login", { email, password });
}

export function changePasswordRequest(currentPassword: string, newPassword: string) {
  return apiPost<null>("/v1/auth/change-password", { current_password: currentPassword, new_password: newPassword });
}
