"use client";

import { hasPermission } from "@/lib/auth";
import { useAuthStore } from "@/store/auth-store";
import type { Permission } from "@/types/roles";

export function RoleGuard({
  permission,
  children,
  fallback = null
}: {
  permission: Permission;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const role = useAuthStore((state) => state.role);
  if (!hasPermission(role, permission)) return fallback;
  return <>{children}</>;
}
