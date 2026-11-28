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

export type ParticipationStatus = "OPEN" | "CLOSED";

export interface CommissionParticipation {
  id: string;
  organizationId: string;
  commissionId: string;
  memberId: string;
  startedAt: string;
  endedAt: string | null;
  createdAt: string;
  updatedAt: string;
  version: number;
  status: ParticipationStatus;
  isOpen: boolean;
  isEffective: boolean;
  memberStatus: import("./members").MemberStatus | null;
  commissionStatus: CommissionStatus;
}

export interface ParticipationListFilters {
  page: number;
  limit: number;
  status?: ParticipationStatus;
  effective?: boolean;
}

export interface ParticipationListResponse extends Omit<CommissionPage, "items"> {
  items: CommissionParticipation[];
}

export interface CreateParticipationInput { memberId: string }
export interface CloseParticipationInput { status: "CLOSED"; version: number }

export function listCommissionParticipations(organizationId: string, id: string, filters: ParticipationListFilters, signal: AbortSignal) {
  const query = new URLSearchParams({ page: String(filters.page), limit: String(filters.limit) });
  if (filters.status) query.set("status", filters.status);
  if (filters.effective !== undefined) query.set("effective", String(filters.effective));
  return apiClient<ParticipationListResponse>(path(organizationId, id) + "/members?" + query, { signal });
}

export function createCommissionParticipation(organizationId: string, id: string, input: CreateParticipationInput) {
  return apiClient<CommissionParticipation>(path(organizationId, id) + "/members", {
    method: "POST", body: JSON.stringify({ memberId: input.memberId }),
  });
}

export function closeCommissionParticipation(organizationId: string, id: string, participationId: string, input: CloseParticipationInput) {
  return apiClient<CommissionParticipation>(path(organizationId, id) + "/members/" + encodeURIComponent(participationId) + "/status", {
    method: "PATCH", body: JSON.stringify({ status: input.status, version: input.version }),
  });
}

const participationErrors: Readonly<Record<string, string>> = {
  PARTICIPATION_ALREADY_OPEN: "Ce membre possède déjà une participation ouverte.",
  PARTICIPATION_ALREADY_CLOSED: "Cette participation a déjà été clôturée.",
  PARTICIPATION_VERSION_CONFLICT: "Cette participation a changé depuis sa consultation.",
  PARTICIPATION_MEMBER_INELIGIBLE: "Ce membre n’est plus éligible à une nouvelle participation.",
  COMMISSION_ARCHIVED: "Cette commission a été archivée.",
  MEMBER_NOT_FOUND: "Cette fiche membre n’est plus disponible.",
  FORBIDDEN: "Vous ne disposez pas des permissions nécessaires.",
};

export function participationErrorMessage(error: unknown) {
  if (error instanceof ApiError && Object.hasOwn(participationErrors, error.code)) return participationErrors[error.code];
  return commissionErrorMessage(error);
}
