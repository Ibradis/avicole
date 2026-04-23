"use client";

import { ClipboardList, FileText, Stethoscope } from "lucide-react";
import { CONFIGS } from "@/components/shared/module-placeholder";
import { TabbedResourcePage } from "@/components/shared/tabbed-resource-page";

export default function VeterinairesPage() {
  return (
    <TabbedResourcePage
      tabs={[
        { label: "Vétérinaires", icon: Stethoscope, config: CONFIGS.Vétérinaires },
        { label: "Contrats", icon: FileText, config: CONFIGS.Contrats },
        { label: "Interventions", icon: ClipboardList, config: CONFIGS.Interventions }
      ]}
    />
  );
}
