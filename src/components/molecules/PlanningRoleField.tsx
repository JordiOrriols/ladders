import React from "react";
import { useTranslation } from "react-i18next";
import { PLANNING_ROLES, type PlanningRole } from "@/types";
import { Label } from "../ui/label";
import { SelectField } from "@jordiorriols/ui";

type Props = {
  value: PlanningRole | null;
  onChange: (role: PlanningRole | null) => void;
};

export function PlanningRoleField({ value, onChange }: Props) {
  const { t } = useTranslation();
  return (
    <div className="space-y-1">
      <Label htmlFor="planning-role">{t("planningRole.label")}</Label>
      <SelectField
        id="planning-role"
        data-testid="assessment-planning-role"
        value={value ?? ""}
        onValueChange={(value) => onChange(PLANNING_ROLES.find((role) => role === value) ?? null)}
        aria-describedby="planning-role-hint"
        options={[
          { value: "", label: t("planningRole.none") },
          ...PLANNING_ROLES.map((role) => ({
            value: role,
            label: t(`planningRole.options.${role}`),
          })),
        ]}
      />
      <p id="planning-role-hint" className="text-xs text-slate-500">
        {t("planningRole.hint")}
      </p>
    </div>
  );
}
