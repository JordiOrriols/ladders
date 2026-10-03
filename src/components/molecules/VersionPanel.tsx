import React, { useMemo, useState } from "react";
import { Eye, EyeOff, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { versionLabel } from "@/data/evaluations";
import { evaluationAuthor } from "@/data/radarSeries";
import type { Evaluation, EvaluationStatus } from "@/types";
import { ConfirmDialog } from "./ConfirmDialog";
import { ButtonGroup, StatusBadge } from "@jordiorriols/ui";

type Props = {
  evaluations: Evaluation[];
  selectedId: string | null;
  compareIds: string[];
  onSelect: (id: string) => void;
  onToggleCompare: (id: string) => void;
  onDelete?: (evaluation: Evaluation) => void;
  canDelete?: (evaluation: Evaluation) => boolean;
  onChangeStatus?: (evaluation: Evaluation, status: EvaluationStatus) => Promise<void>;
  canChangeStatus?: (evaluation: Evaluation) => boolean;
};

const groupOf = (e: Evaluation) => (e.kind === "peer" ? `peer:${e.authorName ?? ""}` : e.kind);

export function VersionPanel({
  evaluations,
  selectedId,
  compareIds,
  onSelect,
  onToggleCompare,
  onDelete,
  canDelete = () => false,
  onChangeStatus,
  canChangeStatus = () => false,
}: Props) {
  const { t, i18n } = useTranslation();
  const [hiddenGroups, setHiddenGroups] = useState<string[]>([]);
  const [pendingDelete, setPendingDelete] = useState<Evaluation | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const changeStatus = async (evaluation: Evaluation) => {
    if (!onChangeStatus) return;
    setBusyId(evaluation.id);
    setError(null);
    try {
      await onChangeStatus(evaluation, evaluation.status === "draft" ? "published" : "draft");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason));
    } finally {
      setBusyId(null);
    }
  };

  const groups = useMemo(() => {
    const seen = new Map<string, string>();
    for (const e of evaluations) {
      if (!seen.has(groupOf(e))) seen.set(groupOf(e), evaluationAuthor(e, t));
    }
    return [...seen.entries()];
  }, [evaluations, t]);

  const visible = evaluations.filter((e) => !hiddenGroups.includes(groupOf(e)));

  const toggleGroup = (group: string) =>
    setHiddenGroups((prev) =>
      prev.includes(group) ? prev.filter((g) => g !== group) : [...prev, group]
    );

  return (
    <aside
      className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3"
      data-testid="version-panel"
    >
      <h2 className="text-sm font-semibold text-slate-700">{t("versions.title")}</h2>
      {error && (
        <p role="alert" className="text-xs text-red-600">
          {error}
        </p>
      )}

      {groups.length > 1 && (
        <ButtonGroup
          label={t("versions.filter")}
          items={groups.map(([value, label]) => ({
            value,
            label,
            selected: !hiddenGroups.includes(value),
          }))}
          onToggle={toggleGroup}
        />
      )}

      <ol className="space-y-1 max-h-[60vh] overflow-y-auto">
        {visible.length === 0 && (
          <li className="text-xs text-slate-500 px-1">{t("versions.empty")}</li>
        )}
        {visible.map((evaluation) => {
          const isSelected = evaluation.id === selectedId;
          const isCompared = compareIds.includes(evaluation.id);
          const published = evaluation.status === "published";
          return (
            <li
              key={evaluation.id}
              data-testid="version-row"
              className={`rounded-lg border px-3 py-2 ${
                isSelected ? "border-indigo-400 bg-indigo-50" : "border-slate-200"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <button
                  type="button"
                  onClick={() => onSelect(evaluation.id)}
                  aria-current={isSelected ? "true" : undefined}
                  className="text-left flex-1 min-w-0"
                >
                  <span className="block text-sm font-medium text-slate-800 capitalize">
                    {versionLabel(evaluation, evaluations, i18n.language)}
                  </span>
                  <span
                    className="block text-xs text-slate-500 truncate"
                    data-testid="version-author"
                  >
                    {evaluationAuthor(evaluation, t)}
                  </span>
                </button>
                <StatusBadge
                  positive={published}
                  data-testid="version-status"
                  data-status={evaluation.status}
                >
                  {t(`versions.status.${evaluation.status}`)}
                </StatusBadge>
              </div>
              <div className="flex items-center gap-1 mt-1">
                <button
                  type="button"
                  data-testid="version-compare"
                  disabled={isSelected}
                  onClick={() => onToggleCompare(evaluation.id)}
                  title={t("versions.compare")}
                  aria-label={t("versions.compare")}
                  aria-pressed={isCompared}
                  className="p-1 rounded text-slate-500 hover:bg-slate-100 disabled:opacity-30"
                >
                  {isCompared ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
                {onDelete && canDelete(evaluation) && (
                  <button
                    type="button"
                    data-testid="version-delete"
                    onClick={() => setPendingDelete(evaluation)}
                    title={t("buttons.delete")}
                    aria-label={t("buttons.delete")}
                    className="p-1 rounded text-red-500 hover:bg-red-50 ml-auto"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                {evaluation.kind === "peer" && onChangeStatus && canChangeStatus(evaluation) && (
                  <button
                    type="button"
                    data-testid="version-publish"
                    data-status={evaluation.status}
                    disabled={busyId !== null}
                    onClick={() => void changeStatus(evaluation)}
                    className="ml-auto rounded px-2 py-1 text-xs text-indigo-700 hover:bg-indigo-50 disabled:opacity-50"
                  >
                    {t(published ? "versions.returnToDraft" : "buttons.publish")}
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      <ConfirmDialog
        isOpen={!!pendingDelete}
        title={t("versions.deleteTitle")}
        description={t("versions.deleteDescription")}
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete) onDelete?.(pendingDelete);
          setPendingDelete(null);
        }}
      />
    </aside>
  );
}
