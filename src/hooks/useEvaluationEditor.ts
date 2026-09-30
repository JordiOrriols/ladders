import { useCallback, useEffect, useMemo, useState } from "react";
import { VERTICALS } from "@/components/atoms/levelSelector";
import { byNewest, computeAverage, inputsFromAssessmentFile, latestOf } from "@/data/evaluations";
import type { EvaluationStore } from "@/data/evaluationStore";
import { isAssessmentFile } from "@/data/validators";
import type {
  CommentMap,
  Evaluation,
  EvaluationStatus,
  LevelMap,
  MemberProfile,
  TeamMember,
} from "@/types";
import { exportJson, importJsonFromFile } from "@/utils/sharing";
import { useVersionSelection } from "./useVersionSelection";

type FormState = { currentLevels: LevelMap; goalLevels: LevelMap; comments: CommentMap };
type LoadState = "loading" | "ready" | "notFound" | "error";

const EMPTY_FORM: FormState = { currentLevels: {}, goalLevels: {}, comments: {} };
const EMPTY_PROFILE: MemberProfile = { name: "", role: "", templateId: null };

const formFrom = (evaluation: Evaluation | undefined): FormState =>
  evaluation
    ? {
        currentLevels: evaluation.currentLevels,
        goalLevels: evaluation.goalLevels,
        comments: evaluation.comments,
      }
    : EMPTY_FORM;

export class EditorValidationError extends Error {}

/** Shared editor for manager, self and peer evaluations; every save creates a new version. */
export function useEvaluationEditor(store: EvaluationStore) {
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [profile, setProfile] = useState<MemberProfile>(EMPTY_PROFILE);
  const [member, setMember] = useState<TeamMember | null>(null);
  const [authorName, setAuthorName] = useState("");
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedVertical, setExpandedVertical] = useState<string | null>(VERTICALS[0] ?? null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const selection = useVersionSelection(evaluations, store.kind);

  const load = useCallback(async () => {
    setLoadState("loading");
    try {
      const snapshot = await store.load();
      if (!snapshot) {
        setLoadState("notFound");
        return;
      }
      setProfile(snapshot.profile);
      setMember(snapshot.member ?? null);
      setEvaluations(snapshot.evaluations);
      setForm(formFrom(latestOf(snapshot.evaluations, store.kind)));
      setEditingId(null);
      setDirty(false);
      setLoadState("ready");
    } catch (error) {
      console.error("Failed to load evaluations", error);
      setLoadState("error");
    }
  }, [store]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const updateForm = useCallback((patch: (prev: FormState) => FormState) => {
    setForm(patch);
    setDirty(true);
  }, []);

  const handleCurrentChange = useCallback(
    (vertical: string, level: number) =>
      updateForm((prev) => ({
        ...prev,
        currentLevels: { ...prev.currentLevels, [vertical]: level },
      })),
    [updateForm]
  );
  const handleGoalChange = useCallback(
    (vertical: string, level: number) =>
      updateForm((prev) => ({ ...prev, goalLevels: { ...prev.goalLevels, [vertical]: level } })),
    [updateForm]
  );
  const handleCommentChange = useCallback(
    (vertical: string, value: string) =>
      updateForm((prev) => ({ ...prev, comments: { ...prev.comments, [vertical]: value } })),
    [updateForm]
  );
  const updateProfile = useCallback((patch: Partial<MemberProfile>) => {
    setProfile((prev) => ({ ...prev, ...patch }));
    setDirty(true);
  }, []);
  const toggleVertical = useCallback(
    (vertical: string) => setExpandedVertical((prev) => (prev === vertical ? null : vertical)),
    []
  );

  /** Own-kind versions load into the form; other kinds toggle on the radar. */
  const selectVersion = useCallback(
    (id: string) => {
      const evaluation = evaluations.find((e) => e.id === id);
      if (!evaluation) return;
      if (evaluation.kind !== store.kind) {
        selection.toggleCompare(id);
        return;
      }
      setEditingId(id);
      setForm(formFrom(evaluation));
      setDirty(false);
    },
    [evaluations, selection, store.kind]
  );

  const startNewVersion = useCallback(() => {
    setEditingId(null);
    setForm(formFrom(latestOf(evaluations, store.kind)));
    setDirty(false);
  }, [evaluations, store.kind]);

  const save = useCallback(
    async (status: EvaluationStatus) => {
      if (store.editableProfile && !profile.name.trim()) {
        throw new EditorValidationError("nameRequired");
      }
      if (store.kind === "peer" && !authorName.trim()) {
        throw new EditorValidationError("authorRequired");
      }
      setSaving(true);
      try {
        if (store.editableProfile) {
          await store.saveProfile({
            ...profile,
            name: profile.name.trim(),
            role: profile.role.trim(),
          });
        }
        const created = await store.create({
          status,
          authorName:
            store.kind === "peer" ? authorName.trim() : store.kind === "self" ? profile.name : null,
          ...form,
        });
        setDirty(false);
        if (store.kind === "peer") {
          setSubmitted(true);
          setForm(EMPTY_FORM);
          return created;
        }
        setEvaluations((prev) => [created, ...prev]);
        setEditingId(created.id);
        return created;
      } finally {
        setSaving(false);
      }
    },
    [authorName, form, profile, store]
  );

  const setVersionStatus = useCallback(
    async (evaluation: Evaluation, status: EvaluationStatus) => {
      await store.setStatus(evaluation.id, status);
      setEvaluations((prev) => prev.map((e) => (e.id === evaluation.id ? { ...e, status } : e)));
    },
    [store]
  );

  const deleteVersion = useCallback(
    async (evaluation: Evaluation) => {
      await store.remove(evaluation.id);
      setEvaluations((prev) => prev.filter((e) => e.id !== evaluation.id));
      if (editingId === evaluation.id) setEditingId(null);
    },
    [editingId, store]
  );

  const importFile = useCallback(
    async (file: File) => {
      if (!store.importSelf) return 0;
      const data = await importJsonFromFile(file, isAssessmentFile);
      const inputs = inputsFromAssessmentFile(data);
      await store.importSelf(inputs);
      if (store.kind === "self" && !profile.name && data.name) {
        await store.saveProfile({ ...profile, name: data.name, role: data.role ?? profile.role });
      }
      await load();
      return inputs.length;
    },
    [load, profile, store]
  );

  const exportFile = useCallback(() => {
    const own = evaluations.filter((e) => e.kind === store.kind).sort(byNewest);
    exportJson(`assessment-${profile.name.replace(/\s+/g, "-") || "unnamed"}`, {
      name: profile.name,
      role: profile.role,
      ...form,
      evaluations: own,
      exportedAt: new Date().toISOString(),
    });
  }, [evaluations, form, profile, store.kind]);

  const compare = useMemo(
    () => selection.sorted.filter((e) => selection.compareIds.includes(e.id) && e.id !== editingId),
    [selection.sorted, selection.compareIds, editingId]
  );

  const verticalStats = useMemo(
    () =>
      VERTICALS.map((vertical) => ({
        vertical,
        current: form.currentLevels[vertical] || 0,
        goal: form.goalLevels[vertical] || 0,
      })),
    [form]
  );

  return {
    loadState,
    profile,
    member,
    setMember,
    authorName,
    evaluations: selection.sorted,
    form,
    editingId,
    expandedVertical,
    dirty,
    saving,
    submitted,
    compare,
    compareIds: selection.compareIds,
    currentAverage: computeAverage(form.currentLevels),
    goalAverage: computeAverage(form.goalLevels),
    verticalStats,
    memberId: store.memberId(),
    setName: (name: string) => updateProfile({ name }),
    setRole: (role: string) => updateProfile({ role }),
    setTemplateId: (templateId: string | null) => updateProfile({ templateId }),
    setAuthorName,
    handleCurrentChange,
    handleGoalChange,
    handleCommentChange,
    toggleVertical,
    selectVersion,
    startNewVersion,
    toggleCompare: selection.toggleCompare,
    save,
    setVersionStatus,
    deleteVersion,
    importFile,
    exportFile,
    reload: load,
  };
}
