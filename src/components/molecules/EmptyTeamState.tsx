import React from "react";
import { Plus, Users } from "lucide-react";
import { Button } from "../ui/button";

interface EmptyTeamStateProps {
  onAddMember: () => void;
}

export function EmptyTeamState({ onAddMember }: EmptyTeamStateProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
      <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
        <Users className="w-8 h-8 text-slate-400" />
      </div>
      <h3 className="text-lg font-semibold text-slate-800 mb-2">
        No team members yet
      </h3>
      <p className="text-slate-500 mb-6">
        Add your first team member to start tracking competencies
      </p>
      <Button onClick={onAddMember}>
        <Plus className="w-4 h-4 mr-2" />
        Add First Member
      </Button>
    </div>
  );
}
