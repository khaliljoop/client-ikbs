"use client";

import Toast from "./Toast";

import type {
  ToastItem,
} from "./types";

interface ToastContainerProps {
  toasts: ToastItem[];

  onRemove: (
    id: string,
  ) => void;
}

export default function ToastContainer({
  toasts,
  onRemove,
}: ToastContainerProps) {
  return (
    <div
      className="
        pointer-events-none
        fixed
        right-4
        top-4
        z-[100]
        flex
        w-[calc(100%-2rem)]
        max-w-sm
        flex-col
        gap-3
      "
      aria-live="polite"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto"
        >
          <Toast
            toast={toast}
            onClose={onRemove}
          />
        </div>
      ))}
    </div>
  );
}