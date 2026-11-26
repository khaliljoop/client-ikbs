import { ApiError, apiClient } from "./client";

export interface RoleInput {
  name: string;
  description: string | null;
  permissions: string[];
}

export interface OrganizationRole extends RoleInput {
  id: string;
  code: string;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

function organizationPath(id: string) {
  return "/organizations/" + encodeURIComponent(id);
}

function rolePath(id: string, roleId?: string) {
  return organizationPath(id) + "/roles" + (roleId ? "/" + encodeURIComponent(roleId) : "");
}

export function listRoles(id: string, signal: AbortSignal) {
  return apiClient<{ items: OrganizationRole[] }>(rolePath(id), { signal });
}

export function listDelegableRolePermissions(id: string, signal: AbortSignal) {
  return apiClient<{ permissions: string[] }>(organizationPath(id) + "/role-permissions", { signal });
}

export function createRole(id: string, input: RoleInput & { code: string }) {
  return apiClient<OrganizationRole>(rolePath(id), { method: "POST", body: JSON.stringify(input) });
}

export function updateRole(id: string, roleId: string, input: Partial<RoleInput>) {
  return apiClient<OrganizationRole>(rolePath(id, roleId), { method: "PATCH", body: JSON.stringify(input) });
}

export function deleteRole(id: string, roleId: string) {
  return apiClient<void>(rolePath(id, roleId), { method: "DELETE" });
}

export function roleErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    if (error.code === "ORG_ROLE_IN_USE") return "Ce rôle est encore attribué. Retirez ses affectations avant de le supprimer.";
    if (error.code === "ORG_ROLE_CODE_EXISTS") return "Ce code est déjà utilisé dans cette organisation.";
    if (error.code === "SYSTEM_ROLE_PROTECTED") return "Ce code est réservé à un rôle intégré.";
    if (error.code === "ORG_ROLE_PERMISSION_NOT_HELD") return "Une permission sélectionnée ne peut plus être déléguée par votre compte.";
    if (error.status === 400) return "Vérifiez le code, le nom, la description et les permissions.";
    if (error.status === 401) return "Votre session a expiré.";
    if (error.status === 403) return "Votre compte ne peut pas effectuer cette opération.";
    if (error.status === 404) return "Le rôle ou l’organisation est introuvable ou inaccessible.";
    if (error.status === 409) return "Cette opération est en conflit avec l’état actuel du rôle.";
  }
  return "Le service des rôles est indisponible. Réessayez.";
}

export interface MembershipOption {
  identityId: string;
  displayName: string;
}

function assignmentPath(id: string, identityId: string) {
  return organizationPath(id) + "/memberships/" + encodeURIComponent(identityId) + "/roles";
}

type MembershipPage = { items: MembershipOption[]; total: number; page: number; limit: number };

export function listMemberships(id: string, page: number, search: string, signal: AbortSignal, limit = 15) {
  const query = new URLSearchParams({ page: String(page), limit: String(limit), ...(search && { search }) });
  return apiClient<MembershipPage>(
    organizationPath(id) + "/memberships?" + query, { signal });
}

export async function findMembershipForMember(id: string, memberId: string, signal: AbortSignal) {
  const query = new URLSearchParams({ memberId });
  const result = await apiClient<MembershipPage>(organizationPath(id) + "/memberships?" + query, { signal });
  if (result.total > 1) throw new ApiError(409, "AMBIGUOUS_MEMBER_IDENTITY", "Multiple matching memberships");
  return result.items[0] ?? null;
}

export function listAssignableRoles(id: string, signal: AbortSignal) {
  return apiClient<{ items: { id: string; name: string }[] }>(organizationPath(id) + "/assignable-roles", { signal });
}

export function listAssignedRoles(id: string, identityId: string, signal: AbortSignal) {
  return apiClient<{ roleIds: string[] }>(assignmentPath(id, identityId), { signal });
}

export function assignRole(id: string, identityId: string, roleId: string) {
  return apiClient<{ roleId: string }>(assignmentPath(id, identityId), {
    method: "POST", body: JSON.stringify({ roleId }),
  });
}

export function removeRoleAssignment(id: string, identityId: string, roleId: string) {
  return apiClient<void>(assignmentPath(id, identityId) + "/" + encodeURIComponent(roleId), { method: "DELETE" });
}

export function assignmentErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    if (error.code === "ROLE_SELF_ASSIGNMENT") return "Vous ne pouvez pas vous attribuer un rôle.";
    if (error.code === "ROLE_ALREADY_ASSIGNED") return "Ce rôle est déjà attribué.";
    if (error.code === "ACTIVE_MEMBERSHIP_NOT_FOUND") return "Cette appartenance est introuvable ou inactive.";
    if (error.code === "ROLE_ASSIGNMENT_NOT_FOUND") return "Cette affectation a déjà été retirée.";
    if (error.code === "AMBIGUOUS_MEMBER_IDENTITY") return "Plusieurs comptes actifs correspondent à cette fiche. L’affectation est bloquée.";
  }
  return roleErrorMessage(error);
}
