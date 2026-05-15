"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ConfirmRegistrationForm } from "@/components/forms/confirm-registration-form";
import { AuthShell } from "@/components/layout/auth-shell";

export default function ConfirmRegistrationPage() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";

  return (
    <AuthShell
      title="Confirmez votre compte"
      description="Saisissez le code à 6 chiffres que nous venons de vous envoyer par email."
    >
      <ConfirmRegistrationForm email={email} />
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Email incorrect ?{" "}
        <Link className="font-medium text-primary hover:underline" href="/inscription">
          Modifier mon inscription
        </Link>
      </p>
    </AuthShell>
  );
}
