import React from "react";
import { Plus, Info, LayoutGrid } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "../ui/button";
import { LanguageSelector } from "../ui/language-selector";

interface HeaderProps {
  onAddMember: () => void;
  onShowReference: () => void;
}

export function Header({ onAddMember, onShowReference }: HeaderProps) {
  const { t, i18n } = useTranslation();

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <LayoutGrid className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-slate-800">{t("header.title")}</h1>
              <p className="text-xs text-slate-500">{t("header.subtitle")}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Language Selector */}
            <LanguageSelector
              value={i18n.language}
              onChange={(lng) => i18n.changeLanguage(lng)}
              position="static"
              className="hidden sm:flex"
            />

            <Button
              eventId="header_show_reference"
              variant="outline"
              size="sm"
              onClick={onShowReference}
              className="hidden sm:flex"
            >
              <Info className="w-4 h-4 mr-2" />
              {t("header.reference")}
            </Button>
            <Button eventId="header_add_member" onClick={onAddMember}>
              <Plus className="w-4 h-4 mr-2" />
              {t("header.addMember")}
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
