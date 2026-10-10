import React, { useState } from "react";
import { ChevronDown, ChevronUp, GraduationCap } from "@jordiorriols/ui/icons";
import { useTranslation } from "react-i18next";
import { VERTICALS } from "@/components/atoms/levelSelector";
import { LADDER_TEMPLATES, LADDER_TRACKS, findTemplate } from "@/data/ladderTemplates";

type Props = {
  templateId: string | null;
  /** Omit to render read-only. */
  onChange?: (templateId: string | null) => void;
};

/** Seniority template picker plus a short explanation of what the level expects. */
export function TemplatePanel({ templateId, onChange }: Props) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const template = findTemplate(templateId);

  if (!onChange && !template) return null;

  return (
    <div
      className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3"
      data-testid="template-panel"
    >
      <div className="flex items-center gap-2">
        <GraduationCap className="w-4 h-4 text-slate-500" />
        <label htmlFor="template-select" className="text-sm font-semibold text-slate-700">
          {t("templates.title")}
        </label>
      </div>

      {onChange ? (
        <select
          id="template-select"
          value={templateId ?? ""}
          onChange={(e) => onChange(e.target.value || null)}
          className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
        >
          <option value="">{t("templates.none")}</option>
          {LADDER_TRACKS.map((track) => (
            <optgroup key={track} label={t(`templates.tracks.${track}`)}>
              {LADDER_TEMPLATES.filter((tpl) => tpl.track === track).map((tpl) => (
                <option key={tpl.id} value={tpl.id}>
                  {tpl.id} · {t(`templates.tracks.${track}`)}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      ) : (
        template && (
          <p className="text-sm font-medium text-slate-800">
            {template.id} · {t(`templates.tracks.${template.track}`)}
          </p>
        )
      )}

      {template && (
        <div className="space-y-2">
          <p className="text-sm text-slate-600">{t(`templates.summaries.${template.id}`)}</p>
          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            aria-expanded={expanded}
            className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:underline"
          >
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            {t("templates.whatItMeans")}
          </button>
          {expanded && (
            <ul className="space-y-1.5">
              {VERTICALS.map((vertical) => {
                const level = template.levels[vertical] ?? 0;
                return (
                  <li key={vertical} className="text-xs text-slate-600">
                    <span className="font-semibold text-slate-700">
                      {vertical} · L{level} {t(`levels.${vertical}.${level}.name`)}
                    </span>
                    {" — "}
                    {t(`levels.${vertical}.${level}.description`)}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
