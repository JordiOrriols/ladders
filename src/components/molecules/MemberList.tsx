import React from "react";
import { User } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { Member } from "../../types";

interface MemberListProps {
  members: Member[];
  selectedMemberId?: string | undefined;
  onSelectMember: (member: Member) => void;
}

export function MemberList({ members, selectedMemberId, onSelectMember }: MemberListProps) {
  const { t } = useTranslation();

  return (
    <div className="lg:col-span-1 space-y-2">
      <h3 className="text-sm font-medium text-slate-500 mb-3 px-1">
        {t("individualView.selectMember")}
      </h3>
      {members.map((member) => (
        <button
          key={member.id}
          onClick={() => onSelectMember(member)}
          className={`w-full p-4 rounded-xl border text-left transition-all ${
            selectedMemberId === member.id
              ? "bg-indigo-50 border-indigo-200"
              : "bg-white border-slate-200 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                selectedMemberId === member.id ? "bg-indigo-100" : "bg-slate-100"
              }`}
            >
              <User
                className={`w-5 h-5 ${
                  selectedMemberId === member.id ? "text-indigo-600" : "text-slate-500"
                }`}
              />
            </div>
            <div>
              <p className="font-medium text-slate-800">{member.name}</p>
              {member.role && <p className="text-xs text-slate-500">{member.role}</p>}
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
