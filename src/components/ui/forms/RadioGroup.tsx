
"use client";

export type RadioValue = string | number;

export interface RadioOption {
  value: RadioValue;
  label: string;
  description?: string;
  disabled?: boolean;
}

interface RadioGroupProps {
  label: string;
  name: string;
  options: RadioOption[];

  value?: RadioValue;

  required?: boolean;
  disabled?: boolean;

  error?: string;
  helperText?: string;

  orientation?: "horizontal" | "vertical";

  onChange?: (value: RadioValue) => void;
}

export default function RadioGroup({
  label,
  name,
  options,
  value,
  required = false,
  disabled = false,
  error,
  helperText,
  orientation = "vertical",
  onChange,
}: RadioGroupProps) {
  const valuesAreEqual = (
    first: RadioValue | undefined,
    second: RadioValue,
  ) => {
    if (
      first === undefined ||
      first === null
    ) {
      return false;
    }

    return String(first) === String(second);
  };

  return (
    <fieldset
      className="w-full space-y-2"
      aria-invalid={Boolean(error)}
    >
      {/* LABEL */}

      {label && (
        <legend
          className="
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
        </legend>
      )}

      {/* OPTIONS */}

      <div
        className={
          orientation === "horizontal"
            ? "flex flex-wrap gap-3"
            : "flex flex-col gap-2"
        }
      >
        {options.map((option) => {
          const checked =
            valuesAreEqual(
              value,
              option.value,
            );

          const optionDisabled =
            disabled || option.disabled;

          const optionId =
            `radio-${name}-${String(option.value)}`;

          return (
            <label
              key={String(option.value)}
              htmlFor={optionId}
              className={`
                flex
                items-start
                gap-3
                rounded-lg
                border
                px-3
                py-2.5
                transition

                ${
                  optionDisabled
                    ? `
                      cursor-not-allowed
                      opacity-60
                    `
                    : `
                      cursor-pointer
                      hover:border-ikbs-primary
                      hover:bg-ikbs-primary/5
                    `
                }

                ${
                  checked
                    ? `
                      border-ikbs-primary
                      bg-ikbs-primary/5
                    `
                    : `
                      border-ikbs-border
                      bg-ikbs-card
                    `
                }

                ${
                  orientation === "horizontal"
                    ? "min-w-36"
                    : "w-full"
                }
              `}
            >
              {/* RADIO NATIF */}

              <input
                id={optionId}
                type="radio"
                name={name}
                value={String(option.value)}
                checked={checked}
                required={required}
                disabled={optionDisabled}
                onChange={() => {
                  onChange?.(
                    option.value,
                  );
                }}
                className="
                  mt-0.5
                  h-4
                  w-4
                  shrink-0
                  accent-[var(--ikbs-primary)]
                "
              />

              {/* CONTENU */}

              <span className="min-w-0">
                <span
                  className={`
                    block
                    text-sm

                    ${
                      checked
                        ? `
                          font-medium
                          text-ikbs-primary
                        `
                        : `
                          text-foreground
                        `
                    }
                  `}
                >
                  {option.label}
                </span>

                {option.description && (
                  <span
                    className="
                      mt-0.5
                      block
                      text-xs
                      text-ikbs-muted
                    "
                  >
                    {option.description}
                  </span>
                )}
              </span>
            </label>
          );
        })}
      </div>

      {/* ERROR / HELPER */}

      {error ? (
        <p className="text-xs text-red-500">
          {error}
        </p>
      ) : helperText ? (
        <p className="text-xs text-ikbs-muted">
          {helperText}
        </p>
      ) : null}
    </fieldset>
  );
}

