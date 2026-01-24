import React, { useState, useEffect } from "react";
import { X, Upload, Share2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import LevelSelector from "./levelSelector";
import { VERTICALS } from "./levelSelector";
import RadarChart from "./radarChart";

export default function MemberForm({ member, onSave, onClose }) {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [currentLevels, setCurrentLevels] = useState({});
  const [goalLevels, setGoalLevels] = useState({});
  const [selfAssessmentLevels, setSelfAssessmentLevels] = useState({});
  const [comments, setComments] = useState<Record<string, string>>({});
  const [expandedVertical, setExpandedVertical] = useState<string | null>(null);

  console.log("[MemberForm] Rendered with member:", member?.name, "editing:", !!member);

  useEffect(() => {
    if (member) {
      console.log("[MemberForm] useEffect: Loading member data for", member.name);
      setName(member.name || "");
      setRole(member.role || "");
      setCurrentLevels(member.currentLevels || {});
      setGoalLevels(member.goalLevels || {});
      setSelfAssessmentLevels(member.selfAssessmentLevels || {});
      setComments(member.comments || {});
    }
  }, [member]);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      console.log("[MemberForm] Backdrop clicked - closing");
      onClose();
    }
  };

  const handleDialogClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
  };

  const handleFormClick = (e: React.MouseEvent<HTMLFormElement>) => {
    e.stopPropagation();
  };

  const handleNameInputChange = (value: string) => setName(value);
  const handleRoleInputChange = (value: string) => setRole(value);

  const handleImportClick = () => {
    document.getElementById("import-assessment-file")?.click();
  };

  const handleToggleVertical = (vertical: string) => {
    setExpandedVertical((prev) => (prev === vertical ? null : vertical));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("[MemberForm] handleSubmit called");
    if (!name.trim()) return;

    onSave({
      id: member?.id || Date.now().toString(),
      name: name.trim(),
      role: role.trim(),
      currentLevels,
      goalLevels,
      comments,
      selfAssessmentLevels,
    });
  };

  const handleImportAssessment = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const result = e.target?.result as string;
        const data = JSON.parse(result);
        if (data.name && !name) {
          setName(data.name);
        }
        if (data.role && !role) {
          setRole(data.role);
        }
        if (data.currentLevels) {
          setSelfAssessmentLevels(data.currentLevels);
        }
      } catch {
        alert(t("validation.importError"));
      }
    };
    reader.readAsText(file);
    event.target.value = "";
  };

  const handleCurrentChange = (vertical, level) => {
    console.log("[LevelSelector] Current level changed for", vertical, "to", level);
    setCurrentLevels((prev) => ({ ...prev, [vertical]: level }));
  };

  const handleGoalChange = (vertical, level) => {
    console.log("[LevelSelector] Goal level changed for", vertical, "to", level);
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
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center overflow-y-auto py-8"
      onClick={handleBackdropClick}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl mx-4"
        onClick={handleDialogClick}
      >
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-xl font-semibold text-slate-800">
            {member ? t("forms.editTeamMember") : t("forms.addTeamMember")}
          </h2>
          <Button size="icon" variant="ghost" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} onClick={handleFormClick} onMouseDown={handleFormClick}>
          <div className="p-6 grid lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">{t("forms.name")}</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => handleNameInputChange(e.target.value)}
                    placeholder={t("forms.name")}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="role">{t("forms.role")}</Label>
                  <Input
                    id="role"
                    value={role}
                    onChange={(e) => handleRoleInputChange(e.target.value)}
                    placeholder="e.g. Senior Engineer"
                    className="mt-1"
                  />
                </div>
                <div>
                  <input
                    type="file"
                    id="import-assessment-file"
                    accept=".json"
                    onChange={handleImportAssessment}
                    className="hidden"
                  />
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      onClick={handleImportClick}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {t("buttons.importAssessment")}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      onClick={handleShareLink}
                    >
                      <Share2 className="w-4 h-4 mr-2" />
                      Share Link
                    </Button>
                  </div>
                  {Object.keys(selfAssessmentLevels).length > 0 && (
                    <p className="text-xs text-slate-500 mt-1">{t("validation.importSuccess")}</p>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <Label>{t("forms.competencies")}</Label>
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
                    onToggle={() => handleToggleVertical(vertical)}
                  />
                ))}
              </div>
            </div>

            <div className="flex flex-col items-center justify-center lg:sticky lg:top-6">
              <h3 className="text-sm font-medium text-slate-500 mb-4">{t("forms.preview")}</h3>
              <RadarChart
                currentLevels={currentLevels}
                goalLevels={goalLevels}
                selfAssessmentLevels={selfAssessmentLevels}
                size={320}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 p-6 border-t border-slate-200 bg-slate-50 rounded-b-2xl">
            <Button type="button" variant="outline" onClick={onClose}>
              {t("buttons.cancel")}
            </Button>
            <Button type="submit" disabled={!name.trim()}>
              {member ? t("buttons.save") : t("buttons.add")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
