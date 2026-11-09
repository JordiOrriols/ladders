import React, { type ReactNode } from "react";
import { FormField } from "@jordiorriols/ui";
import { Input } from "@/components/ui/input";

export type MemberProfileLabels = {
  personalTitle: string;
  nameLabel: string;
  roleLabel: string;
  namePlaceholder: string;
  rolePlaceholder: string;
};
export function MemberProfileFields({
  name,
  role,
  onNameChange,
  onRoleChange,
  labels,
  readOnly = false,
  children,
}: {
  name: string;
  role: string;
  onNameChange: (value: string) => void;
  onRoleChange: (value: string) => void;
  labels: MemberProfileLabels;
  readOnly?: boolean;
  children?: ReactNode;
}) {
  return (
    <div
      className="bg-white rounded-2xl border border-slate-200 p-6"
      data-testid="assessment-profile"
    >
      <h2 className="text-lg font-semibold text-slate-800 mb-4">{labels.personalTitle}</h2>
      <div className="space-y-4">
        <FormField id="name" label={labels.nameLabel} className="space-y-1">
          {(field) => (
            <Input
              {...field}
              data-testid="assessment-name"
              value={name}
              readOnly={readOnly}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder={labels.namePlaceholder}
            />
          )}
        </FormField>
        <FormField id="role" label={labels.roleLabel} className="space-y-1">
          {(field) => (
            <Input
              {...field}
              data-testid="assessment-role"
              value={role}
              readOnly={readOnly}
              onChange={(e) => onRoleChange(e.target.value)}
              placeholder={labels.rolePlaceholder}
            />
          )}
        </FormField>
        {children}
      </div>
    </div>
  );
}
