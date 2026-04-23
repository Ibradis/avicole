"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";

const schema = z.object({
  token: z.string().min(8, "Token requis"),
  password: z.string().min(8, "8 caractères minimum")
});

export function ActivateForm() {
  const params = useSearchParams();
  const { activate } = useAuth();
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: { token: params.get("token") ?? "", password: "" }
  });

  return (
    <form onSubmit={form.handleSubmit((values) => activate.mutate(values))} className="space-y-4">
      <div className="space-y-2">
        <Label>Token d&apos;activation</Label>
        <Input {...form.register("token")} />
      </div>
      <div className="space-y-2">
        <Label>Nouveau mot de passe</Label>
        <Input type="password" {...form.register("password")} />
      </div>
      <Button className="w-full" disabled={activate.isPending || !form.formState.isValid}>
        Activer le compte
      </Button>
    </form>
  );
}
