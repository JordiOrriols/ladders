import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { EvaluationViewer } from "@/components/organisms/EvaluationViewer";
import { getPublicView, isValidToken, resolveToken } from "@/data/tokenApi";
import type { TokenInfo } from "@/data/tokenApi";
import type { Evaluation } from "@/types";
import { PageMessage } from "./PageMessage";

type ViewState =
  | { kind: "loading" | "notFound" | "error" }
  | { kind: "ready"; info: TokenInfo; evaluations: Evaluation[] };

/** Read-only page for the evaluated person: published versions plus their own self versions. */
export default function ViewPage() {
  const { token } = useParams();
  const { t } = useTranslation();
  const [state, setState] = useState<ViewState>({ kind: "loading" });

  useEffect(() => {
    if (!isValidToken(token)) {
      setState({ kind: "notFound" });
      return;
    }
    let active = true;
    Promise.all([resolveToken(token), getPublicView(token)])
      .then(([info, evaluations]) => {
        if (!active) return;
        if (info?.linkKind !== "view") setState({ kind: "notFound" });
        else setState({ kind: "ready", info, evaluations });
      })
      .catch((error) => {
        console.error("Failed to load shared evaluation", error);
        if (active) setState({ kind: "error" });
      });
    return () => {
      active = false;
    };
  }, [token]);

  if (state.kind !== "ready") return <PageMessage kind={state.kind} />;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-lg font-semibold text-slate-800">
            {t("viewPage.title", { name: state.info.name })}
          </h1>
          {state.info.role && <p className="text-xs text-slate-500">{state.info.role}</p>}
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <EvaluationViewer evaluations={state.evaluations} templateId={state.info.templateId} />
        </div>
      </main>
    </div>
  );
}
