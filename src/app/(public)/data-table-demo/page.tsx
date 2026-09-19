"use client";

import { useState } from "react";
import { 
  Pencil, Power, Trash2,Users,
  CalendarDays,
  WalletCards,
  Settings, } from "lucide-react";
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
import FormModal from "@/components/ui/forms/FormModal";
import {
  useToast,
} from "@/components/ui/toast/ToastProvider";
import Alert from "@/components/ui/alert/Alert";


import Tabs, {
  type TabItem,
  type TabValue,
} from "@/components/ui/tabs/Tabs";

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
  const toast = useToast();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [modalOpen, setModalOpen] = useState(false);
  // const [status, setStatus] = useState("");
  // const [commissions, setCommissions] = useState<string[]>([]);
  const [status, setStatus] =useState<SelectValue>("");

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
     status: "ACTIVE",
    contributionType: "MONTHLY",
    commissions: [],
    permissions: [],
  });

  const [formModalOpen, setFormModalOpen] =useState(false);
const [saving, setSaving] =useState(false);
const [showWarning, setShowWarning] =useState(true);
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

const organizationFields: DynamicFormField[] = [
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
    type: "input",
    name: "phone",
    label: "Téléphone",
    inputType: "tel",
    placeholder: "+221 77 000 00 00",
  },
  {
    type: "select",
    name: "status",
    label: "Statut",
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
    type: "radio",
    name: "contributionType",
    label: "Cotisation",
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
];

// tabs
const [activeTab, setActiveTab] = useState<TabValue>("members");

const tabs: TabItem[] = [
  {
    value: "members",
    label: "Membres",
    icon: <Users size={17} />,
    badge: 125,
    content: (
      <div>
        Liste des membres
      </div>
    ),
  },
  {
    value: "contributions",
    label: "Cotisations",
    icon: <WalletCards size={17} />,
    content: (
      <div>
        Gestion des cotisations
      </div>
    ),
  },
  {
    value: "events",
    label: "Événements",
    icon: <CalendarDays size={17} />,
    badge: 3,
    content: (
      <div>
        Liste des événements
      </div>
    ),
  },
  {
    value: "settings",
    label: "Paramètres",
    icon: <Settings size={17} />,
    content: (
      <div>
        Paramètres de l'organisation
      </div>
    ),
  },
];

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <Tabs
        items={tabs}
        value={activeTab}
        onChange={setActiveTab}
      />
      {/* <DynamicForm
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
      /> */}
      <button
        type="button"
        onClick={() =>
          setFormModalOpen(true)
        }
        className="
          rounded-lg
          bg-ikbs-primary
          px-4
          py-2.5
          text-sm
          font-medium
          text-white
        "
      >
        Ajouter une organisation
      </button>
      <div className="space-y-4">

        <Alert
          type="success"
          title="Succès"
        >
          Les informations ont été enregistrées
          avec succès.
        </Alert>

        <Alert
          type="info"
          title="Information"
        >
          Les modifications seront visibles par
          tous les membres de l&apos;organisation.
        </Alert>

        <Alert
          type="warning"
          title="Organisation suspendue"
        >
          Les membres de cette organisation ne
          peuvent actuellement pas accéder à leur
          espace.
        </Alert>

        <Alert
          type="error"
          title="Erreur"
        >
          Impossible de récupérer les informations
          de l&apos;organisation.
        </Alert>

        {showWarning && (
          <Alert
            type="warning"
            title="Attention"
            dismissible
            onClose={() =>
              setShowWarning(false)
            }
          >
            Certaines informations sont
            manquantes.
          </Alert>
        )}

      </div>
      {/* <TreeGroup
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
      /> */}
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
      <FormModal
        open={formModalOpen}
        title="Ajouter une organisation"
        fields={organizationFields}
        values={formValues}
        columns={2}
        loading={saving}
        onChange={(
          name: string,
          value: FormValue,
        ) => {
          setFormValues(
            (current) => ({
              ...current,
              [name]: value,
            }),
          );
        }}
        onSubmit={async () => {
          setSaving(true);

          try {
            await new Promise(
              (resolve) =>
                setTimeout(
                  resolve,
                  1000,
                ),
            );

            toast.success(
              "Organisation ajoutée avec succès.",
            );

            // toast.error(
            //   "Impossible de supprimer l'organisation.",
            // );

            // toast.warning(
            //   "Cette organisation est actuellement suspendue.",
            // );

            // toast.info(
            //   "Les informations ont été mises à jour.",
            // );

            setFormModalOpen(false);
          } catch {
            toast.error(
              "Une erreur est survenue pendant l'enregistrement.",
              "Erreur",
            );
          } finally {
            setSaving(false);
          }
        }}
        onClose={() => {
          if (!saving) {
            setFormModalOpen(false);
          }
        }}
      />
    </section>
  );
}