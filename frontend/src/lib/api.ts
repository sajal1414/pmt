import axios, { AxiosError } from "axios";
import { env } from "@/config/env";
import { useAuthStore } from "@/stores/auth-store";

export const api = axios.create({
  baseURL: env.apiBaseUrl,
  // No default Content-Type here: axios sets application/json automatically for a
  // plain-object body, and — critically — must be left alone for a FormData body so
  // it can generate the multipart boundary itself. A forced default (or a per-call
  // "multipart/form-data" override with no boundary) breaks file uploads silently.
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.set("Authorization", `Bearer ${token}`);
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401 && !window.location.pathname.startsWith("/login")) {
      useAuthStore.getState().clear();
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

export interface Envelope<T> {
  STATUS: "SUCCESS" | "FAIL";
  MESSAGE: string;
  DATA: T;
}

export async function apiGet<T>(url: string, params?: Record<string, unknown>): Promise<T> {
  const res = await api.get<Envelope<T>>(url, { params });
  return res.data.DATA;
}

export async function apiPost<T>(url: string, data?: unknown, config?: Parameters<typeof api.post>[2]): Promise<T> {
  const res = await api.post<Envelope<T>>(url, data, config);
  return res.data.DATA;
}

export async function apiPut<T>(url: string, data?: unknown): Promise<T> {
  const res = await api.put<Envelope<T>>(url, data);
  return res.data.DATA;
}

export async function apiDelete<T>(url: string): Promise<T> {
  const res = await api.delete<Envelope<T>>(url);
  return res.data.DATA;
}

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const envelope = error.response?.data as Envelope<unknown> | undefined;
    if (envelope?.MESSAGE) return envelope.MESSAGE;
    if (error.message) return error.message;
  }
  return "Something went wrong";
}
