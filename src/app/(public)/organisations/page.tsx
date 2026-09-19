
// export default function OrganizationsPage() {
//   return (
//     <div>
//       <h1>Organisations</h1>
//     </div>
//   );
// }

"use client";

import {
  useState,
} from "react";

import {
  Plus,
} from "lucide-react";

import OrganizationList from "@/features/organizations/components/OrganizationList";

import type {
  Organization,
} from "@/types/organization";
import FormModal from "@/components/ui/forms/FormModal";

import type {
  FormValue,
  FormValues,
} from "@/components/ui/forms/DynamicForm";

import {
  createEmptyOrganizationFormValues,
  organizationFormFields,
  organizationToFormValues,
} from "@/features/organizations/forms/organization-form";

import {
  useToast,
} from "@/components/ui/toast/ToastProvider";

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

export default function OrganizationsPage() {

  const toast = useToast();

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


    const handleAdd = () => {
  setSelectedOrganization(null);

  setFormValues(
    createEmptyOrganizationFormValues(),
  );

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

  setFormModalOpen(true);
};

const handleFormChange = (
  name: string,
  value: FormValue,
) => {
  setFormValues(
    (current) => ({
      ...current,
      [name]: value,
    }),
  );
};

const handleSubmit = async () => {
  setSaving(true);

  try {
    console.log(
      selectedOrganization
        ? "Modification"
        : "Création",
      formValues,
    );

    // Simulation API
    await new Promise(
      (resolve) =>
        setTimeout(resolve, 800),
    );

    if (selectedOrganization) {
      toast.success(
        "L'organisation a été modifiée avec succès.",
        "Organisation modifiée",
      );
    } else {
      toast.success(
        "L'organisation a été ajoutée avec succès.",
        "Organisation ajoutée",
      );
    }

    handleCloseForm();
  } catch {
    toast.error(
      "Une erreur est survenue pendant l'enregistrement.",
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
};

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

        {/* <button
          type="button"
          onClick={() => {
            console.log(
              "Ajouter une organisation",
            );
          }}
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
        </button> */}
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
        organizations={
          filteredOrganizations
        }
        page={page}
        limit={limit}
        total={
          filteredOrganizations.length
        }
        onSearch={(value) => {
          setSearch(value);
          setPage(1);
        }}
        onPageChange={
          setPage
        }
        onLimitChange={(
          value,
        ) => {
          setLimit(value);
          setPage(1);
        }}
        onEdit={handleEdit}
        onDelete={(
          organization,
        ) => {
          console.log(
            "Supprimer :",
            organization,
          );
        }}
        onChangeStatus={(
          organization,
        ) => {
          console.log(
            "Changer statut :",
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
    </section>
  );
}