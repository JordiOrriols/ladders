import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Save, Users, Share2 } from "lucide-react";
import LevelSelector, { VERTICALS } from "@/components/atoms/levelSelector";
import RadarChart from "@/components/atoms/radarChart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Member } from "@/types";

const STORAGE_KEY = "engineering-ladder-data";

export default function MemberAssessmentPage() {
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

  const members = useMemo(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return [] as Member[];
    try {
      return JSON.parse(saved) as Member[];
    } catch (e) {
      console.error("Failed to parse members", e);
      return [] as Member[];
    }
  }, []);

  useEffect(() => {
    if (!memberId) return;
    const found = members.find((m) => m.id === memberId);
    if (found) {
      setName(found.name || "");
      setRole(found.role || "");
      setCurrentLevels(found.currentLevels || {});
      setGoalLevels(found.goalLevels || {});
      setSelfAssessmentLevels(found.selfAssessmentLevels || {});
      setComments(found.comments || {});
    }
  }, [memberId, members]);

  const persist = (updatedMembers: Member[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedMembers));
  };

  const handleSave = () => {
    if (!name.trim()) return;
    const payload: Member = {
      id: memberId || Date.now().toString(),
      name: name.trim(),
      role: role.trim(),
      currentLevels,
      goalLevels,
      selfAssessmentLevels,
      comments,
    };

    const exists = members.find((m) => m.id === payload.id);
    const next = exists
      ? members.map((m) => (m.id === payload.id ? payload : m))
      : [...members, payload];

    persist(next);
    navigate("/");
  };

  const handleCurrentChange = (vertical: string, level: number) => {
    setCurrentLevels((prev) => ({ ...prev, [vertical]: level }));
  };

  const handleGoalChange = (vertical: string, level: number) => {
    setGoalLevels((prev) => ({ ...prev, [vertical]: level }));
  };

  const handleCommentChange = (vertical: string, value: string) => {
    setComments((prev) => ({ ...prev, [vertical]: value }));
  };

  const handleShareLink = () => {
    const base = `${window.location.origin}${window.location.pathname}`.replace(/#.*$/, "");
    const url = `${base}#/SelfAssessment`;
    navigator.clipboard
      .writeText(url)
      .then(() => {
        alert("Self-assessment link copied to clipboard!");
      })
      .catch(() => {
        alert("Failed to copy link");
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
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-slate-800">Team Member Assessment</h1>
                  <p className="text-xs text-slate-500">Full-page editor matching Self Assessment</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={handleShareLink}>
                <Share2 className="w-4 h-4 mr-2" />
                Share Self-Assessment
              </Button>
              <Button onClick={handleSave} disabled={!name.trim()}>
                <Save className="w-4 h-4 mr-2" />
                Save Member
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
              <h2 className="text-lg font-semibold text-slate-800 mb-4">Personal Information</h2>
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
              <h2 className="text-lg font-semibold text-slate-800 mb-4">Competencies</h2>
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
                {name || "Member"} Preview
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
                  <p className="text-xs text-emerald-600 font-medium mb-1">Current Average</p>
                  <p className="text-2xl font-bold text-emerald-700">
                    {Object.values(currentLevels).length > 0
                      ? (
                          Object.values(currentLevels).reduce((a, b) => (a as number) + (b as number), 0) /
                          VERTICALS.length
                        ).toFixed(1)
                      : "0.0"}
                  </p>
                </div>
                <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                  <p className="text-xs text-amber-600 font-medium mb-1">Goal Average</p>
                  <p className="text-2xl font-bold text-amber-700">
                    {Object.values(goalLevels).length > 0
                      ? (
                          Object.values(goalLevels).reduce((a, b) => (a as number) + (b as number), 0) /
                          VERTICALS.length
                        ).toFixed(1)
                      : "0.0"}
                  </p>
                </div>
              </div>

              {/* Progress by Vertical */}
              <div className="mt-6 space-y-3">
                <h3 className="text-sm font-semibold text-slate-700">Competency Levels</h3>
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
