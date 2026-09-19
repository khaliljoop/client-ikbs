

// "use client";

// import {
//   useCallback,
//   useEffect,
//   useState,
// } from "react";

// import {
//   Plus,
// } from "lucide-react";

// import OrganizationList from "@/features/organizations/components/OrganizationList";

// import type {
//   Organization,
//   OrganizationStatus,
// } from "@/types/organization";
// import FormModal from "@/components/ui/forms/FormModal";

// import type {
//    FormErrors,
//   FormValue,
//   FormValues,
// } from "@/components/ui/forms/DynamicForm";

// import {
//   createEmptyOrganizationFormValues,
//   organizationFormFields,
//   organizationFormToCreateInput,
//   organizationFormToUpdateInput,
//   organizationToFormValues,
//   validateOrganizationForm,
// } from "@/features/organizations/forms/organization-form";

// import {
//   useToast,
// } from "@/components/ui/toast/ToastProvider";

// import {
//   createOrganization,
//   updateOrganization,
//   changeOrganizationStatus,
//   listOrganizations,
//   deleteOrganization,
// } from "@/lib/api/organizations";
// import ConfirmModal from "@/components/ui/modal/ConfirmModal";


// const organizationsMock: Organization[] = [
//   {
//     id: "1",
//     code: "B1304049",
//     name: "Association Espoir",
//     description:
//       "Association communautaire",
//     email: "contact@espoir.sn",
//     phone: "+221 77 000 00 01",
//     address: "Dakar",
//     status: "ACTIVE",
//     createdAt:
//       "2026-09-01T10:00:00.000Z",
//     updatedAt:
//       "2026-09-01T10:00:00.000Z",
//   },

//   {
//     id: "2",
//     code: "C2457812",
//     name: "Mouvement Solidarité",
//     email:
//       "contact@solidarite.sn",
//     phone:
//       "+221 77 000 00 02",
//     address: "Thiès",
//     status: "PENDING",
//     createdAt:
//       "2026-09-02T10:00:00.000Z",
//     updatedAt:
//       "2026-09-02T10:00:00.000Z",
//   },

//   {
//     id: "3",
//     code: "D7823410",
//     name: "Organisation Jeunesse",
//     email:
//       "contact@jeunesse.sn",
//     phone:
//       "+221 77 000 00 03",
//     address: "Saint-Louis",
//     status: "SUSPENDED",
//     createdAt:
//       "2026-09-03T10:00:00.000Z",
//     updatedAt:
//       "2026-09-03T10:00:00.000Z",
//   },
// ];

// export default function OrganizationsPage() {

// const  toast=useToast();
// const [
//   formErrors,
//   setFormErrors,
// ] = useState<FormErrors>({});

// const [
//   formModalOpen,
//   setFormModalOpen,
// ] = useState(false);

// const [
//   selectedOrganization,
//   setSelectedOrganization,
// ] = useState<Organization | null>(null);

// const [
//   formValues,
//   setFormValues,
// ] = useState<FormValues>(
//   createEmptyOrganizationFormValues(),
// );

// const [
//   saving,
//   setSaving,
// ] = useState(false);

//   const [page, setPage] =useState(1);

//   const [limit, setLimit] = useState(10);

//   const [search, setSearch] = useState("");

//   const [
//   organizations,
//   setOrganizations,
// ] = useState<Organization[]>([]);

// const [
//   organizationToDelete,
//   setOrganizationToDelete,
// ] = useState<Organization | null>(null);

// const [
//   deleting,
//   setDeleting,
// ] = useState(false);


// const [
//   organizationToChangeStatus,
//   setOrganizationToChangeStatus,
// ] = useState<Organization | null>(null);

// const [
//   changingStatus,
//   setChangingStatus,
// ] = useState(false);


// const [
//   debouncedSearch,
//   setDebouncedSearch,
// ] = useState("");

// const [
//   total,
//   setTotal,
// ] = useState(0);

// const [
//   loading,
//   setLoading,
// ] = useState(false);

//   const filteredOrganizations =
//     organizationsMock.filter(
//       (organization) => {
//         if (!search.trim()) {
//           return true;
//         }

//         const query =
//           search.toLowerCase();

//         return [
//           organization.name,
//           organization.code,
//           organization.email,
//         ].some((value) =>
//           value
//             ?.toLowerCase()
//             .includes(query),
//         );
//       },
//     );
// const fetchOrganizations =
//   useCallback(async () => {
//     setLoading(true);

//     try {
//       const response = await listOrganizations({
//           page,
//           limit,
//           search:
//             debouncedSearch ||
//             undefined,
//         });

//       setOrganizations(
//         response.items,
//       );

//       setTotal(
//         response.total,
//       );
//     } catch (error) {
//       console.error(
//         "Erreur récupération organisations :",
//         error,
//       );

//       setOrganizations([]);
//       setTotal(0);

//       toast.error(
//         error instanceof Error
//           ? error.message
//           : "Impossible de récupérer les organisations.",
//         "Erreur",
//       );
//     } finally {
//       setLoading(false);
//     }
//   }, [
//     page,
//     limit,
//     debouncedSearch,
//     toast,
//   ]);



// const handleAdd = () => {
//   setSelectedOrganization(null);

//   setFormValues(
//     createEmptyOrganizationFormValues(),
//   );

//   setFormErrors({});

//   setFormModalOpen(true);
// };

// const handleEdit = (
//   organization: Organization,
// ) => {
//   setSelectedOrganization(
//     organization,
//   );

//   setFormValues(
//     organizationToFormValues(
//       organization,
//     ),
//   );

//   setFormErrors({});

//   setFormModalOpen(true);
// };

// const handleChangeStatus = async () => {
//   if (!organizationToChangeStatus) {
//     return;
//   }

//   const nextStatus: OrganizationStatus =
//     organizationToChangeStatus.status ===
//     "ACTIVE"
//       ? "SUSPENDED"
//       : "ACTIVE";

//   setChangingStatus(true);

//   try {
//     await changeOrganizationStatus(
//       organizationToChangeStatus.id,
//       nextStatus,
//     );

//     toast.success(
//       nextStatus === "ACTIVE"
//         ? "L'organisation a été activée avec succès."
//         : "L'organisation a été suspendue avec succès.",
//       nextStatus === "ACTIVE"
//         ? "Organisation activée"
//         : "Organisation suspendue",
//     );

//     setOrganizationToChangeStatus(null);

//     await fetchOrganizations();
//   } catch (error) {
//     console.error(
//       "Erreur changement statut organisation :",
//       error,
//     );

//     toast.error(
//       error instanceof Error
//         ? error.message
//         : "Impossible de modifier le statut de l'organisation.",
//       "Erreur",
//     );
//   } finally {
//     setChangingStatus(false);
//   }
// };

// const handleDelete = async () => {
//   if (!organizationToDelete) {
//     return;
//   }

//   setDeleting(true);

//   try {
//     await deleteOrganization(
//       organizationToDelete.id,
//     );

//     toast.success(
//       "L'organisation a été supprimée avec succès.",
//       "Organisation supprimée",
//     );

//     setOrganizationToDelete(null);

//     const remainingItemsOnPage =
//       organizations.length - 1;

//     if (
//       remainingItemsOnPage === 0 &&
//       page > 1
//     ) {
//       setPage((current) => current - 1);
//     } else {
//       await fetchOrganizations();
//     }
//   } catch (error) {
//     console.error(
//       "Erreur suppression organisation :",
//       error,
//     );

//     toast.error(
//       error instanceof Error
//         ? error.message
//         : "Impossible de supprimer l'organisation.",
//       "Erreur",
//     );
//   } finally {
//     setDeleting(false);
//   }
// };

// const handleFormChange = (
//   name: string,
//   value: FormValue,
// ) => {
//   setFormValues((current) => ({
//     ...current,
//     [name]: value,
//   }));

//   setFormErrors((current) => ({
//     ...current,
//     [name]: undefined,
//   }));
// };

// const handleSubmit = async () => {
//   const errors =
//     validateOrganizationForm(
//       formValues,
//     );

//   if (
//     Object.values(errors).some(
//       Boolean,
//     )
//   ) {
//     setFormErrors(errors);
//     return;
//   }

//   setSaving(true);

//   try {
//     if (selectedOrganization) {
//       // ============================
//       // MODIFICATION
//       // ============================

//       const payload =
//         organizationFormToUpdateInput(
//           formValues,
//         );

//       const organization =
//         await updateOrganization(
//           selectedOrganization.id,
//           payload,
//         );

//       console.log(
//         "Organisation modifiée :",
//         organization,
//       );

//       toast.success(
//         "L'organisation a été modifiée avec succès.",
//         "Organisation modifiée",
//       );
//     } else {
//       // ============================
//       // CRÉATION
//       // ============================

//       const payload =
//         organizationFormToCreateInput(
//           formValues,
//         );

//       const organization =
//         await createOrganization(
//           payload,
//         );

//       console.log(
//         "Organisation créée :",
//         organization,
//       );

//       toast.success(
//         "L'organisation a été ajoutée avec succès.",
//         "Organisation ajoutée",
//       );
//     }

//     handleCloseForm();

//     await fetchOrganizations();
//   } catch (error) {
//     console.error(
//       "Erreur enregistrement organisation :",
//       error,
//     );

//     toast.error(
//       error instanceof Error
//         ? error.message
//         : "Une erreur est survenue pendant l'enregistrement.",
//       "Erreur",
//     );
//   } finally {
//     setSaving(false);
//   }
// };

// const handleCloseForm = () => {
//   setFormModalOpen(false);

//   setSelectedOrganization(null);

//   setFormValues(
//     createEmptyOrganizationFormValues(),
//   );

//   setFormErrors({});
// };



//   useEffect(() => {
//   const timeout = window.setTimeout(
//     () => {
//       setDebouncedSearch(
//         search.trim(),
//       );
//     },
//     400,
//   );

//   return () => {
//     window.clearTimeout(
//       timeout,
//     );
//   };
// }, [search]);

// useEffect(() => {
//   void fetchOrganizations();
// }, [fetchOrganizations]);







//   return (
//     <section
//       className="
//         mx-auto
//         max-w-7xl
//         px-4
//         py-10
//         sm:px-6
//         lg:px-8
//       "
//     >
//       {/* HEADER */}

//       <div
//         className="
//           mb-6
//           flex
//           flex-col
//           gap-4
//           sm:flex-row
//           sm:items-center
//           sm:justify-between
//         "
//       >
//         <div>
//           <h1
//             className="
//               text-2xl
//               font-bold
//               text-foreground
//             "
//           >
//             Organisations
//           </h1>

//           <p
//             className="
//               mt-1
//               text-sm
//               text-ikbs-muted
//             "
//           >
//             Gestion des organisations
//             enregistrées sur IKBS.
//           </p>
//         </div>

//         <button
//           type="button"
//           onClick={handleAdd}
//           className="
//             inline-flex
//             items-center
//             justify-center
//             gap-2
//             rounded-lg
//             bg-ikbs-primary
//             px-4
//             py-2.5
//             text-sm
//             font-medium
//             text-white
//             transition
//             hover:opacity-90
//           "
//         >
//           <Plus size={17} />

//           Ajouter
//         </button>
//       </div>

//       {/* TABLE */}

      
//       <OrganizationList
//         organizations={organizations}
//         loading={loading}
//         page={page}
//         limit={limit}
//         total={total}
//         onSearch={(value) => {
//           setSearch(value);
//           setPage(1);
//         }}
//         onPageChange={(value) => {
//           setPage(value);
//         }}
//         onLimitChange={(value) => {
//           setLimit(value);
//           setPage(1);
//         }}
//         onEdit={handleEdit}
//         onDelete={(organization) => {
//           setOrganizationToDelete(
//             organization,
//           );
//         }}
//        onChangeStatus={(organization) => {
//           setOrganizationToChangeStatus(
//             organization,
//           );
//         }}
//       />

//       <FormModal
//       open={formModalOpen}
//       title={
//         selectedOrganization
//           ? "Modifier l'organisation"
//           : "Ajouter une organisation"
//       }
//       fields={organizationFormFields}
//       values={formValues}
//       errors={formErrors}
//       columns={2}
//       loading={saving}
//       submitLabel={
//         selectedOrganization
//           ? "Modifier"
//           : "Enregistrer"
//       }
//       onChange={handleFormChange}
//       onSubmit={handleSubmit}
//       onClose={() => {
//         if (!saving) {
//           handleCloseForm();
//         }
//       }}
//     />

//     <ConfirmModal
//       open={organizationToDelete !== null}
//       title="Supprimer l'organisation"
//       message={
//         organizationToDelete
//           ? `Voulez-vous vraiment supprimer « ${organizationToDelete.name} » ? Cette action est irréversible.`
//           : ""
//       }
//       confirmLabel="Supprimer"
//       cancelLabel="Annuler"
//       danger
//       loading={deleting}
//       onConfirm={handleDelete}
//       onClose={() => {
//         if (!deleting) {
//           setOrganizationToDelete(null);
//         }
//       }}
//     />

//     <ConfirmModal
//       open={
//         organizationToChangeStatus !== null
//       }
//       title={
//         organizationToChangeStatus?.status ===
//         "ACTIVE"
//           ? "Suspendre l'organisation"
//           : "Activer l'organisation"
//       }
//       message={
//         organizationToChangeStatus
//           ? organizationToChangeStatus.status ===
//             "ACTIVE"
//             ? `Voulez-vous vraiment suspendre « ${organizationToChangeStatus.name} » ?`
//             : `Voulez-vous vraiment activer « ${organizationToChangeStatus.name} » ?`
//           : ""
//       }
//       confirmLabel={
//         organizationToChangeStatus?.status ===
//         "ACTIVE"
//           ? "Suspendre"
//           : "Activer"
//       }
//       cancelLabel="Annuler"
//       danger={
//         organizationToChangeStatus?.status ===
//         "ACTIVE"
//       }
//       loading={changingStatus}
//       onConfirm={handleChangeStatus}
//       onClose={() => {
//         if (!changingStatus) {
//           setOrganizationToChangeStatus(
//             null,
//           );
//         }
//       }}
//     />
//     </section>
//   );
// }

"use client";

import {
  Search,
  X,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useState,
} from "react";

import OrganizationPublicList from "@/features/organizations/components/OrganizationPublicList";
import { listOrganizations } from "@/lib/api/organizations";
import type { Organization } from "@/types/organization";

export default function OrganizationsPage() {
  const [
    organizations,
    setOrganizations,
  ] = useState<Organization[]>([]);

  const [search, setSearch] =
    useState("");

  const [
    debouncedSearch,
    setDebouncedSearch,
  ] = useState("");

  const [page, setPage] =
    useState(1);

  const [limit] =
    useState(9);

  const [total, setTotal] =
    useState(0);

  const [loading, setLoading] =
    useState(false);

  /*
   * Debounce de la recherche.
   */
  useEffect(() => {
    const timeout =
      window.setTimeout(() => {
        setDebouncedSearch(
          search.trim(),
        );
      }, 400);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [search]);

  /*
   * Chargement des organisations.
   */
  const fetchOrganizations =
    useCallback(async () => {
      setLoading(true);

      try {
        const response =
          await listOrganizations({
            page,
            limit,
            search:
              debouncedSearch ||
              undefined,
          });

        setOrganizations(
          response.items,
        );

        setTotal(response.total);
      } catch (error) {
        console.error(
          "Erreur chargement organisations :",
          error,
        );

        setOrganizations([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    }, [
      page,
      limit,
      debouncedSearch,
    ]);

  useEffect(() => {
    void fetchOrganizations();
  }, [fetchOrganizations]);

  const totalPages =
    Math.max(
      1,
      Math.ceil(total / limit),
    );

  return (
    <div className="bg-background">
      {/* Hero */}
      <section
        className="
          border-b border-ikbs-border
          bg-gradient-to-b
          from-ikbs-primary/10
          to-background
        "
      >
        <div
          className="
            mx-auto max-w-7xl
            px-4 py-14
            sm:px-6
            lg:px-8
          "
        >
          <div className="max-w-2xl">
            <p
              className="
                text-sm font-semibold
                uppercase tracking-wider
                text-ikbs-primary
              "
            >
              Réseau IKBS
            </p>

            <h1
              className="
                mt-3 text-3xl
                font-bold tracking-tight
                text-foreground
                sm:text-4xl
              "
            >
              Découvrez nos organisations
            </h1>

            <p
              className="
                mt-4 text-base
                leading-7
                text-ikbs-muted
              "
            >
              Découvrez les organisations
              présentes sur la plateforme,
              leurs activités, leurs
              commissions et leurs
              coordonnées.
            </p>
          </div>

          {/* Recherche */}
          <div
            className="
              relative mt-8
              max-w-xl
            "
          >
            <Search
              size={19}
              className="
                absolute left-4 top-1/2
                -translate-y-1/2
                text-ikbs-muted
              "
            />

            <input
              type="search"
              value={search}
              onChange={(event) => {
                setSearch(
                  event.target.value,
                );

                setPage(1);
              }}
              placeholder="Rechercher une organisation..."
              className="
                h-12 w-full
                rounded-xl
                border border-ikbs-border
                bg-ikbs-card
                pl-11 pr-11
                text-sm text-foreground
                outline-none
                transition
                placeholder:text-ikbs-muted
                focus:border-ikbs-primary
                focus:ring-2
                focus:ring-ikbs-primary/10
              "
            />

            {search && (
              <button
                type="button"
                aria-label="Effacer la recherche"
                onClick={() => {
                  setSearch("");
                  setPage(1);
                }}
                className="
                  absolute right-3 top-1/2
                  -translate-y-1/2
                  rounded-lg p-1.5
                  text-ikbs-muted
                  transition
                  hover:bg-ikbs-primary/10
                  hover:text-ikbs-primary
                "
              >
                <X size={17} />
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Organisations */}
      <section
        className="
          mx-auto max-w-7xl
          px-4 py-10
          sm:px-6
          lg:px-8
        "
      >
        <div
          className="
            mb-6 flex
            items-center
            justify-between
          "
        >
          <div>
            <h2
              className="
                text-xl font-semibold
                text-foreground
              "
            >
              Organisations
            </h2>

            {!loading && (
              <p
                className="
                  mt-1 text-sm
                  text-ikbs-muted
                "
              >
                {total} organisation
                {total > 1 ? "s" : ""}
              </p>
            )}
          </div>
        </div>

        <OrganizationPublicList
          organizations={
            organizations
          }
          loading={loading}
        />

        {/* Pagination */}
        {!loading &&
          totalPages > 1 && (
            <div
              className="
                mt-10 flex
                items-center
                justify-center gap-3
              "
            >
              <button
                type="button"
                disabled={page <= 1}
                onClick={() =>
                  setPage(
                    (current) =>
                      current - 1,
                  )
                }
                className="
                  rounded-lg
                  border border-ikbs-border
                  bg-ikbs-card
                  px-4 py-2
                  text-sm font-medium
                  text-foreground
                  transition
                  hover:border-ikbs-primary
                  disabled:cursor-not-allowed
                  disabled:opacity-40
                "
              >
                Précédent
              </button>

              <span
                className="
                  text-sm
                  text-ikbs-muted
                "
              >
                Page{" "}
                <strong className="text-foreground">
                  {page}
                </strong>{" "}
                sur {totalPages}
              </span>

              <button
                type="button"
                disabled={
                  page >= totalPages
                }
                onClick={() =>
                  setPage(
                    (current) =>
                      current + 1,
                  )
                }
                className="
                  rounded-lg
                  border border-ikbs-border
                  bg-ikbs-card
                  px-4 py-2
                  text-sm font-medium
                  text-foreground
                  transition
                  hover:border-ikbs-primary
                  disabled:cursor-not-allowed
                  disabled:opacity-40
                "
              >
                Suivant
              </button>
            </div>
          )}
      </section>
    </div>
  );
}