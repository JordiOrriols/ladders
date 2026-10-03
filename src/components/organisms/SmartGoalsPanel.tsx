import React, { useEffect, useState } from "react";
import { CalendarDays, Check, Plus, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { SmartGoal, SmartGoalInput } from "@/types";
import type { GoalStore } from "@/data/goalStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ProgressIndicator } from "@jordiorriols/ui";

const emptyGoal: SmartGoalInput = {
  title: "",
  description: "",
  dueDate: null,
  progress: 0,
};

function daysRemaining(dueDate: string | null) {
  if (!dueDate) return null;
  const due = new Date(`${dueDate}T23:59:59`);
  return Math.ceil((due.getTime() - Date.now()) / 86_400_000);
}

interface Props {
  store: GoalStore | null;
  readOnly?: boolean;
}

export function SmartGoalsPanel({ store, readOnly = false }: Props) {
  const { t } = useTranslation();
  const [goals, setGoals] = useState<SmartGoal[]>([]);
  const [draft, setDraft] = useState<SmartGoalInput>(emptyGoal);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [canDelete, setCanDelete] = useState(false);
  const [newComments, setNewComments] = useState<Record<string, string>>({});

  useEffect(() => {
    let active = true;
    if (!store) {
      setGoals([]);
      setLoading(false);
      return () => {
        active = false;
      };
    }
    setLoading(true);
    setCanDelete(false);
    Promise.all([store.list(), store.canDelete()])
      .then(([nextGoals, allowed]) => {
        if (!active) return;
        setGoals(nextGoals);
        setCanDelete(allowed);
      })
      .catch(
        (reason) => active && setError(reason instanceof Error ? reason.message : String(reason))
      )
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [store]);

  const addGoal = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!store || !draft.title.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const goal = await store.create({
        ...draft,
        title: draft.title.trim(),
        dueDate: draft.dueDate || null,
      });
      setGoals((current) => [...current, goal]);
      setDraft(emptyGoal);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason));
    } finally {
      setSaving(false);
    }
  };

  const updateGoal = async (goal: SmartGoal) => {
    if (!store) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await store.update(goal.id, {
        title: goal.title.trim(),
        description: goal.description,
        dueDate: goal.dueDate || null,
        progress: goal.progress,
      });
      setGoals((current) => current.map((item) => (item.id === updated.id ? updated : item)));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason));
    } finally {
      setSaving(false);
    }
  };

  const removeGoal = async (goalId: string) => {
    if (!store || !canDelete) return;
    setSaving(true);
    try {
      await store.remove(goalId);
      setGoals((current) => current.filter((goal) => goal.id !== goalId));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason));
    } finally {
      setSaving(false);
    }
  };

  const appendComment = async (goalId: string) => {
    const text = newComments[goalId]?.trim();
    if (!store || readOnly || !text) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await store.appendComment(goalId, text);
      setGoals((current) =>
        current.map((goal) => (goal.id === goalId ? { ...goal, comments: updated.comments } : goal))
      );
      setNewComments((current) => ({ ...current, [goalId]: "" }));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason));
    } finally {
      setSaving(false);
    }
  };

  const renderComments = (goal: SmartGoal) => (
    <div className="mt-4 space-y-3">
      {goal.comments.length > 0 && (
        <div>
          <h4 className="text-xs font-medium text-slate-500">{t("smartGoals.comments")}</h4>
          <ol className="mt-2 space-y-2">
            {goal.comments.map((comment) => (
              <li key={comment.id} className="border-l-2 border-slate-200 pl-3">
                <p className="whitespace-pre-wrap break-words text-sm text-slate-700">
                  {comment.text}
                </p>
                <time dateTime={comment.createdAt} className="text-xs text-slate-400">
                  {new Date(comment.createdAt).toLocaleString()}
                </time>
              </li>
            ))}
          </ol>
        </div>
      )}
      {!readOnly && (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void appendComment(goal.id);
          }}
          className="space-y-2"
        >
          <Label htmlFor={`new-comment-${goal.id}`}>{t("smartGoals.newComment")}</Label>
          <textarea
            id={`new-comment-${goal.id}`}
            data-testid="goal-comment-input"
            value={newComments[goal.id] ?? ""}
            onChange={(event) =>
              setNewComments((current) => ({ ...current, [goal.id]: event.target.value }))
            }
            disabled={saving}
            maxLength={10000}
            className="min-h-16 w-full rounded-md border border-slate-200 p-2 text-sm"
          />
          <Button
            eventId="goal_comment_append"
            data-testid="goal-comment-submit"
            type="submit"
            disabled={saving || !newComments[goal.id]?.trim()}
          >
            <Plus className="h-4 w-4" />
            {t("smartGoals.addComment")}
          </Button>
        </form>
      )}
    </div>
  );

  if (loading) return <p className="text-sm text-slate-500">{t("pageMessage.loading")}</p>;

  return (
    <section className="space-y-6" aria-labelledby="smart-goals-title" data-testid="goals-panel">
      <div>
        <h2 id="smart-goals-title" className="text-xl font-semibold text-slate-800">
          {t("smartGoals.title")}
        </h2>
        <p className="mt-1 text-sm text-slate-500">{t("smartGoals.description")}</p>
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}

      {!readOnly && store?.mode === "manager" && (
        <form
          onSubmit={addGoal}
          data-testid="goal-create-form"
          className="space-y-4 rounded-xl border border-slate-200 bg-white p-5"
        >
          <div className="grid gap-4 md:grid-cols-[1fr_180px]">
            <div>
              <Label htmlFor="new-goal-title">{t("smartGoals.goalTitle")}</Label>
              <Input
                id="new-goal-title"
                data-testid="goal-title-input"
                value={draft.title}
                onChange={(event) => setDraft({ ...draft, title: event.target.value })}
                placeholder={t("smartGoals.titlePlaceholder")}
                maxLength={160}
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="new-goal-date">{t("smartGoals.dueDate")}</Label>
              <Input
                id="new-goal-date"
                data-testid="goal-date-input"
                type="date"
                value={draft.dueDate ?? ""}
                onChange={(event) => setDraft({ ...draft, dueDate: event.target.value || null })}
                className="mt-1"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="new-goal-description">{t("smartGoals.goalDescription")}</Label>
            <textarea
              id="new-goal-description"
              data-testid="goal-description-input"
              value={draft.description}
              onChange={(event) => setDraft({ ...draft, description: event.target.value })}
              className="mt-1 min-h-24 w-full rounded-md border border-slate-200 p-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <Button
            eventId="goal_create"
            data-testid="goal-create-submit"
            type="submit"
            disabled={saving || !draft.title.trim()}
          >
            <Plus className="h-4 w-4" />
            {t("smartGoals.add")}
          </Button>
        </form>
      )}

      {goals.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
          {t("smartGoals.empty")}
        </p>
      ) : (
        <div className="space-y-4">
          {goals.map((goal) => {
            const remaining = daysRemaining(goal.dueDate);
            const remainingLabel =
              remaining === null
                ? t("smartGoals.noDate")
                : remaining < 0
                  ? t("smartGoals.overdue", { days: Math.abs(remaining) })
                  : t("smartGoals.daysRemaining", { days: remaining });
            if (readOnly || store?.mode === "member") {
              return (
                <article
                  key={goal.id}
                  className="rounded-xl border border-slate-200 bg-white p-5"
                  data-testid="goal-read"
                  data-goal-id={goal.id}
                  data-goal-title={goal.title}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <h3 className="font-semibold text-slate-800" data-testid="goal-read-title">
                      {goal.title}
                    </h3>
                    <span className="flex items-center gap-1 text-xs text-slate-500">
                      <CalendarDays className="h-4 w-4" />
                      {goal.dueDate && `${goal.dueDate} · `}
                      {remainingLabel}
                    </span>
                  </div>
                  {goal.description && (
                    <p className="mt-2 whitespace-pre-line text-sm text-slate-600">
                      {goal.description}
                    </p>
                  )}
                  <div className="mt-4 flex items-center gap-3">
                    <span className="shrink-0 text-xs font-medium text-slate-500">
                      {t("smartGoals.progress")}
                    </span>
                    {readOnly ? (
                      <ProgressIndicator value={goal.progress} label={t("smartGoals.progress")} />
                    ) : (
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="1"
                        value={goal.progress}
                        aria-label={t("smartGoals.progress")}
                        data-testid="goal-progress"
                        disabled={saving}
                        onChange={(event) =>
                          setGoals((current) =>
                            current.map((item) =>
                              item.id === goal.id
                                ? { ...item, progress: Number(event.target.value) }
                                : item
                            )
                          )
                        }
                        className="min-w-0 flex-1 accent-indigo-600"
                      />
                    )}
                    <span
                      className="w-12 text-right text-sm font-medium"
                      data-testid="goal-progress-value"
                    >
                      {goal.progress}%
                    </span>
                  </div>
                  {!readOnly && (
                    <Button
                      eventId="goal_progress_save"
                      data-testid="goal-progress-save"
                      type="button"
                      className="mt-3"
                      disabled={saving}
                      onClick={() => void updateGoal(goal)}
                    >
                      <Check className="h-4 w-4" />
                      {t("smartGoals.save")}
                    </Button>
                  )}
                  {renderComments(goal)}
                </article>
              );
            }
            return (
              <article
                key={goal.id}
                className="rounded-xl border border-slate-200 bg-white p-5"
                data-testid="goal"
                data-goal-id={goal.id}
                data-goal-title={goal.title}
              >
                <div className="grid gap-4 md:grid-cols-[1fr_180px]">
                  <div>
                    <Label htmlFor={`goal-title-${goal.id}`}>{t("smartGoals.goalTitle")}</Label>
                    <Input
                      id={`goal-title-${goal.id}`}
                      data-testid="goal-title-field"
                      value={goal.title}
                      disabled={readOnly || saving}
                      onChange={(event) =>
                        setGoals((current) =>
                          current.map((item) =>
                            item.id === goal.id ? { ...item, title: event.target.value } : item
                          )
                        )
                      }
                      className="mt-1 font-medium"
                    />
                  </div>
                  <div>
                    <Label htmlFor={`goal-date-${goal.id}`}>{t("smartGoals.dueDate")}</Label>
                    <Input
                      id={`goal-date-${goal.id}`}
                      data-testid="goal-date-field"
                      type="date"
                      value={goal.dueDate ?? ""}
                      disabled={readOnly || saving}
                      onChange={(event) =>
                        setGoals((current) =>
                          current.map((item) =>
                            item.id === goal.id
                              ? { ...item, dueDate: event.target.value || null }
                              : item
                          )
                        )
                      }
                      className="mt-1"
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <Label htmlFor={`goal-description-${goal.id}`}>
                    {t("smartGoals.goalDescription")}
                  </Label>
                  <textarea
                    id={`goal-description-${goal.id}`}
                    data-testid="goal-description-field"
                    value={goal.description}
                    disabled={readOnly || saving}
                    onChange={(event) =>
                      setGoals((current) =>
                        current.map((item) =>
                          item.id === goal.id ? { ...item, description: event.target.value } : item
                        )
                      )
                    }
                    className="mt-1 min-h-20 w-full rounded-md border border-slate-200 p-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-50"
                  />
                </div>
                <div className="mt-4 flex items-center gap-3">
                  <Label htmlFor={`goal-progress-${goal.id}`} className="shrink-0">
                    {t("smartGoals.progress")}
                  </Label>
                  <input
                    id={`goal-progress-${goal.id}`}
                    data-testid="goal-progress"
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={goal.progress}
                    disabled={readOnly || saving}
                    onChange={(event) =>
                      setGoals((current) =>
                        current.map((item) =>
                          item.id === goal.id
                            ? { ...item, progress: Number(event.target.value) }
                            : item
                        )
                      )
                    }
                    className="min-w-0 flex-1 accent-indigo-600"
                  />
                  <span
                    className="w-12 text-right text-sm font-medium"
                    data-testid="goal-progress-value"
                  >
                    {goal.progress}%
                  </span>
                </div>
                <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                  <CalendarDays className="h-4 w-4" />
                  {remainingLabel}
                </div>
                {renderComments(goal)}
                {!readOnly && (
                  <div className="mt-4 flex justify-end gap-2">
                    {canDelete && (
                      <Button
                        eventId="goal_delete"
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label={t("smartGoals.delete")}
                        onClick={() => void removeGoal(goal.id)}
                        disabled={saving}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    )}
                    <Button
                      eventId="goal_save"
                      data-testid="goal-save"
                      type="button"
                      onClick={() => void updateGoal(goal)}
                      disabled={saving || !goal.title.trim()}
                    >
                      <Check className="h-4 w-4" />
                      {t("smartGoals.save")}
                    </Button>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
