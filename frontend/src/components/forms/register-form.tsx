"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";

const schema = z.object({
  organisation_nom: z.string().min(2, "Nom requis"),
  pays: z.string().min(2, "Pays requis"),
  devise: z.literal("GNF"),
  admin_nom: z.string().min(2, "Nom administrateur requis"),
  email: z.string().email("Email invalide"),
  telephone: z.string().optional(),
  password: z.string().min(8, "8 caractères minimum")
});

export function RegisterForm() {
  const { register } = useAuth();
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: { organisation_nom: "", pays: "Guinée", devise: "GNF", admin_nom: "", email: "", telephone: "", password: "" }
  });

  return (
    <form onSubmit={form.handleSubmit((values) => register.mutate(values))} className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="organisation_nom">Nom de l&apos;exploitation</Label>
        <Input id="organisation_nom" {...form.register("organisation_nom")} />
        <p className="text-xs text-destructive">{form.formState.errors.organisation_nom?.message}</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="pays">Pays</Label>
        <Input id="pays" {...form.register("pays")} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="devise">Devise</Label>
        <Input id="devise" readOnly {...form.register("devise")} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="admin_nom">Nom administrateur</Label>
        <Input id="admin_nom" {...form.register("admin_nom")} />
        <p className="text-xs text-destructive">{form.formState.errors.admin_nom?.message}</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="telephone">Téléphone</Label>
        <Input id="telephone" {...form.register("telephone")} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" {...form.register("email")} />
        <p className="text-xs text-destructive">{form.formState.errors.email?.message}</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Mot de passe</Label>
        <Input id="password" type="password" {...form.register("password")} />
        <p className="text-xs text-destructive">{form.formState.errors.password?.message}</p>
      </div>
      <Button className="sm:col-span-2" disabled={register.isPending || !form.formState.isValid}>
        {register.isPending ? "Création..." : "Créer le compte SaaS"}
      </Button>
    </form>
  );
}
