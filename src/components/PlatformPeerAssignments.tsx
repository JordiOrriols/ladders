import React, { useEffect, useState } from "react";
import { Button, FormField, SelectField } from "@jordiorriols/ui";
import { useAsyncAction } from "@jordiorriols/ui/hooks";
import { useTranslation } from "react-i18next";
import { platformRepository, type PeerAssignment, type PlatformTeam } from "../data/platform";
import { localizeError } from "../utils/localizeError";

export function PlatformPeerAssignments({
  workspace,
  member,
}: {
  workspace: string;
  member: string;
}) {
  const { t } = useTranslation();
  const [data, setData] = useState<{ candidates: PlatformTeam[]; assignments: PeerAssignment[] }>();
  const [error, setError] = useState<unknown>();
  const [reviewer, setReviewer] = useState("");
  const [revision, setRevision] = useState(0);
  const action = useAsyncAction();
  useEffect(() => {
    let active = true;
    setData(undefined);
    setError(undefined);
    void Promise.all([
      platformRepository.peerCandidates(workspace, member),
      platformRepository.peerAssignments(workspace, member),
    ]).then(
      ([candidates, assignments]) => {
        if (active) setData({ candidates, assignments });
      },
      (reason: unknown) => {
        if (active) setError(reason);
      }
    );
    return () => {
      active = false;
    };
  }, [workspace, member, revision]);
  return (
    <section className="space-y-3" aria-label={t("platform.peerReviews")}>
      <h3 className="font-semibold">{t("platform.peerReviews")}</h3>
      {error ? (
        <p role="alert">{localizeError(error, t)}</p>
      ) : !data ? (
        <p>{t("pageMessage.loading")}</p>
      ) : (
        <>
          {data.candidates.length > 0 ? (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                if (!reviewer || action.busy) return;
                void action.run(async () => {
                  await platformRepository.assignPeer(workspace, member, reviewer);
                  setReviewer("");
                  setRevision((value) => value + 1);
                });
              }}
            >
              <FormField id="peer-reviewer" label={t("platform.reviewer")}>
                {(field) => (
                  <SelectField
                    {...field}
                    value={reviewer}
                    onValueChange={setReviewer}
                    options={data.candidates.map((row) => ({ value: row.id, label: row.name }))}
                  />
                )}
              </FormField>
              <Button type="submit" disabled={!reviewer || action.busy}>
                {t("platform.assignPeer")}
              </Button>
            </form>
          ) : (
            <p>{t("platform.noReviewers")}</p>
          )}
          <ul className="space-y-2">
            {data.assignments.map((row) => (
              <li key={row.id} data-testid={`peer-assignment-${row.id}`}>
                {row.name} -{" "}
                {row.submitted ? t("platform.peerSubmitted") : t("platform.peerPending")}
                {row.revoked ? (
                  ` - ${t("platform.peerRevoked")}`
                ) : (
                  <Button
                    disabled={action.busy}
                    onClick={() =>
                      void action.run(async () => {
                        await platformRepository.revokePeer(workspace, member, row.id);
                        setRevision((value) => value + 1);
                      })
                    }
                  >
                    {t("platform.revokePeer")}
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
      {action.error && <p role="alert">{localizeError(action.error, t)}</p>}
    </section>
  );
}
