import { clsx, type ClassValue } from "clsx";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatGNF = (value: number | string | null | undefined) =>
  new Intl.NumberFormat("fr-GN", {
    style: "currency",
    currency: "GNF",
    maximumFractionDigits: 0
  }).format(Number(value ?? 0));

export const formatDateFr = (value: string | Date | null | undefined) => {
  if (!value) return "-";
  const date = typeof value === "string" ? parseISO(value) : value;
  return format(date, "dd MMM yyyy", { locale: fr });
};

export function unwrapResults<T>(data: any): T[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (data.results && Array.isArray(data.results)) return data.results;
  return [data as T];
}
