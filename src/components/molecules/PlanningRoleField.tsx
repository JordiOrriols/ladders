import React from "react";
import { useTranslation } from "react-i18next";
import { PLANNING_ROLES, type PlanningRole } from "@/types";
import { FormField, SelectField } from "@jordiorriols/ui";

type Props = {
  value: PlanningRole | null;
  onChange: (role: PlanningRole | null) => void;
};

export function PlanningRoleField({ value, onChange }: Props) {
  const { t } = useTranslation();
  return (
    <FormField
      id="planning-role"
      label={t("planningRole.label")}
      description={t("planningRole.hint")}
      className="space-y-1"
    >
      {(field) => (
        <SelectField
          {...field}
          data-testid="assessment-planning-role"
          value={value ?? ""}
          onValueChange={(value) => onChange(PLANNING_ROLES.find((role) => role === value) ?? null)}
          options={[
            { value: "", label: t("planningRole.none") },
            ...PLANNING_ROLES.map((role) => ({
              value: role,
              label: t(`planningRole.options.${role}`),
            })),
          ]}
        />
      )}
    </FormField>
  );
}
