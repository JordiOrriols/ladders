import React, { useState } from "react";
import { AlertModal } from "@jordiorriols/ui";
import { Calendar, Eye, Share2, UserRound, Users } from "@jordiorriols/ui/icons";
import { useTranslation } from "react-i18next";
import type { TeamMember } from "@/types";
import {
  buildShareLink,
  buildVacationLink,
  copyToClipboard,
  PlannerUrlError,
} from "@/utils/sharing";
import { SplitButton } from "./SplitButton";

type ShareKind = "self" | "peer" | "view" | "vacations";

type Props = {
  member: Pick<TeamMember, "selfToken" | "peerToken"> &
    Partial<Pick<TeamMember, "viewToken" | "viewEnabled" | "vacationToken">>;
  onEnableView?: () => Promise<void>;
};

export function ShareAction({ member, onEnableView }: Props) {
  const { t } = useTranslation();
  const [message, setMessage] = useState<string | null>(null);

  const copy = async (kind: ShareKind) => {
    const token =
      kind === "self"
        ? member.selfToken
        : kind === "peer"
          ? member.peerToken
          : kind === "view"
            ? member.viewToken
            : member.vacationToken;
    if (!token) return;

    try {
      if (kind === "view" && !member.viewEnabled) {
        if (!onEnableView) return;
        await onEnableView();
      }
      await copyToClipboard(
        kind === "vacations"
          ? buildVacationLink(token)
          : buildShareLink(`${kind === "view" ? "v" : "e"}/${token}`)
      );
      setMessage(t("alerts.linkCopied"));
    } catch (error) {
      console.error("Failed to copy share link", error);
      setMessage(
        t(
          error instanceof PlannerUrlError
            ? "share.vacations.configurationError"
            : "alerts.failedToCopyLink"
        )
      );
    }
  };

  return (
    <>
      <SplitButton
        label={t("share.action")}
        icon={<Share2 className="h-4 w-4" />}
        eventId="member_share_self"
        onClick={() => void copy("self")}
        menuLabel={t("share.menuLabel")}
        variant="outline"
        menuModal={false}
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
          ...(member.viewToken
            ? [
                {
                  label: t("share.view.label"),
                  icon: <Eye className="h-4 w-4" />,
                  eventId: "member_share_view",
                  onSelect: () => void copy("view"),
                },
              ]
            : []),
          ...(member.vacationToken
            ? [
                {
                  label: t("share.vacations.label"),
                  icon: <Calendar className="h-4 w-4" />,
                  eventId: "member_share_vacations",
                  onSelect: () => void copy("vacations"),
                },
              ]
            : []),
        ]}
      />
      <AlertModal
        isOpen={message !== null}
        title={t("alerts.notice")}
        description={message ?? ""}
        closeLabel={t("buttons.close")}
        onClose={() => setMessage(null)}
      />
    </>
  );
}
