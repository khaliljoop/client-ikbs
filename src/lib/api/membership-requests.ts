import { ApiError, apiClient } from "./client";

const base = "/membership-requests";
export const requestStatuses = ["PENDING", "APPROVED", "REJECTED"] as const;
export type RequestStatus = typeof requestStatuses[number];

export interface MembershipRequestInput {
  firstName: string;
  lastName: string;
  organizationName: string;
  organizationObjective: string;
}

export interface MembershipRequest extends MembershipRequestInput {
  id: string;
  reference: string;
  email: string;
  phone: string | null;
  address: string | null;
  status: RequestStatus;
  createdAt: string;
  rejectionReason: string | null;
  organizationId: string | null;
  canProvision: boolean;
  awaitingAccount: boolean;
  accessEmailStatus: "PENDING" | "SENT" | null;
}

export type PublicRequestInput = MembershipRequestInput & { email: string };

export function requestMembershipEmailCode(input: PublicRequestInput) {
  return apiClient<{ challengeId: string; expiresIn: number }>(base + "/public", { method: "POST", body: JSON.stringify(input) });
}

export function confirmMembershipRequest(input: PublicRequestInput, challengeId: string, otp: string) {
  return apiClient<{ reference: string; code: string }>(base + "/public/verify", {
    method: "POST", body: JSON.stringify({ request: input, challengeId, otp }),
  });
}

export function confirmMembershipRequestLink(token: string) {
  return apiClient<{ reference: string; code: string }>(base + "/public/confirm-link", {
    method: "POST", body: JSON.stringify({ token }),
  });
}

export function trackMembershipRequest(reference: string, code: string) {
  return apiClient<{ reference: string; status: RequestStatus; createdAt: string; reviewedAt: string | null }>(
    base + "/track", { method: "POST", body: JSON.stringify({ reference, code }) },
  );
}

export function linkMembershipRequest(reference: string, code: string) {
  return apiClient<void>(base + "/claim", { method: "POST", body: JSON.stringify({ reference, code }) });
}

export function listMembershipRequests(page: number, status: RequestStatus | "", search: string, signal: AbortSignal) {
  const query = new URLSearchParams({ page: String(page), limit: "10", ...(status && { status }), ...(search && { search }) });
  return apiClient<{ data: MembershipRequest[]; pagination: { total: number; totalPages: number } }>(
    base + "?" + query, { signal },
  );
}

export function reviewMembershipRequest(id: string, action: "approve" | "reject", reason?: string) {
  return apiClient<MembershipRequest>(base + "/" + encodeURIComponent(id) + "/" + action, {
    method: "PATCH", ...(action === "reject" && { body: JSON.stringify(reason ? { reason } : {}) }),
  });
}

export function retryMembershipAccessEmail(id: string) {
  return apiClient<MembershipRequest>(base + "/" + encodeURIComponent(id) + "/access-email", { method: "POST" });
}

export function membershipRequestError(error: unknown) {
  if (error instanceof ApiError) {
    if (error.code === "REQUEST_EMAIL_CODE_INVALID") return "Code invalide ou expiré. Vérifiez le code ou demandez-en un nouveau.";
    if (error.code === "REQUEST_EMAIL_COOLDOWN") return "Attendez une minute avant de demander un nouveau code.";
    if (error.code === "ACCESS_EMAIL_COOLDOWN") return "Attendez une minute avant de renvoyer l’invitation.";
    if (error.code === "REQUEST_EMAIL_UNAVAILABLE") return "Le code n’a pas pu être envoyé. Réessayez dans un instant.";
    if (error.code === "DUPLICATE_ORGANIZATION_REQUEST") return "Une organisation ou une demande en attente existe déjà avec ce nom ou ce courriel.";
    if (error.code === "REQUEST_TRACKING_UNAVAILABLE") return "Demande introuvable. Vérifiez la référence et le code privé.";
    if (error.code === "REQUEST_CLAIM_UNAVAILABLE") return "Impossible de rattacher cette demande. Vérifiez la référence, le code et l’adresse de votre compte.";
    if (error.status === 429) return "Trop de demandes ont été envoyées. Réessayez dans quelques minutes.";
    if (error.code === "APPLICANT_MUST_CLAIM") return "Cette adresse correspond déjà à un compte. Le demandeur doit rattacher la demande depuis ce compte.";
    if (error.code === "ACCESS_EMAIL_UNAVAILABLE") return "Cette demande ne permet pas de relancer l’invitation.";
    if (error.code === "APPLICANT_ACCOUNT_UNAVAILABLE") return "Le compte du demandeur est indisponible ou son adresse a changé.";
    if (error.status === 401) return "Reconnectez-vous pour continuer.";
    if (error.status === 403) return "Votre compte ne peut pas effectuer cette action.";
    if (error.status === 400) return "Vérifiez les données saisies.";
    if (error.status === 409) return "La demande est en conflit avec son état actuel. Actualisez la liste.";
  }
  return "Le service des demandes est temporairement indisponible.";
}
