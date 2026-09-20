import { apiClient } from "./client";

import type {
  Organization,
  OrganizationListResponse,
  OrganizationStatus,
} from "@/types/organization";

export interface ListOrganizationsParams {
  page?: number;
  limit?: number;
  search?: string;
}

export interface CreateOrganizationInput {
  name: string;
  description?: string;
  email?: string;
  phone?: string;
  address?: string;
  logoUrl?: string;
}

export interface UpdateOrganizationInput {
  name?: string;
  description?: string;
  email?: string;
  phone?: string;
  address?: string;
  logoUrl?: string;
}

export async function listOrganizations(
  params: ListOrganizationsParams = {},
): Promise<OrganizationListResponse> {
  const searchParams = new URLSearchParams();

  if (params.page !== undefined) {
    searchParams.set("page", String(params.page));
  }

  if (params.limit !== undefined) {
    searchParams.set("limit", String(params.limit));
  }

  if (params.search) {
    searchParams.set("search", params.search);
  }

  const query = searchParams.toString();

  return apiClient<OrganizationListResponse>(
    `/organizations${query ? `?${query}` : ""}`,
  );
}

export async function listPublicOrganizations(
  params: ListOrganizationsParams = {},
): Promise<OrganizationListResponse> {
  const searchParams =
    new URLSearchParams();

  if (params.page !== undefined) {
    searchParams.set(
      "page",
      String(params.page),
    );
  }

  if (params.limit !== undefined) {
    searchParams.set(
      "limit",
      String(params.limit),
    );
  }

  if (params.search) {
    searchParams.set(
      "search",
      params.search,
    );
  }

  const query =
    searchParams.toString();

  return apiClient<OrganizationListResponse>(
    `/organizations/public${
      query ? `?${query}` : ""
    }`,
  );
}

export async function getOrganization(
  id: string,
): Promise<Organization> {
  return apiClient<Organization>(
    `/organizations/${id}`,
  );
}

export async function getPublicOrganization(
  code: string,
): Promise<Organization> {
  return apiClient<Organization>(
    `/organizations/public/${encodeURIComponent(code)}`,
  );
}

export async function createOrganization(
  data: CreateOrganizationInput,
): Promise<Organization> {
  return apiClient<Organization>(
    "/organizations",
    {
      method: "POST",
      body: JSON.stringify(data),
    },
  );
}

export async function updateOrganization(
  id: string,
  data: UpdateOrganizationInput,
): Promise<Organization> {
  return apiClient<Organization>(
    `/organizations/${id}`,
    {
      method: "PATCH",
      body: JSON.stringify(data),
    },
  );
}
export async function changeOrganizationStatus(
  id: string,
  status: OrganizationStatus,
): Promise<Organization> {
  return apiClient<Organization>(
    `/organizations/${id}/status`,
    {
      method: "PATCH",
      body: JSON.stringify({
        status,
      }),
    },
  );
}

export async function deleteOrganization(
  id: string,
): Promise<void> {
  await apiClient<void>(
    `/organizations/${id}`,
    {
      method: "DELETE",
    },
  );
}