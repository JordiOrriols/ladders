import React from "react";
import { Plus, User } from "lucide-react";
import { Button } from "../ui/button";

interface EmptyIndividualStateProps {
  onAddMember: () => void;
}

export function EmptyIndividualState({
  onAddMember,
}: EmptyIndividualStateProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
      <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
        <User className="w-8 h-8 text-slate-400" />
      </div>
      <h3 className="text-lg font-semibold text-slate-800 mb-2">
        No team members
      </h3>
      <p className="text-slate-500 mb-6">
        Add team members to view individual profiles
      </p>
      <Button onClick={onAddMember}>
        <Plus className="w-4 h-4 mr-2" />
        Add Member
      </Button>
    </div>
  );
}
