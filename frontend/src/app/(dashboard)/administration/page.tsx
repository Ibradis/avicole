"use client";

import { Building2, Package, Settings, Users } from "lucide-react";
import { CONFIGS } from "@/components/shared/module-placeholder";
import { TabbedResourcePage } from "@/components/shared/tabbed-resource-page";

export default function AdministrationPage() {
  return (
    <TabbedResourcePage
      tabs={[
        { label: "Boutiques", icon: Building2, config: CONFIGS.Boutiques },
        { label: "Produits", icon: Package, config: CONFIGS.Produits },
        { label: "Équipe", icon: Users, config: CONFIGS.Utilisateurs },
        { label: "Organisation", icon: Settings, config: CONFIGS.Organisation }
      ]}
    />
  );
}
