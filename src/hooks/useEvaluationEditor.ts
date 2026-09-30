import { useCallback, useEffect, useMemo, useState } from "react";
import { VERTICALS } from "@/components/atoms/levelSelector";
import { byNewest, computeAverage, latestOf } from "@/data/evaluations";
import type { EvaluationStore } from "@/data/evaluationStore";
import type {
  CommentMap,
  Evaluation,
  EvaluationStatus,
  LevelMap,
  MemberProfile,
  TeamMember,
} from "@/types";
import { exportJson } from "@/utils/sharing";
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

const sameMap = <T extends string | number>(a: Record<string, T>, b: Record<string, T>) => {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  return [...keys].every((key) => a[key] === b[key]);
};

const sameForm = (a: FormState, b: FormState) =>
  sameMap(a.currentLevels, b.currentLevels) &&
  sameMap(a.goalLevels, b.goalLevels) &&
  sameMap(a.comments, b.comments);

const normalizedProfile = (profile: MemberProfile): MemberProfile => ({
  ...profile,
  name: profile.name.trim(),
  role: profile.role.trim(),
});

const sameProfile = (a: MemberProfile, b: MemberProfile) =>
  a.name === b.name && a.role === b.role && a.templateId === b.templateId;

export class EditorValidationError extends Error {}

/** Shared editor for manager, self and peer evaluations. */
export function useEvaluationEditor(store: EvaluationStore) {
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [profile, setProfile] = useState<MemberProfile>(EMPTY_PROFILE);
  const [savedProfile, setSavedProfile] = useState<MemberProfile>(EMPTY_PROFILE);
  const [member, setMember] = useState<TeamMember | null>(null);
  const [authorName, setAuthorName] = useState("");
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedVertical, setExpandedVertical] = useState<string | null>(VERTICALS[0] ?? null);
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
      setSavedProfile(snapshot.profile);
      setMember(snapshot.member ?? null);
      setEvaluations(snapshot.evaluations);
      const latest = latestOf(snapshot.evaluations, store.kind);
      const draft = snapshot.evaluations.find(
        (evaluation) => evaluation.kind === store.kind && evaluation.status === "draft"
      );
      setForm(formFrom(draft ?? latest));
      setEditingId(draft?.id ?? null);
      setLoadState("ready");
    } catch (error) {
      console.error("Failed to load evaluations", error);
      setLoadState("error");
    }
  }, [store]);

  useEffect(() => {
    void load();
  }, [load]);

  const selectedEvaluation = useMemo(
    () => evaluations.find((evaluation) => evaluation.id === editingId),
    [editingId, evaluations]
  );
  const baselineEvaluation = selectedEvaluation ?? latestOf(evaluations, store.kind);
  const contentChanged = !sameForm(form, formFrom(baselineEvaluation));
  const profileChanged = !sameProfile(normalizedProfile(profile), savedProfile);
  const dirty = contentChanged || profileChanged;
  const existingDraft = evaluations.find(
    (evaluation) => evaluation.kind === store.kind && evaluation.status === "draft"
  );
  const hasBlockingDraft = !!existingDraft && existingDraft.id !== selectedEvaluation?.id;

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const updateForm = useCallback((patch: (prev: FormState) => FormState) => setForm(patch), []);

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
    },
    [evaluations, selection, store.kind]
  );

  const startNewVersion = useCallback(() => {
    const draft = evaluations.find(
      (evaluation) => evaluation.kind === store.kind && evaluation.status === "draft"
    );
    setEditingId(draft?.id ?? null);
    setForm(formFrom(draft ?? latestOf(evaluations, store.kind)));
  }, [evaluations, store.kind]);

  const save = useCallback(
    async (status: EvaluationStatus) => {
      if (store.editableProfile && !profile.name.trim()) {
        throw new EditorValidationError("nameRequired");
      }
      if (store.kind === "peer" && !authorName.trim()) {
        throw new EditorValidationError("authorRequired");
      }
      if (store.kind !== "peer" && !contentChanged && !profileChanged) {
        if (!(selectedEvaluation?.status === "draft" && status === "published")) {
          throw new EditorValidationError("noChanges");
        }
      }
      if (
        store.kind !== "peer" &&
        status === "published" &&
        selectedEvaluation?.status !== "draft"
      ) {
        throw new EditorValidationError("publishDraftFirst");
      }
      if (status === "draft" && hasBlockingDraft) {
        throw new EditorValidationError("draftAlreadyExists");
      }
      setSaving(true);
      try {
        const nextProfile = normalizedProfile(profile);
        if (store.editableProfile) {
          await store.saveProfile(nextProfile);
          setProfile(nextProfile);
          setSavedProfile(nextProfile);
        }
        if (store.kind !== "peer" && !contentChanged) {
          if (selectedEvaluation?.status === "draft" && status === "published") {
            await store.setStatus(selectedEvaluation.id, "published");
            const published = { ...selectedEvaluation, status: "published" as const };
            setEvaluations((prev) =>
              prev.map((evaluation) =>
                evaluation.id === selectedEvaluation.id ? published : evaluation
              )
            );
            return published;
          }
          return selectedEvaluation ?? null;
        }
        const input = {
          status,
          authorName:
            store.kind === "peer"
              ? authorName.trim()
              : store.kind === "self"
                ? nextProfile.name
                : null,
          ...form,
        };
        const saved =
          selectedEvaluation?.status === "draft" && store.updateDraft
            ? await store.updateDraft(selectedEvaluation.id, input)
            : await store.create(input);
        if (store.kind === "peer") {
          setSubmitted(true);
          setForm(EMPTY_FORM);
          return saved;
        }
        setEvaluations((prev) => [saved, ...prev.filter((e) => e.id !== saved.id)]);
        setEditingId(saved.id);
        return saved;
      } finally {
        setSaving(false);
      }
    },
    [
      authorName,
      contentChanged,
      form,
      hasBlockingDraft,
      profile,
      profileChanged,
      selectedEvaluation,
      store,
    ]
  );

  const setVersionStatus = useCallback(
    async (evaluation: Evaluation, status: EvaluationStatus) => {
      const hasOtherDraft = evaluations.some(
        (other) =>
          other.id !== evaluation.id && other.kind === evaluation.kind && other.status === "draft"
      );
      if (status === "draft" && evaluation.kind !== "peer" && hasOtherDraft) {
        throw new EditorValidationError("draftAlreadyExists");
      }
      await store.setStatus(evaluation.id, status);
      setEvaluations((prev) => prev.map((e) => (e.id === evaluation.id ? { ...e, status } : e)));
    },
    [evaluations, store]
  );

  const canChangeVersionStatus = useCallback(
    (evaluation: Evaluation) => {
      if (!store.canChangeStatus(evaluation)) return false;
      if (evaluation.status === "draft") return true;
      return !evaluations.some(
        (other) =>
          other.id !== evaluation.id && other.kind === evaluation.kind && other.status === "draft"
      );
    },
    [evaluations, store]
  );

  const deleteVersion = useCallback(
    async (evaluation: Evaluation) => {
      await store.remove(evaluation.id);
      setEvaluations((prev) => prev.filter((e) => e.id !== evaluation.id));
      if (editingId === evaluation.id) setEditingId(null);
    },
    [editingId, store]
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
    contentChanged,
    profileChanged,
    canSaveDraft: !saving && !hasBlockingDraft && (contentChanged || profileChanged),
    canPublish: !saving && (store.kind === "peer" || selectedEvaluation?.status === "draft"),
    canStartNewVersion: !existingDraft,
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
    canChangeVersionStatus,
    deleteVersion,
    exportFile,
    reload: load,
  };
}
