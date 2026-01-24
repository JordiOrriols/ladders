import { useCallback, useEffect, useMemo, useState } from "react";
import type { TFunction } from "i18next";
import { VERTICALS } from "@/components/atoms/levelSelector";
import { buildShareLink, copyToClipboard, exportJson, importJsonFromFile } from "@/utils/sharing";
import { clearStorageKey, loadFromStorage, saveToStorageDebounced } from "@/utils/storage";

const STORAGE_KEY = "self-assessment-data";
const STORAGE_VERSION = 1;

type LevelMap = Record<string, number>;
type CommentMap = Record<string, string>;

type Translator = TFunction<"translation">;

type SelfAssessment = {
  name: string;
  role: string;
  currentLevels: LevelMap;
  goalLevels: LevelMap;
  comments: CommentMap;
  exportedAt?: string;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);

const isLevelMap = (value: unknown): value is LevelMap => {
  if (!isRecord(value)) return false;
  return Object.values(value).every((v) => typeof v === "number");
};

const isCommentMap = (value: unknown): value is CommentMap => {
  if (!isRecord(value)) return false;
  return Object.values(value).every((v) => typeof v === "string");
};

const isSelfAssessment = (value: unknown): value is SelfAssessment => {
  if (!isRecord(value)) return false;
  const { name, role, currentLevels, goalLevels, comments } = value;
  return (
    typeof name === "string" &&
    typeof role === "string" &&
    isLevelMap(currentLevels) &&
    isLevelMap(goalLevels) &&
    isCommentMap(comments)
  );
};

export function useSelfAssessmentForm(t: Translator) {
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [currentLevels, setCurrentLevels] = useState<LevelMap>({});
  const [goalLevels, setGoalLevels] = useState<LevelMap>({});
  const [comments, setComments] = useState<CommentMap>({});
  const [expandedVertical, setExpandedVertical] = useState<string | null>(null);

  useEffect(() => {
    const saved = loadFromStorage<SelfAssessment>(STORAGE_KEY, isSelfAssessment, STORAGE_VERSION);
    if (saved) {
      setName(saved.name || "");
      setRole(saved.role || "");
      setCurrentLevels(saved.currentLevels || {});
      setGoalLevels(saved.goalLevels || {});
      setComments(saved.comments || {});
    }
  }, []);

  const persist = useCallback(
    (next: SelfAssessment) => {
      saveToStorageDebounced(STORAGE_KEY, next, STORAGE_VERSION);
    },
    []
  );

  // Persist on change
  useEffect(() => {
    persist({ name, role, currentLevels, goalLevels, comments });
  }, [name, role, currentLevels, goalLevels, comments, persist]);

  const handleNameChange = useCallback((value: string) => setName(value), []);
  const handleRoleChange = useCallback((value: string) => setRole(value), []);

  const handleCurrentChange = useCallback((vertical: string, level: number) => {
    setCurrentLevels((prev) => ({ ...prev, [vertical]: level }));
  }, []);

  const handleGoalChange = useCallback((vertical: string, level: number) => {
    setGoalLevels((prev) => ({ ...prev, [vertical]: level }));
  }, []);

  const handleCommentChange = useCallback((vertical: string, value: string) => {
    setComments((prev) => ({ ...prev, [vertical]: value }));
  }, []);

  const handleExport = useCallback(() => {
    if (!name.trim()) return;
    exportJson(`assessment-${name.replace(/\s+/g, "-") || "unnamed"}`, {
      name,
      role,
      currentLevels,
      goalLevels,
      comments,
      exportedAt: new Date().toISOString(),
    });
  }, [comments, currentLevels, goalLevels, name, role]);

  const handleImport = useCallback(
    async (file: File) => {
      try {
        const data = await importJsonFromFile<SelfAssessment>(file, isSelfAssessment);
        setName(data.name || "");
        setRole(data.role || "");
        setCurrentLevels(data.currentLevels || {});
        setGoalLevels(data.goalLevels || {});
        setComments(data.comments || {});
      } catch (error) {
        console.error("Failed to import assessment", error);
        alert(t("alerts.failedToImportSelfAssessment"));
      }
    },
    [t]
  );

  const handleShareLink = useCallback(async () => {
    const url = buildShareLink("SelfAssessment");
    try {
      await copyToClipboard(url);
      alert(t("alerts.linkCopied"));
    } catch (error) {
      console.error("Failed to copy share link", error);
      alert(t("alerts.failedToCopyLink"));
    }
  }, [t]);

  const handleClear = useCallback(() => {
    setName("");
    setRole("");
    setCurrentLevels({});
    setGoalLevels({});
    setComments({});
    clearStorageKey(STORAGE_KEY);
  }, []);

  const verticalStats = useMemo(
    () =>
      VERTICALS.map((vertical) => ({
        vertical,
        current: currentLevels[vertical] || 0,
        goal: goalLevels[vertical] || 0,
      })),
    [currentLevels, goalLevels]
  );

  const currentAverage = useMemo(() => {
    if (Object.keys(currentLevels).length === 0) return 0;
    const total = Object.values(currentLevels).reduce((sum, value) => sum + value, 0);
    return total / VERTICALS.length;
  }, [currentLevels]);

  return {
    state: {
      name,
      role,
      currentLevels,
      goalLevels,
      comments,
      expandedVertical,
      verticalStats,
      currentAverage,
    },
    setExpandedVertical,
    handleNameChange,
    handleRoleChange,
    handleCurrentChange,
    handleGoalChange,
    handleCommentChange,
    handleExport,
    handleImport,
    handleClear,
    handleShareLink,
  };
}
