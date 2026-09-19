"use client";

import type { ReactNode } from "react";

import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Info,
  X,
} from "lucide-react";

export type AlertType =
  | "success"
  | "error"
  | "warning"
  | "info";

interface AlertProps {
  type?: AlertType;

  title?: string;

  children: ReactNode;

  dismissible?: boolean;

  onClose?: () => void;
}

export default function Alert({
  type = "info",
  title,
  children,
  dismissible = false,
  onClose,
}: AlertProps) {
  const config = {
    success: {
      icon: CheckCircle2,
      className: `
        border-green-500/30
        bg-green-50
        text-green-700

        dark:bg-green-950/50
        dark:text-green-300
      `,
    },

    error: {
      icon: AlertCircle,
      className: `
        border-red-500/30
        bg-red-50
        text-red-700

        dark:bg-red-950/50
        dark:text-red-300
      `,
    },

    warning: {
      icon: AlertTriangle,
      className: `
        border-amber-500/30
        bg-amber-50
        text-amber-700

        dark:bg-amber-950/50
        dark:text-amber-300
      `,
    },

    info: {
      icon: Info,
      className: `
        border-ikbs-primary/30
        bg-ikbs-primary/10
        text-ikbs-primary
      `,
    },
  };

  const {
    icon: Icon,
    className,
  } = config[type];

  return (
    <div
      role="alert"
      className={`
        flex
        w-full
        items-start
        gap-3
        rounded-xl
        border
        p-4
        ${className}
      `}
    >
      {/* ICON */}

      <Icon
        size={20}
        className="
          mt-0.5
          shrink-0
        "
      />

      {/* CONTENT */}

      <div className="min-w-0 flex-1">
        {title && (
          <p
            className="
              mb-1
              font-semibold
            "
          >
            {title}
          </p>
        )}

        <div className="text-sm">
          {children}
        </div>
      </div>

      {/* CLOSE */}

      {dismissible && (
        <button
          type="button"
          onClick={onClose}
          className="
            inline-flex
            h-7
            w-7
            shrink-0
            items-center
            justify-center
            rounded-lg
            transition

            hover:bg-black/5
            dark:hover:bg-white/10
          "
          title="Fermer"
          aria-label="Fermer"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}