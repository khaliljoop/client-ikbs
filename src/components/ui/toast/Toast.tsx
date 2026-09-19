"use client";

import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Info,
  X,
} from "lucide-react";

import {
  useEffect,
} from "react";

import type {
  ToastItem,
} from "./types";

interface ToastProps {
  toast: ToastItem;

  onClose: (
    id: string,
  ) => void;
}

export default function Toast({
  toast,
  onClose,
}: ToastProps) {
  useEffect(() => {
    if (
      !toast.duration ||
      toast.duration <= 0
    ) {
      return;
    }

    const timeout =
      window.setTimeout(
        () => {
          onClose(toast.id);
        },
        toast.duration,
      );

    return () => {
      window.clearTimeout(
        timeout,
      );
    };
  }, [
    toast.id,
    toast.duration,
    onClose,
  ]);

  const config = {
    success: {
      icon: CheckCircle2,
      className:
        "border-green-500/30 bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300",
    },

    error: {
      icon: AlertCircle,
      className:
        "border-red-500/30 bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300",
    },

    warning: {
      icon: AlertTriangle,
      className:
        "border-amber-500/30 bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
    },

    info: {
      icon: Info,
      className:
        "border-ikbs-primary/30 bg-ikbs-primary/10 text-ikbs-primary",
    },
  };

  const {
    icon: Icon,
    className,
  } = config[toast.type];

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
        shadow-lg
        ${className}
      `}
    >
      <Icon
        size={20}
        className="mt-0.5 shrink-0"
      />

      <div className="min-w-0 flex-1">
        {toast.title && (
          <p className="font-semibold">
            {toast.title}
          </p>
        )}

        <p className="text-sm">
          {toast.message}
        </p>
      </div>

      <button
        type="button"
        onClick={() =>
          onClose(toast.id)
        }
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
    </div>
  );
}