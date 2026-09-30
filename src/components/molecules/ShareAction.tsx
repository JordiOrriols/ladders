import React from "react";
import { Eye, Share2, UserRound, Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { TeamMember } from "@/types";
import { buildShareLink, copyToClipboard } from "@/utils/sharing";
import { SplitButton } from "./SplitButton";

type ShareKind = "self" | "peer" | "view";

type Props = {
  member: TeamMember;
  onEnableView: () => Promise<void>;
};

export function ShareAction({ member, onEnableView }: Props) {
  const { t } = useTranslation();

  const copy = async (kind: ShareKind) => {
    const token =
      kind === "self" ? member.selfToken : kind === "peer" ? member.peerToken : member.viewToken;
    if (!token) return;

    try {
      if (kind === "view" && !member.viewEnabled) await onEnableView();
      await copyToClipboard(buildShareLink(`${kind === "view" ? "v" : "e"}/${token}`));
      alert(t("alerts.linkCopied"));
    } catch (error) {
      console.error("Failed to copy share link", error);
      alert(t("alerts.failedToCopyLink"));
    }
  };

  return (
    <SplitButton
      label={t("share.action")}
      icon={<Share2 className="h-4 w-4" />}
      eventId="member_share_self"
      onClick={() => void copy("self")}
      menuLabel={t("share.menuLabel")}
      variant="outline"
      items={[
        {
          label: t("share.self.label"),
          icon: <UserRound className="h-4 w-4" />,
          eventId: "member_share_self_menu",
          onSelect: () => void copy("self"),
        },
        {
          label: t("share.peer.label"),
          icon: <Users className="h-4 w-4" />,
          eventId: "member_share_peer",
          onSelect: () => void copy("peer"),
        },
        {
          label: t("share.view.label"),
          icon: <Eye className="h-4 w-4" />,
          eventId: "member_share_view",
          onSelect: () => void copy("view"),
        },
      ]}
    />
  );
}
