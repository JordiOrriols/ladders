import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Download, Trash2, LayoutGrid, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import LevelSelector from "@/components/atoms/levelSelector";
import RadarChart from "@/components/atoms/radarChart";
import { VERTICALS } from "@/components/atoms/levelSelector";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const STORAGE_KEY = "self-assessment-data";

const formatLevel = (level: number): string => {
  return level % 1 === 0 ? `${level}` : `${level}`;
};

export default function SelfAssessment() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [currentLevels, setCurrentLevels] = useState<Record<string, number>>({});
  const [goalLevels, setGoalLevels] = useState<Record<string, number>>({});
  const [comments, setComments] = useState<Record<string, string>>({});
  const [expandedVertical, setExpandedVertical] = useState<string | null>(null);
  const [showClearDialog, setShowClearDialog] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setName(data.name || "");
        setRole(data.role || "");
        setCurrentLevels(data.currentLevels || {});
        setGoalLevels(data.goalLevels || {});
        setComments(data.comments || {});
      } catch (e) {
        console.error("Failed to load assessment data", e);
      }
    }
  }, []);

  // Save to localStorage on every change
  const saveToLocalStorage = (data) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  };

  const handleNameChange = (value) => {
    setName(value);
    saveToLocalStorage({ name: value, role, currentLevels, goalLevels, comments });
  };

  const handleRoleChange = (value) => {
    setRole(value);
    saveToLocalStorage({ name, role: value, currentLevels, goalLevels, comments });
  };

  const handleCurrentChange = (vertical, level) => {
    const updated = { ...currentLevels, [vertical]: level };
    setCurrentLevels(updated);
    saveToLocalStorage({ name, role, currentLevels: updated, goalLevels, comments });
  };

  const handleGoalChange = (vertical, level) => {
    const updated = { ...goalLevels, [vertical]: level };
    setGoalLevels(updated);
    saveToLocalStorage({ name, role, currentLevels, goalLevels: updated, comments });
  };

  const handleCommentChange = (vertical, value) => {
    const updated = { ...comments, [vertical]: value };
    setComments(updated);
    saveToLocalStorage({ name, role, currentLevels, goalLevels, comments: updated });
  };

  const handleExport = () => {
    const data = {
      name,
      role,
      currentLevels,
      goalLevels,
      comments,
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `assessment-${name.replace(/\s+/g, "-").toLowerCase() || "unnamed"}-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleClear = () => {
    setName("");
    setRole("");
    setCurrentLevels({});
    setGoalLevels({});
    setComments({});
    localStorage.removeItem(STORAGE_KEY);
    setShowClearDialog(false);
  };

  const handleShareLink = () => {
    const base = `${window.location.origin}${window.location.pathname}`.replace(/#.*$/, "");
    const url = `${base}#/SelfAssessment`;
    navigator.clipboard
      .writeText(url)
      .then(() => {
        alert(t("alerts.linkCopied"));
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
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                  <LayoutGrid className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-slate-800">{t("selfAssessment.title")}</h1>
                  <p className="text-xs text-slate-500">{t("selfAssessment.subtitle")}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleShareLink}>
                <Share2 className="w-4 h-4 mr-2" />
                {t("selfAssessment.shareLink")}
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowClearDialog(true)}>
                <Trash2 className="w-4 h-4 mr-2" />
                {t("buttons.clear")}
              </Button>
              <Button onClick={handleExport} disabled={!name.trim()}>
                <Download className="w-4 h-4 mr-2" />
                Export
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
              <h2 className="text-lg font-semibold text-slate-800 mb-4">{t("selfAssessment.personalInfo")}</h2>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">{t("forms.name")}</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="Enter your name"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="role">{t("forms.role")}</Label>
                  <Input
                    id="role"
                    value={role}
                    onChange={(e) => handleRoleChange(e.target.value)}
                    placeholder="e.g. Senior Engineer"
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-800 mb-4">{t("selfAssessment.competencies")}</h2>
              <div className="space-y-3">
                {VERTICALS.map((vertical) => (
                  <LevelSelector
                    key={vertical}
                    vertical={vertical}
                    currentLevel={currentLevels[vertical] || 0}
                    goalLevel={goalLevels[vertical] || 0}
                    comment={comments[vertical] || ""}
                    onCurrentChange={(level) => handleCurrentChange(vertical, level)}
                    onGoalChange={(level) => handleGoalChange(vertical, level)}
                    onCommentChange={(value) => handleCommentChange(vertical, value)}
                    expanded={expandedVertical === vertical}
                    onToggle={() =>
                      setExpandedVertical((prev) => (prev === vertical ? null : vertical))
                    }
                    hideGoal={true}
                  />
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border border-indigo-200 p-6">
              <h3 className="font-semibold text-indigo-900 mb-2">{t("selfAssessment.howToUse")}</h3>
              <ul className="text-sm text-indigo-700 space-y-1">
                {(t("selfAssessment.howToUseItems", { returnObjects: true }) as string[]).map((item, i) => (
                  <li key={i}>• {item}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Right Column - Preview */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-800 mb-6 text-center">
                {t("selfAssessment.preview", { name: name || t("selfAssessment.yourAssessment") })}
              </h2>

              <div className="flex justify-center mb-8">
                <RadarChart
                  currentLevels={currentLevels}
                  goalLevels={goalLevels}
                  hideGoal={true}
                  size={350}
                />
              </div>

              {/* Summary Stats */}
              <div className="grid grid-cols-1 gap-4">
                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                  <p className="text-xs text-emerald-600 font-medium mb-1">{t("selfAssessment.currentAverage")}</p>
                  <p className="text-2xl font-bold text-emerald-700">
                    {Object.values(currentLevels).length > 0
                      ? (
                          Object.values(currentLevels).reduce(
                            (a, b) => (a as number) + (b as number),
                            0
                          ) / 5
                        ).toFixed(1)
                      : "0.0"}
                  </p>
                </div>
              </div>

              {/* Progress by Vertical */}
              <div className="mt-6 space-y-3">
                <h3 className="text-sm font-semibold text-slate-700">{t("selfAssessment.competencyLevels")}</h3>
                {VERTICALS.map((vertical) => {
                  const current = currentLevels[vertical] || 0;

                  return (
                    <div key={vertical} className="flex items-center justify-between text-sm">
                      <span className="text-slate-600 font-medium">{vertical}</span>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full bg-emerald-500" />
                          <span className="text-slate-500 w-8">L{formatLevel(current)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Clear Confirmation Dialog */}
      <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("selfAssessment.clearConfirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("selfAssessment.clearConfirmDesc")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("buttons.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleClear} className="bg-red-500 hover:bg-red-600">
              {t("selfAssessment.clearAll")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
