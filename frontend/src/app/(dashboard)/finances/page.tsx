"use client";

import { Landmark, Repeat } from "lucide-react";
import { CONFIGS } from "@/components/shared/module-placeholder";
import { TabbedResourcePage } from "@/components/shared/tabbed-resource-page";

export default function FinancesPage() {
  return (
    <TabbedResourcePage
      tabs={[
        { label: "Portefeuilles", icon: Landmark, config: CONFIGS.Portefeuilles },
        { label: "Mouvements", icon: Repeat, config: CONFIGS.Finances }
      ]}
    />
  );
}
