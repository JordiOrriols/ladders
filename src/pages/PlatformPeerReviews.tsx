import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ErrorState } from "@jordiorriols/ui";
import { useTranslation } from "react-i18next";
import { platformRepository, type MyPeerAssignment } from "../data/platform";
import { createPlatformPeerStore } from "../data/platformEvaluationStore";
import { PlatformLayout } from "../components/PlatformLayout";
import { PlatformAssessmentEditor } from "../components/PlatformEvaluationEditor";
import { localizeError } from "../utils/localizeError";

export default function PlatformPeerReviews() {
  const { assignment } = useParams();
  const { t } = useTranslation();
  const [rows, setRows] = useState<MyPeerAssignment[]>();
  const [error, setError] = useState<unknown>();
  const [revision, setRevision] = useState(0);
  const store = useMemo(
    () => (assignment ? createPlatformPeerStore(assignment) : null),
    [assignment]
  );
  useEffect(() => {
    if (assignment) return;
    let active = true;
    setRows(undefined);
    setError(undefined);
    void platformRepository.myPeerAssignments().then(
      (rows) => {
        if (active) setRows(rows);
      },
      (error: unknown) => {
        if (active) setError(error);
      }
    );
    return () => {
      active = false;
    };
  }, [assignment, revision]);
  return (
    <PlatformLayout>
      <Link to="/">{t("platform.workspaces")}</Link>
      {assignment && <Link to="/me/peer-reviews">{t("platform.peerReviews")}</Link>}
      <h2 className="text-2xl font-semibold">{t("platform.peerReviews")}</h2>
      {store ? (
        <PlatformAssessmentEditor key={assignment} store={store} />
      ) : error ? (
        <ErrorState
          message={localizeError(error, t)}
          retryLabel={t("errors.retry")}
          onRetry={() => setRevision((value) => value + 1)}
        />
      ) : !rows ? (
        <p>{t("pageMessage.loading")}</p>
      ) : rows.length === 0 ? (
        <p>{t("platform.noPeerAssignments")}</p>
      ) : (
        <ul>
          {rows.map((row) => (
            <li key={row.id}>
              {row.submitted ? (
                `${row.name} - ${t("platform.peerSubmitted")}`
              ) : (
                <Link to={`/me/peer-reviews/${row.id}`}>{row.name}</Link>
              )}
            </li>
          ))}
        </ul>
      )}
    </PlatformLayout>
  );
}
