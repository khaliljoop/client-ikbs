
"use client";

import {
  ChevronDown,
  ChevronRight,
  Minus,
  Check,
} from "lucide-react";

import {
  useState,
} from "react";

export type TreeValue = string | number;

export interface TreeNode {
  value: TreeValue;
  label: string;
  disabled?: boolean;
  children?: TreeNode[];
}

interface TreeGroupProps {
  label: string;
  name: string;

  nodes: TreeNode[];

  value?: TreeValue | TreeValue[];

  multiple?: boolean;
  required?: boolean;
  disabled?: boolean;

  defaultExpanded?: boolean;

  error?: string;
  helperText?: string;

  onChange?: (
    value: TreeValue | TreeValue[],
  ) => void;
}

export default function TreeGroup({
  label,
  name,
  nodes,
  value,
  multiple = false,
  required = false,
  disabled = false,
  defaultExpanded = true,
  error,
  helperText,
  onChange,
}: TreeGroupProps) {
  /*
   * ================================
   * EXPANDED
   * ================================
   */

  const getInitialExpanded = (
    items: TreeNode[],
  ): Set<string> => {
    if (!defaultExpanded) {
      return new Set();
    }

    const result = new Set<string>();

    const walk = (list: TreeNode[]) => {
      list.forEach((node) => {
        if (node.children?.length) {
          result.add(String(node.value));
          walk(node.children);
        }
      });
    };

    walk(items);

    return result;
  };

  const [expanded, setExpanded] =
    useState<Set<string>>(
      () => getInitialExpanded(nodes),
    );

  /*
   * ================================
   * NORMALISATION
   * ================================
   */

  const selectedValues: TreeValue[] =
    multiple
      ? Array.isArray(value)
        ? value
        : []
      : value !== undefined &&
          value !== null &&
          value !== ""
        ? [value as TreeValue]
        : [];

  const valuesAreEqual = (
    first: TreeValue,
    second: TreeValue,
  ) =>
    String(first) === String(second);

  const isSelected = (
    nodeValue: TreeValue,
  ) =>
    selectedValues.some(
      (selectedValue) =>
        valuesAreEqual(
          selectedValue,
          nodeValue,
        ),
    );

  /*
   * ================================
   * ENFANTS
   * ================================
   */

  const getDescendants = (
    node: TreeNode,
  ): TreeValue[] => {
    if (!node.children?.length) {
      return [];
    }

    return node.children.flatMap(
      (child) => [
        child.value,
        ...getDescendants(child),
      ],
    );
  };

  const getSelectableDescendants = (
    node: TreeNode,
  ): TreeValue[] => {
    if (!node.children?.length) {
      return [];
    }

    return node.children.flatMap(
      (child) => [
        ...(child.disabled
          ? []
          : [child.value]),
        ...getSelectableDescendants(child),
      ],
    );
  };

  /*
   * ================================
   * ÉTAT PARTIEL
   * ================================
   */

  const getNodeState = (
    node: TreeNode,
  ) => {
    const descendants =
      getSelectableDescendants(node);

    const ownSelected =
      isSelected(node.value);

    if (
      descendants.length === 0
    ) {
      return {
        checked: ownSelected,
        partial: false,
      };
    }

    const selectedChildren =
      descendants.filter(
        (descendant) =>
          isSelected(descendant),
      ).length;

    const allChildrenSelected =
      selectedChildren ===
      descendants.length;

    const someChildrenSelected =
      selectedChildren > 0;

    return {
      checked:
        ownSelected &&
        allChildrenSelected,

      partial:
        someChildrenSelected &&
        !allChildrenSelected,
    };
  };

  /*
   * ================================
   * EXPAND / COLLAPSE
   * ================================
   */

  const toggleExpanded = (
    nodeValue: TreeValue,
  ) => {
    const key =
      String(nodeValue);

    setExpanded((current) => {
      const next =
        new Set(current);

      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }

      return next;
    });
  };

  /*
   * ================================
   * SÉLECTION
   * ================================
   */

  const handleSelect = (
    node: TreeNode,
  ) => {
    if (
      disabled ||
      node.disabled
    ) {
      return;
    }

    /*
     * SINGLE
     */

    if (!multiple) {
      onChange?.(node.value);
      return;
    }

    /*
     * MULTIPLE
     */

    const descendants =
      getSelectableDescendants(node);

    const valuesToToggle = [
      node.value,
      ...descendants,
    ];

    const allSelected =
      valuesToToggle.every(
        (item) =>
          isSelected(item),
      );

    if (allSelected) {
      const newValues =
        selectedValues.filter(
          (selectedValue) =>
            !valuesToToggle.some(
              (item) =>
                valuesAreEqual(
                  selectedValue,
                  item,
                ),
            ),
        );

      onChange?.(newValues);

      return;
    }

    const newValues = [
      ...selectedValues,
    ];

    valuesToToggle.forEach(
      (item) => {
        const exists =
          newValues.some(
            (selectedValue) =>
              valuesAreEqual(
                selectedValue,
                item,
              ),
          );

        if (!exists) {
          newValues.push(item);
        }
      },
    );

    onChange?.(newValues);
  };

  /*
   * ================================
   * NODE
   * ================================
   */

  const renderNode = (
    node: TreeNode,
    level = 0,
  ) => {
    const hasChildren =
      Boolean(
        node.children?.length,
      );

    const isExpanded =
      expanded.has(
        String(node.value),
      );

    const nodeDisabled =
      disabled ||
      node.disabled;

    const state =
      getNodeState(node);

    return (
      <div
        key={String(node.value)}
      >
        <div
          className={`
            flex
            min-h-10
            items-center
            gap-2
            rounded-lg
            px-2
            py-1.5
            transition

            ${
              nodeDisabled
                ? `
                  cursor-not-allowed
                  opacity-50
                `
                : `
                  hover:bg-ikbs-primary/5
                `
            }
          `}
          style={{
            paddingLeft:
              `${level * 20 + 8}px`,
          }}
        >
          {/* EXPAND */}

          <button
            type="button"
            disabled={
              !hasChildren
            }
            onClick={() =>
              toggleExpanded(
                node.value,
              )
            }
            className="
              flex
              h-6
              w-6
              shrink-0
              items-center
              justify-center
              rounded
              text-ikbs-muted
              hover:text-ikbs-primary
              disabled:cursor-default
            "
            aria-label={
              isExpanded
                ? "Réduire"
                : "Développer"
            }
          >
            {hasChildren ? (
              isExpanded ? (
                <ChevronDown
                  size={16}
                />
              ) : (
                <ChevronRight
                  size={16}
                />
              )
            ) : (
              <span className="h-4 w-4" />
            )}
          </button>

          {/* SELECT */}

          <button
            type="button"
            disabled={
              nodeDisabled
            }
            onClick={() =>
              handleSelect(node)
            }
            className="
              flex
              min-w-0
              flex-1
              items-center
              gap-2
              text-left
            "
          >
            {/* MULTIPLE */}

            {multiple && (
              <span
                className={`
                  flex
                  h-5
                  w-5
                  shrink-0
                  items-center
                  justify-center
                  rounded
                  border

                  ${
                    state.checked ||
                    state.partial
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
                {state.partial ? (
                  <Minus
                    size={13}
                    strokeWidth={3}
                  />
                ) : state.checked ? (
                  <Check
                    size={13}
                    strokeWidth={3}
                  />
                ) : null}
              </span>
            )}

            {/* SINGLE */}

            {!multiple && (
              <span
                className={`
                  flex
                  h-5
                  w-5
                  shrink-0
                  items-center
                  justify-center
                  rounded-full
                  border

                  ${
                    isSelected(
                      node.value,
                    )
                      ? `
                        border-ikbs-primary
                      `
                      : `
                        border-ikbs-border
                      `
                  }
                `}
              >
                {isSelected(
                  node.value,
                ) && (
                  <span
                    className="
                      h-2.5
                      w-2.5
                      rounded-full
                      bg-ikbs-primary
                    "
                  />
                )}
              </span>
            )}

            <span
              className={`
                truncate
                text-sm

                ${
                  isSelected(
                    node.value,
                  )
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
              {node.label}
            </span>
          </button>
        </div>

        {/* CHILDREN */}

        {hasChildren &&
          isExpanded && (
            <div>
              {node.children?.map(
                (child) =>
                  renderNode(
                    child,
                    level + 1,
                  ),
              )}
            </div>
          )}
      </div>
    );
  };

  return (
    <fieldset
      className="
        w-full
        space-y-2
      "
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

      {/* TREE */}

      <div
        id={`tree-${name}`}
        className={`
          rounded-lg
          border
          bg-ikbs-card
          p-2

          ${
            error
              ? "border-red-500"
              : "border-ikbs-border"
          }
        `}
      >
        {nodes.length > 0 ? (
          nodes.map((node) =>
            renderNode(node),
          )
        ) : (
          <div
            className="
              px-3
              py-4
              text-sm
              text-ikbs-muted
            "
          >
            Aucun élément
          </div>
        )}
      </div>

      {/* ERROR */}

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

