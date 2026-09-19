import type {
  DynamicFormField,
  FormValues,
} from "@/components/ui/forms/DynamicForm";

import type {
  Organization,
} from "@/types/organization";

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