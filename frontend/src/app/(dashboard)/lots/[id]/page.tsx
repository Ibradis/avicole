"use client";

import { ClipboardCheck, Egg, Layers } from "lucide-react";
import { CONFIGS } from "@/components/shared/module-placeholder";
import { TabbedResourcePage } from "@/components/shared/tabbed-resource-page";

export default function LotDetailPage() {
  return (
    <TabbedResourcePage
      tabs={[
        { label: "Lots", icon: Layers, config: CONFIGS.Lots },
        { label: "Productions", icon: Egg, config: CONFIGS.Productions },
        { label: "Rapports", icon: ClipboardCheck, config: CONFIGS["Rapports journaliers"] }
      ]}
    />
  );
}
