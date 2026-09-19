import type {
  DynamicFormField,
  FormValues,
  FormErrors
} from "@/components/ui/forms/DynamicForm";

import type {
  Organization,
} from "@/types/organization";
import type {
  CreateOrganizationInput,
  UpdateOrganizationInput,
} from "@/lib/api/organizations";



/**
 * Configuration des champs du formulaire Organization.
 *
 * Cette configuration pourra être utilisée aussi bien
 * pour la création que pour la modification.
 */
export const organizationFormFields: DynamicFormField[] = [
  {
    type: "input",
    name: "name",
    label: "Nom de l'organisation",
    placeholder: "Ex : Association Espoir",
    required: true,
  },

  {
    type: "input",
    name: "email",
    label: "Email",
    inputType: "email",
    placeholder: "contact@organisation.sn",
  },

  {
    type: "input",
    name: "phone",
    label: "Téléphone",
    inputType: "tel",
    placeholder: "+221 77 000 00 00",
  },

  {
    type: "input",
    name: "address",
    label: "Adresse",
    placeholder: "Ex : Dakar, Sénégal",
  },

  {
    type: "input",
    name: "logoUrl",
    label: "URL du logo",
    inputType: "url",
    placeholder: "https://...",
    className: "md:col-span-2",
  },

  {
  type: "textarea",
  name: "description",
  label: "Description",
  placeholder:
    "Présentez brièvement l'organisation...",
  rows: 4,
  maxLength: 1000,
  className: "md:col-span-2",
},
];

/**
 * Valeurs initiales utilisées lors d'une création.
 */
export function createEmptyOrganizationFormValues(): FormValues {
  return {
    name: "",
    description: "",
    email: "",
    phone: "",
    address: "",
    logoUrl: "",
  };
}

/**
 * Transforme une Organization venant de l'API
 * en valeurs exploitables par DynamicForm.
 */
export function organizationToFormValues(
  organization: Organization,
): FormValues {
  return {
    name: organization.name ?? "",
    description: organization.description ?? "",
    email: organization.email ?? "",
    phone: organization.phone ?? "",
    address: organization.address ?? "",
    logoUrl: organization.logoUrl ?? "",
  };
}

function getStringValue(
  values: FormValues,
  key: string,
): string {
  const value = values[key];

  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

function optionalString(
  value: string,
): string | undefined {
  return value || undefined;
}

export function organizationFormToCreateInput(
  values: FormValues,
): CreateOrganizationInput {
  return {
    name: getStringValue(
      values,
      "name",
    ),

    description: optionalString(
      getStringValue(
        values,
        "description",
      ),
    ),

    email: optionalString(
      getStringValue(
        values,
        "email",
      ),
    ),

    phone: optionalString(
      getStringValue(
        values,
        "phone",
      ),
    ),

    address: optionalString(
      getStringValue(
        values,
        "address",
      ),
    ),

    logoUrl: optionalString(
      getStringValue(
        values,
        "logoUrl",
      ),
    ),
  };
}

export function organizationFormToUpdateInput(
  values: FormValues,
): UpdateOrganizationInput {
  return organizationFormToCreateInput(
    values,
  );
}

export function validateOrganizationForm(
  values: FormValues,
): FormErrors {
  const errors: FormErrors = {};

  const name = getStringValue(
    values,
    "name",
  );

  const email = getStringValue(
    values,
    "email",
  );

  if (!name) {
    errors.name =
      "Le nom de l'organisation est obligatoire.";
  }

  if (email) {
    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      errors.email =
        "L'adresse email n'est pas valide.";
    }
  }

  return errors;
}