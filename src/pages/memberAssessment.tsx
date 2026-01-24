import React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AssessmentHeader } from "@/components/organisms/AssessmentHeader";
import { AssessmentPreview } from "@/components/organisms/AssessmentPreview";
import { MemberAssessmentFormColumn } from "./memberAssessment/MemberAssessmentFormColumn";
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
      <AssessmentHeader
        onBack={() => navigate("/")}
        title={t("memberAssessment.title")}
        subtitle={t("memberAssessment.subtitle")}
        actions={[
          {
            type: "file",
            label: t("memberAssessment.importSelfAssessment"),
            icon: (
              <span className="mr-1" aria-hidden>
                📥
              </span>
            ),
            onFile: (file) => handleImportSelfAssessment(file),
          },
          {
            type: "button",
            label: t("memberAssessment.shareSelfAssessment"),
            icon: (
              <span className="mr-1" aria-hidden>
                🔗
              </span>
            ),
            variant: "outline",
            size: "sm",
            onClick: handleShareLink,
          },
        ]}
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

          <AssessmentPreview
            title={t("memberAssessment.preview", { name: name || t("memberAssessment.member") })}
            radar={{
              currentLevels: currentLevels,
              goalLevels: goalLevels,
              selfAssessmentLevels: selfAssessmentLevels,
              size: 350,
            }}
            metrics={[
              {
                label: t("memberAssessment.currentAverage"),
                value: currentAverage.toFixed(1),
                tone: "current",
              },
              {
                label: t("memberAssessment.goalAverage"),
                value: goalAverage.toFixed(1),
                tone: "goal",
              },
            ]}
            verticalStats={verticalStats.map((item) => ({
              vertical: item.vertical,
              current: item.current,
              goal: item.goal,
              self: item.self,
            }))}
            labels={{
              sectionTitle: t("memberAssessment.competencyLevels"),
              currentLabel: "L",
              goalLabel: "L",
              selfLabel: "L",
            }}
          />
        </div>
      </main>
    </div>
  );
}
