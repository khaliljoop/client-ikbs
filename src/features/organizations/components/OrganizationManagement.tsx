
"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  Plus,
} from "lucide-react";

import OrganizationList from "@/features/organizations/components/OrganizationList";

import type {
  Organization,
  OrganizationStatus,
} from "@/types/organization";
import FormModal from "@/components/ui/forms/FormModal";

import type {
   FormErrors,
  FormValue,
  FormValues,
} from "@/components/ui/forms/DynamicForm";

import {
  createEmptyOrganizationFormValues,
  organizationFormFields,
  organizationFormToCreateInput,
  organizationFormToUpdateInput,
  organizationToFormValues,
  validateOrganizationForm,
} from "@/features/organizations/forms/organization-form";

import {
  useToast,
} from "@/components/ui/toast/ToastProvider";

import {
  createOrganization,
  updateOrganization,
  changeOrganizationStatus,
  listOrganizations,
  deleteOrganization,
} from "@/lib/api/organizations";
import ConfirmModal from "@/components/ui/modal/ConfirmModal";


const organizationsMock: Organization[] = [
  {
    id: "1",
    code: "B1304049",
    name: "Association Espoir",
    description:
      "Association communautaire",
    email: "contact@espoir.sn",
    phone: "+221 77 000 00 01",
    address: "Dakar",
    status: "ACTIVE",
    createdAt:
      "2026-09-01T10:00:00.000Z",
    updatedAt:
      "2026-09-01T10:00:00.000Z",
  },

  {
    id: "2",
    code: "C2457812",
    name: "Mouvement Solidarité",
    email:
      "contact@solidarite.sn",
    phone:
      "+221 77 000 00 02",
    address: "Thiès",
    status: "PENDING",
    createdAt:
      "2026-09-02T10:00:00.000Z",
    updatedAt:
      "2026-09-02T10:00:00.000Z",
  },

  {
    id: "3",
    code: "D7823410",
    name: "Organisation Jeunesse",
    email:
      "contact@jeunesse.sn",
    phone:
      "+221 77 000 00 03",
    address: "Saint-Louis",
    status: "SUSPENDED",
    createdAt:
      "2026-09-03T10:00:00.000Z",
    updatedAt:
      "2026-09-03T10:00:00.000Z",
  },
];

export default function OrganizationManagement() {

const  toast=useToast();
const [
  formErrors,
  setFormErrors,
] = useState<FormErrors>({});

const [
  formModalOpen,
  setFormModalOpen,
] = useState(false);

const [
  selectedOrganization,
  setSelectedOrganization,
] = useState<Organization | null>(null);

const [
  formValues,
  setFormValues,
] = useState<FormValues>(
  createEmptyOrganizationFormValues(),
);

const [
  saving,
  setSaving,
] = useState(false);

  const [page, setPage] =useState(1);

  const [limit, setLimit] = useState(10);

  const [search, setSearch] = useState("");

  const [
  organizations,
  setOrganizations,
] = useState<Organization[]>([]);

const [
  organizationToDelete,
  setOrganizationToDelete,
] = useState<Organization | null>(null);

const [
  deleting,
  setDeleting,
] = useState(false);


const [
  organizationToChangeStatus,
  setOrganizationToChangeStatus,
] = useState<Organization | null>(null);

const [
  changingStatus,
  setChangingStatus,
] = useState(false);


const [
  debouncedSearch,
  setDebouncedSearch,
] = useState("");

const [
  total,
  setTotal,
] = useState(0);

const [
  loading,
  setLoading,
] = useState(false);

  const filteredOrganizations =
    organizationsMock.filter(
      (organization) => {
        if (!search.trim()) {
          return true;
        }

        const query =
          search.toLowerCase();

        return [
          organization.name,
          organization.code,
          organization.email,
        ].some((value) =>
          value
            ?.toLowerCase()
            .includes(query),
        );
      },
    );
const fetchOrganizations =
  useCallback(async () => {
    setLoading(true);

    try {
      const response = await listOrganizations({
          page,
          limit,
          search:
            debouncedSearch ||
            undefined,
        });

      setOrganizations(
        response.items,
      );

      setTotal(
        response.total,
      );
    } catch (error) {
      console.error(
        "Erreur récupération organisations :",
        error,
      );

      setOrganizations([]);
      setTotal(0);

      toast.error(
        error instanceof Error
          ? error.message
          : "Impossible de récupérer les organisations.",
        "Erreur",
      );
    } finally {
      setLoading(false);
    }
  }, [
    page,
    limit,
    debouncedSearch,
    toast,
  ]);



const handleAdd = () => {
  setSelectedOrganization(null);

  setFormValues(
    createEmptyOrganizationFormValues(),
  );

  setFormErrors({});

  setFormModalOpen(true);
};

const handleEdit = (
  organization: Organization,
) => {
  setSelectedOrganization(
    organization,
  );

  setFormValues(
    organizationToFormValues(
      organization,
    ),
  );

  setFormErrors({});

  setFormModalOpen(true);
};

const handleChangeStatus = async () => {
  if (!organizationToChangeStatus) {
    return;
  }

  const nextStatus: OrganizationStatus =
    organizationToChangeStatus.status ===
    "ACTIVE"
      ? "SUSPENDED"
      : "ACTIVE";

  setChangingStatus(true);

  try {
    await changeOrganizationStatus(
      organizationToChangeStatus.id,
      nextStatus,
    );

    toast.success(
      nextStatus === "ACTIVE"
        ? "L'organisation a été activée avec succès."
        : "L'organisation a été suspendue avec succès.",
      nextStatus === "ACTIVE"
        ? "Organisation activée"
        : "Organisation suspendue",
    );

    setOrganizationToChangeStatus(null);

    await fetchOrganizations();
  } catch (error) {
    console.error(
      "Erreur changement statut organisation :",
      error,
    );

    toast.error(
      error instanceof Error
        ? error.message
        : "Impossible de modifier le statut de l'organisation.",
      "Erreur",
    );
  } finally {
    setChangingStatus(false);
  }
};

const handleDelete = async () => {
  if (!organizationToDelete) {
    return;
  }

  setDeleting(true);

  try {
    await deleteOrganization(
      organizationToDelete.id,
    );

    toast.success(
      "L'organisation a été supprimée avec succès.",
      "Organisation supprimée",
    );

    setOrganizationToDelete(null);

    const remainingItemsOnPage =
      organizations.length - 1;

    if (
      remainingItemsOnPage === 0 &&
      page > 1
    ) {
      setPage((current) => current - 1);
    } else {
      await fetchOrganizations();
    }
  } catch (error) {
    console.error(
      "Erreur suppression organisation :",
      error,
    );

    toast.error(
      error instanceof Error
        ? error.message
        : "Impossible de supprimer l'organisation.",
      "Erreur",
    );
  } finally {
    setDeleting(false);
  }
};

const handleFormChange = (
  name: string,
  value: FormValue,
) => {
  setFormValues((current) => ({
    ...current,
    [name]: value,
  }));

  setFormErrors((current) => ({
    ...current,
    [name]: undefined,
  }));
};

const handleSubmit = async () => {
  const errors =
    validateOrganizationForm(
      formValues,
    );

  if (
    Object.values(errors).some(
      Boolean,
    )
  ) {
    setFormErrors(errors);
    return;
  }

  setSaving(true);

  try {
    if (selectedOrganization) {
      // ============================
      // MODIFICATION
      // ============================

      const payload =
        organizationFormToUpdateInput(
          formValues,
        );

      const organization =
        await updateOrganization(
          selectedOrganization.id,
          payload,
        );

      console.log(
        "Organisation modifiée :",
        organization,
      );

      toast.success(
        "L'organisation a été modifiée avec succès.",
        "Organisation modifiée",
      );
    } else {
      // ============================
      // CRÉATION
      // ============================

      const payload =
        organizationFormToCreateInput(
          formValues,
        );

      const organization =
        await createOrganization(
          payload,
        );

      console.log(
        "Organisation créée :",
        organization,
      );

      toast.success(
        "L'organisation a été ajoutée avec succès.",
        "Organisation ajoutée",
      );
    }

    handleCloseForm();

    await fetchOrganizations();
  } catch (error) {
    console.error(
      "Erreur enregistrement organisation :",
      error,
    );

    toast.error(
      error instanceof Error
        ? error.message
        : "Une erreur est survenue pendant l'enregistrement.",
      "Erreur",
    );
  } finally {
    setSaving(false);
  }
};

const handleCloseForm = () => {
  setFormModalOpen(false);

  setSelectedOrganization(null);

  setFormValues(
    createEmptyOrganizationFormValues(),
  );

  setFormErrors({});
};



  useEffect(() => {
  const timeout = window.setTimeout(
    () => {
      setDebouncedSearch(
        search.trim(),
      );
    },
    400,
  );

  return () => {
    window.clearTimeout(
      timeout,
    );
  };
}, [search]);

useEffect(() => {
  void fetchOrganizations();
}, [fetchOrganizations]);







  return (
    <section
      className="
        mx-auto
        max-w-7xl
        px-4
        py-10
        sm:px-6
        lg:px-8
      "
    >
      {/* HEADER */}

      <div
        className="
          mb-6
          flex
          flex-col
          gap-4
          sm:flex-row
          sm:items-center
          sm:justify-between
        "
      >
        <div>
          <h1
            className="
              text-2xl
              font-bold
              text-foreground
            "
          >
            Organisations
          </h1>

          <p
            className="
              mt-1
              text-sm
              text-ikbs-muted
            "
          >
            Gestion des organisations
            enregistrées sur IKBS.
          </p>
        </div>

        <button
          type="button"
          onClick={handleAdd}
          className="
            inline-flex
            items-center
            justify-center
            gap-2
            rounded-lg
            bg-ikbs-primary
            px-4
            py-2.5
            text-sm
            font-medium
            text-white
            transition
            hover:opacity-90
          "
        >
          <Plus size={17} />

          Ajouter
        </button>
      </div>

      {/* TABLE */}

      
      <OrganizationList
        organizations={organizations}
        loading={loading}
        page={page}
        limit={limit}
        total={total}
        onSearch={(value) => {
          setSearch(value);
          setPage(1);
        }}
        onPageChange={(value) => {
          setPage(value);
        }}
        onLimitChange={(value) => {
          setLimit(value);
          setPage(1);
        }}
        onEdit={handleEdit}
        onDelete={(organization) => {
          setOrganizationToDelete(
            organization,
          );
        }}
       onChangeStatus={(organization) => {
          setOrganizationToChangeStatus(
            organization,
          );
        }}
      />

      <FormModal
      open={formModalOpen}
      title={
        selectedOrganization
          ? "Modifier l'organisation"
          : "Ajouter une organisation"
      }
      fields={organizationFormFields}
      values={formValues}
      errors={formErrors}
      columns={2}
      loading={saving}
      submitLabel={
        selectedOrganization
          ? "Modifier"
          : "Enregistrer"
      }
      onChange={handleFormChange}
      onSubmit={handleSubmit}
      onClose={() => {
        if (!saving) {
          handleCloseForm();
        }
      }}
    />

    <ConfirmModal
      open={organizationToDelete !== null}
      title="Supprimer l'organisation"
      message={
        organizationToDelete
          ? `Voulez-vous vraiment supprimer « ${organizationToDelete.name} » ? Cette action est irréversible.`
          : ""
      }
      confirmLabel="Supprimer"
      cancelLabel="Annuler"
      danger
      loading={deleting}
      onConfirm={handleDelete}
      onClose={() => {
        if (!deleting) {
          setOrganizationToDelete(null);
        }
      }}
    />

    <ConfirmModal
      open={
        organizationToChangeStatus !== null
      }
      title={
        organizationToChangeStatus?.status ===
        "ACTIVE"
          ? "Suspendre l'organisation"
          : "Activer l'organisation"
      }
      message={
        organizationToChangeStatus
          ? organizationToChangeStatus.status ===
            "ACTIVE"
            ? `Voulez-vous vraiment suspendre « ${organizationToChangeStatus.name} » ?`
            : `Voulez-vous vraiment activer « ${organizationToChangeStatus.name} » ?`
          : ""
      }
      confirmLabel={
        organizationToChangeStatus?.status ===
        "ACTIVE"
          ? "Suspendre"
          : "Activer"
      }
      cancelLabel="Annuler"
      danger={
        organizationToChangeStatus?.status ===
        "ACTIVE"
      }
      loading={changingStatus}
      onConfirm={handleChangeStatus}
      onClose={() => {
        if (!changingStatus) {
          setOrganizationToChangeStatus(
            null,
          );
        }
      }}
    />
    </section>
  );
}