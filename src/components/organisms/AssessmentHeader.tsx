import React, { useCallback, useRef } from "react";
import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SplitButton } from "@/components/molecules/SplitButton";
import type { SplitButtonItem } from "@/components/molecules/SplitButton";

type HeaderAction =
  | {
      type: "button";
      label: string;
      icon?: ReactNode;
      variant?: "default" | "outline" | "ghost";
      size?: "sm" | "icon";
      onClick: () => void;
      eventId: string;
      disabled?: boolean;
    }
  | {
      type: "file";
      label: string;
      icon?: ReactNode;
      accept?: string;
      onFile: (file: File) => void;
      eventId: string;
    }
  | {
      type: "split";
      label: string;
      icon?: ReactNode;
      eventId: string;
      onClick: () => void;
      disabled?: boolean;
      menuLabel: string;
      items: SplitButtonItem[];
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
  extraActions?: ReactNode;
};

export function AssessmentHeader({
  title,
  subtitle,
  onBack,
  leadingAdornment,
  actions,
  extraActions,
}: Props) {
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
    <header
      className="bg-white border-b border-slate-200 sticky top-0 z-40"
      data-testid="assessment-header"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex min-h-16 flex-wrap items-center justify-between gap-2 py-2">
          <div className="flex items-center gap-3">
            {onBack && (
              <Button
                eventId="assessment_header_back"
                data-testid="assessment-back"
                variant="ghost"
                size="icon"
                onClick={onBack}
                aria-label="Go back"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
            )}
            <div className="flex min-w-0 items-center gap-3">
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

          <div className="flex flex-wrap items-center justify-end gap-2">
            {extraActions}
            {actions.map((action, idx) => {
              if (action.type === "button") {
                return (
                  <Button
                    key={idx}
                    eventId={action.eventId}
                    data-testid={`assessment-action-${action.eventId}`}
                    variant={action.variant ?? "outline"}
                    size={action.size ?? "sm"}
                    disabled={action.disabled}
                    onClick={action.onClick}
                  >
                    {action.icon && <span className="mr-2 inline-flex">{action.icon}</span>}
                    {action.label}
                  </Button>
                );
              }

              if (action.type === "split") {
                return (
                  <SplitButton
                    key={idx}
                    label={action.label}
                    icon={action.icon}
                    eventId={action.eventId}
                    onClick={action.onClick}
                    {...(action.disabled !== undefined ? { disabled: action.disabled } : {})}
                    menuLabel={action.menuLabel}
                    items={action.items}
                  />
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
                    data-testid={`assessment-action-${action.eventId}`}
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
