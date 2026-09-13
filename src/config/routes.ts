export const routes = {
  home: "/",
  services: "/services",
  organisations: "/organisations",
  login: "/login",
  register: "/register",
  forgotPassword: "/forgot-password",
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