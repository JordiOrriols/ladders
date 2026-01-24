import React from "react";
import { ArrowLeft, Download, Trash2, LayoutGrid, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  onBack: () => void;
  onShare: () => void;
  onClear: () => void;
  onExport: () => void;
  title: string;
  subtitle: string;
  shareLabel: string;
  clearLabel: string;
  exportLabel: string;
};

export function SelfAssessmentHeader({
  onBack,
  onShare,
  onClear,
  onExport,
  title,
  subtitle,
  shareLabel,
  clearLabel,
  exportLabel,
}: Props) {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={onBack} aria-label="Go back">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                <LayoutGrid className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-slate-800">{title}</h1>
                <p className="text-xs text-slate-500">{subtitle}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onShare}>
              <Share2 className="w-4 h-4 mr-2" />
              {shareLabel}
            </Button>
            <Button variant="outline" size="sm" onClick={onClear}>
              <Trash2 className="w-4 h-4 mr-2" />
              {clearLabel}
            </Button>
            <Button onClick={onExport}>
              <Download className="w-4 h-4 mr-2" />
              {exportLabel}
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
