import type { SessionProfile } from "../../types/auth";
import { safeReturnPath } from "./redirect";

export const globalOrganizationManagement = "organizations.global.manage";
export const organizationRead = "organization.read";
export const organizationUpdate = "organization.profile.update";
export const workspacePath = "/espaces";

export function canManageOrganizations(profile: SessionProfile) {
  return profile.globalPermissions.includes(globalOrganizationManagement);
}

export function accessibleOrganizations(profile: SessionProfile) {
  return profile.organizations.filter(({ code, permissions }) =>
    /^[A-Za-z][0-9]{7}$/.test(code) && permissions.includes(organizationRead)
  );
}

export function findWorkspace(profile: SessionProfile, code: string) {
  return accessibleOrganizations(profile).find((organization) => organization.code.toUpperCase() === code.toUpperCase());
}

export function postLoginPath(profile: SessionProfile, requested: string | null) {
  const destination = safeReturnPath(requested);
  const global = canManageOrganizations(profile);
  if (requested === destination) {
    if (destination === "/dash" || destination === "/dash/organisations") {
      if (global) return destination;
    } else if (destination.startsWith("/espace/")) {
      if (findWorkspace(profile, destination.slice("/espace/".length))) return destination;
    } else {
      return destination;
    }
  }

  if (global) return "/dash";
  const organizations = accessibleOrganizations(profile);
  return organizations.length === 1 ? "/espace/" + organizations[0].code : workspacePath;
}
