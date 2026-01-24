import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import type { Member } from "../types";
import { Header } from "../components/molecules/Header";
import { DeleteMemberDialog } from "../components/molecules/DeleteMemberDialog";
import { ReferenceModal } from "../components/molecules/ReferenceModal";
import { MainTabs } from "../components/organisms/MainTabs";
import { ErrorBoundary } from "../components/ErrorBoundary";
import { loadFromStorage, saveToStorageDebounced } from "@/utils/storage";

const STORAGE_KEY = "engineering-ladder-data";
const STORAGE_VERSION = 1;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);

const isLevelMap = (value: unknown): value is Record<string, number> => {
  if (!isRecord(value)) return false;
  return Object.values(value).every((v) => typeof v === "number");
};

const isMember = (value: unknown): value is Member => {
  if (!isRecord(value)) return false;
  return (
    typeof value["id"] === "string" &&
    typeof value["name"] === "string" &&
    isLevelMap(value["currentLevels"]) &&
    isLevelMap(value["goalLevels"])
  );
};

const isMemberList = (value: unknown): value is Member[] => Array.isArray(value) && value.every(isMember);

export default function Home() {
  const navigate = useNavigate();
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showReference, setShowReference] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const loaded = loadFromStorage<Member[]>(STORAGE_KEY, isMemberList, STORAGE_VERSION);
    if (loaded) setMembers(loaded);
  }, []);

  // Save to localStorage whenever members change (debounced to reduce churn)
  useEffect(() => {
    saveToStorageDebounced(STORAGE_KEY, members, STORAGE_VERSION);
  }, [members]);

  const handleEditMember = (member: Member) => {
    navigate(`/MemberAssessment?id=${member.id}`);
  };

  const handleDeleteMember = (id: string) => {
    setMembers((prev) => {
      const updated = prev.filter((m) => m.id !== id);
      saveToStorageDebounced(STORAGE_KEY, updated, STORAGE_VERSION);
      return updated;
    });
    setDeleteId(null);
    if (selectedMember?.id === id) {
      setSelectedMember(null);
    }
  };

  const handleMemberClick = (member: Member) => {
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
          onConfirm={() => deleteId && handleDeleteMember(deleteId)}
          onCancel={() => setDeleteId(null)}
        />
      </ErrorBoundary>

      <ErrorBoundary componentName="ReferenceModal">
        <ReferenceModal isOpen={showReference} onClose={() => setShowReference(false)} />
      </ErrorBoundary>
    </div>
  );
}
