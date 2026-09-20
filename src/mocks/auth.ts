export interface MockUser {
  id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: "MEMBER" | "ORG_ADMIN" | "SUPER_ADMIN";
  organizations: string[];
}

export const mockUsers: MockUser[] = [
  {
    id: "mock-user-001",
    email: "admin@ikbs.sn",
    password: "Admin123!",
    firstName: "Admin",
    lastName: "IKBS",
    role: "ORG_ADMIN",

    // Codes des organisations auxquelles
    // cet utilisateur peut accéder.
    organizations: [
      "L7052688",
    ],
  },
];