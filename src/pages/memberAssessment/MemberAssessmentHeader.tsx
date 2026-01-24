import React, { useRef, useCallback } from "react";
import { ArrowLeft, Download, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  onBack: () => void;
  onImport: (file?: File) => void;
  onShare: () => void;
  title: string;
  subtitle: string;
  importLabel: string;
  shareLabel: string;
};

export function MemberAssessmentHeader({
  onBack,
  onImport,
  onShare,
  title,
  subtitle,
  importLabel,
  shareLabel,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        onImport(file);
      }
      event.target.value = "";
    },
    [onImport]
  );

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={onBack} aria-label="Go back">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold text-slate-800">{title}</h1>
              <p className="text-xs text-slate-500">{subtitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={handleFileChange}
            />
            <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
              <Download className="w-4 h-4 mr-2" />
              {importLabel}
            </Button>
            <Button variant="outline" onClick={onShare}>
              <Share2 className="w-4 h-4 mr-2" />
              {shareLabel}
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
