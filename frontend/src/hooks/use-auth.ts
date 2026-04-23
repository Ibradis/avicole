"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { apiClient } from "@/lib/axios";
import { API_ROUTES } from "@/lib/api-routes";
import { useAuthStore } from "@/store/auth-store";
import type { LoginPayload, RegisterPayload, Tokens, User } from "@/types/api";
import type { Role } from "@/types/roles";

type LoginResponse = Tokens & { user?: User };

function decodeJwt(token: string): Record<string, unknown> {
  try {
    return JSON.parse(atob(token.split(".")[1] ?? "")) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function normalizeRole(value: unknown): Role | null {
  if (value === "administrateur") return "admin";
  if (value === "controleur" || value === "pdg" || value === "gerant" || value === "vendeur" || value === "admin") return value;
  return null;
}

function rememberSession(tokens: Tokens) {
  document.cookie = `avicole_access=${tokens.access}; path=/; max-age=28800; SameSite=Lax`;
}

function forgetSession() {
  document.cookie = "avicole_access=; path=/; max-age=0; SameSite=Lax";
}

export function useAuth() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const clearAuthStore = useAuthStore((state) => state.clearAuth);
  const tokens = useAuthStore((state) => state.tokens);

  const login = useMutation({
    mutationFn: async (payload: LoginPayload) => {
      const { data } = await apiClient.post<LoginResponse>(API_ROUTES.auth.login, payload);
      return data;
    },
    onSuccess: (data) => {
      const payload = decodeJwt(data.access);
      const role = data.user?.role ?? normalizeRole(payload.role) ?? "admin";
      const user: User = data.user ?? {
        id: Number(payload.user_id ?? 0),
        email: String(payload.email ?? ""),
        role,
        entite_type: payload.entite_type === "ferme" || payload.entite_type === "boutique" ? payload.entite_type : null,
        entite_id: typeof payload.entite_id === "number" ? payload.entite_id : null
      };
      setAuth({ tokens: { access: data.access, refresh: data.refresh }, user });
      rememberSession(data);
      toast.success("Connexion réussie");
      
      if (user.doit_changer_mdp) {
        router.push("/auth/change-password");
      } else {
        router.push("/");
      }
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail ?? "Identifiants invalides");
    }
  });

  const register = useMutation({
    mutationFn: async (payload: RegisterPayload) => {
      const { data } = await apiClient.post(API_ROUTES.organisations.inscription, payload);
      return data;
    },
    onSuccess: () => {
      toast.success("Compte créé. Vous pouvez vous connecter.");
      router.push("/login");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail ?? "L'inscription publique n'est pas encore exposée par l'API.");
    }
  });

  const activate = useMutation({
    mutationFn: async (payload: { token: string; password: string }) => {
      const { data } = await apiClient.post(API_ROUTES.auth.activate, payload);
      return data;
    },
    onSuccess: () => {
      toast.success("Compte activé");
      router.push("/login");
    },
    onError: (error: any) => toast.error(error?.response?.data?.detail ?? "Activation impossible")
  });

  const resetPassword = useMutation({
    mutationFn: async (payload: { email: string }) => {
      const { data } = await apiClient.post(API_ROUTES.auth.resetPassword, payload);
      return data;
    },
    onSuccess: () => toast.success("Si cet email existe, un lien a été envoyé."),
    onError: (error: any) => toast.error(error?.response?.data?.detail ?? "Demande impossible")
  });

  const logout = async () => {
    try {
      if (tokens?.refresh) await apiClient.post(API_ROUTES.auth.logout, { refresh: tokens.refresh });
    } finally {
      forgetSession();
      clearAuthStore();
      router.push("/login");
    }
  };

  return { login, register, activate, resetPassword, logout };
}
