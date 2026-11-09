import React, { useState } from "react";
import { Button } from "@jordiorriols/ui";
import { useAsyncAction } from "@jordiorriols/ui/hooks";
import { useTranslation } from "react-i18next";
import { platformRepository, type PlatformRoster } from "../data/platform";
import { MemberProfileFields } from "./molecules/MemberProfileFields";
import { PlanningRoleField } from "./molecules/PlanningRoleField";
import { TemplatePanel } from "./molecules/TemplatePanel";
import { PlatformDeleteAction } from "./PlatformDeleteAction";

export function PlatformMemberProfile({
  workspace,
  member,
  editable,
  onSaved,
  onDeleted,
  createTeam,
  onCreated,
}: {
  workspace: string;
  member: PlatformRoster["members"][number];
  editable: boolean;
  onSaved: () => void;
  onDeleted?: () => void;
  createTeam?: string;
  onCreated?: (id: string) => void;
}) {
  const { t } = useTranslation();
  const [profile, setProfile] = useState(member);
  const action = useAsyncAction();
  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        if (!editable || action.busy) return;
        void action.run(async () => {
          if (createTeam && onCreated) {
            onCreated(await platformRepository.createMember(workspace, createTeam, profile));
          } else {
            await platformRepository.saveProfile(workspace, member.id, profile);
            onSaved();
          }
        });
      }}
    >
      <fieldset disabled={action.busy} className="space-y-4">
        <MemberProfileFields
          name={profile.name}
          role={profile.role}
          readOnly={!editable}
          onNameChange={(name) => setProfile((value) => ({ ...value, name }))}
          onRoleChange={(role) => setProfile((value) => ({ ...value, role }))}
          labels={{
            personalTitle: t("platform.profile"),
            nameLabel: t("forms.name"),
            roleLabel: t("forms.role"),
            namePlaceholder: t("forms.memberNamePlaceholder"),
            rolePlaceholder: t("forms.rolePlaceholder"),
          }}
        >
          {editable ? (
            <PlanningRoleField
              value={profile.planning_role}
              onChange={(planning_role) => setProfile((value) => ({ ...value, planning_role }))}
            />
          ) : (
            <p>
              {t("planningRole.label")}:{" "}
              {profile.planning_role
                ? t(`planningRole.options.${profile.planning_role}`)
                : t("planningRole.none")}
            </p>
          )}
          <TemplatePanel
            templateId={profile.template_id}
            {...(editable
              ? {
                  onChange: (template_id: string | null) =>
                    setProfile((value) => ({ ...value, template_id })),
                }
              : {})}
          />
        </MemberProfileFields>
        {editable && <Button type="submit">{t("buttons.save")}</Button>}
      </fieldset>
      {action.error && (
        <p role="alert" className="text-destructive">
          {action.error}
        </p>
      )}
      {onDeleted && (
        <PlatformDeleteAction
          kind="member"
          name={member.name}
          disabled={action.busy}
          onDelete={async () => {
            await platformRepository.deleteMember(workspace, member.id);
            onDeleted();
          }}
        />
      )}
    </form>
  );
}
