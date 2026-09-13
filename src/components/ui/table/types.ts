import type { ReactNode } from "react";

export interface DataTableColumn<T> {
  key: keyof T;
  label: string;
  render?: (value: T[keyof T], row: T) => ReactNode;
  sortable?: boolean;
  className?: string;
}

export interface DataTableSearch<T> {
  enabled?: boolean;
  keys: Array<keyof T>;
  placeholder?: string;
  onChange?: (value: string) => void;
}

export interface DataTablePagination {
  enabled?: boolean;
  page: number;
  limit: number;
  total: number;
  onPageChange?: (page: number) => void;
  onLimitChange?: (limit: number) => void;
}

export interface DataTableAction<T> {
  key: string;
  label: string;
  icon?: ReactNode;
  onClick: (row: T) => void;
  disabled?: boolean | ((row: T) => boolean);
  hidden?: boolean | ((row: T) => boolean);
  danger?: boolean;
}

export interface DataTableActions<T> {
  enabled?: boolean;
  items: (row: T) => DataTableAction<T>[];
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];

  search?: DataTableSearch<T>;

  pagination?: DataTablePagination;

  actions?: DataTableActions<T>;

  loading?: boolean;

  emptyMessage?: string;

  rowKey?: (row: T) => string;
}