import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { ErrorBoundary, ErrorState } from "@jordiorriols/ui";
import { useTranslation } from "react-i18next";
import PlatformTeams from "./pages/PlatformTeams";
import PlatformEvaluations from "./pages/PlatformEvaluations";
import PlatformMyEvaluations from "./pages/PlatformMyEvaluations";
import PlatformSelfEvaluation from "./pages/PlatformSelfEvaluation";
import PlatformMyGoals from "./pages/PlatformMyGoals";
import PlatformPeerReviews from "./pages/PlatformPeerReviews";
import PlatformMemberInvitations from "./pages/PlatformMemberInvitations";
import { PlatformLayout } from "./components/PlatformLayout";

export default function App() {
  const { t } = useTranslation();
  return (
    <ErrorBoundary
      componentName="App"
      fallback={() => (
        <PlatformLayout>
          <ErrorState
            message={t("errors.generic")}
            retryLabel={t("errors.retry")}
            onRetry={() => window.location.reload()}
          />
        </PlatformLayout>
      )}
    >
      <Routes>
        <Route path="/" element={<PlatformTeams />} />
        <Route path="/me" element={<PlatformMyEvaluations />} />
        <Route path="/me/members/:member/evaluations" element={<PlatformMyEvaluations />} />
        <Route path="/me/members/:member/self-evaluation" element={<PlatformSelfEvaluation />} />
        <Route path="/me/members/:member/goals" element={<PlatformMyGoals />} />
        <Route path="/me/peer-reviews" element={<PlatformPeerReviews />} />
        <Route path="/me/invitations" element={<PlatformMemberInvitations />} />
        <Route path="/me/peer-reviews/:assignment" element={<PlatformPeerReviews />} />
        <Route path="/workspaces/:workspace/teams" element={<PlatformTeams />} />
        <Route path="/workspaces/:workspace/members/:member" element={<PlatformTeams />} />
        <Route
          path="/workspaces/:workspace/members/:member/evaluations"
          element={<PlatformEvaluations />}
        />
        <Route path="/workspaces/:workspace/teams/:team/members/new" element={<PlatformTeams />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ErrorBoundary>
  );
}
