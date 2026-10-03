import React from "react";
import { Plus, User } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button, EmptyState } from "@jordiorriols/ui";

export function EmptyIndividualState({ onAddMember }: { onAddMember: () => void }) {
  const { t } = useTranslation();
  return (
    <EmptyState
      icon={<User className="w-8 h-8 text-slate-400" />}
      title={t("individualView.empty")}
      description={t("individualView.emptyDescription")}
      action={
        <Button eventId="empty_individual_add_member" onClick={onAddMember}>
          <Plus className="w-4 h-4 mr-2" />
          {t("buttons.add")}
        </Button>
      }
    />
  );
}
