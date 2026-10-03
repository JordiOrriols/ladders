import React from "react";
import { Pencil, Plus, Share2, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { Member, Team } from "../../types";
import MemberCard from "../atoms/memberCard";
import { EmptyTeamState } from "../molecules/EmptyTeamState";
import { Button } from "../ui/button";

interface TeamTabProps {
  teams?: Team[];
  members: Member[];
  onAddMember: (teamId?: string) => void;
  onEditMember: (member: Member) => void;
  onDeleteMember: (id: string) => void;
  onSelectMember: (member: Member) => void;
  onCreateTeam?: () => void;
  onShareTeam?: (team: Team) => void;
  onMoveMember?: (memberId: string, teamId: string) => void;
  onDeleteTeam?: (team: Team) => void;
  onRenameTeam?: (team: Team) => void;
}

export function TeamTab({
  teams = [],
  members,
  onAddMember,
  onEditMember,
  onDeleteMember,
  onSelectMember,
  onCreateTeam,
  onShareTeam,
  onMoveMember,
  onDeleteTeam,
  onRenameTeam,
}: TeamTabProps) {
  const { t } = useTranslation();

  const handleMemberSelect = (member: Member) => {
    onSelectMember(member);
  };

  if (!members || members.length === 0) {
    return (
      <div className="space-y-4" data-testid="team-tab">
        {onCreateTeam && (
          <div className="flex justify-end">
            <Button
              eventId="team_create_open"
              data-testid="team-create-open"
              variant="outline"
              onClick={onCreateTeam}
            >
              <Plus className="h-4 w-4" />
              {t("teams.create")}
            </Button>
          </div>
        )}
        <EmptyTeamState onAddMember={() => onAddMember(teams[0]?.id)} />
      </div>
    );
  }

  const visibleTeams: Team[] =
    teams.length > 0
      ? teams
      : [
          {
            id: "all",
            ownerId: "",
            name: t("labels.teamOverview"),
            isDefault: true,
            access: "owner",
            createdAt: "",
            updatedAt: "",
          },
        ];

  return (
    <div className="space-y-4" data-testid="team-tab">
      <div className="flex justify-between items-center gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-800" data-testid="team-overview-title">
            {t("labels.teamOverview")}
          </h2>
          <p className="text-sm text-slate-500" data-testid="team-member-count">
            {members.length} {members.length !== 1 ? t("labels.members") : t("labels.member")}
          </p>
        </div>
        {onCreateTeam && (
          <Button
            eventId="team_create_open"
            data-testid="team-create-open"
            variant="outline"
            onClick={onCreateTeam}
          >
            <Plus className="h-4 w-4" />
            {t("teams.create")}
          </Button>
        )}
      </div>

      {visibleTeams.map((team) => {
        const teamMembers =
          team.id === "all" ? members : members.filter((member) => member.teamId === team.id);
        const editable = team.access !== "viewer";
        const handleDrop = (event: React.DragEvent<HTMLElement>) => {
          event.preventDefault();
          const memberId = event.dataTransfer.getData("text/member-id");
          if (memberId && team.id !== "all" && onMoveMember) onMoveMember(memberId, team.id);
        };
        return (
          <section
            data-testid={`team-section-${team.id}`}
            key={team.id}
            className="space-y-3"
            aria-labelledby={`team-${team.id}`}
            onDragOver={(event) => event.preventDefault()}
            onDrop={handleDrop}
          >
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div className="flex min-w-0 items-center gap-2">
                <h3 id={`team-${team.id}`} className="truncate font-semibold text-slate-800">
                  {team.name}
                </h3>
                <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                  {teamMembers.length}
                </span>
                {team.access !== "owner" && (
                  <span
                    className="text-xs text-slate-500"
                    data-testid={`team-access-${team.id}`}
                    data-access={team.access}
                  >
                    {t(`teams.${team.access}`)}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {editable && (
                  <Button
                    eventId="team_add_member"
                    variant="ghost"
                    size="sm"
                    data-testid="add-member-button"
                    aria-label={t("teams.addMemberTo", { name: team.name })}
                    onClick={() => onAddMember(team.id === "all" ? undefined : team.id)}
                  >
                    <Plus className="h-4 w-4" />
                    {t("header.addMember")}
                  </Button>
                )}
                {team.access === "owner" && team.id !== "all" && (
                  <>
                    {onRenameTeam && (
                      <Button
                        eventId="team_rename_open"
                        data-testid="team-rename-open"
                        variant="ghost"
                        size="sm"
                        aria-label={t("teams.renameAria", { name: team.name })}
                        onClick={() => onRenameTeam(team)}
                      >
                        <Pencil className="h-4 w-4" />
                        {t("teams.rename")}
                      </Button>
                    )}
                    {onShareTeam && (
                      <Button
                        eventId="team_share_open"
                        data-testid="team-share-open"
                        variant="ghost"
                        size="sm"
                        onClick={() => onShareTeam(team)}
                      >
                        <Share2 className="h-4 w-4" />
                        {t("teams.share")}
                      </Button>
                    )}
                    {onDeleteTeam && teamMembers.length === 0 && !team.isDefault && (
                      <Button
                        eventId="team_delete_open"
                        data-testid="team-delete-open"
                        variant="ghost"
                        size="icon-sm"
                        aria-label={t("teams.deleteAria", { name: team.name })}
                        onClick={() => onDeleteTeam(team)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>
            {teamMembers.length === 0 ? (
              <p className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
                {t("teams.emptyTeam")}
              </p>
            ) : (
              <div
                className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                data-testid="team-grid"
              >
                {teamMembers.map((member) => (
                  <MemberCard
                    key={member.id}
                    member={member}
                    onEdit={onEditMember}
                    onDelete={onDeleteMember}
                    readOnly={!editable}
                    draggable={editable && !!onMoveMember}
                    onDragStart={(event) => {
                      event.dataTransfer.effectAllowed = "move";
                      event.dataTransfer.setData("text/member-id", member.id);
                    }}
                    {...(editable ? { onClick: () => handleMemberSelect(member) } : {})}
                  />
                ))}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
