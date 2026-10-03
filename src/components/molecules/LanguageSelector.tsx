import React from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Check, ChevronDown, Globe } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

const LANGUAGES = [
  { code: "en", short: "EN", label: "English" },
  { code: "es", short: "ES", label: "Español" },
  { code: "ca", short: "CA", label: "Català" },
];

export function LanguageSelector() {
  const { t, i18n } = useTranslation();
  const current = i18n.language.split("-")[0] ?? "en";
  const short = LANGUAGES.find((language) => language.code === current)?.short ?? "EN";

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <Button
          eventId="header_language_menu"
          variant="outline"
          size="sm"
          aria-label={t("header.language")}
          data-testid="language-selector"
          className="hidden sm:inline-flex"
        >
          <Globe className="h-4 w-4" />
          {short}
          <ChevronDown className="h-3.5 w-3.5" />
        </Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={6}
          className="z-50 min-w-40 rounded-md border border-slate-200 bg-white p-1 shadow-lg"
        >
          <DropdownMenu.RadioGroup
            value={current}
            onValueChange={(language) => void i18n.changeLanguage(language)}
          >
            {LANGUAGES.map((language) => (
              <DropdownMenu.RadioItem
                key={language.code}
                value={language.code}
                data-testid={`language-button-${language.code}`}
                className="flex cursor-default select-none items-center justify-between gap-4 rounded px-3 py-2 text-sm text-slate-700 outline-none data-[highlighted]:bg-slate-100"
              >
                <span>{language.label}</span>
                <DropdownMenu.ItemIndicator>
                  <Check className="h-4 w-4 text-emerald-600" />
                </DropdownMenu.ItemIndicator>
              </DropdownMenu.RadioItem>
            ))}
          </DropdownMenu.RadioGroup>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
