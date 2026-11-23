import type { SessionProfile } from "../../types/auth";
import { ApiError, apiClient } from "./client";

export function login(input: { identifier: string; password: string }) {
  return apiClient<SessionProfile>("/auth/login", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function getSession(options: RequestInit = {}, origin = "") {
  return apiClient<SessionProfile>("/auth/me", options, origin);
}

export function logout() {
  return apiClient<void>("/auth/logout", { method: "POST" });
}

export function authErrorMessage(error: unknown, action: "login" | "session" | "logout"): string {
  if (error instanceof ApiError) {
    switch (error.status) {
      case 400: return "Vérifiez les informations saisies.";
      case 401: return action === "login" ? "Identifiant ou mot de passe incorrect." : "Votre session a expiré.";
      case 403: return error.code === "CSRF_REJECTED" ? "Requête refusée. Rechargez la page et réessayez." : "Accès refusé.";
      case 429: return "Trop de tentatives. Réessayez dans quelques instants.";
      case 503: return "Le service de connexion est temporairement indisponible.";
    }
  }
  return action === "logout" ? "La déconnexion a échoué. Réessayez." :
    "Impossible de joindre le service de connexion. Réessayez.";
}
