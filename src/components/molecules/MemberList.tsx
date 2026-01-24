import React, { memo } from "react";
import { User } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { Member } from "../../types";

interface MemberListProps {
  members: Member[];
  selectedMemberId?: string | undefined;
  onSelectMember: (member: Member) => void;
}

function MemberListComponent({ members, selectedMemberId, onSelectMember }: MemberListProps) {
  const { t } = useTranslation();

  const handleMemberClick = (member: Member) => {
    onSelectMember(member);
  };

  return (
    <div className="lg:col-span-1 space-y-2">
      <h3 className="text-sm font-medium text-slate-500 mb-3 px-1" id="member-list-heading">
        {t("individualView.selectMember")}
      </h3>
      <nav aria-labelledby="member-list-heading">
        <div className="space-y-2">
          {members.map((member) => (
            <button
              key={member.id}
              onClick={() => handleMemberClick(member)}
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
          ))}
        </div>
      </nav>
    </div>
  );
}

export const MemberList = memo(MemberListComponent);
