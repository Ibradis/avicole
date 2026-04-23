"use client";

import { FileDown, Sheet } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { downloadBlob } from "@/lib/axios";

export function ExportButtons({ pdfUrl, excelUrl, baseName }: { pdfUrl: string; excelUrl: string; baseName: string }) {
  const exportFile = async (url: string, ext: "pdf" | "xlsx") => {
    try {
      await downloadBlob(url, `${baseName}.${ext}`);
      toast.success("Export généré");
    } catch {
      toast.error("Export indisponible");
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" onClick={() => exportFile(pdfUrl, "pdf")}>
        <FileDown className="mr-2 h-4 w-4" />
        PDF
      </Button>
      <Button variant="outline" size="sm" onClick={() => exportFile(excelUrl, "xlsx")}>
        <Sheet className="mr-2 h-4 w-4" />
        Excel
      </Button>
    </div>
  );
}
