"use client";

import { useState } from "react";
import { LogOut, Menu, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { SidebarContent } from "@/components/layout/sidebar";
import { useAuth } from "@/hooks/use-auth";
import { useAuthStore } from "@/store/auth-store";
import { ROLE_LABELS } from "@/types/roles";

export function Header() {
  const { theme, setTheme } = useTheme();
  const { logout } = useAuth();
  const user = useAuthStore((state) => state.user);
  const role = useAuthStore((state) => state.role);
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
          <div className="truncate text-sm font-medium">Tableau de bord</div>
          <div className="truncate text-xs text-muted-foreground">{user?.email || "Session active"}</div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {role ? <Badge className="hidden sm:inline-flex">{ROLE_LABELS[role]}</Badge> : null}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          aria-label="Basculer le thème"
        >
          <Sun className="h-4 w-4 dark:hidden" />
          <Moon className="hidden h-4 w-4 dark:block" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => void logout()} aria-label="Déconnexion">
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
