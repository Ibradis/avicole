import Link from "next/link";
import { RegisterForm } from "@/components/forms/register-form";
import { AuthShell } from "@/components/layout/auth-shell";

export default function RegisterPage() {
  return (
    <AuthShell
      title="Créer votre espace Avicole ERP"
      description="Trois étapes guidées : votre organisation, vos coordonnées, puis votre mot de passe."
    >
      <RegisterForm />
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Déjà inscrit ?{" "}
        <Link className="font-medium text-primary hover:underline" href="/login">
          Se connecter
        </Link>
      </p>
    </AuthShell>
  );
}
