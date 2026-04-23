import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function AuthShell({
  title,
  description,
  children
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-secondary/40">
      <div className="mx-auto grid min-h-screen w-full max-w-6xl items-center gap-8 px-4 py-10 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="hidden lg:block">
          <div className="space-y-6">
            <div>
              <p className="text-sm font-medium text-primary">SaaS Avicole ERP</p>
              <h1 className="mt-3 max-w-xl text-5xl font-semibold leading-tight tracking-normal">
                Gestion unifiée ferme, boutiques et finances.
              </h1>
            </div>
            <div className="grid max-w-lg grid-cols-2 gap-3">
              {["Mouvements caisse", "Lots & production", "Stocks critiques", "Rôles stricts"].map((item) => (
                <div key={item} className="rounded-lg border bg-card p-4 text-sm shadow-sm">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>
        <Card className="mx-auto w-full max-w-xl shadow-soft">
          <CardHeader>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </CardHeader>
          <CardContent>{children}</CardContent>
        </Card>
      </div>
    </main>
  );
}
