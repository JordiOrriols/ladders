import { AppNavigation, AppNavigationItem } from "@jordiorriols/ui";
import { UserRound } from "@jordiorriols/ui/icons";
import React, { useEffect, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Header } from "@/components/molecules/Header";
import { useData } from "@/data/DataProvider";
import type { LinkedMember } from "@/types";
import { PageMessage } from "./PageMessage";
import { MemberView } from "./ViewPage";

type State =
  | { kind: "loading" | "notFound" | "error" }
  | { kind: "ready"; workspaceId: string; member: LinkedMember };

/** Home for a person whose account is linked to a member: only their own page. */
export function MemberHome({
  workspaceId,
  workspaceBar,
}: {
  workspaceId: string;
  workspaceBar: ReactNode;
}) {
  const { t } = useTranslation();
  const { repository } = useData();
  const [state, setState] = useState<State>({ kind: "loading" });

  useEffect(() => {
    if (!repository) return;
    let active = true;
    setState({ kind: "loading" });
    repository
      .myMember(workspaceId)
      .then((member) => {
        if (active)
          setState(member ? { kind: "ready", workspaceId, member } : { kind: "notFound" });
      })
      .catch((error) => {
        console.error("Failed to load linked member", error);
        if (active) setState({ kind: "error" });
      });
    return () => {
      active = false;
    };
  }, [repository, workspaceId]);

  if (state.kind !== "ready") return <PageMessage kind={state.kind} />;
  return (
    <MemberView
      key={state.member.viewToken}
      token={state.member.viewToken}
      renderHeader={({ title, share }) => (
        <Header
          navigation={
            <AppNavigation
              label={t("tabs.label")}
              actions={
                <>
                  {workspaceBar}
                  {share}
                </>
              }
            >
              <AppNavigationItem aria-current="page" data-testid="member-home-tab">
                <UserRound />
                {title}
              </AppNavigationItem>
            </AppNavigation>
          }
        />
      )}
    />
  );
}
