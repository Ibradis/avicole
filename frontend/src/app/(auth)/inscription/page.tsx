import Link from "next/link";
import { RegisterForm } from "@/components/forms/register-form";
import { AuthShell } from "@/components/layout/auth-shell";

export default function RegisterPage() {
  return (
    <AuthShell title="Inscription SaaS" description="Créez l'organisation, l'administrateur et la devise GNF par défaut.">
      <RegisterForm />
      <p className="mt-4 text-center text-sm text-muted-foreground">
        Déjà inscrit ?{" "}
        <Link className="text-primary hover:underline" href="/login">
          Se connecter
        </Link>
      </p>
    </AuthShell>
  );
}
