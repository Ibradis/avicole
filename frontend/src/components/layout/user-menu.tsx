"use client";

import Link from "next/link";
import { ChevronDown, KeyRound, LogOut, Moon, Sun, UserCircle2 } from "lucide-react";
import { useTheme } from "next-themes";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/use-auth";
import { useAuthStore } from "@/store/auth-store";
import { ROLE_LABELS } from "@/types/roles";

function getInitials(user: { first_name?: string; last_name?: string; email: string }): string {
  const first = user.first_name?.trim()[0];
  const last = user.last_name?.trim()[0];
  if (first && last) return `${first}${last}`.toUpperCase();
  if (first) return first.toUpperCase();
  const local = user.email.split("@")[0] ?? user.email;
  return local.slice(0, 2).toUpperCase();
}

function getDisplayName(user: { first_name?: string; last_name?: string; email: string }): string {
  if (user.first_name && user.last_name) return `${user.first_name} ${user.last_name}`;
  if (user.first_name) return user.first_name;
  return user.email;
}

export function UserMenu() {
  const user = useAuthStore((state) => state.user);
  const role = useAuthStore((state) => state.role);
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { logout } = useAuth();

  if (!user) return null;

  const initials = getInitials(user);
  const displayName = getDisplayName(user);
  const roleLabel = role ? ROLE_LABELS[role] : null;
  const entiteLabel = user.entite_type === "ferme" ? "Ferme" : user.entite_type === "boutique" ? "Boutique" : null;
  const isDark = (resolvedTheme ?? theme) === "dark";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={`Menu utilisateur de ${displayName}`}
          className="group flex items-center gap-2 rounded-full border border-transparent p-1 pr-2 transition-colors hover:border-border hover:bg-accent/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:gap-3 sm:pr-3"
        >
          <Avatar className="h-9 w-9 ring-2 ring-primary/15 transition-shadow group-hover:ring-primary/30">
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="hidden min-w-0 text-left sm:flex sm:flex-col sm:leading-tight">
            <span className="truncate text-sm font-medium">{displayName}</span>
            {roleLabel ? (
              <span className="truncate text-xs text-muted-foreground">{roleLabel}</span>
            ) : null}
          </div>
          <ChevronDown className="hidden h-4 w-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180 sm:block" aria-hidden="true" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <div className="flex items-center gap-3 px-2 py-2">
          <Avatar className="h-12 w-12 ring-2 ring-primary/15">
            <AvatarFallback className="text-base">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-semibold">{displayName}</span>
            <span className="truncate text-xs text-muted-foreground">{user.email}</span>
            <div className="mt-1.5 flex flex-wrap items-center gap-1">
              {roleLabel ? (
                <Badge variant="default" className="px-1.5 py-0.5">
                  {roleLabel}
                </Badge>
              ) : null}
              {entiteLabel ? (
                <Badge variant="secondary" className="px-1.5 py-0.5">
                  {entiteLabel}
                </Badge>
              ) : null}
            </div>
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Compte</DropdownMenuLabel>
        <DropdownMenuItem disabled>
          <UserCircle2 className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          Mon profil
          <span className="ml-auto text-[10px] uppercase text-muted-foreground">Bientôt</span>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/auth/change-password">
            <KeyRound className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            Mot de passe
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Préférences</DropdownMenuLabel>
        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault();
            setTheme(isDark ? "light" : "dark");
          }}
        >
          {isDark ? (
            <Sun className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          ) : (
            <Moon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          )}
          {isDark ? "Thème clair" : "Thème sombre"}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={() => void logout()}
          className="text-destructive focus:bg-destructive/10 focus:text-destructive"
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
          Déconnexion
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
