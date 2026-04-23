"use client";

import { Boxes, Package, Repeat } from "lucide-react";
import { CONFIGS } from "@/components/shared/module-placeholder";
import { TabbedResourcePage } from "@/components/shared/tabbed-resource-page";
import { useAuthStore } from "@/store/auth-store";

export default function StockPage() {
  const role = useAuthStore((state) => state.role);

  return (
    <TabbedResourcePage
      tabs={[
        ...(role !== "vendeur" ? [{ label: "Produits", icon: Package, config: CONFIGS.Produits }] : []),
        { label: "Stock Global", icon: Boxes, config: CONFIGS.Stock },
        { label: "Matériel", icon: Boxes, config: CONFIGS.StockMateriel },
        ...(role !== "vendeur" ? [{ label: "Mouvements", icon: Repeat, config: CONFIGS["Mouvements de stock"] }] : [])
      ]}
    />
  );
}
