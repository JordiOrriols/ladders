import React, { useEffect, useState } from "react";
import { CalendarDays, Check, Plus, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { SmartGoal, SmartGoalInput } from "@/types";
import type { GoalStore } from "@/data/goalStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const emptyGoal: SmartGoalInput = {
  title: "",
  description: "",
  dueDate: null,
  progress: 0,
  comments: "",
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
    store
      .list()
      .then((nextGoals) => active && setGoals(nextGoals))
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
        comments: goal.comments,
      });
      setGoals((current) => current.map((item) => (item.id === updated.id ? updated : item)));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason));
    } finally {
      setSaving(false);
    }
  };

  const removeGoal = async (goalId: string) => {
    if (!store) return;
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

  if (loading) return <p className="text-sm text-slate-500">{t("pageMessage.loading")}</p>;

  return (
    <section className="space-y-6" aria-labelledby="smart-goals-title">
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

      {!readOnly && (
        <form
          onSubmit={addGoal}
          className="space-y-4 rounded-xl border border-slate-200 bg-white p-5"
        >
          <div className="grid gap-4 md:grid-cols-[1fr_180px]">
            <div>
              <Label htmlFor="new-goal-title">{t("smartGoals.goalTitle")}</Label>
              <Input
                id="new-goal-title"
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
              value={draft.description}
              onChange={(event) => setDraft({ ...draft, description: event.target.value })}
              className="mt-1 min-h-24 w-full rounded-md border border-slate-200 p-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <Button eventId="goal_create" type="submit" disabled={saving || !draft.title.trim()}>
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
            if (readOnly) {
              return (
                <article
                  key={goal.id}
                  className="rounded-xl border border-slate-200 bg-white p-5"
                  data-testid="goal-read"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <h3 className="font-semibold text-slate-800">{goal.title}</h3>
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
                    <div
                      role="progressbar"
                      aria-label={t("smartGoals.progress")}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={goal.progress}
                      className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-slate-100"
                    >
                      <div
                        className="h-full rounded-full bg-indigo-500"
                        style={{ width: `${goal.progress}%` }}
                      />
                    </div>
                    <span className="w-12 text-right text-sm font-medium">{goal.progress}%</span>
                  </div>
                  {goal.comments && (
                    <div className="mt-4 rounded-lg bg-slate-50 p-3">
                      <p className="text-xs font-medium text-slate-500">
                        {t("smartGoals.comments")}
                      </p>
                      <p className="mt-1 whitespace-pre-line text-sm text-slate-700">
                        {goal.comments}
                      </p>
                    </div>
                  )}
                </article>
              );
            }
            return (
              <article key={goal.id} className="rounded-xl border border-slate-200 bg-white p-5">
                <div className="grid gap-4 md:grid-cols-[1fr_180px]">
                  <div>
                    <Label htmlFor={`goal-title-${goal.id}`}>{t("smartGoals.goalTitle")}</Label>
                    <Input
                      id={`goal-title-${goal.id}`}
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
                  <span className="w-12 text-right text-sm font-medium">{goal.progress}%</span>
                </div>
                <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                  <CalendarDays className="h-4 w-4" />
                  {remainingLabel}
                </div>
                <div className="mt-4">
                  <Label htmlFor={`goal-comments-${goal.id}`}>{t("smartGoals.comments")}</Label>
                  <textarea
                    id={`goal-comments-${goal.id}`}
                    value={goal.comments}
                    disabled={readOnly || saving}
                    onChange={(event) =>
                      setGoals((current) =>
                        current.map((item) =>
                          item.id === goal.id ? { ...item, comments: event.target.value } : item
                        )
                      )
                    }
                    className="mt-1 min-h-16 w-full rounded-md border border-slate-200 p-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-50"
                  />
                </div>
                {!readOnly && (
                  <div className="mt-4 flex justify-end gap-2">
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
                    <Button
                      eventId="goal_save"
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
