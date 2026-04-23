import { ResetPasswordForm } from "@/components/forms/reset-password-form";
import { AuthShell } from "@/components/layout/auth-shell";

export default function ResetPasswordPage() {
  return (
    <AuthShell title="Réinitialisation" description="Recevez un lien de réinitialisation si votre email existe.">
      <ResetPasswordForm />
    </AuthShell>
  );
}
