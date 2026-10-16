import React, { type ReactNode } from "react";
import { Info, Users, User } from "@jordiorriols/ui/icons";
import { useTranslation } from "react-i18next";
import type { Evaluation, Member, Team } from "../../types";
import { AppMain, AppNavigation, AppNavigationItem } from "@jordiorriols/ui";
import { Tabs } from "@jordiorriols/ui/radix";
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
  onShareTeam?: (team: Team) => void;
  onMoveMember?: (memberId: string, teamId: string) => void;
  onDeleteTeam?: (team: Team) => void;
  onRenameTeam?: (team: Team) => void;
  /** Places the tab navigation inside the app header, below the branding. */
  renderHeader?: (navigation: ReactNode) => ReactNode;
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
  onShareTeam,
  onMoveMember,
  onDeleteTeam,
  onRenameTeam,
  renderHeader,
}: MainTabsProps) {
  const { t } = useTranslation();

  const navigation = (
    <AppNavigation
      label={t("tabs.label")}
      actions={
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
      }
    >
      <Tabs.List className="flex items-center gap-1" data-testid="tabs-list">
        <Tabs.Trigger value="individual" asChild>
          <AppNavigationItem data-testid="tab-individual">
            <User />
            {t("tabs.individual")}
          </AppNavigationItem>
        </Tabs.Trigger>
        <Tabs.Trigger value="team" asChild>
          <AppNavigationItem data-testid="tab-team">
            <Users />
            {t("tabs.team")}
          </AppNavigationItem>
        </Tabs.Trigger>
      </Tabs.List>
    </AppNavigation>
  );

  return (
    <Tabs.Root defaultValue="individual" data-testid="main-tabs">
      {renderHeader ? renderHeader(navigation) : navigation}
      <AppMain data-testid="main-area">
        <Tabs.Content value="team">
          <ErrorBoundary componentName="TeamTab">
            <TeamTab
              teams={teams}
              members={members}
              onAddMember={onAddMember}
              onEditMember={onEditMember}
              onDeleteMember={onDeleteMember}
              onSelectMember={onSelectMember}
              {...(onCreateTeam ? { onCreateTeam } : {})}
              {...(onShareTeam ? { onShareTeam } : {})}
              {...(onMoveMember ? { onMoveMember } : {})}
              {...(onDeleteTeam ? { onDeleteTeam } : {})}
              {...(onRenameTeam ? { onRenameTeam } : {})}
            />
          </ErrorBoundary>
        </Tabs.Content>

        <Tabs.Content value="individual">
          <ErrorBoundary componentName="IndividualTab">
            <IndividualTab
              teams={teams}
              members={members}
              evaluations={evaluations}
              onAddMember={onAddMember}
              onEditMember={onEditMember}
            />
          </ErrorBoundary>
        </Tabs.Content>
      </AppMain>
    </Tabs.Root>
  );
}
