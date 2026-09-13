import type { ChangeEvent } from "react";

import type {
  DataTableAction,
  DataTableProps,
} from "./types";

export default function DataTable<T extends object>({
  columns,
  data,
  search,
  pagination,
  actions,
  loading = false,
  emptyMessage = "Aucune donnée disponible.",
  rowKey,
}: DataTableProps<T>) {
  const handleSearchChange = (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    search?.onChange?.(event.target.value);
  };

  const totalPages = pagination
    ? Math.ceil(
        pagination.total / pagination.limit,
      )
    : 0;

  const isActionHidden = (
    action: DataTableAction<T>,
    row: T,
  ) => {
    if (typeof action.hidden === "function") {
      return action.hidden(row);
    }

    return action.hidden === true;
  };

  const isActionDisabled = (
    action: DataTableAction<T>,
    row: T,
  ) => {
    if (typeof action.disabled === "function") {
      return action.disabled(row);
    }

    return action.disabled === true;
  };

  return (
    <div className="w-full space-y-4">
      {/* Search */}
      {search?.enabled && (
        <div className="w-full">
          <input
            type="search"
            placeholder={
              search.placeholder ?? "Rechercher..."
            }
            onChange={handleSearchChange}
            className="
              w-full
              rounded-lg
              border border-ikbs-border
              bg-ikbs-card
              px-4 py-2.5
              text-foreground
              outline-none
              transition
              placeholder:text-ikbs-muted
              focus:border-ikbs-primary
              focus:ring-2
              focus:ring-ikbs-primary/20
            "
          />
        </div>
      )}

      {/* Table */}
      <div className="w-full overflow-x-auto rounded-lg border border-ikbs-border">
        <table className="w-full min-w-max border-collapse">
          <thead>
            <tr className="border-b border-ikbs-border bg-ikbs-card">
              {columns.map((column) => (
                <th
                  key={String(column.key)}
                  className={`
                    px-4 py-3
                    text-left
                    text-sm
                    font-semibold
                    text-foreground
                    ${column.className ?? ""}
                  `}
                >
                  {column.label}
                </th>
              ))}

              {actions?.enabled && (
                <th
                  className="
                    px-4 py-3
                    text-right
                    text-sm
                    font-semibold
                    text-foreground
                  "
                >
                  Actions
                </th>
              )}
            </tr>
          </thead>

          <tbody>
            {/* Loading */}
            {loading ? (
              <tr>
                <td
                  colSpan={
                    columns.length +
                    (actions?.enabled ? 1 : 0)
                  }
                  className="
                    px-4 py-8
                    text-center
                    text-sm
                    text-ikbs-muted
                  "
                >
                  Chargement...
                </td>
              </tr>
            ) : data.length === 0 ? (
              /* Empty */
              <tr>
                <td
                  colSpan={
                    columns.length +
                    (actions?.enabled ? 1 : 0)
                  }
                  className="
                    px-4 py-8
                    text-center
                    text-sm
                    text-ikbs-muted
                  "
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row, index) => {
                const rowActions =
                  actions?.enabled
                    ? actions.items(row)
                    : [];

                const visibleActions =
                  rowActions.filter(
                    (action) =>
                      !isActionHidden(
                        action,
                        row,
                      ),
                  );

                return (
                  <tr
                    key={
                      rowKey
                        ? rowKey(row)
                        : index
                    }
                    className="
                      border-b
                      border-ikbs-border
                      last:border-b-0
                      hover:bg-ikbs-primary/5
                    "
                  >
                    {columns.map((column) => {
                      const value =
                        row[column.key];

                      return (
                        <td
                          key={String(
                            column.key,
                          )}
                          className={`
                            px-4 py-3
                            text-sm
                            text-foreground
                            ${column.className ?? ""}
                          `}
                        >
                          {column.render
                            ? column.render(
                                value,
                                row,
                              )
                            : String(
                                value ?? "",
                              )}
                        </td>
                      );
                    })}

                    {actions?.enabled && (
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          {visibleActions.map(
                            (action) => {
                              const disabled =
                                isActionDisabled(
                                  action,
                                  row,
                                );

                              return (
                                <button
                                key={action.key}
                                type="button"
                                disabled={disabled}
                                onClick={() => action.onClick(row)}
                                title={action.label}
                                aria-label={action.label}
                                className={`
                                    inline-flex
                                    h-9
                                    w-9
                                    items-center
                                    justify-center
                                    rounded-lg
                                    border
                                    transition
                                    disabled:cursor-not-allowed
                                    disabled:opacity-50
                                    ${
                                    action.danger
                                        ? `
                                        border-red-300
                                        text-red-600
                                        hover:bg-red-50
                                        dark:border-red-800
                                        dark:text-red-400
                                        dark:hover:bg-red-950
                                        `
                                        : `
                                        border-ikbs-border
                                        text-foreground
                                        hover:border-ikbs-primary
                                        hover:bg-ikbs-primary/5
                                        hover:text-ikbs-primary
                                        `
                                    }
                                `}
                                >
                                {action.icon}
                                </button>
                              );
                            },
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination?.enabled &&
        pagination.total > 0 && (
          <div
            className="
              flex
              flex-col
              gap-3
              sm:flex-row
              sm:items-center
              sm:justify-between
            "
          >
            <div className="text-sm text-ikbs-muted">
              Total : {pagination.total}
            </div>

            <div className="flex items-center gap-2">
              <select
                value={pagination.limit}
                onChange={(event) =>
                  pagination.onLimitChange?.(
                    Number(
                      event.target.value,
                    ),
                  )
                }
                className="
                  rounded-lg
                  border border-ikbs-border
                  bg-ikbs-card
                  px-3 py-2
                  text-sm
                  text-foreground
                  outline-none
                  focus:border-ikbs-primary
                  focus:ring-2
                  focus:ring-ikbs-primary/20
                "
                aria-label="Nombre d'éléments par page"
              >
                {[10, 25, 50, 100].map(
                  (limit) => (
                    <option
                      key={limit}
                      value={limit}
                    >
                      {limit} / page
                    </option>
                  ),
                )}
              </select>

              <button
                type="button"
                disabled={
                  pagination.page <= 1
                }
                onClick={() =>
                  pagination.onPageChange?.(
                    pagination.page - 1,
                  )
                }
                className="
                  rounded-lg
                  border border-ikbs-border
                  bg-ikbs-card
                  px-3 py-2
                  text-sm
                  text-foreground
                  transition
                  hover:border-ikbs-primary
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                "
              >
                Précédent
              </button>

              <span
                className="
                  whitespace-nowrap
                  px-2
                  text-sm
                  text-foreground
                "
              >
                Page {pagination.page}
                {totalPages > 0 &&
                  ` / ${totalPages}`}
              </span>

              <button
                type="button"
                disabled={
                  pagination.page >=
                  totalPages
                }
                onClick={() =>
                  pagination.onPageChange?.(
                    pagination.page + 1,
                  )
                }
                className="
                  rounded-lg
                  border border-ikbs-border
                  bg-ikbs-card
                  px-3 py-2
                  text-sm
                  text-foreground
                  transition
                  hover:border-ikbs-primary
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                "
              >
                Suivant
              </button>
            </div>
          </div>
        )}
    </div>
  );
}