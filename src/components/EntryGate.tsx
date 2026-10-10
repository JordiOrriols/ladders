import React from "react";
import type { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { useData } from "@/data/DataProvider";
import { WelcomePage } from "@/pages/WelcomePage";
import { Spinner } from "@jordiorriols/ui";
import { useTranslation } from "react-i18next";

export function EntryGate({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const { user, loading, authError } = useData();
  const { t } = useTranslation();
  const isSharedRoute = pathname.startsWith("/e/") || pathname.startsWith("/v/");

  if (loading && !isSharedRoute) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Spinner label={t("pageMessage.loading")} />
      </div>
    );
  }

  if (authError && !isSharedRoute) {
    return (
      <p role="alert" className="p-6 text-sm text-red-600">
        {authError}
      </p>
    );
  }

  if (!isSharedRoute && !user) return <WelcomePage />;
  return children;
}
