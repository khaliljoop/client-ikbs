"use client";

import { Loader2, TriangleAlert } from "lucide-react";

import Modal from "./Modal";

interface ConfirmModalProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  danger?: boolean;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
}

export default function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = "Confirmer",
  cancelLabel = "Annuler",
  loading = false,
  danger = false,
  onConfirm,
  onClose,
}: ConfirmModalProps) {
  const handleConfirm = async () => {
    await onConfirm();
  };

  return (
    <Modal
      open={open}
      title={title}
      onClose={() => {
        if (!loading) {
          onClose();
        }
      }}
      size="sm"
      closeOnOverlayClick={false}
    >
      <div className="space-y-5">
        <div className="flex gap-3">
          <div
            className={`
              flex h-10 w-10 shrink-0 items-center
              justify-center rounded-full
              ${
                danger
                  ? "bg-red-500/10 text-red-500"
                  : "bg-ikbs-primary/10 text-ikbs-primary"
              }
            `}
          >
            <TriangleAlert size={20} />
          </div>

          <p className="pt-1 text-sm leading-6 text-ikbs-muted">
            {message}
          </p>
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            disabled={loading}
            onClick={onClose}
            className="
              rounded-lg border border-ikbs-border
              px-4 py-2 text-sm font-medium
              text-foreground transition
              hover:bg-ikbs-primary/5
              disabled:cursor-not-allowed
              disabled:opacity-50
            "
          >
            {cancelLabel}
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={() => void handleConfirm()}
            className={`
              inline-flex items-center gap-2
              rounded-lg px-4 py-2
              text-sm font-medium text-white
              transition
              disabled:cursor-not-allowed
              disabled:opacity-50
              ${
                danger
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-ikbs-primary hover:opacity-90"
              }
            `}
          >
            {loading && (
              <Loader2
                size={16}
                className="animate-spin"
              />
            )}

            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}