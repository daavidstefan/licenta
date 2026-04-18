export type UserRole = string | null | undefined;

export function canCreateProjects(role: UserRole) {
  return role === "admin" || role === "developer";
}

export function canManageDevRequests(role: UserRole) {
  return role === "admin";
}

export function canManageProjectRequests(role: UserRole) {
  return role === "admin";
}
