"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";


import type {
  ToastItem,
  ToastType,
} from "./types";
import ToastContainer from "./ToastContainer";

interface ShowToastOptions {
  type?: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

interface ToastContextValue {
  showToast: (
    options: ShowToastOptions,
  ) => void;

  success: (
    message: string,
    title?: string,
  ) => void;

  error: (
    message: string,
    title?: string,
  ) => void;

  warning: (
    message: string,
    title?: string,
  ) => void;

  info: (
    message: string,
    title?: string,
  ) => void;
}

const ToastContext =
  createContext<ToastContextValue | null>(
    null,
  );

interface ToastProviderProps {
  children: ReactNode;
}

export default function ToastProvider({
  children,
}: ToastProviderProps) {
  const [toasts, setToasts] =
    useState<ToastItem[]>([]);

  const removeToast = useCallback(
    (id: string) => {
      setToasts((current) =>
        current.filter(
          (toast) =>
            toast.id !== id,
        ),
      );
    },
    [],
  );

  const showToast = useCallback(
    ({
      type = "info",
      title,
      message,
      duration = 4000,
    }: ShowToastOptions) => {
      const id =
        crypto.randomUUID();

      const toast: ToastItem = {
        id,
        type,
        title,
        message,
        duration,
      };

      setToasts((current) => [
        ...current,
        toast,
      ]);
    },
    [],
  );

  const value =
    useMemo<ToastContextValue>(
      () => ({
        showToast,

        success: (
          message,
          title,
        ) => {
          showToast({
            type: "success",
            title,
            message,
          });
        },

        error: (
          message,
          title,
        ) => {
          showToast({
            type: "error",
            title,
            message,
          });
        },

        warning: (
          message,
          title,
        ) => {
          showToast({
            type: "warning",
            title,
            message,
          });
        },

        info: (
          message,
          title,
        ) => {
          showToast({
            type: "info",
            title,
            message,
          });
        },
      }),
      [showToast],
    );

  return (
    <ToastContext.Provider
      value={value}
    >
      {children}

      <ToastContainer
        toasts={toasts}
        onRemove={removeToast}
      />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context =
    useContext(ToastContext);

  if (!context) {
    throw new Error(
      "useToast doit être utilisé dans ToastProvider.",
    );
  }

  return context;
}