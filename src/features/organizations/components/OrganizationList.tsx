"use client";

import {
  Pencil,
  Power,
PowerOff,
  Trash2,
} from "lucide-react";

import DataTable from "@/components/ui/table/DataTable";

import type {
  DataTableColumn,
} from "@/components/ui/table/types";

import type {
  Organization,
} from "@/types/organization";

interface OrganizationListProps {
  organizations: Organization[];

  loading?: boolean;

  page: number;
  limit: number;
  total: number;

  onSearch: (
    value: string,
  ) => void;

  onPageChange: (
    page: number,
  ) => void;

  onLimitChange: (
    limit: number,
  ) => void;

  onEdit: (
    organization: Organization,
  ) => void;

  onDelete: (
    organization: Organization,
  ) => void;

  onChangeStatus: (
    organization: Organization,
  ) => void;
}

export default function OrganizationList({
  organizations,
  loading = false,
  page,
  limit,
  total,
  onSearch,
  onPageChange,
  onLimitChange,
  onEdit,
  onDelete,
  onChangeStatus,
}: OrganizationListProps) {
  const columns: DataTableColumn<Organization>[] = [
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
      render: (value) => (
        <span>
          {String(value ?? "-")}
        </span>
      ),
    },

    {
      key: "phone",
      label: "Téléphone",
      render: (value) => (
        <span>
          {String(value ?? "-")}
        </span>
      ),
    },

    {
      key: "status",
      label: "Statut",
      render: (value) => {
        const status =
          String(value);

        const labels = {
          ACTIVE: "Active",
          PENDING: "En attente",
          SUSPENDED: "Suspendue",
          ARCHIVED: "Archivée",
        };

        const classNames = {
          ACTIVE:
            "bg-green-500/10 text-green-600 dark:text-green-400",

          PENDING:
            "bg-amber-500/10 text-amber-600 dark:text-amber-400",

          SUSPENDED:
            "bg-red-500/10 text-red-600 dark:text-red-400",

          ARCHIVED:
            "bg-slate-500/10 text-slate-600 dark:text-slate-400",
        };

        const typedStatus =
          status as keyof typeof labels;

        return (
          <span
            className={`
              inline-flex
              rounded-full
              px-2.5
              py-1
              text-xs
              font-medium

              ${
                classNames[
                  typedStatus
                ] ??
                "bg-ikbs-primary/10 text-ikbs-primary"
              }
            `}
          >
            {labels[
              typedStatus
            ] ?? status}
          </span>
        );
      },
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={organizations}
      loading={loading}
      rowKey={(row) => row.id}
      emptyMessage="Aucune organisation trouvée."
      search={{
        enabled: true,
        keys: [
          "name",
          "code",
          "email",
        ],
        placeholder:
          "Rechercher une organisation...",
        onChange: onSearch,
      }}
      pagination={{
        enabled: true,
        page,
        limit,
        total,
        onPageChange,
        onLimitChange,
      }}
      actions={{
        enabled: true,

        items: (
          organization,
        ) => [
          {
            key: "edit",
            label: "Modifier",
            icon: (
              <Pencil size={16} />
            ),
            onClick: onEdit,
          },

          {
            key: "status",
            label: organization.status === "ACTIVE"
                ? "Suspendre"
                : "Activer",
            icon:organization.status === "ACTIVE" ? (
                <PowerOff size={16} />
                ) : (
                <Power size={16} />
                ),
            onClick: () =>onChangeStatus(organization),
            hidden:organization.status === "ARCHIVED",
            },

          {
            key: "delete",
            label: "Supprimer",

            icon: (
              <Trash2
                size={16}
              />
            ),

            danger: true,

            onClick:
              onDelete,
          },
        ],
      }}
    />
  );
}