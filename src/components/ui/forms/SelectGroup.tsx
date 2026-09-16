
"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";

import {
  Check,
  ChevronDown,
  Search,
} from "lucide-react";

import { createPortal } from "react-dom";

export type SelectValue = string | number;

export interface SelectOption {
  value: SelectValue;
  label: string;
  disabled?: boolean;
}

interface SelectGroupProps {
  label: string;
  name: string;
  options: SelectOption[];

  value?: SelectValue | SelectValue[];

  placeholder?: string;

  required?: boolean;
  disabled?: boolean;
  multiple?: boolean;

  error?: string;
  helperText?: string;

  search?: boolean;

  enableBulkActions?: boolean;
  maxSelectAll?: number;

  onChange?: (
    value: SelectValue | SelectValue[],
  ) => void;
}

export default function SelectGroup({
  label,
  name,
  options,
  value,
  placeholder = "Sélectionner...",
  required = false,
  disabled = false,
  multiple = false,
  error,
  helperText,
  search = false,
  enableBulkActions = true,
  maxSelectAll = 20,
  onChange,
}: SelectGroupProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const [dropdownStyle, setDropdownStyle] =
    useState<CSSProperties>({});

  const containerRef =
    useRef<HTMLDivElement>(null);

  const dropdownRef =
    useRef<HTMLDivElement>(null);

  const buttonRef =
    useRef<HTMLButtonElement>(null);

  /*
   * =====================================================
   * VALEURS
   * =====================================================
   */

  const selectedValues: SelectValue[] =
    multiple
      ? Array.isArray(value)
        ? value
        : []
      : value !== undefined &&
          value !== null &&
          value !== ""
        ? [value as SelectValue]
        : [];

  /*
   * =====================================================
   * COMPARAISON
   * =====================================================
   *
   * Permet par exemple :
   *
   * value = 1
   * option.value = "1"
   *
   * d'être considérés identiques.
   */

  const valuesAreEqual = (
    first: SelectValue,
    second: SelectValue,
  ) => {
    return String(first) === String(second);
  };

  /*
   * =====================================================
   * OPTION SÉLECTIONNÉE ?
   * =====================================================
   */

  const isSelected = (
    optionValue: SelectValue,
  ) => {
    return selectedValues.some(
      (selectedValue) =>
        valuesAreEqual(
          selectedValue,
          optionValue,
        ),
    );
  };

  /*
   * =====================================================
   * OPTIONS SÉLECTIONNÉES
   * =====================================================
   */

  const selectedOptions = options.filter(
    (option) =>
      isSelected(option.value),
  );

  /*
   * =====================================================
   * FILTRE
   * =====================================================
   */

  const normalizedQuery = query
    .trim()
    .toLowerCase();

  const filteredOptions =
    search && normalizedQuery
      ? options.filter((option) =>
          option.label
            .toLowerCase()
            .includes(normalizedQuery),
        )
      : options;

  /*
   * =====================================================
   * POSITION DROPDOWN
   * =====================================================
   */

  const calculatePosition = () => {
    if (!buttonRef.current) {
      return;
    }

    const rect =
      buttonRef.current.getBoundingClientRect();

    const dropdownHeight = 300;

    const spaceBelow =
      window.innerHeight - rect.bottom;

    const spaceAbove = rect.top;

    const openUpward =
      spaceBelow < dropdownHeight &&
      spaceAbove > dropdownHeight;

    setDropdownStyle({
      position: "fixed",

      left: rect.left,
      width: rect.width,

      zIndex: 999999,

      ...(openUpward
        ? {
            bottom:
              window.innerHeight -
              rect.top +
              4,
          }
        : {
            top: rect.bottom + 4,
          }),
    });
  };

  useEffect(() => {
    if (!open) {
      return;
    }

    calculatePosition();

    window.addEventListener(
      "resize",
      calculatePosition,
    );

    window.addEventListener(
      "scroll",
      calculatePosition,
      true,
    );

    return () => {
      window.removeEventListener(
        "resize",
        calculatePosition,
      );

      window.removeEventListener(
        "scroll",
        calculatePosition,
        true,
      );
    };
  }, [open]);

  /*
   * =====================================================
   * CLICK EXTÉRIEUR
   * =====================================================
   *
   * IMPORTANT :
   * Le dropdown est dans document.body avec createPortal.
   * Il faut donc tester containerRef ET dropdownRef.
   */

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleOutsideClick = (
      event: MouseEvent,
    ) => {
      const target = event.target as Node;

      const clickedTrigger =
        containerRef.current?.contains(
          target,
        );

      const clickedDropdown =
        dropdownRef.current?.contains(
          target,
        );

      if (
        !clickedTrigger &&
        !clickedDropdown
      ) {
        setOpen(false);
        setQuery("");
      }
    };

    document.addEventListener(
      "mousedown",
      handleOutsideClick,
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick,
      );
    };
  }, [open]);

  /*
   * =====================================================
   * SÉLECTION
   * =====================================================
   */

  const handleOptionClick = (
    option: SelectOption,
  ) => {
    if (option.disabled) {
      return;
    }

    /*
     * MULTIPLE
     */
    if (multiple) {
      const alreadySelected =
        isSelected(option.value);

      const newValues =
        alreadySelected
          ? selectedValues.filter(
              (selectedValue) =>
                !valuesAreEqual(
                  selectedValue,
                  option.value,
                ),
            )
          : [
              ...selectedValues,
              option.value,
            ];

      onChange?.(newValues);

      // En multiple on garde le menu ouvert.
      return;
    }

    /*
     * SINGLE
     */

    onChange?.(option.value);

    setOpen(false);
    setQuery("");
  };

  /*
   * =====================================================
   * TOUT COCHER
   * =====================================================
   */

  const selectableOptions =
    filteredOptions.filter(
      (option) => !option.disabled,
    );

  const canSelectAll =
    multiple &&
    enableBulkActions &&
    selectableOptions.length > 0 &&
    selectableOptions.length <=
      maxSelectAll;

  const handleSelectAll = () => {
    if (!multiple) {
      return;
    }

    /*
     * On conserve les valeurs déjà sélectionnées
     * qui ne sont pas dans le résultat de recherche.
     */

    const newValues = [
      ...selectedValues,
    ];

    selectableOptions.forEach(
      (option) => {
        const exists = newValues.some(
          (selectedValue) =>
            valuesAreEqual(
              selectedValue,
              option.value,
            ),
        );

        if (!exists) {
          newValues.push(
            option.value,
          );
        }
      },
    );

    onChange?.(newValues);
  };

  /*
   * =====================================================
   * RESET
   * =====================================================
   */

  const handleReset = () => {
    if (!multiple) {
      return;
    }

    onChange?.([]);
  };

  /*
   * =====================================================
   * AFFICHAGE VALEUR
   * =====================================================
   */

  const renderValue = () => {
    /*
     * Aucune sélection
     */

    if (selectedOptions.length === 0) {
      return (
        <span className="text-ikbs-muted">
          {placeholder}
        </span>
      );
    }

    /*
     * SINGLE
     */

    if (!multiple) {
      return (
        <span
          className="
            block
            truncate
            text-foreground
          "
        >
          {selectedOptions[0].label}
        </span>
      );
    }

    /*
     * MULTIPLE
     */

    return (
      <div
        className="
          flex
          min-w-0
          flex-wrap
          gap-1.5
        "
      >
        {selectedOptions.map(
          (option) => (
            <span
              key={String(
                option.value,
              )}
              className="
                inline-flex
                items-center
                rounded-md
                bg-ikbs-primary/10
                px-2
                py-1
                text-xs
                font-medium
                text-ikbs-primary
              "
            >
              {option.label}
            </span>
          ),
        )}
      </div>
    );
  };

  /*
   * =====================================================
   * RENDER
   * =====================================================
   */

  return (
    <div
      ref={containerRef}
      className="w-full space-y-1.5"
    >
      {/* LABEL */}

      {label && (
        <label
          htmlFor={`select-${name}`}
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

      {/* SELECT BUTTON */}

      <button
        ref={buttonRef}
        id={`select-${name}`}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => {
          if (!disabled) {
            setOpen(
              (previous) =>
                !previous,
            );
          }
        }}
        className={`
          flex
          min-h-[42px]
          w-full
          items-center
          justify-between
          rounded-lg
          border
          bg-ikbs-card
          px-3
          py-2
          text-left
          text-sm
          outline-none
          transition

          disabled:cursor-not-allowed
          disabled:opacity-60

          ${
            error
              ? `
                border-red-500
                focus:ring-2
                focus:ring-red-500/20
              `
              : `
                border-ikbs-border
                hover:border-ikbs-primary
                focus:border-ikbs-primary
                focus:ring-2
                focus:ring-ikbs-primary/20
              `
          }
        `}
      >
        <div
          className="
            min-w-0
            flex-1
          "
        >
          {renderValue()}
        </div>

        <ChevronDown
          size={18}
          className={`
            ml-2
            shrink-0
            text-ikbs-muted
            transition-transform

            ${
              open
                ? "rotate-180"
                : ""
            }
          `}
        />
      </button>

      {/* DROPDOWN */}

      {open &&
        typeof document !==
          "undefined" &&
        createPortal(
          <div
            ref={dropdownRef}
            style={dropdownStyle}
            className="
              overflow-hidden
              rounded-lg
              border
              border-ikbs-border
              bg-ikbs-card
              shadow-2xl
            "
          >
            {/* BULK ACTIONS */}

            {canSelectAll && (
              <div
                className="
                  flex
                  items-center
                  justify-between
                  border-b
                  border-ikbs-border
                  px-3
                  py-2
                "
              >
                <button
                  type="button"
                  onClick={
                    handleSelectAll
                  }
                  className="
                    text-xs
                    font-medium
                    text-ikbs-primary
                    hover:underline
                  "
                >
                  Tout cocher
                </button>

                <button
                  type="button"
                  onClick={handleReset}
                  disabled={
                    selectedValues.length ===
                    0
                  }
                  className="
                    text-xs
                    font-medium
                    text-red-500
                    hover:underline
                    disabled:cursor-not-allowed
                    disabled:opacity-50
                  "
                >
                  Réinitialiser
                </button>
              </div>
            )}

            {/* SEARCH */}

            {search && (
              <div
                className="
                  border-b
                  border-ikbs-border
                  p-2
                "
              >
                <div className="relative">
                  <Search
                    size={16}
                    className="
                      absolute
                      left-3
                      top-1/2
                      -translate-y-1/2
                      text-ikbs-muted
                    "
                  />

                  <input
                    type="text"
                    value={query}
                    autoFocus
                    onChange={(
                      event,
                    ) =>
                      setQuery(
                        event.target
                          .value,
                      )
                    }
                    placeholder="Rechercher..."
                    className="
                      w-full
                      rounded-lg
                      border
                      border-ikbs-border
                      bg-ikbs-card
                      py-2
                      pl-9
                      pr-3
                      text-sm
                      text-foreground
                      outline-none
                      focus:border-ikbs-primary
                      focus:ring-2
                      focus:ring-ikbs-primary/20
                    "
                  />
                </div>
              </div>
            )}

            {/* OPTIONS */}

            <div
              role="listbox"
              aria-multiselectable={
                multiple || undefined
              }
              className="
                max-h-60
                overflow-y-auto
                p-1
              "
            >
              {filteredOptions.length ===
              0 ? (
                <div
                  className="
                    px-3
                    py-3
                    text-sm
                    text-ikbs-muted
                  "
                >
                  Aucun résultat
                </div>
              ) : (
                filteredOptions.map(
                  (option) => {
                    const selected =
                      isSelected(
                        option.value,
                      );

                    return (
                      <button
                        key={String(
                          option.value,
                        )}
                        type="button"
                        role="option"
                        aria-selected={
                          selected
                        }
                        disabled={
                          option.disabled
                        }
                        onClick={() =>
                          handleOptionClick(
                            option,
                          )
                        }
                        className={`
                          flex
                          w-full
                          items-center
                          rounded-md
                          px-3
                          py-2.5
                          text-left
                          text-sm
                          transition

                          ${
                            option.disabled
                              ? `
                                cursor-not-allowed
                                opacity-50
                              `
                              : `
                                cursor-pointer
                                hover:bg-ikbs-primary/10
                              `
                          }

                          ${
                            selected
                              ? `
                                bg-ikbs-primary/5
                                text-ikbs-primary
                              `
                              : `
                                text-foreground
                              `
                          }
                        `}
                      >
                        {/* MULTIPLE : CHECKBOX */}

                        {multiple && (
                          <span
                            className={`
                              mr-3
                              flex
                              h-5
                              w-5
                              shrink-0
                              items-center
                              justify-center
                              rounded
                              border
                              transition

                              ${
                                selected
                                  ? `
                                    border-ikbs-primary
                                    bg-ikbs-primary
                                    text-white
                                  `
                                  : `
                                    border-ikbs-border
                                    bg-ikbs-card
                                  `
                              }
                            `}
                          >
                            {selected && (
                              <Check
                                size={14}
                                strokeWidth={
                                  3
                                }
                              />
                            )}
                          </span>
                        )}

                        {/* LABEL */}

                        <span
                          className={`
                            min-w-0
                            flex-1
                            truncate

                            ${
                              selected
                                ? "font-medium"
                                : ""
                            }
                          `}
                        >
                          {option.label}
                        </span>

                        {/* SINGLE : SIMPLE CHECK */}

                        {!multiple &&
                          selected && (
                            <Check
                              size={17}
                              strokeWidth={
                                2.5
                              }
                              className="
                                ml-3
                                shrink-0
                                text-ikbs-primary
                              "
                            />
                          )}
                      </button>
                    );
                  },
                )
              )}
            </div>
          </div>,
          document.body,
        )}

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
    </div>
  );
}

