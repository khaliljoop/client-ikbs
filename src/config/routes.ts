// export const routes = {
//   home: "/",
//   services: "/services",
//   organisations: "/organisations",
//   login: "/login",
//   register: "/register",
//   forgotPassword: "/forgot-password",
// } as const;

export const organisationRoutes = {
  public: (
    organizationCode: string,
  ) =>
    `/organisations/${organizationCode}`,

  dashboard: (
    organizationCode: string,
  ) =>
    `/espace/${organizationCode}`,

  members: (
    organizationCode: string,
  ) =>
    `/espace/${organizationCode}/membres`,

  contributions: (
    organizationCode: string,
  ) =>
    `/espace/${organizationCode}/cotisations`,

  events: (
    organizationCode: string,
  ) =>
    `/espace/${organizationCode}/evenements`,

  commissions: (
    organizationCode: string,
  ) =>
    `/espace/${organizationCode}/commissions`,

  roles: (
    organizationCode: string,
  ) =>
    `/espace/${organizationCode}/roles`,

  settings: (
    organizationCode: string,
  ) =>
    `/espace/${organizationCode}/parametres`,
} as const;



// Pour les routes dynamiques d'organisation, on pourra ensuite créer des fonctions :

// export const organisationRoutes = {
//   public: (organizationCode: string) =>
//     `/organisations/${organizationCode}`,

//   dashboard: (organizationCode: string) =>
//     `/organisations/${organizationCode}`,

//   members: (organizationCode: string) =>
//     `/organisations/${organizationCode}/membres`,
// } as const;