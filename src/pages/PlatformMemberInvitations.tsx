import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button, ErrorState } from "@jordiorriols/ui";
import { useAsyncAction } from "@jordiorriols/ui/hooks";
import { useTranslation } from "react-i18next";
import { platformRepository, type MemberInvitation } from "../data/platform";
import { PlatformLayout } from "../components/PlatformLayout";
import { localizeError } from "../utils/localizeError";

export default function PlatformMemberInvitations() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [data, setData] = useState<{ account: string; invitations: MemberInvitation[] }>();
  const [error, setError] = useState<unknown>();
  const [revision, setRevision] = useState(0);
  const action = useAsyncAction();
  useEffect(() => {
    let active = true;
    setData(undefined);
    setError(undefined);
    void Promise.all([
      platformRepository.myAccountId(),
      platformRepository.myMemberInvitations(),
    ]).then(
      ([account, invitations]) => {
        if (active) setData({ account, invitations });
      },
      (error: unknown) => {
        if (active) setError(error);
      }
    );
    return () => {
      active = false;
    };
  }, [revision]);
  return (
    <PlatformLayout>
      <Link to="/">{t("platform.workspaces")}</Link>
      <h2 className="text-2xl font-semibold">{t("platform.memberInvitation")}</h2>
      {error ? (
        <ErrorState
          message={localizeError(error, t)}
          retryLabel={t("errors.retry")}
          onRetry={() => setRevision((value) => value + 1)}
        />
      ) : !data ? (
        <p>{t("pageMessage.loading")}</p>
      ) : (
        <>
          <p>
            {t("platform.yourAccountId")}: <code data-testid="account-id">{data.account}</code>
          </p>
          <p>{t("platform.invitationAccess")}</p>
          {data.invitations.length === 0 && <p>{t("platform.noInvitations")}</p>}
          <ul className="space-y-4">
            {data.invitations.map((invite) => (
              <li key={invite.id} data-testid={`member-invite-${invite.id}`}>
                <h3>
                  {invite.workspace_name} - {invite.name}
                </h3>
                <Button
                  disabled={action.busy}
                  onClick={() =>
                    void action.run(async () => {
                      const member = await platformRepository.answerMemberInvitation(
                        invite.id,
                        true
                      );
                      navigate(`/me/members/${member}/evaluations`, { replace: true });
                    })
                  }
                >
                  {t("platform.acceptInvitation")}
                </Button>
                <Button
                  disabled={action.busy}
                  onClick={() =>
                    void action.run(async () => {
                      await platformRepository.answerMemberInvitation(invite.id, false);
                      setRevision((value) => value + 1);
                    })
                  }
                >
                  {t("platform.declineInvitation")}
                </Button>
              </li>
            ))}
          </ul>
        </>
      )}
      {action.error && <p role="alert">{localizeError(action.error, t)}</p>}
    </PlatformLayout>
  );
}
