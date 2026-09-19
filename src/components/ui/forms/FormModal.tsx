"use client";

import type { FormEvent } from "react";
import { Loader2, Save, X } from "lucide-react";

import Modal from "@/components/ui/modal/Modal";

import DynamicForm, {
  type DynamicFormField,
  type FormErrors,
  type FormValue,
  type FormValues,
} from "./DynamicForm";

interface FormModalProps {
  open: boolean;
  title: string;

  fields: DynamicFormField[];

  values: FormValues;

  errors?: FormErrors;

  columns?: 1 | 2 | 3;

  loading?: boolean;

  submitLabel?: string;
  cancelLabel?: string;

  onChange: (
    name: string,
    value: FormValue,
  ) => void;

  onSubmit: () => void | Promise<void>;

  onClose: () => void;
}

export default function FormModal({
  open,
  title,
  fields,
  values,
  errors = {},
  columns = 1,
  loading = false,
  submitLabel = "Enregistrer",
  cancelLabel = "Annuler",
  onChange,
  onSubmit,
  onClose,
}: FormModalProps) {
  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (loading) {
      return;
    }

    await onSubmit();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="lg"
      closeOnOverlayClick={false}
    >
      <form
        onSubmit={handleSubmit}
        className="space-y-6"
      >
        {/* FORMULAIRE */}

        <DynamicForm
          fields={fields}
          values={values}
          errors={errors}
          columns={columns}
          onChange={onChange}
        />

        {/* ACTIONS */}

        <div
          className="
            flex
            flex-col-reverse
            gap-3
            border-t
            border-ikbs-border
            pt-5
            sm:flex-row
            sm:justify-end
          "
        >
          <button
            type="button"
            disabled={loading}
            onClick={onClose}
            className="
              inline-flex
              items-center
              justify-center
              gap-2
              rounded-lg
              border
              border-ikbs-border
              bg-ikbs-card
              px-4
              py-2.5
              text-sm
              font-medium
              text-foreground
              transition

              hover:border-ikbs-primary
              hover:bg-ikbs-primary/5

              disabled:cursor-not-allowed
              disabled:opacity-50
            "
          >
            <X size={16} />

            {cancelLabel}
          </button>

          <button
            type="submit"
            disabled={loading}
            className="
              inline-flex
              items-center
              justify-center
              gap-2
              rounded-lg
              bg-ikbs-primary
              px-4
              py-2.5
              text-sm
              font-medium
              text-white
              transition

              hover:opacity-90

              disabled:cursor-not-allowed
              disabled:opacity-60
            "
          >
            {loading ? (
              <Loader2
                size={16}
                className="animate-spin"
              />
            ) : (
              <Save size={16} />
            )}

            {loading
              ? "Enregistrement..."
              : submitLabel}
          </button>
        </div>
      </form>
    </Modal>
  );
}