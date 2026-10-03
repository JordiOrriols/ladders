import React from "react";
import { useTranslation } from "react-i18next";
import { ConfirmDialog as ConfirmDialogView } from "@jordiorriols/ui";

interface ConfirmDialogProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title?: string;
  description?: string;
  confirmLabel?: string;
}

export function ConfirmDialog({ title, description, confirmLabel, ...props }: ConfirmDialogProps) {
  const { t } = useTranslation();
  return (
    <ConfirmDialogView
      {...props}
      title={title ?? t("deleteDialog.title")}
      description={description ?? t("deleteDialog.description")}
      confirmLabel={confirmLabel ?? t("buttons.delete")}
      cancelLabel={t("buttons.cancel")}
    />
  );
}
