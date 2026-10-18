import { AppMain, AppNavigation, AppNavigationItem, AppPage } from "@jordiorriols/ui";
import { Radar, Target } from "@jordiorriols/ui/icons";
import { Tabs } from "@jordiorriols/ui/radix";
import React, { useEffect, useMemo, useState, type ReactNode } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { EvaluationViewer } from "@/components/organisms/EvaluationViewer";
import { SmartGoalsPanel } from "@/components/organisms/SmartGoalsPanel";
import { ShareAction } from "@/components/molecules/ShareAction";
import { AssessmentHeader } from "@/components/organisms/AssessmentHeader";
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

/** The view page of one member; `renderHeader` replaces the standalone header. */
export function MemberView({
  token,
  renderHeader,
}: {
  token: string | undefined;
  renderHeader?: (header: ViewHeader) => ReactNode;
}) {
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

  const share = <ShareAction member={state.links} />;
  const tabs = (
    <Tabs.List className="flex items-center gap-1" data-testid="member-view-tabs">
      <Tabs.Trigger value="evaluation" asChild>
        <AppNavigationItem data-testid="assessment-tab-evaluation">
          <Radar />
          {t("memberAssessment.evaluationTab")}
        </AppNavigationItem>
      </Tabs.Trigger>
      <Tabs.Trigger value="goals" asChild>
        <AppNavigationItem data-testid="assessment-tab-goals">
          <Target />
          {t("smartGoals.tab")}
        </AppNavigationItem>
      </Tabs.Trigger>
    </Tabs.List>
  );
  const header: ViewHeader = {
    title: t("viewPage.title", { name: state.info.name }),
    subtitle: state.info.role,
    share,
    tabs,
  };
  return (
    <AppPage>
      <Tabs.Root defaultValue="evaluation">
        {renderHeader ? (
          renderHeader(header)
        ) : (
          <AssessmentHeader
            title={header.title}
            subtitle={header.subtitle}
            actions={[]}
            navigation={
              <AppNavigation label={t("tabs.label")} actions={share}>
                {tabs}
              </AppNavigation>
            }
          />
        )}
        <AppMain>
          <Tabs.Content value="evaluation">
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <EvaluationViewer
                evaluations={state.evaluations}
                templateId={state.info.templateId}
              />
            </div>
          </Tabs.Content>
          <Tabs.Content value="goals">
            <SmartGoalsPanel store={goalStore} />
          </Tabs.Content>
        </AppMain>
      </Tabs.Root>
    </AppPage>
  );
}
