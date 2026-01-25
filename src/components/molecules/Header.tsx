import React from "react";
import { Plus, Info, LayoutGrid, Globe } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "../ui/button";

interface HeaderProps {
  onAddMember: () => void;
  onShowReference: () => void;
}

export function Header({ onAddMember, onShowReference }: HeaderProps) {
  const { t, i18n } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40" data-testid="header">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3" data-testid="header-content">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <LayoutGrid className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-slate-800" data-testid="header-title">{t("header.title")}</h1>
              <p className="text-xs text-slate-500" data-testid="header-subtitle">{t("header.subtitle")}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Language Selector */}
            <div className="hidden sm:flex items-center gap-1 px-2 py-1 bg-slate-100 rounded-lg" data-testid="language-selector">
              <Globe className="w-4 h-4 text-slate-600" />
              <Button
                eventId="header_language_en"
                variant={i18n.language === "en" ? "default" : "ghost"}
                size="sm"
                onClick={() => changeLanguage("en")}
                className="h-7 px-2 text-xs"
                data-testid="language-button-en"
              >
                EN
              </Button>
              <Button
                eventId="header_language_es"
                variant={i18n.language === "es" ? "default" : "ghost"}
                size="sm"
                onClick={() => changeLanguage("es")}
                className="h-7 px-2 text-xs"
                data-testid="language-button-es"
              >
                ES
              </Button>
              <Button
                eventId="header_language_ca"
                variant={i18n.language === "ca" ? "default" : "ghost"}
                size="sm"
                onClick={() => changeLanguage("ca")}
                className="h-7 px-2 text-xs"
                data-testid="language-button-ca"
              >
                CA
              </Button>
            </div>

            <Button
              eventId="header_show_reference"
              variant="outline"
              size="sm"
              onClick={onShowReference}
              className="hidden sm:flex"
              data-testid="reference-button"
            >
              <Info className="w-4 h-4 mr-2" />
              {t("header.reference")}
            </Button>
            <Button eventId="header_add_member" onClick={onAddMember} data-testid="add-member-button">
              <Plus className="w-4 h-4 mr-2" />
              {t("header.addMember")}
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
