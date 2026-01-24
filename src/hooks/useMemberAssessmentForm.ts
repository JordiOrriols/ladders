import { useCallback, useEffect, useMemo, useState } from "react";
import type { TFunction } from "i18next";
import { VERTICALS } from "@/components/atoms/levelSelector";
import type { Member } from "@/types";
import { buildShareLink, copyToClipboard, importJsonFromFile } from "@/utils/sharing";
import { clearStorageKey, loadFromStorage, saveToStorageDebounced } from "@/utils/storage";

const STORAGE_KEY = "engineering-ladder-data";
const STORAGE_VERSION = 1;

type LevelMap = Record<string, number>;
type CommentMap = Record<string, string>;

type Translator = TFunction<"translation">;

type SelfAssessmentPayload = {
  name?: string;
  role?: string;
  currentLevels?: LevelMap;
  goalLevels?: LevelMap;
  comments?: CommentMap;
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

const isSelfAssessmentPayload = (value: unknown): value is SelfAssessmentPayload => {
  if (!isRecord(value)) return false;
  const { name, role, currentLevels, goalLevels, comments } = value;
  const validName = typeof name === "string" || typeof name === "undefined";
  const validRole = typeof role === "string" || typeof role === "undefined";
  const validCurrent = typeof currentLevels === "undefined" || isLevelMap(currentLevels);
  const validGoal = typeof goalLevels === "undefined" || isLevelMap(goalLevels);
  const validComments = typeof comments === "undefined" || isCommentMap(comments);
  return validName && validRole && validCurrent && validGoal && validComments;
};

function computeAverage(levels: LevelMap): number {
  if (Object.keys(levels).length === 0) return 0;
  const total = Object.values(levels).reduce((sum, value) => sum + value, 0);
  return total / VERTICALS.length;
}

export function useMemberAssessmentForm(memberId: string | null, t: Translator) {
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [currentLevels, setCurrentLevels] = useState<LevelMap>({});
  const [goalLevels, setGoalLevels] = useState<LevelMap>({});
  const [selfAssessmentLevels, setSelfAssessmentLevels] = useState<LevelMap>({});
  const [comments, setComments] = useState<CommentMap>({});
  const [expandedVertical, setExpandedVertical] = useState<string | null>(VERTICALS[0] ?? null);
  const [members, setMembers] = useState<Member[]>([]);
  const [draftId, setDraftId] = useState<string>(() => memberId ?? Date.now().toString());

  // Load members once
  useEffect(() => {
    const loaded = loadFromStorage<Member[]>(STORAGE_KEY, isMemberList, STORAGE_VERSION);
    if (loaded) {
      setMembers(loaded);
    }
  }, []);

  // Hydrate form when editing an existing member
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

  const persistMembers = useCallback(
    (updater: (prev: Member[]) => Member[]) => {
      setMembers((prev) => {
        const next = updater(prev);
        saveToStorageDebounced(STORAGE_KEY, next, STORAGE_VERSION);
        return next;
      });
    },
    []
  );

  // Persist whenever form changes and name is present
  useEffect(() => {
    if (!name.trim()) return;
    const payload: Member = {
      id: draftId,
      name: name.trim(),
      role: role.trim(),
      currentLevels,
      goalLevels,
      selfAssessmentLevels,
      comments,
    };

    persistMembers((prev) => {
      const exists = prev.find((m) => m.id === payload.id);
      return exists ? prev.map((m) => (m.id === payload.id ? payload : m)) : [...prev, payload];
    });
  }, [name, role, currentLevels, goalLevels, selfAssessmentLevels, comments, draftId, persistMembers]);

  const handleCurrentChange = useCallback((vertical: string, level: number) => {
    setCurrentLevels((prev) => ({ ...prev, [vertical]: level }));
  }, []);

  const handleGoalChange = useCallback((vertical: string, level: number) => {
    setGoalLevels((prev) => ({ ...prev, [vertical]: level }));
  }, []);

  const handleCommentChange = useCallback((vertical: string, value: string) => {
    setComments((prev) => ({ ...prev, [vertical]: value }));
  }, []);

  const handleImportSelfAssessment = useCallback(
    async (file?: File) => {
      const importFromData = (data: SelfAssessmentPayload) => {
        if (!isSelfAssessmentPayload(data)) {
          alert(t("alerts.failedToImportSelfAssessment"));
          return;
        }
        const importedSelfLevels = data.currentLevels || {};
        setSelfAssessmentLevels(importedSelfLevels);
        if (!name && data.name) setName(data.name);
        if (!role && data.role) setRole(data.role);
        alert(t("alerts.importSelfAssessmentSuccess"));
      };

      if (file) {
        try {
          const parsed = await importJsonFromFile<SelfAssessmentPayload>(file, isSelfAssessmentPayload);
          importFromData(parsed);
        } catch (error) {
          console.error("Failed to import self-assessment", error);
          alert(t("alerts.failedToImportSelfAssessment"));
        }
        return;
      }

      const raw = loadFromStorage<SelfAssessmentPayload>("self-assessment-data", isSelfAssessmentPayload);
      if (!raw) {
        alert(t("alerts.noSelfAssessmentFound"));
        return;
      }
      importFromData(raw);
    },
    [name, role, t]
  );

  const handleShareLink = useCallback(async () => {
    const url = buildShareLink("SelfAssessment");
    try {
      await copyToClipboard(url);
      alert(t("alerts.shareLinkCopied"));
    } catch (error) {
      console.error("Failed to copy share link", error);
      alert(t("alerts.failedToCopyLink"));
    }
  }, [t]);

  const removeMember = useCallback((id: string) => {
    persistMembers((prev) => prev.filter((m) => m.id !== id));
    if (id === draftId) {
      setDraftId(Date.now().toString());
      setName("");
      setRole("");
      setCurrentLevels({});
      setGoalLevels({});
      setSelfAssessmentLevels({});
      setComments({});
    }
  }, [draftId, persistMembers]);

  const verticalStats = useMemo(
    () =>
      VERTICALS.map((vertical) => {
        const current = currentLevels[vertical] || 0;
        const goal = goalLevels[vertical] || 0;
        const self = selfAssessmentLevels[vertical] || 0;
        return { vertical, current, goal, self };
      }),
    [currentLevels, goalLevels, selfAssessmentLevels]
  );

  const currentAverage = useMemo(() => computeAverage(currentLevels), [currentLevels]);
  const goalAverage = useMemo(() => computeAverage(goalLevels), [goalLevels]);

  const resetStorage = useCallback(() => {
    clearStorageKey(STORAGE_KEY);
    setMembers([]);
  }, []);

  return {
    state: {
      name,
      role,
      currentLevels,
      goalLevels,
      selfAssessmentLevels,
      comments,
      expandedVertical,
      members,
      verticalStats,
      currentAverage,
      goalAverage,
    },
    setName,
    setRole,
    setExpandedVertical,
    handleCurrentChange,
    handleGoalChange,
    handleCommentChange,
    handleImportSelfAssessment,
    handleShareLink,
    removeMember,
    resetStorage,
  };
}
