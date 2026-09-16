"use client";

import type { ReactNode } from "react";
import { X } from "lucide-react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  closeOnOverlayClick?: boolean;
  showCloseButton?: boolean;
}

const sizeClasses = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
};

export default function Modal({
  open,
  onClose,
  title,
  children,
  size = "md",
  closeOnOverlayClick = false,
  showCloseButton = true,
}: ModalProps) {
  if (!open) {
    return null;
  }

  const handleOverlayClick = () => {
    if (closeOnOverlayClick) {
      onClose();
    }
  };

  return (
    <div
      className="
        fixed
        inset-0
        z-50
        flex
        items-center
        justify-center
        p-4
      "
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? "modal-title" : undefined}
    >
      {/* Overlay */}
      <div
        className="
          absolute
          inset-0
          bg-black/50
          backdrop-blur-sm
        "
        onClick={handleOverlayClick}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        className={`
          relative
          w-full
          ${sizeClasses[size]}
          max-h-[90vh]
          overflow-hidden
          rounded-xl
          border
          border-ikbs-border
          bg-ikbs-card
          shadow-xl
        `}
        onClick={(event) => {
          event.stopPropagation();
        }}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div
            className="
              flex
              items-center
              justify-between
              border-b
              border-ikbs-border
              px-5
              py-4
            "
          >
            {title ? (
              <h2
                id="modal-title"
                className="
                  text-lg
                  font-semibold
                  text-foreground
                "
              >
                {title}
              </h2>
            ) : (
              <span />
            )}

            {showCloseButton && (
              <button
                type="button"
                onClick={onClose}
                className="
                  inline-flex
                  h-9
                  w-9
                  items-center
                  justify-center
                  rounded-lg
                  text-ikbs-muted
                  transition
                  hover:bg-ikbs-primary/10
                  hover:text-foreground
                  focus:outline-none
                  focus:ring-2
                  focus:ring-ikbs-primary/30
                "
                aria-label="Fermer"
                title="Fermer"
              >
                <X size={18} />
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div className="max-h-[calc(90vh-73px)] overflow-y-auto p-5">
          {children}
        </div>
      </div>
    </div>
  );
}