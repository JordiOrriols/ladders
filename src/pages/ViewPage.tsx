import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { EvaluationViewer } from "@/components/organisms/EvaluationViewer";
import { SmartGoalsPanel } from "@/components/organisms/SmartGoalsPanel";
import { ShareAction } from "@/components/molecules/ShareAction";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createTokenGoalStore } from "@/data/goalStore";
import { getPublicView, getViewSharingLinks, isValidToken, resolveToken } from "@/data/tokenApi";
import type { TokenInfo } from "@/data/tokenApi";
import type { Evaluation } from "@/types";
import { PageMessage } from "./PageMessage";

type ViewState =
  | { kind: "loading" | "notFound" | "error" }
  | {
      kind: "ready";
      info: TokenInfo;
      evaluations: Evaluation[];
      links: Awaited<ReturnType<typeof getViewSharingLinks>>;
    };

/** Read-only page for the evaluated person: published versions plus their own self versions. */
export default function ViewPage() {
  const { token } = useParams();
  const { t } = useTranslation();
  const [state, setState] = useState<ViewState>({ kind: "loading" });
  const goalStore = useMemo(
    () => (state.kind === "ready" && token ? createTokenGoalStore(token) : null),
    [state.kind, token]
  );

  useEffect(() => {
    if (!isValidToken(token)) {
      setState({ kind: "notFound" });
      return;
    }
    let active = true;
    Promise.all([resolveToken(token), getPublicView(token), getViewSharingLinks(token)])
      .then(([info, evaluations, links]) => {
        if (!active) return;
        if (info?.linkKind !== "view") setState({ kind: "notFound" });
        else setState({ kind: "ready", info, evaluations, links });
      })
      .catch((error) => {
        // A view link that has not been enabled yet resolves to nothing, which
        // is a missing link rather than a failure: without this the page would
        // report a server error for a link that simply is not shared.
        if (error instanceof Error && /invalid view link/i.test(error.message)) {
          setState({ kind: "notFound" });
          return;
        }
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-lg font-semibold text-slate-800">
              {t("viewPage.title", { name: state.info.name })}
            </h1>
            {state.info.role && <p className="text-xs text-slate-500">{state.info.role}</p>}
          </div>
          <ShareAction member={state.links} />
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="evaluation" className="space-y-6">
          <TabsList className="bg-white border border-slate-200">
            <TabsTrigger value="evaluation">{t("memberAssessment.evaluationTab")}</TabsTrigger>
            <TabsTrigger value="goals">{t("smartGoals.tab")}</TabsTrigger>
          </TabsList>
          <TabsContent value="evaluation">
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <EvaluationViewer
                evaluations={state.evaluations}
                templateId={state.info.templateId}
              />
            </div>
          </TabsContent>
          <TabsContent value="goals">
            <SmartGoalsPanel store={goalStore} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
