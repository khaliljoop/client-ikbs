export interface SessionProfile {
  user: { id: string; memberId: string | null; displayName: string };
  globalPermissions: string[];
  organizations: { id: string; code: string; name: string; permissions: string[] }[];
  session: { expiresAt: string };
}
