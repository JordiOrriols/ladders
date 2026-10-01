import React, { memo, useMemo } from "react";
import { User } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { Evaluation, Member } from "@/types";
import { useData } from "@/data/DataProvider";
import { createRepositoryGoalStore } from "@/data/goalStore";
import { Button } from "../ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { EvaluationViewer } from "../organisms/EvaluationViewer";
import { SmartGoalsPanel } from "../organisms/SmartGoalsPanel";

interface MemberDetailsPanelProps {
  member: Member | null;
  evaluations?: Evaluation[];
  onEdit: (member: Member) => void;
  onClose?: () => void;
  readOnly?: boolean;
}

function MemberDetailsPanelComponent({
  member,
  evaluations = [],
  onEdit,
  readOnly = false,
}: MemberDetailsPanelProps) {
  const { t } = useTranslation();
  const { repository } = useData();
  const memberId = member?.id;
  const goalStore = useMemo(
    () => (repository && memberId ? createRepositoryGoalStore(repository, memberId) : null),
    [repository, memberId]
  );

  const handleEditClick = () => {
    if (member) {
      onEdit(member);
    }
  };

  if (!member) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
        <User className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <p className="text-slate-500">{t("individualView.empty")}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-slate-800">{member.name}</h2>
          {member.role && <p className="text-slate-500">{member.role}</p>}
        </div>
        {!readOnly && (
          <Button eventId="member_details_edit" variant="outline" onClick={handleEditClick}>
            {t("buttons.edit")}
          </Button>
        )}
      </div>

      <Tabs key={member.id} defaultValue="evaluation" className="space-y-4">
        <TabsList className="bg-white border border-slate-200">
          <TabsTrigger value="evaluation">{t("memberAssessment.evaluationTab")}</TabsTrigger>
          <TabsTrigger value="goals">{t("smartGoals.tab")}</TabsTrigger>
        </TabsList>
        <TabsContent value="evaluation">
          <EvaluationViewer
            evaluations={evaluations.filter((e) => e.memberId === member.id)}
            templateId={member.templateId ?? null}
            showVersionPanel={false}
          />
        </TabsContent>
        <TabsContent value="goals">
          <SmartGoalsPanel store={goalStore} readOnly={readOnly} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export const MemberDetailsPanel = memo(MemberDetailsPanelComponent);
