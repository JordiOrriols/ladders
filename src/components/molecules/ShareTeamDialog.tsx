import React from "react";
import { useTranslation } from "react-i18next";
import { ShareAccessDialog } from "@jordiorriols/ui";
import { useShareAccessForm } from "@jordiorriols/ui/hooks";
import type { SharedTeamAccess, Team, TeamShare } from "@/types";

interface Props {
  team: Team | null;
  shares: TeamShare[];
  isOpen: boolean;
  loading?: boolean;
  onClose: () => void;
  onShare: (email: string, access: SharedTeamAccess) => Promise<void>;
  onChangeAccess: (userId: string, access: SharedTeamAccess) => Promise<void>;
  onRemove: (userId: string) => Promise<void>;
}
export function ShareTeamDialog({
  team,
  shares,
  isOpen,
  loading = false,
  onClose,
  onShare,
  onChangeAccess,
  onRemove,
}: Props) {
  const { t } = useTranslation();
  const form = useShareAccessForm<SharedTeamAccess>({
    isOpen,
    initialAccess: "viewer",
    onShare,
    onChangeAccess,
    onRemove,
  });
  return (
    <ShareAccessDialog
      isOpen={isOpen}
      onClose={onClose}
      loading={loading}
      form={form}
      entries={shares.map((share) => ({
        id: share.userId,
        email: share.email,
        access: share.access,
      }))}
      options={[
        { value: "viewer", label: t("teams.viewer") },
        { value: "editor", label: t("teams.editor") },
      ]}
      labels={{
        title: t("teams.shareTitle", { name: team?.name ?? "" }),
        description: t("teams.shareDescription"),
        email: t("auth.email"),
        permission: t("teams.permission"),
        share: t("teams.share"),
        loading: t("pageMessage.loading"),
        empty: t("teams.noShares"),
        close: t("buttons.close"),
        permissionFor: (email) => t("teams.permissionFor", { email }),
        remove: (email) => t("teams.removeShare", { email }),
      }}
    />
  );
}
