import React, { type ReactNode } from "react";
import { Info, Users, User } from "@jordiorriols/ui/icons";
import { useTranslation } from "react-i18next";
import { Link, useSearchParams } from "react-router-dom";
import type { Evaluation, Member, Team } from "../../types";
import { AppMain, AppNavigation, AppNavigationItem } from "@jordiorriols/ui";
import { TeamTab } from "./TeamTab";
import { IndividualTab } from "./IndividualTab";
import { ErrorBoundary } from "../ErrorBoundary";
import { Button } from "../ui/button";

interface MainTabsProps {
  teams?: Team[];
  members: Member[];
  evaluations?: Evaluation[];
  onAddMember: (teamId?: string) => void;
  onEditMember: (member: Member) => void;
  onDeleteMember: (id: string) => void;
  onSelectMember: (member: Member) => void;
  onShowReference: () => void;
  onCreateTeam?: () => void;
  onMoveMember?: (memberId: string, teamId: string) => void;
  onDeleteTeam?: (team: Team) => void;
  onRenameTeam?: (team: Team) => void;
  /** Workspace picker and sharing, shown in the tab bar next to the tabs. */
  workspaceActions?: ReactNode;
  /** Places the tab navigation inside the app header, below the branding. */
  renderLayout?: (navigation: ReactNode, content: ReactNode) => ReactNode;
}

export function MainTabs({
  teams = [],
  members,
  evaluations = [],
  onAddMember,
  onEditMember,
  onDeleteMember,
  onSelectMember,
  onShowReference,
  onCreateTeam,
  onMoveMember,
  onDeleteTeam,
  onRenameTeam,
  workspaceActions,
  renderLayout,
}: MainTabsProps) {
  const { t } = useTranslation();
  const [search] = useSearchParams();
  const selected = search.get("view") === "team" ? "team" : "individual";
  const viewUrl = (view: string) => {
    const next = new URLSearchParams(search);
    if (view === "individual") next.delete("view");
    else next.set("view", view);
    return { pathname: "/", search: next.toString() };
  };

  const navigation = (
    <AppNavigation
      label={t("tabs.label")}
      actions={
        <>
          {workspaceActions}
          <Button
            eventId="tabs_show_reference"
            variant="outline"
            size="sm"
            onClick={onShowReference}
            data-testid="reference-button"
          >
            <Info className="w-4 h-4" />
            <span className="hidden sm:inline">{t("header.reference")}</span>
          </Button>
        </>
      }
    >
      <div className="flex items-center gap-1" data-testid="tabs-list">
        <AppNavigationItem asChild data-testid="tab-individual">
          <Link
            to={viewUrl("individual")}
            aria-current={selected === "individual" ? "page" : undefined}
          >
            <User />
            {t("tabs.individual")}
          </Link>
        </AppNavigationItem>
        <AppNavigationItem asChild data-testid="tab-team">
          <Link to={viewUrl("team")} aria-current={selected === "team" ? "page" : undefined}>
            <Users />
            {t("tabs.team")}
          </Link>
        </AppNavigationItem>
      </div>
    </AppNavigation>
  );

  const content = (
    <div data-testid="main-tabs">
      {selected === "team" ? (
        <ErrorBoundary componentName="TeamTab">
          <TeamTab
            teams={teams}
            members={members}
            onAddMember={onAddMember}
            onEditMember={onEditMember}
            onDeleteMember={onDeleteMember}
            onSelectMember={onSelectMember}
            {...(onCreateTeam ? { onCreateTeam } : {})}
            {...(onMoveMember ? { onMoveMember } : {})}
            {...(onDeleteTeam ? { onDeleteTeam } : {})}
            {...(onRenameTeam ? { onRenameTeam } : {})}
          />
        </ErrorBoundary>
      ) : (
        <ErrorBoundary componentName="IndividualTab">
          <IndividualTab
            teams={teams}
            members={members}
            evaluations={evaluations}
            onAddMember={onAddMember}
            onEditMember={onEditMember}
          />
        </ErrorBoundary>
      )}
    </div>
  );
  return renderLayout ? (
    renderLayout(navigation, content)
  ) : (
    <>
      {navigation}
      <AppMain>{content}</AppMain>
    </>
  );
}
