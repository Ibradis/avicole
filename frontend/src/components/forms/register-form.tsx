"use client";

import { zodResolver } from "@hookform/resolvers/zod";
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
      className="grid gap-4 sm:grid-cols-2"
      noValidate
    >
      <FormField
        label="Nom de l'exploitation"
        containerClassName="sm:col-span-2"
        error={errors.organisation_nom?.message}
        {...form.register("organisation_nom")}
      />
      <FormField label="Pays" error={errors.pays?.message} {...form.register("pays")} />
      <FormField label="Devise" readOnly hint="Devise par défaut" {...form.register("devise")} />
      <FormField
        label="Nom administrateur"
        error={errors.admin_nom?.message}
        autoComplete="name"
        {...form.register("admin_nom")}
      />
      <FormField label="Téléphone" autoComplete="tel" {...form.register("telephone")} />
      <FormField
        label="Email"
        type="email"
        autoComplete="email"
        error={errors.email?.message}
        {...form.register("email")}
      />
      <FormField
        label="Mot de passe"
        type="password"
        autoComplete="new-password"
        error={errors.password?.message}
        hint="8 caractères minimum"
        {...form.register("password")}
      />
      <Button className="sm:col-span-2" disabled={register.isPending || !form.formState.isValid}>
        {register.isPending ? "Création..." : "Créer le compte SaaS"}
      </Button>
    </form>
  );
}
