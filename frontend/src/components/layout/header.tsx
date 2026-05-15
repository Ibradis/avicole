"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { SidebarContent } from "@/components/layout/sidebar";
import { UserMenu } from "@/components/layout/user-menu";

export function Header() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-2 border-b bg-background/95 px-4 backdrop-blur lg:px-8">
      <div className="flex min-w-0 items-center gap-2">
        <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              aria-label="Ouvrir le menu de navigation"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 border-0 p-0" hideClose>
            <SheetTitle className="sr-only">Navigation principale</SheetTitle>
            <SidebarContent onNavigate={() => setMobileNavOpen(false)} />
          </SheetContent>
        </Sheet>
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold tracking-tight">Tableau de bord</div>
          <div className="truncate text-xs text-muted-foreground">Avicole ERP</div>
        </div>
      </div>
      <UserMenu />
    </header>
  );
}
