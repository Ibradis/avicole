import { Suspense } from "react";
import { ActivateForm } from "@/components/forms/activate-form";
import { AuthShell } from "@/components/layout/auth-shell";

export default function ActivatePage() {
  return (
    <AuthShell title="Activation du compte" description="Définissez votre mot de passe à partir du lien d'invitation.">
      <Suspense fallback={null}>
        <ActivateForm />
      </Suspense>
    </AuthShell>
  );
}
