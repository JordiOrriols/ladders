import React from "react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

type Props = {
  kind: "loading" | "notFound" | "error" | "thanks";
  children?: ReactNode;
};

export function PageMessage({ kind, children }: Props) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50 p-6">
      <div className="text-center max-w-md space-y-4" role={kind === "error" ? "alert" : "status"}>
        {kind === "loading" && (
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-slate-400 mx-auto" />
        )}
        <p className="text-slate-700">{t(`pageMessage.${kind}`)}</p>
        {children}
        {kind !== "loading" && (
          <Link to="/" className="block text-sm text-indigo-600 hover:underline">
            {t("pageMessage.home")}
          </Link>
        )}
      </div>
    </div>
  );
}
