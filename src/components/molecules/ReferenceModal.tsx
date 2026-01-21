import React from "react";
import { useTranslation } from "react-i18next";
import { Button } from "../ui/button";

const VERTICALS = ['Technology', 'System', 'People', 'Process', 'Influence'];
const LEVELS = [1, 2, 3, 4, 5];

interface ReferenceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ReferenceModal({ isOpen, onClose }: ReferenceModalProps) {
  const { t } = useTranslation();
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center overflow-y-auto py-8">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl mx-4">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-xl font-semibold text-slate-800">
            {t('reference.title')}
          </h2>
          <Button
            size="icon"
            variant="ghost"
            onClick={onClose}
          >
            <span className="text-xl">&times;</span>
          </Button>
        </div>
        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-6">
          {VERTICALS.map((vertical) => (
            <div key={vertical}>
              <h3 className="font-semibold text-lg text-slate-800 mb-3">
                {vertical}
              </h3>
              <div className="space-y-2">
                {LEVELS.map((level) => (
                  <div
                    key={level}
                    className="p-3 bg-slate-50 rounded-lg"
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
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="p-6 border-t border-slate-200 bg-slate-50 rounded-b-2xl">
          <Button onClick={onClose} className="w-full">
            {t('buttons.close')}
          </Button>
        </div>
      </div>
    </div>
  );
}
