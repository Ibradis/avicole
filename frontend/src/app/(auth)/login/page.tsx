import { AuthShell } from "@/components/layout/auth-shell";
import { LoginForm } from "@/components/forms/login-form";

export default function LoginPage() {
  return (
    <AuthShell title="Connexion" description="Accédez à votre espace avicole sécurisé.">
      <LoginForm />
    </AuthShell>
  );
}
