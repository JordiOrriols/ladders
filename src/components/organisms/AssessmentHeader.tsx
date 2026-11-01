import React, { useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import type { ReactNode } from "react";
import { AppHeader, AppShell, PublicAppShell } from "@jordiorriols/ui";
import { ArrowLeft } from "@jordiorriols/ui/icons";
import { AppIcon } from "@/components/atoms/AppIcon";
import { useHeaderLanguage } from "@/components/molecules/LanguageSelector";
import { useAppHeaderProps } from "@/components/molecules/Header";
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

function useAssessmentHeader({
  title,
  subtitle,
  onBack,
  actions,
  extraActions,
  navigation,
}: Props) {
  const { t } = useTranslation();
  const language = useHeaderLanguage();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>, onFile: (file: File) => void) => {
      const file = event.target.files?.[0];
      if (file) onFile(file);
      event.target.value = "";
    },
    []
  );

  return {
    projectSwitcherLabel: t("header.projectSwitcher"),
    title,
    ...(subtitle ? { subtitle } : {}),
    testId: "assessment-header",
    language,
    ...(navigation ? { navigation } : {}),
    leading: onBack && (
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
    ),
    actions: (
      <>
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
    ),
  };
}

export function AssessmentHeader(props: Props) {
  const header = useAssessmentHeader(props);
  return <AppHeader {...header} projectId="ladders" icon={<AppIcon />} />;
}

export function AssessmentLayout({
  children,
  authenticated = false,
  ...props
}: Props & { children: ReactNode; authenticated?: boolean }) {
  const { t } = useTranslation();
  const header = useAssessmentHeader(props);
  const accountHeader = useAppHeaderProps();
  const footer = { text: t("footer.attribution") };
  return authenticated ? (
    <AppShell
      projectId="ladders"
      header={{
        ...header,
        actions: (
          <>
            {header.actions}
            {accountHeader.actions}
          </>
        ),
      }}
      footer={footer}
      mainClassName="max-w-[90rem]"
    >
      {children}
    </AppShell>
  ) : (
    <PublicAppShell
      projectId="ladders"
      header={header}
      footer={footer}
      mainClassName="max-w-[90rem]"
    >
      {children}
    </PublicAppShell>
  );
}
