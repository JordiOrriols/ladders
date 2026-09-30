import React, { memo } from "react";
import { User } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { Evaluation, Member } from "@/types";
import { Button } from "../ui/button";
import { EvaluationViewer } from "../organisms/EvaluationViewer";

interface MemberDetailsPanelProps {
  member: Member | null;
  evaluations?: Evaluation[];
  onEdit: (member: Member) => void;
  onClose?: () => void;
}

function MemberDetailsPanelComponent({
  member,
  evaluations = [],
  onEdit,
}: MemberDetailsPanelProps) {
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
        <Button eventId="member_details_edit" variant="outline" onClick={handleEditClick}>
          {t("buttons.edit")}
        </Button>
      </div>

      <EvaluationViewer
        key={member.id}
        evaluations={evaluations.filter((e) => e.memberId === member.id)}
        templateId={member.templateId ?? null}
        showVersionPanel={false}
      />
    </div>
  );
}

export const MemberDetailsPanel = memo(MemberDetailsPanelComponent);
