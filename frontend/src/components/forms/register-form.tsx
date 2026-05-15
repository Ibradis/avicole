"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Building2, ShieldCheck, UserCog } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/forms/form-field";
import { useAuth } from "@/hooks/use-auth";

const schema = z.object({
  organisation_nom: z.string().min(2, "Nom requis"),
  pays: z.string().min(2, "Pays requis"),
  devise: z.literal("GNF"),
  admin_nom: z.string().min(2, "Nom administrateur requis"),
  email: z.string().email("Email invalide"),
  telephone: z.string().optional(),
  password: z.string().min(8, "8 caractères minimum"),
});

function FormSection({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <header className="flex items-start gap-3 border-b pb-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </header>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}

export function RegisterForm() {
  const { register } = useAuth();
  const form = useForm<z.infer<typeof schema>>({
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

  return (
    <form
      onSubmit={form.handleSubmit((values) => register.mutate(values))}
      className="space-y-6"
      noValidate
    >
      <FormSection
        icon={Building2}
        title="Votre organisation"
        description="L'exploitation que vous allez gérer dans Avicole ERP. Une ferme initiale sera créée automatiquement."
      >
        <FormField
          label="Nom de l'exploitation"
          containerClassName="sm:col-span-2"
          error={errors.organisation_nom?.message}
          placeholder="Ex. Ferme Sory Avicole"
          {...form.register("organisation_nom")}
        />
        <FormField
          label="Pays"
          error={errors.pays?.message}
          autoComplete="country-name"
          {...form.register("pays")}
        />
        <FormField
          label="Devise"
          readOnly
          hint="GNF — devise par défaut, modifiable plus tard."
          {...form.register("devise")}
        />
      </FormSection>

      <FormSection
        icon={UserCog}
        title="Votre compte administrateur"
        description="Vous serez le propriétaire de l'organisation avec tous les droits d'administration."
      >
        <FormField
          label="Nom complet"
          autoComplete="name"
          error={errors.admin_nom?.message}
          placeholder="Prénom Nom"
          {...form.register("admin_nom")}
        />
        <FormField label="Téléphone" autoComplete="tel" placeholder="+224 ..." {...form.register("telephone")} />
        <FormField
          label="Email professionnel"
          type="email"
          autoComplete="email"
          error={errors.email?.message}
          containerClassName="sm:col-span-2"
          {...form.register("email")}
        />
        <FormField
          label="Mot de passe"
          type="password"
          autoComplete="new-password"
          hint="8 caractères minimum"
          error={errors.password?.message}
          containerClassName="sm:col-span-2"
          {...form.register("password")}
        />
      </FormSection>

      <div className="flex items-center gap-2 rounded-md border border-primary/20 bg-primary/5 px-3 py-2 text-xs text-muted-foreground">
        <ShieldCheck className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
        <span>
          À la création, vous deviendrez <strong className="text-foreground">propriétaire</strong> de cette organisation et serez connecté automatiquement.
        </span>
      </div>

      <Button className="w-full" disabled={register.isPending || !form.formState.isValid}>
        {register.isPending ? "Création de votre espace..." : "Créer mon organisation et mon compte"}
      </Button>
    </form>
  );
}
