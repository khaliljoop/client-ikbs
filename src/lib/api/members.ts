import { ApiError, apiClient } from "./client";

export type MemberStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED" | "ARCHIVED";
export type NextMemberStatus = Exclude<MemberStatus, "SUSPENDED">;

export interface DirectoryMember {
  id: string;
  code: string;
  firstName: string;
  lastName: string;
  status: MemberStatus;
}

export type MemberGender = "MALE" | "FEMALE";

export interface MemberPersonalDetails {
  email: string;
  phone: string | null;
  address: string | null;
  gender: MemberGender | null;
}

export interface MemberDetail extends DirectoryMember {
  personal?: MemberPersonalDetails;
}

interface MemberPage {
  items: DirectoryMember[];
  total: number;
}

function directoryPath(id: string) {
  return "/organizations/" + encodeURIComponent(id) + "/members";
}

export function listMembers(id: string, page: number, limit: number, search: string, signal: AbortSignal, status?: MemberStatus) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (search) params.set("search", search);
  if (status) params.set("status", status);
  return apiClient<MemberPage>(directoryPath(id) + "?" + params, { signal });
}

export function getMember(id: string, memberId: string, signal: AbortSignal) {
  return apiClient<MemberDetail>(directoryPath(id) + "/" + encodeURIComponent(memberId), { signal });
}

export function inviteMember(id: string, memberId: string) {
  return apiClient<{ status: "SENT" | "PENDING" }>(directoryPath(id) + "/" + encodeURIComponent(memberId) + "/invitation",
    { method: "POST" });
}

export function memberInvitationError(error: unknown) {
  if (error instanceof ApiError) {
    if (error.code === "MEMBER_INVITATION_COOLDOWN") return "Attendez une minute avant de relancer l’invitation.";
    if (error.code === "APPLICANT_MUST_CLAIM" || error.code === "MEMBER_INVITATION_ALREADY_LINKED") {
      return "Cette fiche ou cette adresse est déjà associée à un compte. L’invitation n’a pas été envoyée.";
    }
    if (error.code === "MEMBER_INVITATION_INACTIVE") return "Seules les fiches actives peuvent être invitées.";
    if (error.status === 403) return "Votre compte ne peut pas inviter de membres.";
  }
  return memberErrorMessage(error);
}

export function memberErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    if (error.status === 401) return "Votre session a expiré.";
    if (error.status === 403) return "Votre compte ne peut pas consulter les membres.";
    if (error.status === 404) return "Cette fiche ou cet espace est introuvable ou inaccessible.";
  }
  return "Le service des membres est indisponible. Réessayez.";
}

export interface MemberNames {
  firstName: string;
  lastName: string;
}

export interface CreateMemberInput extends MemberNames {
  username: string;
  email: string;
  phone?: string;
  address?: string;
  gender?: MemberGender;
}

export function createMember(id: string, input: CreateMemberInput) {
  return apiClient<DirectoryMember>(directoryPath(id), { method: "POST", body: JSON.stringify(input) });
}

export function updateMember(id: string, memberId: string, input: Partial<MemberNames & MemberPersonalDetails>) {
  return apiClient<MemberDetail>(directoryPath(id) + "/" + encodeURIComponent(memberId),
    { method: "PATCH", body: JSON.stringify(input) });
}

export function memberMutationError(error: unknown) {
  if (error instanceof ApiError) {
    if (error.code === "MEMBER_EMAIL_ALREADY_EXISTS") return "Cette adresse email est déjà utilisée dans l’organisation.";
    if (error.code === "MEMBER_USERNAME_ALREADY_EXISTS") return "Ce nom d’utilisateur est déjà utilisé dans l’organisation.";
    if (error.code === "MEMBER_CODE_ALREADY_EXISTS") return "Le code généré est déjà utilisé. Contactez l’administrateur.";
    if (error.status === 400) return "Vérifiez les champs du formulaire.";
    if (error.status === 403) return "Votre compte ne peut pas enregistrer les fiches membres.";
  }
  return memberErrorMessage(error);
}

export function changeMemberStatus(id: string, member: DirectoryMember, status: NextMemberStatus) {
  return apiClient<DirectoryMember>(directoryPath(id) + "/" + encodeURIComponent(member.id) + "/status", {
    method: "PATCH", body: JSON.stringify({ expectedStatus: member.status, status }),
  });
}
