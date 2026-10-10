import React from "react";
import { useTranslation } from "react-i18next";
import { PLANNING_ROLES, type PlanningRole } from "@/types";
import { Label } from "../ui/label";

type Props = {
  value: PlanningRole | null;
  onChange: (role: PlanningRole | null) => void;
};

export function PlanningRoleField({ value, onChange }: Props) {
  const { t } = useTranslation();
  return (
    <div className="space-y-1">
      <Label htmlFor="planning-role">{t("planningRole.label")}</Label>
      <select
        id="planning-role"
        data-testid="assessment-planning-role"
        value={value ?? ""}
        onChange={(event) =>
          onChange(PLANNING_ROLES.find((role) => role === event.target.value) ?? null)
        }
        aria-describedby="planning-role-hint"
        className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
      >
        <option value="">{t("planningRole.none")}</option>
        {PLANNING_ROLES.map((role) => (
          <option key={role} value={role}>
            {t(`planningRole.options.${role}`)}
          </option>
        ))}
      </select>
      <p id="planning-role-hint" className="text-xs text-slate-500">
        {t("planningRole.hint")}
      </p>
    </div>
  );
}
