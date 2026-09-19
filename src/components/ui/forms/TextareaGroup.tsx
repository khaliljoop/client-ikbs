"use client";

import type {
  ChangeEvent,
} from "react";

interface TextareaGroupProps {
  label: string;
  name: string;

  value?: string;

  placeholder?: string;

  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;

  error?: string;
  helperText?: string;

  rows?: number;
  maxLength?: number;

  onChange?: (
    value: string,
    event: ChangeEvent<HTMLTextAreaElement>,
  ) => void;
}

export default function TextareaGroup({
  label,
  name,
  value = "",
  placeholder,
  required = false,
  disabled = false,
  readOnly = false,
  error,
  helperText,
  rows = 4,
  maxLength,
  onChange,
}: TextareaGroupProps) {
  const textareaId =
    `textarea-${name}`;

  const handleChange = (
    event: ChangeEvent<HTMLTextAreaElement>,
  ) => {
    onChange?.(
      event.target.value,
      event,
    );
  };

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label
          htmlFor={textareaId}
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

      <textarea
        id={textareaId}
        name={name}
        value={value}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        readOnly={readOnly}
        rows={rows}
        maxLength={maxLength}
        onChange={handleChange}
        aria-invalid={Boolean(error)}
        aria-describedby={
          error
            ? `${textareaId}-error`
            : helperText
              ? `${textareaId}-helper`
              : undefined
        }
        className={`
          w-full
          resize-y
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

      {error ? (
        <p
          id={`${textareaId}-error`}
          className="text-xs text-red-500"
        >
          {error}
        </p>
      ) : helperText ? (
        <p
          id={`${textareaId}-helper`}
          className="text-xs text-ikbs-muted"
        >
          {helperText}
        </p>
      ) : null}
    </div>
  );
}