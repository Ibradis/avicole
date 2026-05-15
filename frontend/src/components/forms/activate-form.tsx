"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/forms/form-field";
import { useAuth } from "@/hooks/use-auth";

const schema = z.object({
  token: z.string().min(8, "Token requis"),
  password: z.string().min(8, "8 caractères minimum"),
});

export function ActivateForm() {
  const params = useSearchParams();
  const { activate } = useAuth();
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: { token: params.get("token") ?? "", password: "" },
  });
  const errors = form.formState.errors;

  return (
    <form
      onSubmit={form.handleSubmit((values) => activate.mutate(values))}
      className="space-y-4"
      noValidate
    >
      <FormField
        label="Token d'activation"
        error={errors.token?.message}
        {...form.register("token")}
      />
      <FormField
        label="Nouveau mot de passe"
        type="password"
        autoComplete="new-password"
        hint="8 caractères minimum"
        error={errors.password?.message}
        {...form.register("password")}
      />
      <Button className="w-full" disabled={activate.isPending || !form.formState.isValid}>
        Activer le compte
      </Button>
    </form>
  );
}
