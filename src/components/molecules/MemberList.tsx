import React, { memo } from "react";
import { Plus, User } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { Member, Team } from "../../types";
import { Button } from "../ui/button";

interface MemberListProps {
  teams?: Team[];
  members: Member[];
  selectedMemberId?: string | undefined;
  onSelectMember: (member: Member) => void;
  onAddMember: (teamId?: string) => void;
}

function MemberListComponent({
  teams = [],
  members,
  selectedMemberId,
  onSelectMember,
  onAddMember,
}: MemberListProps) {
  const { t } = useTranslation();

  const handleMemberClick = (member: Member) => {
    onSelectMember(member);
  };

  const renderMember = (member: Member) => (
    <button
      key={member.id}
      onClick={() => handleMemberClick(member)}
      data-testid={`member-card-${member.id}`}
      className={`w-full p-4 rounded-xl border text-left transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
        selectedMemberId === member.id
          ? "bg-indigo-50 border-indigo-200"
          : "bg-white border-slate-200 hover:border-slate-300"
      }`}
      aria-selected={selectedMemberId === member.id}
      aria-label={`${member.name}${member.role ? `, ${member.role}` : ""}`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
            selectedMemberId === member.id ? "bg-indigo-100" : "bg-slate-100"
          }`}
          aria-hidden="true"
        >
          <User
            className={`w-5 h-5 ${
              selectedMemberId === member.id ? "text-indigo-600" : "text-slate-500"
            }`}
          />
        </div>
        <div className="min-w-0">
          <p className="font-medium text-slate-800 truncate">{member.name}</p>
          {member.role && <p className="text-xs text-slate-500 truncate">{member.role}</p>}
        </div>
      </div>
    </button>
  );

  return (
    <div className="lg:col-span-1 space-y-2" data-testid="member-list">
      <h3 className="text-sm font-medium text-slate-500 mb-3 px-1" id="member-list-heading">
        {t("individualView.selectMember")}
      </h3>
      <nav aria-labelledby="member-list-heading">
        {teams.length > 0 ? (
          <div className="space-y-5">
            {teams.map((team) => {
              const teamMembers = members.filter((member) => member.teamId === team.id);
              return (
                <section key={team.id} aria-label={team.name} className="space-y-2">
                  <div className="flex items-center justify-between px-1">
                    <h4 className="truncate text-xs font-semibold uppercase text-slate-400">
                      {team.name}
                    </h4>
                    {team.access !== "viewer" && (
                      <Button
                        eventId="individual_add_member"
                        variant="ghost"
                        size="icon-sm"
                        className="h-7 w-7"
                        aria-label={t("teams.addMemberTo", { name: team.name })}
                        onClick={() => onAddMember(team.id)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  {teamMembers.length === 0 ? (
                    <p className="px-1 text-xs text-slate-400">{t("teams.emptyTeam")}</p>
                  ) : (
                    teamMembers.map(renderMember)
                  )}
                </section>
              );
            })}
          </div>
        ) : (
          <div className="space-y-2">
            {members.map(renderMember)}
            <button
              type="button"
              onClick={() => onAddMember()}
              data-testid="add-member-row"
              className="w-full rounded-xl border border-dashed border-slate-300 bg-white p-4 text-left transition-all hover:border-indigo-300 hover:bg-indigo-50/40"
            >
              <span className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                  <Plus className="h-5 w-5" />
                </span>
                <span className="font-medium text-slate-700">{t("header.addMember")}</span>
              </span>
            </button>
          </div>
        )}
      </nav>
    </div>
  );
}

export const MemberList = memo(MemberListComponent);
