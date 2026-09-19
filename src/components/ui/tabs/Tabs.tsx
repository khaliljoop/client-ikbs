"use client";

import type { ReactNode } from "react";

export type TabValue = string | number;

export interface TabItem {
  value: TabValue;
  label: string;

  icon?: ReactNode;
  badge?: string | number;

  disabled?: boolean;

  content: ReactNode;
}

interface TabsProps {
  items: TabItem[];

  value: TabValue;

  onChange: (
    value: TabValue,
  ) => void;

  className?: string;
}

export default function Tabs({
  items,
  value,
  onChange,
  className = "",
}: TabsProps) {
  const valuesAreEqual = (
    first: TabValue,
    second: TabValue,
  ) => {
    return String(first) === String(second);
  };

  const activeTab =
    items.find((item) =>
      valuesAreEqual(
        item.value,
        value,
      ),
    );

  return (
    <div
      className={`
        w-full
        ${className}
      `}
    >
      {/* TAB NAVIGATION */}

      <div
        className="
          overflow-x-auto
          border-b
          border-ikbs-border
        "
      >
        <div
          role="tablist"
          className="
            flex
            min-w-max
            items-center
            gap-1
          "
        >
          {items.map((item) => {
            const active =
              valuesAreEqual(
                item.value,
                value,
              );

            return (
              <button
                key={String(item.value)}
                type="button"
                role="tab"
                aria-selected={active}
                disabled={item.disabled}
                onClick={() => {
                  if (!item.disabled) {
                    onChange(
                      item.value,
                    );
                  }
                }}
                className={`
                  relative
                  inline-flex
                  items-center
                  gap-2
                  whitespace-nowrap
                  px-4
                  py-3
                  text-sm
                  font-medium
                  transition

                  focus:outline-none
                  focus-visible:ring-2
                  focus-visible:ring-ikbs-primary/30

                  disabled:cursor-not-allowed
                  disabled:opacity-50

                  ${
                    active
                      ? `
                        text-ikbs-primary
                      `
                      : `
                        text-ikbs-muted
                        hover:text-foreground
                      `
                  }
                `}
              >
                {/* ICON */}

                {item.icon && (
                  <span
                    className="
                      flex
                      shrink-0
                      items-center
                      justify-center
                    "
                  >
                    {item.icon}
                  </span>
                )}

                {/* LABEL */}

                <span>
                  {item.label}
                </span>

                {/* BADGE */}

                {item.badge !==
                  undefined && (
                  <span
                    className={`
                      inline-flex
                      min-w-5
                      items-center
                      justify-center
                      rounded-full
                      px-1.5
                      py-0.5
                      text-xs
                      font-semibold

                      ${
                        active
                          ? `
                            bg-ikbs-primary
                            text-white
                          `
                          : `
                            bg-ikbs-primary/10
                            text-ikbs-primary
                          `
                      }
                    `}
                  >
                    {item.badge}
                  </span>
                )}

                {/* ACTIVE INDICATOR */}

                {active && (
                  <span
                    className="
                      absolute
                      bottom-0
                      left-0
                      h-0.5
                      w-full
                      rounded-full
                      bg-ikbs-primary
                    "
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* CONTENT */}

      <div
        role="tabpanel"
        className="pt-5"
      >
        {activeTab?.content}
      </div>
    </div>
  );
}