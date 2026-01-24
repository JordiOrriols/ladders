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
import { useSelfAssessmentForm } from "@/hooks/useSelfAssessmentForm";
import { SelfAssessmentHeader } from "./selfAssessment/SelfAssessmentHeader";
import { SelfAssessmentFormColumn } from "./selfAssessment/SelfAssessmentFormColumn";
import { SelfAssessmentPreview } from "./selfAssessment/SelfAssessmentPreview";

export default function SelfAssessment() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [showClearDialog, setShowClearDialog] = useState(false);

  const {
    state: { name, role, currentLevels, goalLevels, comments, expandedVertical, verticalStats, currentAverage },
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
      <SelfAssessmentHeader
        onBack={() => navigate("/")}
        onShare={handleShareLink}
        onClear={() => setShowClearDialog(true)}
        onExport={handleExport}
        title={t("selfAssessment.title")}
        subtitle={t("selfAssessment.subtitle")}
        shareLabel={t("selfAssessment.shareLink")}
        clearLabel={t("buttons.clear")}
        exportLabel={t("buttons.export", "Export")}
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

          <SelfAssessmentPreview
            name={name}
            t={t}
            currentAverage={currentAverage}
            verticalStats={verticalStats}
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
