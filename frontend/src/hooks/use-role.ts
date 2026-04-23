"use client";

import { hasPermission } from "@/lib/auth";
import { useAuthStore } from "@/store/auth-store";
import type { Permission } from "@/types/roles";

export function useRole() {
  const role = useAuthStore((state) => state.role);
  const entiteType = useAuthStore((state) => state.entite_type);
  const entiteId = useAuthStore((state) => state.entite_id);

  return {
    role,
    entiteType,
    entiteId,
    can: (permission: Permission) => hasPermission(role, permission)
  };
}
