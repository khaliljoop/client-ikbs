export type OrganizationStatus =
  | "PENDING"
  | "ACTIVE"
  | "SUSPENDED"
  | "ARCHIVED";

export interface Organization {
  id: string;
  code: string;
  name: string;
  description?: string;
  email?: string;
  phone?: string;
  address?: string;
  logoUrl?: string;
  status: OrganizationStatus;
  createdAt: string;
  updatedAt: string;
}

export type PublicOrganization = Pick<Organization, "code" | "name" | "description" | "logoUrl"> & { status: "ACTIVE" };

export interface OrganizationListResponse<T = Organization> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}