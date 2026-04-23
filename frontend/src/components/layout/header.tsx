"use client";

import { LogOut, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { useAuthStore } from "@/store/auth-store";
import { ROLE_LABELS } from "@/types/roles";

export function Header() {
  const { theme, setTheme } = useTheme();
  const { logout } = useAuth();
  const user = useAuthStore((state) => state.user);
  const role = useAuthStore((state) => state.role);

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b bg-background/95 px-4 backdrop-blur lg:px-8">
      <div>
        <div className="text-sm font-medium">Tableau de bord</div>
        <div className="text-xs text-muted-foreground">{user?.email || "Session active"}</div>
      </div>
      <div className="flex items-center gap-2">
        {role ? <Badge>{ROLE_LABELS[role]}</Badge> : null}
        <Button variant="ghost" size="icon" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} aria-label="Basculer le thème">
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
