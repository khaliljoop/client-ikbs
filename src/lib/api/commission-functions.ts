import { ApiError, apiClient } from "./client";
import type { Commission, CommissionFilters, CommissionInput, CommissionPage } from "./commissions";

// BE1 uses the same record shape as the registry, with an independent UUID and FCT code.
export type CommissionFunctionDefinition = Omit<Commission, "organizationId"> & { enabled?: boolean };
type FunctionPage = Omit<CommissionPage, "items"> & { items: CommissionFunctionDefinition[] };

function path(organizationId: string, id?: string) {
  return (organizationId ? "/organizations/" + encodeURIComponent(organizationId) + "/commission-function-reference"
    : "/commission-function-definitions") +
    (id ? "/" + encodeURIComponent(id) : "");
}

export function listCommissionFunctions(organizationId: string, { page, limit, search, status }: CommissionFilters, signal: AbortSignal) {
  const query = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (search) query.set("search", search);
  if (status) query.set("status", status);
  return apiClient<FunctionPage>(path(organizationId) + "?" + query, { signal });
}

export function getCommissionFunction(organizationId: string, id: string, signal?: AbortSignal) {
  return apiClient<CommissionFunctionDefinition>(path(organizationId, id), { signal });
}

export function createCommissionFunction(organizationId: string, input: CommissionInput) {
  return apiClient<CommissionFunctionDefinition>(path(organizationId), { method: "POST", body: JSON.stringify(input) });
}

export function updateCommissionFunction(organizationId: string, id: string, input: CommissionInput & { version: number }) {
  return apiClient<CommissionFunctionDefinition>(path(organizationId, id), { method: "PATCH", body: JSON.stringify(input) });
}

export function archiveCommissionFunction(organizationId: string, id: string, version: number) {
  return apiClient<CommissionFunctionDefinition>(path(organizationId, id) + "/status", {
    method: "PATCH", body: JSON.stringify({ status: "ARCHIVED", version }),
  });
}

export function functionErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    if (error.code === "COMMISSION_FUNCTION_ARCHIVED") return "Cette fonction est archivée.";
    if (error.code === "COMMISSION_FUNCTION_CODE_UNAVAILABLE") return "Le catalogue a atteint sa limite de codes.";
    if (error.status === 409) return "La fonction ou le catalogue a changé. Relisez les données avant de poursuivre.";
    if (error.status === 404) return "Cette fonction ou cette organisation est introuvable ou inaccessible.";
    if (error.status === 403) return "Votre compte ne dispose pas des droits nécessaires.";
    if (error.status === 401) return "Votre session a expiré.";
    if (error.status === 400) return "Vérifiez les données saisies.";
  }
  return "Le catalogue des fonctions est indisponible. Réessayez.";
}

export function setCommissionFunctionEnabled(organizationId: string, id: string, enabled: boolean) {
  return apiClient<CommissionFunctionDefinition>(path(organizationId, id), { method: "PATCH", body: JSON.stringify({ enabled }) });
}

export interface ParticipantFunction {
  id: string;
  functionId: string;
  name: string;
  startedAt: string;
  closedAt: string | null;
  isEffective: boolean;
}

function participantFunctionsPath(organizationId: string, commissionId: string, participationId: string) {
  return "/organizations/" + encodeURIComponent(organizationId) + "/commissions/" + encodeURIComponent(commissionId) +
    "/members/" + encodeURIComponent(participationId) + "/functions";
}

export function listParticipantFunctions(organizationId: string, commissionId: string, participationId: string, signal: AbortSignal) {
  return apiClient<{ items: ParticipantFunction[] }>(participantFunctionsPath(organizationId, commissionId, participationId), { signal });
}

export function assignParticipantFunction(organizationId: string, commissionId: string, participationId: string, functionId: string) {
  return apiClient<ParticipantFunction>(participantFunctionsPath(organizationId, commissionId, participationId), {
    method: "POST", body: JSON.stringify({ functionId }),
  });
}

export function closeParticipantFunction(organizationId: string, commissionId: string, participationId: string, id: string) {
  return apiClient<ParticipantFunction>(participantFunctionsPath(organizationId, commissionId, participationId) + "/" + encodeURIComponent(id) + "/status", {
    method: "PATCH", body: JSON.stringify({ status: "CLOSED" }),
  });
}

export function participantFunctionError(error: unknown) {
  if (error instanceof ApiError) {
    if (error.code === "MANDATE_PRESIDENT_ALREADY_ASSIGNED") return "Cette commission a déjà un président. Clôturez son mandat avant d’attribuer la présidence.";
    if (error.code === "MANDATE_ALREADY_ASSIGNED") return "Cette fonction est déjà attribuée à ce participant.";
    if (error.code === "MANDATE_FUNCTION_NOT_ENABLED") return "Cette fonction n’est plus activée pour l’organisation.";
    if (error.code === "MANDATE_PARTICIPANT_INELIGIBLE") return "Le participant n’est plus éligible à cette attribution.";
    if (error.code === "COMMISSION_ARCHIVED") return "Cette commission est archivée.";
  }
  return functionErrorMessage(error);
}
