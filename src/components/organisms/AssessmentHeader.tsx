import React, { useCallback, useRef } from "react";
import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

type HeaderAction =
  | {
      type: "button";
      label: string;
      icon?: ReactNode;
      variant?: "default" | "outline" | "ghost";
      size?: "sm" | "icon";
      onClick: () => void;
      eventId: string;
    }
  | {
      type: "file";
      label: string;
      icon?: ReactNode;
      accept?: string;
      onFile: (file: File) => void;
      eventId: string;
    };

type LeadingAdornment = {
  icon: ReactNode;
  className?: string;
};

type Props = {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  leadingAdornment?: LeadingAdornment;
  actions: HeaderAction[];
};

export function AssessmentHeader({ title, subtitle, onBack, leadingAdornment, actions }: Props) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>, onFile: (file: File) => void) => {
      const file = event.target.files?.[0];
      if (file) onFile(file);
      event.target.value = "";
    },
    []
  );

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            {onBack && (
              <Button
                eventId="assessment_header_back"
                variant="ghost"
                size="icon"
                onClick={onBack}
                aria-label="Go back"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
            )}
            <div className="flex items-center gap-3">
              {leadingAdornment && (
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${leadingAdornment.className ?? ""}`}
                >
                  {leadingAdornment.icon}
                </div>
              )}
              <div>
                <h1 className="text-lg font-semibold text-slate-800">{title}</h1>
                {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {actions.map((action, idx) => {
              if (action.type === "button") {
                return (
                  <Button
                    key={idx}
                    eventId={action.eventId}
                    variant={action.variant ?? "outline"}
                    size={action.size ?? "sm"}
                    onClick={action.onClick}
                  >
                    {action.icon && <span className="mr-2 inline-flex">{action.icon}</span>}
                    {action.label}
                  </Button>
                );
              }

              return (
                <React.Fragment key={idx}>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={action.accept ?? "application/json"}
                    className="hidden"
                    onChange={(event) => handleFileChange(event, action.onFile)}
                  />
                  <Button
                    eventId={action.eventId}
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {action.icon && <span className="mr-2 inline-flex">{action.icon}</span>}
                    {action.label}
                  </Button>
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>
    </header>
  );
}
