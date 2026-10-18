import React, { useState } from "react";
import { AlertModal } from "@jordiorriols/ui";
import { Calendar, Eye, Link2, Share2, Unlink, UserRound, Users } from "@jordiorriols/ui/icons";
import { useTranslation } from "react-i18next";
import type { TeamMember } from "@/types";
import { buildShareLink, buildVacationLink, copyToClipboard } from "@/utils/sharing";
import { SplitButton } from "./SplitButton";

type ShareKind = "self" | "peer" | "view" | "vacations";

type Props = {
  member: Pick<TeamMember, "selfToken" | "peerToken"> &
    Partial<Pick<TeamMember, "viewToken" | "viewEnabled" | "vacationToken" | "linked">>;
  onEnableView?: () => Promise<void>;
  /** Creates the one-time invite that links the person's account to this member. */
  onCreateInvite?: () => Promise<string>;
  onUnlink?: () => Promise<void>;
};

export function ShareAction({ member, onEnableView, onCreateInvite, onUnlink }: Props) {
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
      setMessage(t("alerts.failedToCopyLink"));
    }
  };

  const copyInvite = async () => {
    if (!onCreateInvite) return;
    try {
      await copyToClipboard(buildShareLink(`join/${await onCreateInvite()}`));
      setMessage(t("share.account.copied"));
    } catch (error) {
      console.error("Failed to create account invite", error);
      setMessage(t("share.account.failed"));
    }
  };

  const unlink = async () => {
    if (!onUnlink) return;
    try {
      await onUnlink();
      setMessage(t("share.account.unlinked"));
    } catch (error) {
      console.error("Failed to unlink account", error);
      setMessage(t("share.account.failed"));
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
          ...(!member.linked && onCreateInvite
            ? [
                {
                  label: t("share.account.invite"),
                  icon: <Link2 className="h-4 w-4" />,
                  eventId: "member_share_account_invite",
                  onSelect: () => void copyInvite(),
                },
              ]
            : []),
          ...(member.linked && onUnlink
            ? [
                {
                  label: t("share.account.unlink"),
                  icon: <Unlink className="h-4 w-4" />,
                  eventId: "member_share_account_unlink",
                  onSelect: () => void unlink(),
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
