import React from "react";
import { Users, User } from "lucide-react";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "../ui/tabs";
import { TeamTab } from "./TeamTab";
import { IndividualTab } from "./IndividualTab";
import { ErrorBoundary } from "../ErrorBoundary";

interface Member {
  id: string;
  name: string;
  role?: string;
  [key: string]: any;
}

interface MainTabsProps {
  members: Member[];
  onAddMember: () => void;
  onEditMember: (member: Member) => void;
  onDeleteMember: (id: string) => void;
  onSelectMember: (member: Member) => void;
}

export function MainTabs({
  members,
  onAddMember,
  onEditMember,
  onDeleteMember,
  onSelectMember,
}: MainTabsProps) {
  return (
    <Tabs defaultValue="team" className="space-y-6">
      <TabsList className="bg-white border border-slate-200">
        <TabsTrigger
          value="team"
          className="data-[state=active]:bg-slate-100"
        >
          <Users className="w-4 h-4 mr-2" />
          Team
        </TabsTrigger>
        <TabsTrigger
          value="individual"
          className="data-[state=active]:bg-slate-100"
        >
          <User className="w-4 h-4 mr-2" />
          Individual
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
          />
        </ErrorBoundary>
      </TabsContent>

      <TabsContent value="individual" className="mt-6">
        <ErrorBoundary componentName="IndividualTab">
          <IndividualTab
            members={members}
            onAddMember={onAddMember}
            onEditMember={onEditMember}
          />
        </ErrorBoundary>
      </TabsContent>
    </Tabs>
  );
}
