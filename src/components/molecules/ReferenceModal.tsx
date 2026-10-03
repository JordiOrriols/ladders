import React from "react";
import { useTranslation } from "react-i18next";
import { ReferenceDialog } from "@jordiorriols/ui";
import { VERTICALS, LEVELS, LevelExample } from "../atoms/levelSelector";

interface ReferenceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ReferenceModal({ isOpen, onClose }: ReferenceModalProps) {
  const { t } = useTranslation();

  return (
    <ReferenceDialog
      isOpen={isOpen}
      onClose={onClose}
      title={t("reference.title")}
      closeLabel={t("buttons.close")}
    >
      {VERTICALS.map((vertical) => (
        <div key={vertical} data-testid={`reference-vertical-${vertical}`}>
          <h3 className="font-semibold text-lg text-slate-800 mb-3">{vertical}</h3>
          {vertical === "Influence" && (
            <p className="text-sm text-slate-500 mb-3">{t("influenceScope")}</p>
          )}
          <div className="space-y-2">
            {LEVELS.map((level) => (
              <div
                key={level}
                className="p-3 bg-slate-50 rounded-lg"
                data-testid={`reference-level-${vertical}-${level}`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-slate-400 bg-white px-2 py-0.5 rounded">
                    L{level}
                  </span>
                  <span className="font-medium text-slate-700">
                    {t(`levels.${vertical}.${level}.name`)}
                  </span>
                </div>
                <p className="text-sm text-slate-600">
                  {t(`levels.${vertical}.${level}.description`)}
                </p>
                <LevelExample vertical={vertical} level={level} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </ReferenceDialog>
  );
}
