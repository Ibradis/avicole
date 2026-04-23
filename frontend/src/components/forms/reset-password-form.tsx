"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";

const schema = z.object({ email: z.string().email("Email invalide") });

export function ResetPasswordForm() {
  const { resetPassword } = useAuth();
  const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema), mode: "onChange", defaultValues: { email: "" } });

  return (
    <form onSubmit={form.handleSubmit((values) => resetPassword.mutate(values))} className="space-y-4">
      <div className="space-y-2">
        <Label>Email</Label>
        <Input type="email" {...form.register("email")} />
        <p className="text-xs text-destructive">{form.formState.errors.email?.message}</p>
      </div>
      <Button className="w-full" disabled={resetPassword.isPending || !form.formState.isValid}>
        Envoyer le lien
      </Button>
    </form>
  );
}
