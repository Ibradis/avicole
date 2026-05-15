import { PERMISSIONS, type Permission, type Role } from "@/types/roles";

export function hasPermission(role: Role | null | undefined, permission: Permission | Permission[]) {
  if (!role) return false;
  const permissions = PERMISSIONS[role] ?? [];
  if (permissions.includes("*")) return true;
  if (Array.isArray(permission)) {
    return permission.some(p => permissions.includes(p as Permission));
  }
  return permissions.includes(permission);
}

export function isBoutiqueRole(role: Role | null | undefined) {
  return role === "gerant" || role === "vendeur";
}
