"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  Eye,
  EyeOff,
  Loader2,
  ShieldCheck,
  UserCog,
} from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/forms/form-field";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

const schema = z.object({
  organisation_nom: z.string().min(2, "Nom requis (2 caractères minimum)"),
  pays: z.string().min(2, "Pays requis"),
  devise: z.literal("GNF"),
  admin_nom: z.string().min(2, "Nom complet requis"),
  email: z.string().email("Email invalide"),
  telephone: z.string().optional(),
  password: z.string().min(8, "8 caractères minimum"),
});

type RegisterValues = z.infer<typeof schema>;

const STEPS = [
  {
    id: "organisation",
    label: "Organisation",
    shortLabel: "Organisation",
    description: "Votre exploitation et son contexte",
    icon: Building2,
    fields: ["organisation_nom", "pays", "devise"] satisfies (keyof RegisterValues)[],
  },
  {
    id: "identity",
    label: "Vos coordonnées",
    shortLabel: "Coordonnées",
    description: "Comment nous vous contactons",
    icon: UserCog,
    fields: ["admin_nom", "email", "telephone"] satisfies (keyof RegisterValues)[],
  },
  {
    id: "security",
    label: "Sécurité",
    shortLabel: "Sécurité",
    description: "Le mot de passe de votre compte",
    icon: ShieldCheck,
    fields: ["password"] satisfies (keyof RegisterValues)[],
  },
] as const;

type StepIndex = 0 | 1 | 2;

function passwordStrength(pwd: string): { score: number; label: string; color: string } {
  let score = 0;
  if (pwd.length >= 8) score++;
  if (pwd.length >= 12) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  if (!pwd) return { score: 0, label: "—", color: "bg-muted" };
  if (score <= 2) return { score, label: "Faible", color: "bg-destructive" };
  if (score === 3) return { score, label: "Moyen", color: "bg-amber-500" };
  if (score === 4) return { score, label: "Bon", color: "bg-primary" };
  return { score, label: "Excellent", color: "bg-emerald-500" };
}

function Stepper({
  current,
  completed,
  onSelect,
}: {
  current: StepIndex;
  completed: Set<number>;
  onSelect: (idx: number) => void;
}) {
  return (
    <ol className="flex items-center gap-2" aria-label="Étapes d'inscription">
      {STEPS.map((step, idx) => {
        const Icon = step.icon;
        const isCompleted = completed.has(idx);
        const isCurrent = idx === current;
        const isPast = isCompleted || idx < current;
        const isClickable = idx < current || completed.has(idx);
        return (
          <li key={step.id} className="flex flex-1 items-center gap-2">
            <button
              type="button"
              onClick={() => isClickable && onSelect(idx)}
              disabled={!isClickable}
              aria-current={isCurrent ? "step" : undefined}
              aria-label={`Étape ${idx + 1} : ${step.label}`}
              className={cn(
                "flex items-center gap-2 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                isClickable ? "cursor-pointer" : "cursor-default"
              )}
            >
              <span
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors",
                  isCompleted && "border-primary bg-primary text-primary-foreground",
                  isCurrent && !isCompleted && "border-primary bg-primary/10 text-primary",
                  !isPast && "border-muted bg-muted/30 text-muted-foreground"
                )}
              >
                {isCompleted ? <Check className="h-4 w-4" aria-hidden="true" /> : <Icon className="h-4 w-4" aria-hidden="true" />}
              </span>
              <span className="hidden min-w-0 flex-col items-start sm:flex">
                <span className={cn("truncate text-xs font-medium", isCurrent ? "text-foreground" : "text-muted-foreground")}>
                  Étape {idx + 1}
                </span>
                <span className="truncate text-xs text-muted-foreground">{step.shortLabel}</span>
              </span>
            </button>
            {idx < STEPS.length - 1 ? (
              <div
                className={cn(
                  "h-px flex-1 transition-colors",
                  isCompleted ? "bg-primary" : "bg-border"
                )}
                aria-hidden="true"
              />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}

export function RegisterForm() {
  const { register } = useAuth();
  const [step, setStep] = useState<StepIndex>(0);
  const [completed, setCompleted] = useState<Set<number>>(new Set());
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<RegisterValues>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: {
      organisation_nom: "",
      pays: "Guinée",
      devise: "GNF",
      admin_nom: "",
      email: "",
      telephone: "",
      password: "",
    },
  });

  const errors = form.formState.errors;
  const currentStep = STEPS[step];

  const goNext = async () => {
    const valid = await form.trigger(currentStep.fields as (keyof RegisterValues)[]);
    if (!valid) return;
    setCompleted((prev) => new Set(prev).add(step));
    if (step < STEPS.length - 1) {
      setStep((s) => (s + 1) as StepIndex);
    }
  };

  const goBack = () => {
    if (step > 0) setStep((s) => (s - 1) as StepIndex);
  };

  const handleStepClick = (target: number) => {
    if (target <= step || completed.has(target - 1)) {
      setStep(target as StepIndex);
    }
  };

  const onSubmit = (values: RegisterValues) => {
    register.mutate(values);
  };

  const pwd = form.watch("password") ?? "";
  const strength = passwordStrength(pwd);

  return (
    <div className="space-y-6">
      <Stepper current={step} completed={completed} onSelect={handleStepClick} />

      <div className="rounded-lg border bg-muted/20 p-3 text-xs text-muted-foreground">
        <div className="font-medium text-foreground">{currentStep.label}</div>
        <div>{currentStep.description}</div>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={currentStep.id}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="space-y-4"
          >
            {step === 0 ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  label="Nom de l'exploitation"
                  containerClassName="sm:col-span-2"
                  placeholder="Ex. Ferme Sory Avicole"
                  error={errors.organisation_nom?.message}
                  {...form.register("organisation_nom")}
                />
                <FormField
                  label="Pays"
                  autoComplete="country-name"
                  error={errors.pays?.message}
                  {...form.register("pays")}
                />
                <FormField
                  label="Devise"
                  readOnly
                  hint="GNF — modifiable plus tard."
                  {...form.register("devise")}
                />
              </div>
            ) : null}

            {step === 1 ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  label="Nom complet"
                  autoComplete="name"
                  placeholder="Prénom Nom"
                  containerClassName="sm:col-span-2"
                  error={errors.admin_nom?.message}
                  {...form.register("admin_nom")}
                />
                <FormField
                  label="Email professionnel"
                  type="email"
                  autoComplete="email"
                  containerClassName="sm:col-span-2"
                  error={errors.email?.message}
                  {...form.register("email")}
                />
                <FormField
                  label="Téléphone"
                  autoComplete="tel"
                  placeholder="+224 ..."
                  containerClassName="sm:col-span-2"
                  {...form.register("telephone")}
                />
              </div>
            ) : null}

            {step === 2 ? (
              <div className="space-y-4">
                <FormField
                  label="Mot de passe"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  hint="8 caractères minimum, au moins un chiffre et un symbole recommandés."
                  error={errors.password?.message}
                  trailing={
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  }
                  {...form.register("password")}
                />
                <div className="space-y-1.5" aria-live="polite">
                  <div className="flex gap-1.5">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className={cn(
                          "h-1.5 flex-1 rounded-full transition-colors",
                          i < strength.score ? strength.color : "bg-muted"
                        )}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Robustesse :{" "}
                    <span className="font-medium text-foreground">{strength.label}</span>
                  </p>
                </div>
                <div className="flex items-start gap-2 rounded-md border border-primary/20 bg-primary/5 px-3 py-2 text-xs text-muted-foreground">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                  <span>
                    À la confirmation par email, vous deviendrez <strong className="text-foreground">propriétaire</strong> de l'organisation et serez connecté automatiquement.
                  </span>
                </div>
              </div>
            ) : null}
          </motion.div>
        </AnimatePresence>

        <div className="flex items-center justify-between gap-2 border-t pt-4">
          <Button
            type="button"
            variant="ghost"
            onClick={goBack}
            disabled={step === 0 || register.isPending}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Retour
          </Button>

          {step < STEPS.length - 1 ? (
            <Button type="button" onClick={goNext} className="gap-2" disabled={register.isPending}>
              Suivant
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          ) : (
            <Button type="submit" className="gap-2" disabled={register.isPending || !form.formState.isValid}>
              {register.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Check className="h-4 w-4" aria-hidden="true" />
              )}
              {register.isPending ? "Création..." : "Créer mon compte"}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
