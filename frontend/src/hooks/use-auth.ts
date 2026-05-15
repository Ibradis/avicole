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
      try {
        const { data } = await apiClient.post<LoginResponse>(API_ROUTES.auth.login, payload);
        return data;
      } catch (err: any) {
        // Compte inactif → orienter vers la page de confirmation
        if (err?.response?.status === 403) {
          router.push(`/inscription/confirmer?email=${encodeURIComponent(payload.email)}`);
          throw new Error(
            "Votre compte n'est pas encore confirmé. Saisissez le code reçu par email."
          );
        }
        throw err;
      }
    },
    meta: { errorMessage: "Identifiants invalides", successMessage: "Connexion réussie" },
    onSuccess: (data) => {
      const payload = decodeJwt(data.access);
      const role = data.user?.role ?? normalizeRole(payload.role) ?? "admin";
      const user: User = data.user ?? {
        id: Number(payload.user_id ?? 0),
        email: String(payload.email ?? ""),
        role,
        entite_type: payload.entite_type === "ferme" || payload.entite_type === "boutique" ? payload.entite_type : null,
        entite_id: typeof payload.entite_id === "number" ? payload.entite_id : null,
      };
      setAuth({ tokens: { access: data.access, refresh: data.refresh }, user });
      rememberSession(data);

      if (user.doit_changer_mdp) {
        router.push("/auth/change-password");
      } else {
        router.push("/");
      }
    },
  });

  const register = useMutation({
    mutationFn: async (payload: RegisterPayload) => {
      const { data } = await apiClient.post<{
        detail: string;
        email: string;
        organisation_nom: string;
        expires_at: string;
      }>(API_ROUTES.organisations.inscription, payload);
      return data;
    },
    meta: {
      errorMessage: "Impossible de créer le compte. Vérifiez les informations saisies.",
      successMessage: "Compte créé — un code de confirmation vient d'être envoyé par email.",
    },
    onSuccess: (data) => {
      const email = data?.email ?? "";
      router.push(`/inscription/confirmer?email=${encodeURIComponent(email)}`);
    },
  });

  const confirmRegistration = useMutation({
    mutationFn: async (payload: { email: string; code: string }) => {
      const { data } = await apiClient.post<LoginResponse>(API_ROUTES.auth.confirmRegistration, payload);
      return data;
    },
    meta: {
      errorMessage: "Code invalide ou expiré",
      successMessage: "Compte confirmé. Bienvenue !",
    },
    onSuccess: (data) => {
      if (!data?.access || !data?.refresh || !data?.user) {
        router.push("/login");
        return;
      }
      const payload = decodeJwt(data.access);
      const role = data.user.role ?? normalizeRole(payload.role) ?? "admin";
      const user: User = {
        ...data.user,
        role,
        entite_type:
          data.user.entite_type === "ferme" || data.user.entite_type === "boutique"
            ? data.user.entite_type
            : null,
      };
      setAuth({ tokens: { access: data.access, refresh: data.refresh }, user });
      rememberSession({ access: data.access, refresh: data.refresh });
      router.push("/");
    },
  });

  const resendConfirmation = useMutation({
    mutationFn: async (payload: { email: string }) => {
      const { data } = await apiClient.post<{ detail: string; retry_after?: number }>(
        API_ROUTES.auth.resendCode,
        payload
      );
      return data;
    },
    meta: {
      errorMessage: "Impossible de renvoyer le code",
      successMessage: "Un nouveau code vient d'être envoyé.",
    },
  });

  const activate = useMutation({
    mutationFn: async (payload: { token: string; password: string }) => {
      const { data } = await apiClient.post(API_ROUTES.auth.activate, payload);
      return data;
    },
    meta: { errorMessage: "Activation impossible", successMessage: "Compte activé" },
    onSuccess: () => router.push("/login"),
  });

  const resetPassword = useMutation({
    mutationFn: async (payload: { email: string }) => {
      const { data } = await apiClient.post(API_ROUTES.auth.resetPassword, payload);
      return data;
    },
    meta: {
      errorMessage: "Demande impossible",
      successMessage: "Si cet email existe, un lien a été envoyé.",
    },
  });

  const logout = async () => {
    try {
      if (tokens?.refresh) await apiClient.post(API_ROUTES.auth.logout, { refresh: tokens.refresh });
    } finally {
      forgetSession();
      clearAuthStore();
      toast.success("Vous êtes déconnecté");
      router.push("/login");
    }
  };

  return { login, register, confirmRegistration, resendConfirmation, activate, resetPassword, logout };
}
