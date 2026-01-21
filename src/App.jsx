import React, { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ErrorBoundary } from "react-error-boundary";
import Home from "./pages/home";

const SelfAssessment = lazy(() => import("./pages/selfassesment"));

export default function App() {
  const { t } = useTranslation();

  return (
    <Suspense fallback={<div>{t("app.loading", "loading")}</div>}>
      <ErrorBoundary fallback={<div>{t("app.error", "Something went wrong")}</div>}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/SelfAssessment" element={<SelfAssessment />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ErrorBoundary>
    </Suspense>
  );
}
