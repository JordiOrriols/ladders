import React, { useRef } from "react";
import { Download, Upload } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { Member } from "../../types";
import MemberCard from "../atoms/memberCard";
import { EmptyTeamState } from "../molecules/EmptyTeamState";
import { Button } from "../ui/button";

interface TeamTabProps {
  members: Member[];
  onAddMember: () => void;
  onEditMember: (member: Member) => void;
  onDeleteMember: (id: string) => void;
  onSelectMember: (member: Member) => void;
  onExportTeam?: () => void;
  onImportTeam?: (file: File) => void;
}

export function TeamTab({
  members,
  onAddMember,
  onEditMember,
  onDeleteMember,
  onSelectMember,
  onExportTeam,
  onImportTeam,
}: TeamTabProps) {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleMemberSelect = (member: Member) => {
    onSelectMember(member);
  };

  const importInput = onImportTeam && (
    <input
      ref={fileInputRef}
      type="file"
      accept="application/json"
      className="hidden"
      data-testid="import-team-input"
      onChange={(event) => {
        const file = event.target.files?.[0];
        if (file) onImportTeam(file);
        event.target.value = "";
      }}
    />
  );
  const importButton = onImportTeam && (
    <Button
      eventId="team_import"
      variant="outline"
      onClick={() => fileInputRef.current?.click()}
      data-testid="import-team-button"
    >
      <Upload className="w-4 h-4 mr-2" />
      {t("buttons.importTeam")}
    </Button>
  );

  if (!members || members.length === 0) {
    return (
      <div className="space-y-4">
        <EmptyTeamState onAddMember={onAddMember} />
        {importInput}
        {importButton && <div className="flex justify-center">{importButton}</div>}
      </div>
    );
  }

  return (
    <div className="space-y-4" data-testid="team-tab">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold text-slate-800" data-testid="team-overview-title">
            {t("labels.teamOverview")}
          </h2>
          <p className="text-sm text-slate-500" data-testid="team-member-count">
            {members.length} {members.length !== 1 ? t("labels.members") : t("labels.member")}
          </p>
        </div>
        <div className="flex gap-2">
          {importInput}
          {importButton}
          {onExportTeam && (
            <Button
              eventId="team_export"
              onClick={onExportTeam}
              variant="outline"
              data-testid="export-team-button"
            >
              <Download className="w-4 h-4 mr-2" />
              {t("buttons.exportTeam")}
            </Button>
          )}
        </div>
      </div>

      <div
        className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        data-testid="team-grid"
      >
        {members.map((member) => (
          <MemberCard
            key={member.id}
            member={member}
            onEdit={onEditMember}
            onDelete={(id) => onDeleteMember(id)}
            onClick={() => handleMemberSelect(member)}
          />
        ))}
      </div>
    </div>
  );
}
