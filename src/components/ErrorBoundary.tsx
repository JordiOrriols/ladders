import React, { type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { ErrorBoundary as SharedErrorBoundary, ErrorState } from "@jordiorriols/ui";

function ErrorMessage() {
  const { t } = useTranslation();
  return <ErrorState title={t("errors.title")} message={t("errors.generic")} />;
}

export function ErrorBoundary({
  children,
  fallback,
  componentName,
}: {
  children: ReactNode;
  fallback?: (error: Error) => ReactNode;
  componentName?: string;
}) {
  return (
    <SharedErrorBoundary
      {...(componentName ? { componentName } : {})}
      fallback={(error) => (fallback ? fallback(error) : <ErrorMessage />)}
    >
      {children}
    </SharedErrorBoundary>
  );
}
