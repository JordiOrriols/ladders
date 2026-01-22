import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Download, Share2 } from "lucide-react";
import LevelSelector, { VERTICALS } from "@/components/atoms/levelSelector";
import RadarChart from "@/components/atoms/radarChart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Member } from "@/types";

const STORAGE_KEY = "engineering-ladder-data";

export default function MemberAssessmentPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const memberId = searchParams.get("id");

  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [currentLevels, setCurrentLevels] = useState<Record<string, number>>({});
  const [goalLevels, setGoalLevels] = useState<Record<string, number>>({});
  const [selfAssessmentLevels, setSelfAssessmentLevels] = useState<Record<string, number>>({});
  const [comments, setComments] = useState<Record<string, string>>({});
  const [expandedVertical, setExpandedVertical] = useState<string | null>(VERTICALS[0] ?? null);
  const [members, setMembers] = useState<Member[]>([]);
  const [draftId, setDraftId] = useState<string>(() => memberId ?? Date.now().toString());
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as Member[];
        setMembers(parsed);
      } catch (e) {
        console.error("Failed to parse members", e);
      }
    }
  }, []);

  useEffect(() => {
    if (!memberId) return;
    const found = members.find((m) => m.id === memberId);
    if (found) {
      setDraftId(found.id);
      setName(found.name || "");
      setRole(found.role || "");
      setCurrentLevels(found.currentLevels || {});
      setGoalLevels(found.goalLevels || {});
      setSelfAssessmentLevels(found.selfAssessmentLevels || {});
      setComments(found.comments || {});
    }
  }, [memberId, members]);

  useEffect(() => {
    if (!name.trim()) return; // avoid saving empty drafts without a name
    const payload: Member = {
      id: draftId,
      name: name.trim(),
      role: role.trim(),
      currentLevels,
      goalLevels,
      selfAssessmentLevels,
      comments,
    };

    setMembers((prev) => {
      const exists = prev.find((m) => m.id === payload.id);
      const next = exists
        ? prev.map((m) => (m.id === payload.id ? payload : m))
        : [...prev, payload];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, [name, role, currentLevels, goalLevels, selfAssessmentLevels, comments, draftId]);

  const handleCurrentChange = (vertical: string, level: number) => {
    setCurrentLevels((prev) => ({ ...prev, [vertical]: level }));
  };

  const handleGoalChange = (vertical: string, level: number) => {
    setGoalLevels((prev) => ({ ...prev, [vertical]: level }));
  };

  const handleCommentChange = (vertical: string, value: string) => {
    setComments((prev) => ({ ...prev, [vertical]: value }));
  };

  const handleImportSelfAssessment = (event?: React.ChangeEvent<HTMLInputElement>) => {
    const file = event?.target?.files?.[0];

    const importFromData = (raw: string) => {
      try {
        const data = JSON.parse(raw) as {
          name?: string;
          role?: string;
          currentLevels?: Record<string, number>;
          goalLevels?: Record<string, number>;
          comments?: Record<string, string>;
        };

        const importedSelfLevels = data.currentLevels || {};
        setSelfAssessmentLevels(importedSelfLevels);

        // Optional backfill name/role only when empty; stay scoped to current edit session
        if (!name && data.name) setName(data.name);
        if (!role && data.role) setRole(data.role);

        alert(t("alerts.importSelfAssessmentSuccess"));
      } catch (e) {
        console.error("Failed to import self-assessment", e);
        alert(t("alerts.failedToImportSelfAssessment"));
      }
    };

    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const raw = e.target?.result as string;
        importFromData(raw);
      };
      reader.readAsText(file);
      // reset input so same file can be reselected
      if (event?.target) event.target.value = "";
      return;
    }

    // Fallback: previous behavior loading from localStorage
    const raw = localStorage.getItem("self-assessment-data");
    if (!raw) {
      alert(t("alerts.noSelfAssessmentFound"));
      return;
    }
    importFromData(raw);
  };

  const handleShareLink = () => {
    const base = `${window.location.origin}${window.location.pathname}`.replace(/#.*$/, "");
    const url = `${base}#/SelfAssessment`;
    navigator.clipboard
      .writeText(url)
      .then(() => {
        alert(t("alerts.shareLinkCopied"));
      })
      .catch(() => {
        alert(t("alerts.failedToCopyLink"));
      });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-lg font-semibold text-slate-800">
                  {t("memberAssessment.title")}
                </h1>
                <p className="text-xs text-slate-500">{t("memberAssessment.subtitle")}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="application/json"
                className="hidden"
                onChange={handleImportSelfAssessment}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                <Download className="w-4 h-4 mr-2" />
                {t("memberAssessment.importSelfAssessment")}
              </Button>
              <Button variant="outline" onClick={handleShareLink}>
                <Share2 className="w-4 h-4 mr-2" />
                {t("memberAssessment.shareSelfAssessment")}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column - Form */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-800 mb-4">
                {t("memberAssessment.personalInfo")}
              </h2>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter member name"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="role">Role (optional)</Label>
                  <Input
                    id="role"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    placeholder="e.g. Senior Engineer"
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-800 mb-4">
                {t("memberAssessment.competencies")}
              </h2>
              <div className="space-y-3">
                {VERTICALS.map((vertical) => (
                  <LevelSelector
                    key={vertical}
                    vertical={vertical}
                    currentLevel={currentLevels[vertical] || 0}
                    goalLevel={goalLevels[vertical] || 0}
                    selfAssessmentLevel={selfAssessmentLevels[vertical] || 0}
                    comment={comments[vertical] || ""}
                    onCurrentChange={(level) => handleCurrentChange(vertical, level)}
                    onGoalChange={(level) => handleGoalChange(vertical, level)}
                    onCommentChange={(value) => handleCommentChange(vertical, value)}
                    expanded={expandedVertical === vertical}
                    onToggle={() =>
                      setExpandedVertical((prev) => (prev === vertical ? null : vertical))
                    }
                    hideGoal={false}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Preview */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-800 mb-6 text-center">
                {t("memberAssessment.preview", { name: name || t("memberAssessment.member") })}
              </h2>

              <div className="flex justify-center mb-8">
                <RadarChart
                  currentLevels={currentLevels}
                  goalLevels={goalLevels}
                  selfAssessmentLevels={selfAssessmentLevels}
                  size={350}
                />
              </div>

              {/* Summary Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                  <p className="text-xs text-emerald-600 font-medium mb-1">
                    {t("memberAssessment.currentAverage")}
                  </p>
                  <p className="text-2xl font-bold text-emerald-700">
                    {Object.values(currentLevels).length > 0
                      ? (
                          Object.values(currentLevels).reduce(
                            (a, b) => (a as number) + (b as number),
                            0
                          ) / VERTICALS.length
                        ).toFixed(1)
                      : "0.0"}
                  </p>
                </div>
                <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                  <p className="text-xs text-amber-600 font-medium mb-1">
                    {t("memberAssessment.goalAverage")}
                  </p>
                  <p className="text-2xl font-bold text-amber-700">
                    {Object.values(goalLevels).length > 0
                      ? (
                          Object.values(goalLevels).reduce(
                            (a, b) => (a as number) + (b as number),
                            0
                          ) / VERTICALS.length
                        ).toFixed(1)
                      : "0.0"}
                  </p>
                </div>
              </div>

              {/* Progress by Vertical */}
              <div className="mt-6 space-y-3">
                <h3 className="text-sm font-semibold text-slate-700">
                  {t("memberAssessment.competencyLevels")}
                </h3>
                {VERTICALS.map((vertical) => {
                  const current = currentLevels[vertical] || 0;
                  const goal = goalLevels[vertical] || 0;
                  const self = selfAssessmentLevels[vertical] || 0;

                  return (
                    <div key={vertical} className="flex items-center justify-between text-sm">
                      <span className="text-slate-600 font-medium">{vertical}</span>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full bg-emerald-500" />
                          <span className="text-slate-500 w-8">L{current || 0}</span>
                        </div>
                        {self > 0 && (
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-purple-500" />
                            <span className="text-slate-500 w-8">L{self}</span>
                          </div>
                        )}
                        {goal > 0 && goal !== current && (
                          <div className="flex items-center gap-1">
                            <span className="text-slate-400">→</span>
                            <div className="w-2 h-2 rounded-full bg-amber-500" />
                            <span className="text-slate-500 w-8">L{goal}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
