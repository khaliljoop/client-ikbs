import {
  mockUsers,
  type MockUser,
} from "@/mocks/auth";

export interface MockLoginInput {
  email: string;
  password: string;
}

const MOCK_USER_STORAGE_KEY =
  "ikbs_mock_user";

export async function mockLogin({
  email,
  password,
}: MockLoginInput): Promise<MockUser> {
  await new Promise((resolve) =>
    setTimeout(resolve, 500),
  );

  const normalizedEmail =
    email.trim().toLowerCase();

  const user = mockUsers.find(
    (item) =>
      item.email.toLowerCase() ===
        normalizedEmail &&
      item.password === password,
  );

  if (!user) {
    throw new Error(
      "Email ou mot de passe incorrect.",
    );
  }

  return user;
}

export function saveMockUser(
  user: MockUser,
): void {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(
    MOCK_USER_STORAGE_KEY,
    JSON.stringify(user),
  );
}

export function getMockUser():
  MockUser | null {
  if (typeof window === "undefined") {
    return null;
  }

  const value =
    localStorage.getItem(
      MOCK_USER_STORAGE_KEY,
    );

  if (!value) {
    return null;
  }

  try {
    return JSON.parse(
      value,
    ) as MockUser;
  } catch {
    localStorage.removeItem(
      MOCK_USER_STORAGE_KEY,
    );

    return null;
  }
}

export function removeMockUser(): void {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem(
    MOCK_USER_STORAGE_KEY,
  );
}

export function canAccessOrganization(
  user: MockUser,
  organizationCode: string,
): boolean {
  /*
   * SUPER_ADMIN pourra accéder à toutes
   * les organisations pendant nos tests.
   */
  if (
    user.role === "SUPER_ADMIN"
  ) {
    return true;
  }

  return user.organizations.includes(
    organizationCode,
  );
}