import React, { Suspense } from "react";
import Home from "./pages/home";
import { useTranslation } from "react-i18next";
import { ErrorBoundary } from "react-error-boundary";

export default function App() {
  const { t } = useTranslation();

  return (
    <Suspense fallback={t("app.loading", "loading")}>
      <ErrorBoundary fallback={<div>{t("app.error", "Something went wrong")}</div>}>
        <Home />
      </ErrorBoundary>
    </Suspense>
  );
}
