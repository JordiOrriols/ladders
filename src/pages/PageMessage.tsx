import React from "react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router-dom";
import { AssessmentHeader } from "@/components/organisms/AssessmentHeader";
import { AppSkeleton } from "@jordiorriols/ui";

type Props = {
  kind: "loading" | "notFound" | "error" | "thanks";
  children?: ReactNode;
};

export function PageMessage({ kind, children }: Props) {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const shared = pathname.startsWith("/e/") || pathname.startsWith("/v/");
  if (kind === "loading") return <AppSkeleton label={t("pageMessage.loading")} />;
  return (
    <>
      {shared && (
        <AssessmentHeader title={t("header.title")} subtitle={t("header.subtitle")} actions={[]} />
      )}
      <div className="flex items-center justify-center min-h-screen bg-slate-50 p-6">
        <div
          className="text-center max-w-md space-y-4"
          role={kind === "error" ? "alert" : "status"}
          data-testid="page-message"
          data-kind={kind}
        >
          <p className="text-slate-700">{t(`pageMessage.${kind}`)}</p>
          {children}
          <Link to="/" className="block text-sm text-indigo-600 hover:underline">
            {t("pageMessage.home")}
          </Link>
        </div>
      </div>
    </>
  );
}
