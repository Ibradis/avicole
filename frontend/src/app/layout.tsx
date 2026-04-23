import type { Metadata } from "next";
import NextTopLoader from "nextjs-toploader";
import { AppProviders } from "@/components/providers/app-providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "SaaS Avicole ERP",
  description: "ERP SaaS avicole multi-tenant"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body>
        <NextTopLoader color="#1e40af" showSpinner={false} shadow="0 0 10px #1e40af,0 0 5px #1e40af" />
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
