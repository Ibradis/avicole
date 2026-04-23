"use client";

import { HeartPulse, Pill, Syringe } from "lucide-react";
import { CONFIGS } from "@/components/shared/module-placeholder";
import { TabbedResourcePage } from "@/components/shared/tabbed-resource-page";

export default function SantePage() {
  return (
    <TabbedResourcePage
      tabs={[
        { label: "Vaccinations", icon: Syringe, config: CONFIGS.Vaccinations },
        { label: "Traitements", icon: Pill, config: CONFIGS.Traitements },
        { label: "Mortalités", icon: HeartPulse, config: CONFIGS["Mortalités"] }
      ]}
    />
  );
}
