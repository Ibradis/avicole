"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";

const schema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(1, "Mot de passe requis")
});

export function LoginForm() {
  const { login } = useAuth();
  const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema), mode: "onChange", defaultValues: { email: "", password: "" } });

  return (
    <form onSubmit={form.handleSubmit((values) => login.mutate(values))} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" autoComplete="email" {...form.register("email")} />
        <p className="text-xs text-destructive">{form.formState.errors.email?.message}</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Mot de passe</Label>
        <Input id="password" type="password" autoComplete="current-password" {...form.register("password")} />
        <p className="text-xs text-destructive">{form.formState.errors.password?.message}</p>
      </div>
      <Button className="w-full" disabled={login.isPending || !form.formState.isValid}>
        {login.isPending ? "Connexion..." : "Se connecter"}
      </Button>
      <div className="flex items-center justify-between text-sm">
        <Link className="text-primary hover:underline" href="/mot-de-passe/reinitialiser">
          Mot de passe oublié
        </Link>
        <Link className="text-primary hover:underline" href="/inscription">
          Créer un compte
        </Link>
      </div>
    </form>
  );
}
