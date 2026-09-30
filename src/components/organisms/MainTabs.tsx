import React from "react";
import { Users, User } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { Evaluation, Member } from "../../types";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../ui/tabs";
import { TeamTab } from "./TeamTab";
import { IndividualTab } from "./IndividualTab";
import { ErrorBoundary } from "../ErrorBoundary";

interface MainTabsProps {
  members: Member[];
  evaluations?: Evaluation[];
  onAddMember: () => void;
  onEditMember: (member: Member) => void;
  onDeleteMember: (id: string) => void;
  onSelectMember: (member: Member) => void;
  onExportTeam?: () => void;
  onImportTeam?: (file: File) => void;
}

export function MainTabs({
  members,
  evaluations = [],
  onAddMember,
  onEditMember,
  onDeleteMember,
  onSelectMember,
  onExportTeam,
  onImportTeam,
}: MainTabsProps) {
  const { t } = useTranslation();

  return (
    <Tabs defaultValue="individual" className="space-y-6" data-testid="main-tabs">
      <TabsList className="bg-white border border-slate-200" data-testid="tabs-list">
        <TabsTrigger
          value="individual"
          className="data-[state=active]:bg-slate-100"
          data-testid="tab-individual"
        >
          <User className="w-4 h-4 mr-2" />
          {t("tabs.individual")}
        </TabsTrigger>
        <TabsTrigger
          value="team"
          className="data-[state=active]:bg-slate-100"
          data-testid="tab-team"
        >
          <Users className="w-4 h-4 mr-2" />
          {t("tabs.team")}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="team" className="mt-6">
        <ErrorBoundary componentName="TeamTab">
          <TeamTab
            members={members}
            onAddMember={onAddMember}
            onEditMember={onEditMember}
            onDeleteMember={onDeleteMember}
            onSelectMember={onSelectMember}
            {...(onExportTeam ? { onExportTeam } : {})}
            {...(onImportTeam ? { onImportTeam } : {})}
          />
        </ErrorBoundary>
      </TabsContent>

      <TabsContent value="individual" className="mt-6">
        <ErrorBoundary componentName="IndividualTab">
          <IndividualTab
            members={members}
            evaluations={evaluations}
            onAddMember={onAddMember}
            onEditMember={onEditMember}
          />
        </ErrorBoundary>
      </TabsContent>
    </Tabs>
  );
}
