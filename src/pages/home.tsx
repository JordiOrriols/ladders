import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import type { Member } from "../types";
import { Header } from "../components/molecules/Header";
import { DeleteMemberDialog } from "../components/molecules/DeleteMemberDialog";
import { ReferenceModal } from "../components/molecules/ReferenceModal";
import { MainTabs } from "../components/organisms/MainTabs";
import { ErrorBoundary } from "../components/ErrorBoundary";

const STORAGE_KEY = "engineering-ladder-data";

export default function Home() {
  const navigate = useNavigate();
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showReference, setShowReference] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const data = JSON.parse(saved);
      setMembers(data);
    }
  }, []);

  // Save to localStorage whenever members change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(members));
  }, [members]);

  const handleEditMember = (member) => {
    navigate(`/MemberAssessment?id=${member.id}`);
  };

  const handleDeleteMember = (id) => {
    setMembers((prev) => {
      const updated = prev.filter((m) => m.id !== id);
      // Save immediately to localStorage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
    setDeleteId(null);
    if (selectedMember?.id === id) {
      setSelectedMember(null);
    }
  };

  const handleMemberClick = (member) => {
    setSelectedMember(member);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <ErrorBoundary componentName="Header">
        <Header
          onAddMember={() => navigate("/MemberAssessment")}
          onShowReference={() => setShowReference(true)}
        />
      </ErrorBoundary>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ErrorBoundary componentName="MainTabs">
          <MainTabs
            members={members}
            onAddMember={() => navigate("/MemberAssessment")}
            onEditMember={handleEditMember}
            onDeleteMember={(id) => setDeleteId(id)}
            onSelectMember={handleMemberClick}
          />
        </ErrorBoundary>
      </main>

      <ErrorBoundary componentName="DeleteMemberDialog">
        <DeleteMemberDialog
          isOpen={!!deleteId}
          onConfirm={() => handleDeleteMember(deleteId)}
          onCancel={() => setDeleteId(null)}
        />
      </ErrorBoundary>

      <ErrorBoundary componentName="ReferenceModal">
        <ReferenceModal isOpen={showReference} onClose={() => setShowReference(false)} />
      </ErrorBoundary>
    </div>
  );
}
