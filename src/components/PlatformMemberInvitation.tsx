import React, { useEffect, useState } from "react";
import { Button, FormField, Input } from "@jordiorriols/ui";
import { useAsyncAction } from "@jordiorriols/ui/hooks";
import { useTranslation } from "react-i18next";
import { platformRepository, type MemberAccountLink } from "../data/platform";
import { ConfirmDialog } from "./molecules/ConfirmDialog";
import { localizeError } from "../utils/localizeError";

export function PlatformMemberInvitation({
  workspace,
  member,
}: {
  workspace: string;
  member: string;
}) {
  const { t } = useTranslation();
  const [link, setLink] = useState<MemberAccountLink>();
  const [error, setError] = useState<unknown>();
  const [recipient, setRecipient] = useState("");
  const [confirm, setConfirm] = useState(false);
  const action = useAsyncAction();
  useEffect(() => {
    let active = true;
    setLink(undefined);
    setError(undefined);
    void platformRepository.memberAccountLink(workspace, member).then(
      (link) => {
        if (active) setLink(link);
      },
      (error: unknown) => {
        if (active) setError(error);
      }
    );
    return () => {
      active = false;
    };
  }, [workspace, member]);
  return (
    <section aria-label={t("platform.memberInvitation")} className="space-y-3">
      <h3 className="font-semibold">{t("platform.memberInvitation")}</h3>
      {error ? (
        <p role="alert">{localizeError(error, t)}</p>
      ) : !link ? (
        <p>{t("pageMessage.loading")}</p>
      ) : link.linked ? (
        <Button disabled={action.busy} onClick={() => setConfirm(true)}>
          {t("platform.unlinkMember")}
        </Button>
      ) : (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (action.busy) return;
            void action.run(async () => {
              setLink(await platformRepository.inviteMember(workspace, member, recipient.trim()));
              setRecipient("");
            });
          }}
        >
          <FormField id="member-recipient" label={t("platform.recipientId")}>
            {(field) => (
              <Input
                {...field}
                required
                pattern="[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}"
                value={recipient}
                onChange={(event) => setRecipient(event.target.value)}
              />
            )}
          </FormField>
          <p>{t("platform.invitationHint")}</p>
          <Button type="submit" disabled={!recipient.trim() || action.busy}>
            {t("platform.inviteMember")}
          </Button>
          {link.invited && (
            <>
              <p role="status">{t("platform.invitationPending")}</p>
              <Button
                type="button"
                disabled={action.busy}
                onClick={() =>
                  void action.run(async () => {
                    setLink(await platformRepository.revokeMemberInvitation(workspace, member));
                  })
                }
              >
                {t("platform.revokeInvitation")}
              </Button>
            </>
          )}
        </form>
      )}
      {action.error && <p role="alert">{localizeError(action.error, t)}</p>}
      <ConfirmDialog
        isOpen={confirm}
        onCancel={() => setConfirm(false)}
        title={t("platform.unlinkMember")}
        description={t("platform.unlinkHint")}
        confirmLabel={t("platform.unlinkMember")}
        onConfirm={() => {
          if (!action.busy)
            void action.run(async () => {
              setLink(await platformRepository.unlinkMember(workspace, member));
              setConfirm(false);
            });
        }}
      />
    </section>
  );
}
