import { AppNavigation, AppNavigationItem } from "@jordiorriols/ui";
import { Radar, Target } from "@jordiorriols/ui/icons";
import { Tabs } from "@jordiorriols/ui/radix";
import React, { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { EvaluationViewer } from "@/components/organisms/EvaluationViewer";
import { SmartGoalsPanel } from "@/components/organisms/SmartGoalsPanel";
import { ShareAction } from "@/components/molecules/ShareAction";
import { AssessmentLayout } from "@/components/organisms/AssessmentHeader";
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

/** `tabs` is the Evaluation / SMART Goals tab list, to place in the header navigation. */
type ViewHeader = { title: string; subtitle: string; share: ReactNode; tabs: ReactNode };

/** Read-only page for the evaluated person: published versions plus their own self versions. */
export default function ViewPage() {
  const { token } = useParams();
  return <MemberView token={token} />;
}

/** Content is shared; the caller can supply an authenticated layout. */
export function MemberView({
  token,
  renderLayout,
}: {
  token: string | undefined;
  renderLayout?: (header: ViewHeader, content: ReactNode) => ReactNode;
}) {
  const { t } = useTranslation();
  const [search] = useSearchParams();
  const selected = search.get("tab") === "goals" ? "goals" : "evaluation";
  const tabUrl = (value: string) => {
    const next = new URLSearchParams(search);
    if (value === "evaluation") next.delete("tab");
    else next.set("tab", value);
    return { search: next.toString() };
  };
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

  const share = <ShareAction member={state.links} />;
  const tabs = (
    <div className="flex items-center gap-1" data-testid="member-view-tabs">
      <AppNavigationItem asChild data-testid="assessment-tab-evaluation">
        <Link
          to={tabUrl("evaluation")}
          aria-current={selected === "evaluation" ? "page" : undefined}
        >
          <Radar />
          {t("memberAssessment.evaluationTab")}
        </Link>
      </AppNavigationItem>
      <AppNavigationItem asChild data-testid="assessment-tab-goals">
        <Link to={tabUrl("goals")} aria-current={selected === "goals" ? "page" : undefined}>
          <Target />
          {t("smartGoals.tab")}
        </Link>
      </AppNavigationItem>
    </div>
  );
  const header: ViewHeader = {
    title: t("viewPage.title", { name: state.info.name }),
    subtitle: state.info.role,
    share,
    tabs,
  };
  const content = (
    <>
      <Tabs.Content value="evaluation">
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <EvaluationViewer evaluations={state.evaluations} templateId={state.info.templateId} />
        </div>
      </Tabs.Content>
      <Tabs.Content value="goals">
        <SmartGoalsPanel store={goalStore} />
      </Tabs.Content>
    </>
  );
  return (
    <Tabs.Root value={selected}>
      {renderLayout ? (
        renderLayout(header, content)
      ) : (
        <AssessmentLayout
          title={header.title}
          subtitle={header.subtitle}
          actions={[]}
          navigation={
            <AppNavigation label={t("tabs.label")} actions={share}>
              {tabs}
            </AppNavigation>
          }
        >
          {content}
        </AssessmentLayout>
      )}
    </Tabs.Root>
  );
}
