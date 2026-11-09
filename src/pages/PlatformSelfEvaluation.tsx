import React, { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { PlatformLayout } from "../components/PlatformLayout";
import { PlatformAssessmentEditor } from "../components/PlatformEvaluationEditor";
import { createPlatformSelfEvaluationStore } from "../data/platformEvaluationStore";

export default function PlatformSelfEvaluation() {
  const { member = "" } = useParams();
  const { t } = useTranslation();
  const store = useMemo(() => createPlatformSelfEvaluationStore(member), [member]);
  return (
    <PlatformLayout>
      <Link to={`/me/members/${member}/evaluations`}>{t("platform.myEvaluations")}</Link>
      <h2 className="text-2xl font-semibold">{t("selfAssessment.title")}</h2>
      <PlatformAssessmentEditor key={member} store={store} />
    </PlatformLayout>
  );
}
