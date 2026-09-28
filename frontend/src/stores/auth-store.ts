import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface AuthUser {
  id: number;
  email: string;
  role: "admin" | "instructor";
  fullName: string | null;
  instructorId: number | null;
  mustChangePassword: boolean;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  hydrated: boolean;
  setSession: (user: AuthUser, token: string) => void;
  setPasswordChanged: () => void;
  setHydrated: () => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      hydrated: false,
      setSession: (user, token) => set({ user, token }),
      setPasswordChanged: () => set((s) => (s.user ? { user: { ...s.user, mustChangePassword: false } } : s)),
      setHydrated: () => set({ hydrated: true }),
      clear: () => set({ user: null, token: null }),
    }),
    {
      name: "nfolks-atlas-auth",
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    },
  ),
);

export const isAdmin = (user: AuthUser | null | undefined) => user?.role === "admin";
