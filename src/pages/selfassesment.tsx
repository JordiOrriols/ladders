import React, { useState, useEffect } from "react";
import { ArrowLeft, Download, Upload, Trash2, LayoutGrid } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
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

export default function SelfAssessment() {
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [currentLevels, setCurrentLevels] = useState<Record<string, number>>({});
  const [goalLevels, setGoalLevels] = useState<Record<string, number>>({});
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
    saveToLocalStorage({ name: value, role, currentLevels, goalLevels });
  };

  const handleRoleChange = (value) => {
    setRole(value);
    saveToLocalStorage({ name, role: value, currentLevels, goalLevels });
  };

  const handleCurrentChange = (vertical, level) => {
    const updated = { ...currentLevels, [vertical]: level };
    setCurrentLevels(updated);
    saveToLocalStorage({ name, role, currentLevels: updated, goalLevels });
  };

  const handleGoalChange = (vertical, level) => {
    const updated = { ...goalLevels, [vertical]: level };
    setGoalLevels(updated);
    saveToLocalStorage({ name, role, currentLevels, goalLevels: updated });
  };

  const handleExport = () => {
    const data = {
      name,
      role,
      currentLevels,
      goalLevels,
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

  const handleImport = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const result = e.target?.result as string;
        const data = JSON.parse(result);
        setName(data.name || "");
        setRole(data.role || "");
        setCurrentLevels(data.currentLevels || {});
        setGoalLevels(data.goalLevels || {});
        saveToLocalStorage(data);
      } catch {
        alert("Failed to import file. Please ensure it's a valid JSON file.");
      }
    };
    reader.readAsText(file);
    event.target.value = "";
  };

  const handleClear = () => {
    setName("");
    setRole("");
    setCurrentLevels({});
    setGoalLevels({});
    localStorage.removeItem(STORAGE_KEY);
    setShowClearDialog(false);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Link to={createPageUrl("Home")}>
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                  <LayoutGrid className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-slate-800">Self Assessment</h1>
                  <p className="text-xs text-slate-500">Evaluate your competencies</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="file"
                id="import-file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => document.getElementById("import-file")?.click()}
              >
                <Upload className="w-4 h-4 mr-2" />
                Import
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowClearDialog(true)}>
                <Trash2 className="w-4 h-4 mr-2" />
                Clear
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
              <h2 className="text-lg font-semibold text-slate-800 mb-4">Personal Information</h2>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="Enter your name"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="role">Role (optional)</Label>
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
              <h2 className="text-lg font-semibold text-slate-800 mb-4">Competencies</h2>
              <div className="space-y-3">
                {VERTICALS.map((vertical) => (
                  <LevelSelector
                    key={vertical}
                    vertical={vertical}
                    currentLevel={currentLevels[vertical] || 0}
                    goalLevel={goalLevels[vertical] || 0}
                    onCurrentChange={(level) => handleCurrentChange(vertical, level)}
                    onGoalChange={(level) => handleGoalChange(vertical, level)}
                  />
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border border-indigo-200 p-6">
              <h3 className="font-semibold text-indigo-900 mb-2">How to use</h3>
              <ul className="text-sm text-indigo-700 space-y-1">
                <li>• Set your current level for each competency</li>
                <li>• Set your goal levels for future growth</li>
                <li>• All changes are saved automatically</li>
                <li>• Export your assessment as JSON to share with your manager</li>
                <li>• Import a previous assessment to continue editing</li>
              </ul>
            </div>
          </div>

          {/* Right Column - Preview */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-800 mb-6 text-center">
                {name || "Your Assessment"} Preview
              </h2>

              <div className="flex justify-center mb-8">
                <RadarChart currentLevels={currentLevels} goalLevels={goalLevels} size={350} />
              </div>

              {/* Summary Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                  <p className="text-xs text-emerald-600 font-medium mb-1">Current Average</p>
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
                <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                  <p className="text-xs text-amber-600 font-medium mb-1">Goal Average</p>
                  <p className="text-2xl font-bold text-amber-700">
                    {Object.values(goalLevels).length > 0
                      ? (
                          Object.values(goalLevels).reduce(
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
                <h3 className="text-sm font-semibold text-slate-700">Competency Levels</h3>
                {VERTICALS.map((vertical) => {
                  const current = currentLevels[vertical] || 0;
                  const goal = goalLevels[vertical] || 0;

                  return (
                    <div key={vertical} className="flex items-center justify-between text-sm">
                      <span className="text-slate-600 font-medium">{vertical}</span>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full bg-emerald-500" />
                          <span className="text-slate-500 w-8">L{current || 0}</span>
                        </div>
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

      {/* Clear Confirmation Dialog */}
      <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear all assessment data?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove all your assessment data including name, role, and all competency
              levels. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleClear} className="bg-red-500 hover:bg-red-600">
              Clear All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
