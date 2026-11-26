import { ApiError, apiClient } from "./client";

export type CommissionStatus = "ACTIVE" | "ARCHIVED";

export interface Commission {
  id: string;
  organizationId: string;
  code: string;
  name: string;
  description: string | null;
  status: CommissionStatus;
  version: number;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
}

export interface CommissionFilters {
  page: number;
  limit: number;
  search: string;
  status: CommissionStatus | "";
}

export interface CommissionPage {
  items: Commission[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface CommissionInput {
  name: string;
  description: string | null;
}

function path(organizationId: string, id?: string) {
  return "/organizations/" + encodeURIComponent(organizationId) + "/commissions" +
    (id ? "/" + encodeURIComponent(id) : "");
}

export function listCommissions(organizationId: string, filters: CommissionFilters, signal: AbortSignal) {
  const query = new URLSearchParams({ page: String(filters.page), limit: String(filters.limit) });
  if (filters.search) query.set("search", filters.search);
  if (filters.status) query.set("status", filters.status);
  return apiClient<CommissionPage>(path(organizationId) + "?" + query, { signal });
}

export function createCommission(organizationId: string, input: CommissionInput) {
  return apiClient<Commission>(path(organizationId), { method: "POST", body: JSON.stringify(input) });
}

export function getCommission(organizationId: string, id: string, signal?: AbortSignal) {
  return apiClient<Commission>(path(organizationId, id), { signal });
}

export function updateCommission(organizationId: string, id: string, input: CommissionInput & { version: number }) {
  return apiClient<Commission>(path(organizationId, id), { method: "PATCH", body: JSON.stringify(input) });
}

export function archiveCommission(organizationId: string, id: string, version: number) {
  return apiClient<Commission>(path(organizationId, id) + "/status", {
    method: "PATCH", body: JSON.stringify({ version, status: "ARCHIVED" }),
  });
}

export function commissionErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    if (error.status === 400) return "Vérifiez les champs et les paramètres renseignés.";
    if (error.status === 401) return "Votre session a expiré.";
    if (error.status === 403) return "Votre compte ne dispose pas des droits nécessaires.";
    if (error.status === 404) return "Cette commission ou cette organisation est introuvable ou inaccessible.";
    if (error.status === 409) return "L’état de la commission ou du registre a changé. Relisez les données avant de poursuivre.";
  }
  return "Le service des commissions est indisponible. Réessayez.";
}
