import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { Role } from "@/types/roles";
import type { Tokens, User } from "@/types/api";

type AuthState = {
  tokens: Tokens | null;
  user: User | null;
  role: Role | null;
  entite_type: "ferme" | "boutique" | null;
  entite_id: number | null;
  isAuthenticated: boolean;
  setAuth: (payload: { tokens: Tokens; user?: User | null }) => void;
  setAccessToken: (access: string) => void;
  clearAuth: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      tokens: null,
      user: null,
      role: null,
      entite_type: null,
      entite_id: null,
      isAuthenticated: false,
      setAuth: ({ tokens, user }) =>
        set({
          tokens,
          user: user ?? get().user,
          role: user?.role ?? get().role,
          entite_type: user?.entite_type ?? get().entite_type ?? null,
          entite_id: user?.entite_id ?? get().entite_id ?? null,
          isAuthenticated: true
        }),
      setAccessToken: (access) => {
        const tokens = get().tokens;
        if (tokens) set({ tokens: { ...tokens, access } });
      },
      clearAuth: () => set({ tokens: null, user: null, role: null, entite_type: null, entite_id: null, isAuthenticated: false })
    }),
    {
      name: "avicole-auth",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        tokens: state.tokens,
        user: state.user,
        role: state.role,
        entite_type: state.entite_type,
        entite_id: state.entite_id,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
);
