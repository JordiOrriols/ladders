import React, { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Home from "./pages/home";
import { DataProvider } from "./data/DataProvider";
import { EntryGate } from "./components/EntryGate";
import { PasswordResetDialog } from "./components/molecules/PasswordResetDialog";
import { PageMessage } from "./pages/PageMessage";
import { ErrorBoundary, ErrorState, PublicAppShell } from "@jordiorriols/ui";

const AssessmentPage = lazy(() => import("./pages/AssessmentPage"));
const ViewPage = lazy(() => import("./pages/ViewPage"));
const JoinPage = lazy(() => import("./pages/JoinPage"));

// Loading fallback component
function LoadingFallback() {
  return <PageMessage kind="loading" />;
}

// Error fallback component
function ErrorFallback({ resetErrorBoundary }) {
  const { t, i18n } = useTranslation();

  return (
    <PublicAppShell
      projectId="ladders"
      header={{ title: t("header.title"), subtitle: t("header.subtitle") }}
      footer={{
        text: t("footer.attribution"),
        language: i18n.resolvedLanguage ?? i18n.language,
      }}
    >
      <ErrorState
        title={t("errors.title")}
        message={t("errors.generic")}
        onRetry={resetErrorBoundary}
        retryLabel={t("errors.retry")}
      />
    </PublicAppShell>
  );
}

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1">
        <ErrorBoundary
          componentName="App"
          fallback={() => <ErrorFallback resetErrorBoundary={() => (window.location.href = "/")} />}
        >
          <DataProvider>
            <PasswordResetDialog />
            <EntryGate>
              <Suspense fallback={<LoadingFallback />}>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/member/:id" element={<AssessmentPage />} />
                  <Route path="/e/:token" element={<AssessmentPage />} />
                  <Route path="/v/:token" element={<ViewPage />} />
                  <Route path="/join/:token" element={<JoinPage />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Suspense>
            </EntryGate>
          </DataProvider>
        </ErrorBoundary>
      </div>
    </div>
  );
}
