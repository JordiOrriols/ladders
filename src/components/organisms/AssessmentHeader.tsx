import React, { useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import type { ReactNode } from "react";
import { AppHeader } from "@jordiorriols/ui";
import { ArrowLeft } from "@jordiorriols/ui/icons";
import { AppIcon } from "@/components/atoms/AppIcon";
import { LanguageSelector } from "@/components/molecules/LanguageSelector";
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

type Props = {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  actions: HeaderAction[];
  extraActions?: ReactNode;
  /** Tab row shown below the branding, as on the home page. */
  navigation?: ReactNode;
};

export function AssessmentHeader({
  title,
  subtitle,
  onBack,
  actions,
  extraActions,
  navigation,
}: Props) {
  const { t } = useTranslation();
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
    <AppHeader
      projectId="ladders"
      projectSwitcherLabel={t("header.projectSwitcher")}
      title={title}
      {...(subtitle ? { subtitle } : {})}
      icon={<AppIcon />}
      testId="assessment-header"
      {...(navigation ? { navigation } : {})}
      leading={
        onBack && (
          <Button
            eventId="assessment_header_back"
            data-testid="assessment-back"
            variant="ghost"
            size="icon"
            onClick={onBack}
            aria-label={t("header.back")}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
        )
      }
      actions={
        <>
          <LanguageSelector />
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
        </>
      }
    />
  );
}
