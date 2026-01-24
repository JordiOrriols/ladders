import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AssessmentHeader } from "@/components/organisms/AssessmentHeader";
import { AssessmentPreview } from "@/components/organisms/AssessmentPreview";
import { useSelfAssessmentForm } from "@/hooks/useSelfAssessmentForm";
import { SelfAssessmentFormColumn } from "./selfAssessment/SelfAssessmentFormColumn";

export default function SelfAssessment() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [showClearDialog, setShowClearDialog] = useState(false);

  const {
    state: {
      name,
      role,
      currentLevels,
      goalLevels,
      comments,
      expandedVertical,
      verticalStats,
      currentAverage,
    },
    setExpandedVertical,
    handleNameChange,
    handleRoleChange,
    handleCurrentChange,
    handleGoalChange,
    handleCommentChange,
    handleExport,
    handleClear,
    handleShareLink,
  } = useSelfAssessmentForm(t);

  return (
    <div className="min-h-screen bg-slate-50">
      <AssessmentHeader
        onBack={() => navigate("/")}
        title={t("selfAssessment.title")}
        subtitle={t("selfAssessment.subtitle")}
        leadingAdornment={{
          icon: <span className="text-white">⬢</span>,
          className: "bg-gradient-to-br from-purple-500 to-pink-600",
        }}
        actions={[
          {
            type: "button",
            label: t("selfAssessment.shareLink"),
            icon: (
              <span className="mr-1" aria-hidden>
                🔗
              </span>
            ),
            variant: "outline",
            size: "sm",
            onClick: handleShareLink,
          },
          {
            type: "button",
            label: t("buttons.clear"),
            icon: (
              <span className="mr-1" aria-hidden>
                🗑️
              </span>
            ),
            variant: "outline",
            size: "sm",
            onClick: () => setShowClearDialog(true),
          },
          {
            type: "button",
            label: t("buttons.export", "Export"),
            icon: (
              <span className="mr-1" aria-hidden>
                ⬇️
              </span>
            ),
            onClick: handleExport,
          },
        ]}
      />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          <SelfAssessmentFormColumn
            name={name}
            role={role}
            currentLevels={currentLevels}
            goalLevels={goalLevels}
            comments={comments}
            expandedVertical={expandedVertical}
            onNameChange={handleNameChange}
            onRoleChange={handleRoleChange}
            onCurrentChange={handleCurrentChange}
            onGoalChange={handleGoalChange}
            onCommentChange={handleCommentChange}
            onToggleVertical={(vertical) =>
              setExpandedVertical((prev) => (prev === vertical ? null : vertical))
            }
            t={t}
          />

          <AssessmentPreview
            title={t("selfAssessment.preview", {
              name: name || t("selfAssessment.yourAssessment"),
            })}
            radar={{
              currentLevels: currentLevels,
              goalLevels: goalLevels,
              hideGoal: true,
              size: 350,
            }}
            metrics={[
              {
                label: t("selfAssessment.currentAverage"),
                value: currentAverage.toFixed(1),
                tone: "current",
              },
            ]}
            verticalStats={verticalStats}
            labels={{
              sectionTitle: t("selfAssessment.competencyLevels"),
              currentLabel: "L",
            }}
          />
        </div>
      </main>

      {/* Clear Confirmation Dialog */}
      <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("selfAssessment.clearConfirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("selfAssessment.clearConfirmDesc")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("buttons.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                handleClear();
                setShowClearDialog(false);
              }}
              className="bg-red-500 hover:bg-red-600"
            >
              {t("selfAssessment.clearAll")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
