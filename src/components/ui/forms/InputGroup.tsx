"use client";

import type { ChangeEvent } from "react";

export type InputValue = string | number;

interface InputGroupProps {
  label: string;
  name: string;

  type?:
    | "text"
    | "email"
    | "password"
    | "number"
    | "tel"
    | "url"
    | "date";

  value?: InputValue;

  placeholder?: string;

  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;

  error?: string;
  helperText?: string;

  min?: number;
  max?: number;
  step?: number;

  autoComplete?: string;

  onChange?: (
    value: InputValue,
    event: ChangeEvent<HTMLInputElement>,
  ) => void;
}

export default function InputGroup({
  label,
  name,
  type = "text",
  value = "",
  placeholder,
  required = false,
  disabled = false,
  readOnly = false,
  error,
  helperText,
  min,
  max,
  step,
  autoComplete,
  onChange,
}: InputGroupProps) {
  const inputId = `input-${name}`;

  const handleChange = (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    /*
     * Pour number, on renvoie un number
     * seulement lorsqu'une valeur existe.
     *
     * Cela permet aussi d'effacer complètement
     * le contenu d'un input number.
     */
    if (type === "number") {
      const rawValue = event.target.value;

      onChange?.(
        rawValue === ""
          ? ""
          : Number(rawValue),
        event,
      );

      return;
    }

    onChange?.(
      event.target.value,
      event,
    );
  };

  return (
    <div className="w-full space-y-1.5">
      {/* LABEL */}

      {label && (
        <label
          htmlFor={inputId}
          className="
            block
            text-sm
            font-medium
            text-foreground
          "
        >
          {label}

          {required && (
            <span className="ml-1 text-red-500">
              *
            </span>
          )}
        </label>
      )}

      {/* INPUT */}

      <input
        id={inputId}
        name={name}
        type={type}
        value={value}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        readOnly={readOnly}
        min={min}
        max={max}
        step={step}
        autoComplete={autoComplete}
        onChange={handleChange}
        aria-invalid={Boolean(error)}
        aria-describedby={
          error
            ? `${inputId}-error`
            : helperText
              ? `${inputId}-helper`
              : undefined
        }
        className={`
          w-full
          rounded-lg
          border
          bg-ikbs-card
          px-3
          py-2.5
          text-sm
          text-foreground
          outline-none
          transition

          placeholder:text-ikbs-muted

          disabled:cursor-not-allowed
          disabled:opacity-60

          read-only:cursor-default
          read-only:bg-ikbs-primary/5

          ${
            error
              ? `
                border-red-500
                focus:border-red-500
                focus:ring-2
                focus:ring-red-500/20
              `
              : `
                border-ikbs-border
                focus:border-ikbs-primary
                focus:ring-2
                focus:ring-ikbs-primary/20
              `
          }
        `}
      />

      {/* ERROR / HELPER */}

      {error ? (
        <p
          id={`${inputId}-error`}
          className="text-xs text-red-500"
        >
          {error}
        </p>
      ) : helperText ? (
        <p
          id={`${inputId}-helper`}
          className="text-xs text-ikbs-muted"
        >
          {helperText}
        </p>
      ) : null}
    </div>
  );
}