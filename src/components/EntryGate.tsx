import React from "react";
import type { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { useData } from "@/data/DataProvider";
import { WelcomePage } from "@/pages/WelcomePage";
import { AppSkeleton } from "@jordiorriols/ui";
import { useTranslation } from "react-i18next";
import { localizeError } from "@/utils/localizeError";
import { rememberInvite } from "@/utils/pendingInvite";

export function EntryGate({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const { user, loading, authError } = useData();
  const { t } = useTranslation();
  const isSharedRoute = pathname.startsWith("/e/") || pathname.startsWith("/v/");

  if (loading && !isSharedRoute) {
    return <AppSkeleton label={t("pageMessage.loading")} />;
  }

  if (authError && !isSharedRoute) {
    return (
      <p role="alert" className="p-6 text-sm text-red-600">
        {localizeError(authError, t)}
      </p>
    );
  }

  if (!isSharedRoute && !user) {
    const invite = /^\/join\/([^/]+)$/.exec(pathname)?.[1];
    if (invite) rememberInvite(invite);
    return <WelcomePage />;
  }
  return children;
}
