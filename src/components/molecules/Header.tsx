import React from "react";
import { Plus, Info, ClipboardCheck, LayoutGrid } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../ui/button";

interface HeaderProps {
  onAddMember: () => void;
  onShowReference: () => void;
}

export function Header({ onAddMember, onShowReference }: HeaderProps) {
  const navigate = useNavigate();

  const handleNavigateToSelfAssessment = () => {
    navigate("/SelfAssessment");
  };
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <LayoutGrid className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-slate-800">
                Engineering Ladder
              </h1>
              <p className="text-xs text-slate-500">Team competency tracker</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleNavigateToSelfAssessment}
              className="hidden sm:flex"
            >
              <ClipboardCheck className="w-4 h-4 mr-2" />
              Self Assessment
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onShowReference}
              className="hidden sm:flex"
            >
              <Info className="w-4 h-4 mr-2" />
              Reference
            </Button>
            <Button onClick={onAddMember}>
              <Plus className="w-4 h-4 mr-2" />
              Add Member
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
