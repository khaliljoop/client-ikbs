"use client";

import { useState } from "react";
import { Pencil, Power, Trash2 } from "lucide-react";
import DataTable from "@/components/ui/table/DataTable";
import type { DataTableColumn } from "@/components/ui/table/types";
import InputGroup from "@/components/ui/forms/InputGroup";
import SelectGroup, { SelectValue } from "@/components/ui/forms/SelectGroup";
import Modal from "@/components/ui/modal/Modal";
import RadioGroup from "@/components/ui/forms/RadioGroup";
import TreeGroup, { TreeValue } from "@/components/ui/forms/TreeGroup";
import DynamicForm, {
  type DynamicFormField,
  type FormValue,
  type FormValues,
} from "@/components/ui/forms/DynamicForm";

interface DemoOrganization {
  id: string;
  code: string;
  name: string;
  email: string;
  status: "ACTIVE" | "SUSPENDED";
}

const organizations: DemoOrganization[] = [
  {
    id: "1",
    code: "B1304049",
    name: "Association Espoir",
    email: "contact@espoir.sn",
    status: "ACTIVE",
  },
  {
    id: "2",
    code: "C2457812",
    name: "Mouvement Solidarité",
    email: "contact@solidarite.sn",
    status: "ACTIVE",
  },
  {
    id: "3",
    code: "D7823410",
    name: "Organisation Jeunesse",
    email: "contact@jeunesse.sn",
    status: "SUSPENDED",
  },
  {
    id: "4",
    code: "A4567891",
    name: "Collectif Innovation",
    email: "contact@innovation.sn",
    status: "ACTIVE",
  },
  {
    id: "5",
    code: "F1234567",
    name: "Association Culturelle",
    email: "contact@culture.sn",
    status: "ACTIVE",
  },
];

const columns: DataTableColumn<DemoOrganization>[] = [
  {
    key: "code",
    label: "Code",
  },
  {
    key: "name",
    label: "Nom",
  },
  {
    key: "email",
    label: "Email",
  },
  {
    key: "status",
    label: "Statut",
    render: (value) => (
      <span
        className={
          value === "ACTIVE"
            ? "font-medium text-ikbs-success"
            : "font-medium text-ikbs-accent"
        }
      >
        {value === "ACTIVE"
          ? "Actif"
          : "Suspendu"}
      </span>
    ),
  },
];

export default function DataTableDemoPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [modalOpen, setModalOpen] = useState(false);
  // const [status, setStatus] = useState("");
  // const [commissions, setCommissions] = useState<string[]>([]);
  const [status, setStatus] =
  useState<SelectValue>("");

const [commissions, setCommissions] = useState<SelectValue[]>([]);
  const [organizationName, setOrganizationName] =useState("");
  const [contributionType, setContributionType] =useState<"MONTHLY" | "YEARLY">("MONTHLY");
  const [permissions, setPermissions] =useState<TreeValue[]>([]);

  const [email, setEmail] = useState("");
  const filteredOrganizations = organizations.filter((organization) => {
      if (!search.trim()) {
        return true;
      }

      const value = search.toLowerCase();

      return (
        organization.name
          .toLowerCase()
          .includes(value) ||
        organization.code
          .toLowerCase()
          .includes(value) ||
        organization.email
          .toLowerCase()
          .includes(value)
      );
    });
  const [formValues, setFormValues] =
  useState<FormValues>({
    name: "",
    email: "",
    status: "",
    contributionType: "MONTHLY",
    commissions: [],
    permissions: [],
  });

const fields: DynamicFormField[] = [
  {
    type: "input",
    name: "name",
    label: "Nom de l'organisation",
    placeholder: "Ex : Association Espoir",
    required: true,
  },
  {
    type: "input",
    name: "email",
    label: "Email",
    inputType: "email",
    placeholder: "contact@organisation.sn",
  },
  {
    type: "select",
    name: "status",
    label: "Statut",
    placeholder: "Sélectionner un statut",
    options: [
      {
        value: "ACTIVE",
        label: "Actif",
      },
      {
        value: "SUSPENDED",
        label: "Suspendu",
      },
    ],
  },
  {
    type: "select",
    name: "commissions",
    label: "Commissions",
    multiple: true,
    search: true,
    options: [
      {
        value: "FINANCE",
        label: "Finance",
      },
      {
        value: "CULTURE",
        label: "Culturelle",
      },
      {
        value: "PEDAGOGIE",
        label: "Pédagogie",
      },
    ],
  },
  {
    type: "radio",
    name: "contributionType",
    label: "Type de cotisation",
    orientation: "horizontal",
    options: [
      {
        value: "MONTHLY",
        label: "Mensuelle",
      },
      {
        value: "YEARLY",
        label: "Annuelle",
      },
    ],
  },
  {
    type: "tree",
    name: "permissions",
    label: "Permissions",
    multiple: true,
    nodes: [
      {
        value: "ORGANIZATION",
        label: "Organisation",
        children: [
          {
            value: "ORGANIZATION_VIEW",
            label: "Consulter",
          },
          {
            value: "ORGANIZATION_CREATE",
            label: "Ajouter",
          },
          {
            value: "ORGANIZATION_UPDATE",
            label: "Modifier",
          },
        ],
      },
    ],
  },
];

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <DynamicForm
        fields={fields}
        values={formValues}
        columns={1}
        onChange={(
          name,
          value,
        ) => {
          setFormValues(
            (current) => ({
              ...current,
              [name]: value,
            }),
          );

          console.log(
            "Field :",
            name,
            "Value :",
            value,
          );
        }}
      />
      <TreeGroup
      label="Permissions"
      name="permissions"
      multiple={false}
      value={permissions}
      nodes={[
        {
          value: "ORGANIZATION",
          label: "Organisation",
          children: [
            {
              value: "ORGANIZATION_VIEW",
              label: "Consulter",
            },
            {
              value: "ORGANIZATION_CREATE",
              label: "Ajouter",
            },
            {
              value: "ORGANIZATION_UPDATE",
              label: "Modifier",
            },
            {
              value: "ORGANIZATION_DELETE",
              label: "Supprimer",
            },
          ],
        },
        {
          value: "MEMBER",
          label: "Membres",
          children: [
            {
              value: "MEMBER_VIEW",
              label: "Consulter",
            },
            {
              value: "MEMBER_CREATE",
              label: "Ajouter",
            },
            {
              value: "MEMBER_UPDATE",
              label: "Modifier",
            },
          ],
        },
      ]}
      onChange={(value) => {
        setPermissions(
          value as TreeValue[],
        );

        console.log(
          "Permissions :",
          value,
        );
      }}
    />
      <SelectGroup
        label="Statut"
        name="status"
        value={status}
        options={[
          {
            value: "ACTIVE",
            label: "Actif",
          },
          {
            value: "SUSPENDED",
            label: "Suspendu",
          },
          {
            value: "ARCHIVED",
            label: "Archivé",
          },
        ]}
        onChange={(value) => {
           console.log("setStatus:",status);
          setStatus(value as string);
        }}
      />
      <SelectGroup
        label="Commissions"
        name="commissions"
        multiple
        value={commissions}
        options={[
          {
            value: "FINANCE",
            label: "Finance",
          },
          {
            value: "CULTURE",
            label: "Culturelle",
          },
          {
            value: "PEDAGOGIE",
            label: "Pédagogie",
          },
        ]}
          onChange={(value) => {
            console.log("setCommissions:",commissions);
            
            setCommissions(value as string[]);
          }}
      />
       <div className="mb-6 max-w-md">
      <InputGroup
        label="Nom de l'organisation"
        name="organizationName"
        value={organizationName}
        placeholder="Ex : Association Espoir"
        required
        helperText="Nom officiel de l'organisation"
        onChange={(value) => {
          setOrganizationName(
            String(value),
          );

          console.log(
            "Nom :",
            value,
          );
        }}
      />

      <InputGroup
        label="Email"
        name="email"
        type="email"
        value={email}
        placeholder="contact@organisation.sn"
        error="L'adresse email est obligatoire."
        onChange={(value) => {
          setEmail(String(value));

          console.log(
            "Email :",
            value,
          );
        }}
      />
    </div>
    <RadioGroup
      label="Type de cotisation"
      name="contributionType"
      value={contributionType}
      required
      orientation="horizontal"
      options={[
        {
          value: "MONTHLY",
          label: "Mensuelle",
          description: "Cotisation chaque mois",
        },
        {
          value: "YEARLY",
          label: "Annuelle",
          description: "Cotisation une fois par an",
        },
      ]}
      onChange={(value) => {
        setContributionType(
          value as "MONTHLY" | "YEARLY",
        );

        console.log(
          "Type de cotisation :",
          value,
        );
      }}
    />
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">
          DataTable Demo
        </h1>

        <p className="mt-2 text-sm text-ikbs-muted">
          Démonstration du composant DataTable
          générique IKBS.
        </p>
      </div>

      <button
      type="button"
      onClick={() => setModalOpen(true)}
      className="
        mb-6
        rounded-lg
        bg-ikbs-primary
        px-4
        py-2
        text-sm
        font-medium
        text-white
        transition
        hover:bg-ikbs-primary-dark
      "
    >
      Tester le modal
    </button>

      <DataTable
        columns={columns}
        data={filteredOrganizations}
        search={{
          enabled: true,
          keys: ["name", "code", "email"],
          placeholder:
            "Rechercher une organisation...",
          onChange: (value) => {
            setSearch(value);
            setPage(1);
          },
        }}
        actions={{
        enabled: true,
        items: (organization) => [
            {
            key: "edit",
            label: "Modifier",
            icon: <Pencil size={16} />,
            onClick: (row) => {
                console.log("Modifier :", row);
            },
            },
            {
            key: "status",
            label:
                organization.status === "ACTIVE"
                ? "Suspendre"
                : "Activer",
            icon: <Power size={16} />,
            onClick: (row) => {
                console.log("Changer statut :", row);
            },
            },
            {
            key: "delete",
            label: "Supprimer",
            icon: <Trash2 size={16} />,
            danger: true,
            onClick: (row) => {
                console.log("Supprimer :", row);
            },
            },
        ],
        }}
        pagination={{
          enabled: true,
          page,
          limit,
          total: filteredOrganizations.length,
          onPageChange: setPage,
          onLimitChange: (value) => {
            setLimit(value);
            setPage(1);
          },
        }}
        rowKey={(row) => row.id}
        emptyMessage="Aucune organisation trouvée."
      />
      <Modal
  open={modalOpen}
  onClose={() => setModalOpen(false)}
  title="Test du modal"
  size="md"
>
  <div className="space-y-4">
    <p className="text-sm text-ikbs-muted">
      Ceci est un modal générique IKBS.
    </p>

    <div className="flex justify-end">
      <button
        type="button"
        onClick={() => setModalOpen(false)}
        className="
          rounded-lg
          bg-ikbs-primary
          px-4
          py-2
          text-sm
          font-medium
          text-white
          hover:bg-ikbs-primary-dark
        "
      >
        Fermer
      </button>
    </div>
  </div>
</Modal>
    </section>
  );
}