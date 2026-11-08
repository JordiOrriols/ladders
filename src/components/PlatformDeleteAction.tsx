import React, { useState } from "react";
import { Button } from "@jordiorriols/ui";
import { useAsyncAction } from "@jordiorriols/ui/hooks";
import { useTranslation } from "react-i18next";
import { ConfirmDialog } from "./molecules/ConfirmDialog";
import { localizeError } from "../utils/localizeError";

export function PlatformDeleteAction({
  name,
  kind,
  disabled = false,
  onDelete,
}: {
  name: string;
  kind: "member" | "team";
  disabled?: boolean;
  onDelete: () => Promise<void>;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const action = useAsyncAction();
  return (
    <>
      <Button
        type="button"
        variant="destructive"
        disabled={disabled || action.busy}
        aria-label={t("platform.deleteName", { name })}
        onClick={() => {
          action.reset();
          setOpen(true);
        }}
      >
        {t(kind === "team" ? "teams.delete" : "buttons.delete")}
      </Button>
      <ConfirmDialog
        isOpen={open}
        onCancel={() => {
          if (!action.busy) setOpen(false);
        }}
        onConfirm={() => {
          if (action.busy) return;
          setOpen(false);
          void action.run(onDelete);
        }}
        {...(kind === "team"
          ? {
              title: t("teams.deleteTitle"),
              description: t("teams.deleteDescription"),
              confirmLabel: t("teams.delete"),
            }
          : {})}
      />
      {action.error && (
        <p role="alert" className="text-destructive">
          {localizeError(action.error, t)}
        </p>
      )}
    </>
  );
}
