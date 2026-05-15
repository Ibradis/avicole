import axios, { type AxiosError } from "axios";

type DrfErrorPayload =
  | string
  | string[]
  | Record<string, string | string[] | Record<string, unknown>>
  | { detail?: string; message?: string; non_field_errors?: string[] };

function flatten(value: unknown, out: string[]): void {
  if (value == null) return;
  if (typeof value === "string") {
    if (value.trim()) out.push(value.trim());
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((v) => flatten(v, out));
    return;
  }
  if (typeof value === "object") {
    Object.values(value as Record<string, unknown>).forEach((v) => flatten(v, out));
  }
}

export function extractApiError(error: unknown, fallback = "Une erreur est survenue"): string {
  if (!error) return fallback;

  if (axios.isAxiosError(error)) {
    const err = error as AxiosError<DrfErrorPayload>;

    if (err.code === "ERR_NETWORK") return "Connexion impossible au serveur. Vérifiez votre réseau.";
    if (err.code === "ECONNABORTED") return "La requête a expiré. Réessayez plus tard.";

    const status = err.response?.status;
    const data = err.response?.data;

    if (data && typeof data === "object" && !Array.isArray(data)) {
      const obj = data as Record<string, unknown>;
      if (typeof obj.detail === "string") return obj.detail;
      if (typeof obj.message === "string") return obj.message;
    }

    const collected: string[] = [];
    flatten(data, collected);
    if (collected.length) return collected.slice(0, 3).join(" • ");

    if (status === 403) return "Action non autorisée.";
    if (status === 404) return "Ressource introuvable.";
    if (status === 500) return "Erreur serveur. Réessayez plus tard.";
    if (status) return `Erreur ${status}`;
  }

  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

export function isAuthError(error: unknown): boolean {
  return axios.isAxiosError(error) && error.response?.status === 401;
}
