import React from "react";
import { useTranslation } from "react-i18next";
import { NameDialog } from "@jordiorriols/ui";
import { useNameForm } from "@jordiorriols/ui/hooks";

export function CreateTeamDialog({
  isOpen,
  onClose,
  onCreate,
  initialName,
}: {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string) => Promise<void>;
  initialName?: string;
}) {
  const { t } = useTranslation();
  const renaming = initialName !== undefined;
  const form = useNameForm({
    isOpen,
    ...(initialName !== undefined ? { initialName } : {}),
    onClose,
    onSubmit: onCreate,
  });
  return (
    <NameDialog
      isOpen={isOpen}
      onClose={onClose}
      form={form}
      eventId={renaming ? "team_rename" : "team_create"}
      labels={{
        title: t(renaming ? "teams.renameTitle" : "teams.createTitle"),
        description: t(renaming ? "teams.renameDescription" : "teams.createDescription"),
        name: t("teams.name"),
        cancel: t("buttons.cancel"),
        submit: t(renaming ? "teams.rename" : "teams.create"),
      }}
    />
  );
}
