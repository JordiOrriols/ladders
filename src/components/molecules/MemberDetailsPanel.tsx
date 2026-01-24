import React, { memo } from "react";
import { User } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "../ui/button";
import RadarChart from "../atoms/radarChart";
import { CompetencyDetailsCard } from "./CompetencyDetailsCard";
import { ErrorBoundary } from "../ErrorBoundary";
import { VERTICALS } from "../atoms/levelSelector";

interface Member {
  id: string;
  name: string;
  role?: string;
  currentLevels: Record<string, number>;
  goalLevels: Record<string, number>;
  selfAssessmentLevels?: Record<string, number>;
}

interface MemberDetailsPanelProps {
  member: Member | null;
  onEdit: (member: Member) => void;
  onClose?: () => void;
}

function MemberDetailsPanelComponent({ member, onEdit }: MemberDetailsPanelProps) {
  const { t } = useTranslation();

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
        <Button variant="outline" onClick={handleEditClick}>
          {t("buttons.edit")}
        </Button>
      </div>

      <div className="flex justify-center mb-8">
        <ErrorBoundary componentName="RadarChart">
          <RadarChart
            currentLevels={member.currentLevels}
            goalLevels={member.goalLevels}
            selfAssessmentLevels={member.selfAssessmentLevels}
            size={350}
          />
        </ErrorBoundary>
      </div>

      {/* Competency Details */}
      <div className="space-y-4">
        <h3 className="font-semibold text-slate-800">{t("memberDetails.competencyDetails")}</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          {VERTICALS.map((vertical) => (
            <ErrorBoundary key={vertical} componentName={`CompetencyCard-${vertical}`}>
              <CompetencyDetailsCard
                vertical={vertical}
                currentLevel={member.currentLevels[vertical] || 0}
                goalLevel={member.goalLevels[vertical] || 0}
                selfAssessmentLevel={member.selfAssessmentLevels?.[vertical] || 0}
              />
            </ErrorBoundary>
          ))}
        </div>
      </div>
    </div>
  );
}

export const MemberDetailsPanel = memo(MemberDetailsPanelComponent);
