"use client";

import InputGroup, {
  type InputValue,
} from "./InputGroup";

import SelectGroup, {
  type SelectOption,
  type SelectValue,
} from "./SelectGroup";

import RadioGroup, {
  type RadioOption,
  type RadioValue,
} from "./RadioGroup";

import TreeGroup, {
  type TreeNode,
  type TreeValue,
} from "./TreeGroup";

import TextareaGroup from "./TextareaGroup";

/* =====================================================
 * TYPES
 * ===================================================== */

export type FormValue =
  | string
  | number
  | SelectValue[]
  | TreeValue[];

export type FormValues = Record<
  string,
  FormValue
>;

export type FormErrors = Record<
  string,
  string | undefined
>;

interface BaseField {
  name: string;
  label: string;

  placeholder?: string;

  required?: boolean;
  disabled?: boolean;

  helperText?: string;

  className?: string;
}
/* =====================================================
 * TEXTAREA
 * ===================================================== */
export interface TextareaField
  extends BaseField {
  type: "textarea";

  rows?: number;
  maxLength?: number;
}

/* =====================================================
 * INPUT
 * ===================================================== */

export interface InputField
  extends BaseField {
  type: "input";

  inputType?:
    | "text"
    | "email"
    | "password"
    | "number"
    | "tel"
    | "url"
    | "date";

  min?: number;
  max?: number;
  step?: number;

  autoComplete?: string;
}

/* =====================================================
 * SELECT
 * ===================================================== */

export interface SelectField
  extends BaseField {
  type: "select";

  options: SelectOption[];

  multiple?: boolean;
  search?: boolean;

  enableBulkActions?: boolean;
  maxSelectAll?: number;
}

/* =====================================================
 * RADIO
 * ===================================================== */

export interface RadioField
  extends BaseField {
  type: "radio";

  options: RadioOption[];

  orientation?:
    | "horizontal"
    | "vertical";
}

/* =====================================================
 * TREE
 * ===================================================== */

export interface TreeField
  extends BaseField {
  type: "tree";

  nodes: TreeNode[];

  multiple?: boolean;

  defaultExpanded?: boolean;
}

/* =====================================================
 * FIELD UNION
 * ===================================================== */

export type DynamicFormField =
  | InputField
  | TextareaField
  | SelectField
  | RadioField
  | TreeField;

/* =====================================================
 * PROPS
 * ===================================================== */

interface DynamicFormProps {
  fields: DynamicFormField[];

  values: FormValues;

  errors?: FormErrors;

  columns?: 1 | 2 | 3;

  onChange: (
    name: string,
    value: FormValue,
  ) => void;
}

/* =====================================================
 * COMPONENT
 * ===================================================== */

export default function DynamicForm({
  fields,
  values,
  errors = {},
  columns = 1,
  onChange,
}: DynamicFormProps) {
  /*
   * GRID
   */

  const gridClasses = {
    1: "grid-cols-1",
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 xl:grid-cols-3",
  };

  /*
   * RENDER FIELD
   */

  const renderField = (
    field: DynamicFormField,
  ) => {
    const value =
      values[field.name];

    const error =
      errors[field.name];

    /*
     * TEXTAREA
     */
    if (field.type === "textarea") {
  return (
    <TextareaGroup
      label={field.label}
      name={field.name}
      value={String(
        values[field.name] ?? "",
      )}
      placeholder={field.placeholder}
      required={field.required}
      disabled={field.disabled}
      error={errors?.[field.name]}
      helperText={field.helperText}
      rows={field.rows}
      maxLength={field.maxLength}
      onChange={(value) =>
        onChange(
          field.name,
          value,
        )
      }
    />
  );
}
    /*
     * INPUT
     */

    if (field.type === "input") {
      return (
        <InputGroup
          label={field.label}
          name={field.name}
          type={
            field.inputType ??
            "text"
          }
          value={
            value as InputValue
          }
          placeholder={
            field.placeholder
          }
          required={
            field.required
          }
          disabled={
            field.disabled
          }
          error={error}
          helperText={
            field.helperText
          }
          min={field.min}
          max={field.max}
          step={field.step}
          autoComplete={
            field.autoComplete
          }
          onChange={(newValue) =>
            onChange(
              field.name,
              newValue,
            )
          }
        />
      );
    }

    /*
     * SELECT
     */

    if (field.type === "select") {
      return (
        <SelectGroup
          label={field.label}
          name={field.name}
          options={
            field.options
          }
          value={
            value as
              | SelectValue
              | SelectValue[]
          }
          placeholder={
            field.placeholder
          }
          required={
            field.required
          }
          disabled={
            field.disabled
          }
          multiple={
            field.multiple
          }
          search={
            field.search
          }
          enableBulkActions={
            field.enableBulkActions
          }
          maxSelectAll={
            field.maxSelectAll
          }
          error={error}
          helperText={
            field.helperText
          }
          onChange={(newValue) =>
            onChange(
              field.name,
              newValue,
            )
          }
        />
      );
    }

    /*
     * RADIO
     */

    if (field.type === "radio") {
      return (
        <RadioGroup
          label={field.label}
          name={field.name}
          options={
            field.options
          }
          value={
            value as RadioValue
          }
          required={
            field.required
          }
          disabled={
            field.disabled
          }
          orientation={
            field.orientation
          }
          error={error}
          helperText={
            field.helperText
          }
          onChange={(newValue) =>
            onChange(
              field.name,
              newValue,
            )
          }
        />
      );
    }

    /*
     * TREE
     */

    if (field.type === "tree") {
      return (
        <TreeGroup
          label={field.label}
          name={field.name}
          nodes={
            field.nodes
          }
          value={
            value as
              | TreeValue
              | TreeValue[]
          }
          multiple={
            field.multiple
          }
          required={
            field.required
          }
          disabled={
            field.disabled
          }
          defaultExpanded={
            field.defaultExpanded
          }
          error={error}
          helperText={
            field.helperText
          }
          onChange={(newValue) =>
            onChange(
              field.name,
              newValue,
            )
          }
        />
      );
    }

    return null;
  };

  return (
    <div
      className={`
        grid
        gap-5
        ${gridClasses[columns]}
      `}
    >
      {fields.map((field) => (
        <div
          key={field.name}
          className={
            field.className ?? ""
          }
        >
          {renderField(field)}
        </div>
      ))}
    </div>
  );
}