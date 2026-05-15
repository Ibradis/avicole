"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/forms/form-field";
import { useAuth } from "@/hooks/use-auth";

const schema = z.object({ email: z.string().email("Email invalide") });

export function ResetPasswordForm() {
  const { resetPassword } = useAuth();
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: { email: "" },
  });

  return (
    <form
      onSubmit={form.handleSubmit((values) => resetPassword.mutate(values))}
      className="space-y-4"
      noValidate
    >
      <FormField
        label="Email"
        type="email"
        autoComplete="email"
        error={form.formState.errors.email?.message}
        {...form.register("email")}
      />
      <Button className="w-full" disabled={resetPassword.isPending || !form.formState.isValid}>
        Envoyer le lien
      </Button>
    </form>
  );
}
