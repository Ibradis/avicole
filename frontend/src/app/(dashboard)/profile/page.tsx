"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTheme } from "next-themes";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Building2, CalendarDays, CheckCircle2, Eye, EyeOff, Mail, MapPin, Monitor, Moon, ShieldCheck, Sun, UserCog } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField } from "@/components/forms/form-field";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiClient } from "@/lib/axios";
import { useAuthStore } from "@/store/auth-store";
import { ROLE_LABELS } from "@/types/roles";
import { cn } from "@/lib/utils";
import type { User } from "@/types/api";

function initials(user: User): string {
  const first = user.first_name?.trim()[0];
  const last = user.last_name?.trim()[0];
  if (first && last) return `${first}${last}`.toUpperCase();
  if (first) return first.toUpperCase();
  return (user.email.split("@")[0] ?? user.email).slice(0, 2).toUpperCase();
}

function fullName(user: User): string {
  if (user.first_name && user.last_name) return `${user.first_name} ${user.last_name}`;
  if (user.first_name) return user.first_name;
  return user.email.split("@")[0] ?? user.email;
}

const profileSchema = z.object({
  first_name: z.string().min(1, "Prénom requis").max(60),
  last_name: z.string().min(1, "Nom requis").max(60),
});

const passwordSchema = z
  .object({
    password: z.string().min(8, "8 caractères minimum"),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, { message: "Les mots de passe ne correspondent pas", path: ["confirm"] });

export default function ProfilePage() {
  const user = useAuthStore((state) => state.user);
  const setAuth = useAuthStore((state) => state.setAuth);
  const tokens = useAuthStore((state) => state.tokens);
  const queryClient = useQueryClient();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const searchParams = useSearchParams();
  const initialTab = (() => {
    const tab = searchParams.get("tab");
    return tab === "security" || tab === "prefs" ? tab : "info";
  })();

  if (!user) return null;

  return (
    <div className="w-full pb-10">
      <ProfileHero user={user} />
      <div className="mx-auto -mt-16 w-full max-w-7xl space-y-6 px-4 lg:px-8">
        <Tabs defaultValue={initialTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 sm:w-auto">
            <TabsTrigger value="info" className="gap-2">
              <UserCog className="h-4 w-4" aria-hidden="true" />
              <span>Informations</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2">
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              <span>Sécurité</span>
            </TabsTrigger>
            <TabsTrigger value="prefs" className="gap-2">
              <Monitor className="h-4 w-4" aria-hidden="true" />
              <span>Préférences</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="info">
            <InfoTab user={user} setAuth={setAuth} tokens={tokens} queryClient={queryClient} />
          </TabsContent>
          <TabsContent value="security">
            <SecurityTab userId={user.id} />
          </TabsContent>
          <TabsContent value="prefs">
            <PreferencesTab theme={theme} resolvedTheme={resolvedTheme} setTheme={setTheme} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function ProfileHero({ user }: { user: User }) {
  const role = useAuthStore((state) => state.role);
  const roleLabel = role ? ROLE_LABELS[role] : null;
  const entiteLabel = user.entite_type === "ferme" ? "Ferme" : user.entite_type === "boutique" ? "Boutique" : null;

  return (
    <section className="relative overflow-hidden bg-[#111827] text-white">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(27,107,53,0.35),_transparent_55%),radial-gradient(circle_at_bottom_right,_rgba(217,119,6,0.18),_transparent_60%)]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-primary/15 blur-3xl"
        aria-hidden="true"
      />
      <div className="relative mx-auto w-full max-w-7xl px-4 pb-28 pt-10 lg:px-8 lg:pb-32 lg:pt-12">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-white/55">Profil</p>
        <div className="mt-4 flex flex-col gap-6 sm:flex-row sm:items-end">
          <Avatar className="h-24 w-24 shrink-0 ring-4 ring-white/15 sm:h-28 sm:w-28">
            <AvatarFallback className="bg-white/10 text-2xl font-semibold text-white sm:text-3xl">
              {initials(user)}
            </AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <h1 className="truncate text-2xl font-semibold tracking-tight sm:text-3xl">
              {fullName(user)}
            </h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-white/70">
              <span className="inline-flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="truncate">{user.email}</span>
              </span>
              {entiteLabel ? (
                <span className="inline-flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5" aria-hidden="true" />
                  {entiteLabel}
                  {user.entite_id ? ` · #${user.entite_id}` : null}
                </span>
              ) : null}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              {roleLabel ? (
                <span className="inline-flex items-center rounded-md border border-white/15 bg-white/10 px-2 py-1 text-xs font-medium text-white">
                  {roleLabel}
                </span>
              ) : null}
              {user.is_active === false ? (
                <span className="inline-flex items-center gap-1 rounded-md border border-red-400/30 bg-red-500/20 px-2 py-1 text-xs font-medium text-red-100">
                  Compte inactif
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-md border border-emerald-400/30 bg-emerald-500/15 px-2 py-1 text-xs font-medium text-emerald-100">
                  <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                  Actif
                </span>
              )}
              {user.doit_changer_mdp ? (
                <span className="inline-flex items-center rounded-md border border-amber-400/30 bg-amber-500/15 px-2 py-1 text-xs font-medium text-amber-100">
                  Mot de passe à changer
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function InfoTab({
  user,
  setAuth,
  tokens,
  queryClient,
}: {
  user: User;
  setAuth: (v: { tokens: NonNullable<typeof tokens>; user: User }) => void;
  tokens: ReturnType<typeof useAuthStore.getState>["tokens"];
  queryClient: ReturnType<typeof useQueryClient>;
}) {
  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    mode: "onChange",
    defaultValues: {
      first_name: user.first_name ?? "",
      last_name: user.last_name ?? "",
    },
  });

  useEffect(() => {
    form.reset({ first_name: user.first_name ?? "", last_name: user.last_name ?? "" });
  }, [user.first_name, user.last_name, form]);

  const mutation = useMutation({
    mutationFn: async (values: z.infer<typeof profileSchema>) => {
      const { data } = await apiClient.patch<User>(`/utilisateurs/${user.id}/`, values);
      return data;
    },
    meta: {
      successMessage: "Profil mis à jour",
      errorMessage: "Impossible de mettre à jour le profil",
    },
    onSuccess: (updated) => {
      if (tokens) setAuth({ tokens, user: { ...user, ...updated } });
      queryClient.invalidateQueries({ queryKey: ["all-users"] });
    },
  });

  const errors = form.formState.errors;
  const isDirty = form.formState.isDirty;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Informations personnelles</CardTitle>
        <CardDescription>
          Ces informations apparaissent dans la barre de navigation et sur vos exports.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
          className="space-y-6"
          noValidate
        >
          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              label="Prénom"
              autoComplete="given-name"
              error={errors.first_name?.message}
              {...form.register("first_name")}
            />
            <FormField
              label="Nom"
              autoComplete="family-name"
              error={errors.last_name?.message}
              {...form.register("last_name")}
            />
          </div>
          <ReadOnlyField label="Email" value={user.email} hint="L'email est utilisé pour la connexion et ne peut pas être modifié ici." />
          <div className="grid gap-4 md:grid-cols-2">
            <ReadOnlyField label="Identifiant" value={`#${user.id}`} />
            <ReadOnlyField
              label="Entité"
              value={
                user.entite_type
                  ? `${user.entite_type === "ferme" ? "Ferme" : "Boutique"}${user.entite_id ? ` #${user.entite_id}` : ""}`
                  : "Aucune"
              }
            />
          </div>
          <div className="flex items-center justify-end gap-2 border-t pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => form.reset()}
              disabled={!isDirty || mutation.isPending}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={!isDirty || !form.formState.isValid || mutation.isPending}>
              {mutation.isPending ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function ReadOnlyField({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="space-y-1.5">
      <div className="text-xs font-medium text-muted-foreground">{label}</div>
      <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm">{value}</div>
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function SecurityTab({ userId }: { userId: number }) {
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const form = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    mode: "onChange",
    defaultValues: { password: "", confirm: "" },
  });

  const mutation = useMutation({
    mutationFn: async (values: z.infer<typeof passwordSchema>) => {
      const { data } = await apiClient.patch<User>(`/utilisateurs/${userId}/`, { password: values.password });
      return data;
    },
    meta: {
      successMessage: "Mot de passe mis à jour",
      errorMessage: "Impossible de modifier le mot de passe",
    },
    onSuccess: () => form.reset({ password: "", confirm: "" }),
  });

  const pwd = form.watch("password");
  const strength = passwordStrength(pwd);

  const errors = form.formState.errors;

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Changer le mot de passe</CardTitle>
          <CardDescription>
            Utilisez un mot de passe unique d'au moins 8 caractères mélangeant lettres, chiffres et symboles.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
            className="space-y-4"
            noValidate
          >
            <FormField
              label="Nouveau mot de passe"
              type={showCurrent ? "text" : "password"}
              autoComplete="new-password"
              error={errors.password?.message}
              trailing={
                <button
                  type="button"
                  onClick={() => setShowCurrent((v) => !v)}
                  aria-label={showCurrent ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              }
              {...form.register("password")}
            />
            <PasswordStrength strength={strength} />
            <FormField
              label="Confirmation"
              type={showNew ? "text" : "password"}
              autoComplete="new-password"
              error={errors.confirm?.message}
              trailing={
                <button
                  type="button"
                  onClick={() => setShowNew((v) => !v)}
                  aria-label={showNew ? "Masquer la confirmation" : "Afficher la confirmation"}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              }
              {...form.register("confirm")}
            />
            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={mutation.isPending || !form.formState.isValid}>
                {mutation.isPending ? "Mise à jour..." : "Mettre à jour"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldCheck className="h-4 w-4 text-primary" aria-hidden="true" />
            Bonnes pratiques
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <PracticeItem ok={pwd.length >= 8}>Au moins 8 caractères</PracticeItem>
          <PracticeItem ok={/[A-Z]/.test(pwd)}>Une majuscule</PracticeItem>
          <PracticeItem ok={/[0-9]/.test(pwd)}>Un chiffre</PracticeItem>
          <PracticeItem ok={/[^A-Za-z0-9]/.test(pwd)}>Un caractère spécial</PracticeItem>
          <PracticeItem ok={pwd.length >= 12}>12 caractères ou plus (recommandé)</PracticeItem>
        </CardContent>
      </Card>
    </div>
  );
}

function passwordStrength(pwd: string): { score: number; label: string; color: string } {
  let score = 0;
  if (pwd.length >= 8) score += 1;
  if (pwd.length >= 12) score += 1;
  if (/[A-Z]/.test(pwd)) score += 1;
  if (/[0-9]/.test(pwd)) score += 1;
  if (/[^A-Za-z0-9]/.test(pwd)) score += 1;
  if (!pwd) return { score: 0, label: "—", color: "bg-muted" };
  if (score <= 2) return { score, label: "Faible", color: "bg-destructive" };
  if (score === 3) return { score, label: "Moyen", color: "bg-amber-500" };
  if (score === 4) return { score, label: "Bon", color: "bg-primary" };
  return { score, label: "Excellent", color: "bg-emerald-500" };
}

function PasswordStrength({ strength }: { strength: { score: number; label: string; color: string } }) {
  return (
    <div className="space-y-1.5" aria-live="polite">
      <div className="flex gap-1.5">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={cn("h-1.5 flex-1 rounded-full transition-colors", i < strength.score ? strength.color : "bg-muted")}
          />
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Robustesse : <span className="font-medium text-foreground">{strength.label}</span>
      </p>
    </div>
  );
}

function PracticeItem({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <div className={cn("flex items-center gap-2", ok && "text-foreground")}>
      <CheckCircle2 className={cn("h-4 w-4 shrink-0", ok ? "text-emerald-500" : "text-muted-foreground/50")} aria-hidden="true" />
      <span>{children}</span>
    </div>
  );
}

function PreferencesTab({
  theme,
  resolvedTheme,
  setTheme,
}: {
  theme: string | undefined;
  resolvedTheme: string | undefined;
  setTheme: (theme: string) => void;
}) {
  const current = theme ?? "system";
  const options = useMemo(
    () => [
      { value: "light", label: "Clair", icon: Sun, description: "Interface claire pour la journée." },
      { value: "dark", label: "Sombre", icon: Moon, description: "Interface sombre pour réduire la fatigue oculaire." },
      { value: "system", label: "Système", icon: Monitor, description: "Suit la préférence de votre OS." },
    ],
    []
  );

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Apparence</CardTitle>
          <CardDescription>Choisissez le thème qui vous convient. Modifiable à tout moment.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {options.map((opt) => {
            const Icon = opt.icon;
            const active = current === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setTheme(opt.value)}
                aria-pressed={active}
                className={cn(
                  "group flex w-full cursor-pointer items-center gap-3 rounded-lg border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  active ? "border-primary bg-primary/5" : "border-input hover:bg-accent/10"
                )}
              >
                <span className={cn("flex h-9 w-9 items-center justify-center rounded-md", active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className="flex flex-1 flex-col">
                  <span className="text-sm font-medium">{opt.label}</span>
                  <span className="text-xs text-muted-foreground">{opt.description}</span>
                </span>
                {active ? <CheckCircle2 className="h-4 w-4 text-primary" aria-hidden="true" /> : null}
              </button>
            );
          })}
          <p className="text-xs text-muted-foreground">
            Thème actuellement appliqué : <span className="font-medium text-foreground">{resolvedTheme === "dark" ? "Sombre" : "Clair"}</span>
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Région & format</CardTitle>
          <CardDescription>Préférences locales utilisées dans l'application.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-md bg-muted text-muted-foreground">
                <MapPin className="h-4 w-4" aria-hidden="true" />
              </span>
              <div>
                <div className="text-sm font-medium">Langue</div>
                <div className="text-xs text-muted-foreground">Français (par défaut)</div>
              </div>
            </div>
            <Badge variant="secondary">À venir</Badge>
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-md bg-muted text-muted-foreground">
                <CalendarDays className="h-4 w-4" aria-hidden="true" />
              </span>
              <div>
                <div className="text-sm font-medium">Format des dates</div>
                <div className="text-xs text-muted-foreground">JJ/MM/AAAA</div>
              </div>
            </div>
            <Badge variant="secondary">À venir</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
