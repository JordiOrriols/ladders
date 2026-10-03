import React from "react";
import { Plus, Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button, EmptyState } from "@jordiorriols/ui";

export function EmptyTeamState({ onAddMember }: { onAddMember: () => void }) {
  const { t } = useTranslation();
  return (
    <EmptyState
      icon={<Users className="w-8 h-8 text-slate-400" />}
      title={t("teamView.empty")}
      description={t("teamView.emptyDescription")}
      action={
        <Button
          eventId="empty_team_add_member"
          data-testid="add-member-button"
          onClick={onAddMember}
        >
          <Plus className="w-4 h-4 mr-2" />
          {t("teamView.addFirst")}
        </Button>
      }
    />
  );
}
