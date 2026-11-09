import React, { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { PlatformLayout } from "../components/PlatformLayout";
import { SmartGoalsPanel } from "../components/organisms/SmartGoalsPanel";
import { createPlatformMemberGoalStore } from "../data/platformGoalStore";

export default function PlatformMyGoals() {
  const { member = "" } = useParams();
  const { t } = useTranslation();
  const store = useMemo(() => createPlatformMemberGoalStore(member), [member]);
  return (
    <PlatformLayout>
      <Link to={`/me/members/${member}/evaluations`}>{t("platform.myEvaluations")}</Link>
      <SmartGoalsPanel key={member} store={store} />
    </PlatformLayout>
  );
}
