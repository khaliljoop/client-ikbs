"use client";

import { useState } from "react";
import { Pencil, Power, Trash2 } from "lucide-react";
import DataTable from "@/components/ui/table/DataTable";
import type { DataTableColumn } from "@/components/ui/table/types";

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

  const filteredOrganizations =
    organizations.filter((organization) => {
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

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">
          DataTable Demo
        </h1>

        <p className="mt-2 text-sm text-ikbs-muted">
          Démonstration du composant DataTable
          générique IKBS.
        </p>
      </div>

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
    </section>
  );
}