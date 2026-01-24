import React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { MemberAssessmentHeader } from "./memberAssessment/MemberAssessmentHeader";
import { MemberAssessmentFormColumn } from "./memberAssessment/MemberAssessmentFormColumn";
import { MemberAssessmentPreview } from "./memberAssessment/MemberAssessmentPreview";
import { useMemberAssessmentForm } from "@/hooks/useMemberAssessmentForm";

export default function MemberAssessmentPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const memberId = searchParams.get("id");
  const {
    state: {
      name,
      role,
      currentLevels,
      goalLevels,
      selfAssessmentLevels,
      comments,
      expandedVertical,
      verticalStats,
      currentAverage,
      goalAverage,
    },
    setName,
    setRole,
    setExpandedVertical,
    handleCurrentChange,
    handleGoalChange,
    handleCommentChange,
    handleImportSelfAssessment,
    handleShareLink,
  } = useMemberAssessmentForm(memberId, t);

  return (
    <div className="min-h-screen bg-slate-50">
      <MemberAssessmentHeader
        onBack={() => navigate("/")}
        onImport={(file) => handleImportSelfAssessment(file)}
        onShare={handleShareLink}
        title={t("memberAssessment.title")}
        subtitle={t("memberAssessment.subtitle")}
        importLabel={t("memberAssessment.importSelfAssessment")}
        shareLabel={t("memberAssessment.shareSelfAssessment")}
      />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          <MemberAssessmentFormColumn
            name={name}
            role={role}
            currentLevels={currentLevels}
            goalLevels={goalLevels}
            selfAssessmentLevels={selfAssessmentLevels}
            comments={comments}
            expandedVertical={expandedVertical}
            onNameChange={setName}
            onRoleChange={setRole}
            onCurrentChange={handleCurrentChange}
            onGoalChange={handleGoalChange}
            onCommentChange={handleCommentChange}
            onToggleVertical={(vertical) =>
              setExpandedVertical((prev) => (prev === vertical ? null : vertical))
            }
            t={t}
          />

          <MemberAssessmentPreview
            name={name}
            t={t}
            currentAverage={currentAverage}
            goalAverage={goalAverage}
            verticalStats={verticalStats.map((item) => ({
              vertical: item.vertical,
              current: item.current,
              goal: item.goal,
              self: item.self,
            }))}
          />
        </div>
      </main>
    </div>
  );
}
