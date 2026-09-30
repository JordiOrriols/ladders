import React from "react";
import { Copy, Link2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { TeamMember } from "@/types";
import { buildShareLink, copyToClipboard } from "@/utils/sharing";

type Props = {
  member: TeamMember | null;
  onToggleView: (enabled: boolean) => void;
};

export function ShareLinksCard({ member, onToggleView }: Props) {
  const { t } = useTranslation();

  if (!member?.selfToken || !member.peerToken || !member.viewToken) {
    return (
      <div
        className="rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-500"
        data-testid="share-links-unavailable"
      >
        {t("share.loginRequired")}
      </div>
    );
  }

  const links = [
    { id: "self", url: buildShareLink(`e/${member.selfToken}`), enabled: true },
    { id: "peer", url: buildShareLink(`e/${member.peerToken}`), enabled: true },
    { id: "view", url: buildShareLink(`v/${member.viewToken}`), enabled: member.viewEnabled },
  ];

  const copy = async (url: string) => {
    try {
      await copyToClipboard(url);
      alert(t("alerts.linkCopied"));
    } catch (error) {
      console.error("Failed to copy link", error);
      alert(t("alerts.failedToCopyLink"));
    }
  };

  return (
    <div
      className="rounded-xl border border-slate-200 bg-white p-4 space-y-3"
      data-testid="share-links"
    >
      <div className="flex items-center gap-2">
        <Link2 className="w-4 h-4 text-slate-500" />
        <h3 className="text-sm font-semibold text-slate-700">{t("share.title")}</h3>
      </div>
      {links.map((link) => (
        <div key={link.id} className="space-y-1">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-slate-700">
              {t(`share.${link.id}.label`)}
            </span>
            {link.id === "view" && (
              <label className="flex items-center gap-1 text-xs text-slate-600">
                <input
                  type="checkbox"
                  checked={member.viewEnabled}
                  onChange={(e) => onToggleView(e.target.checked)}
                />
                {t("share.view.enable")}
              </label>
            )}
          </div>
          <p className="text-[11px] text-slate-500">{t(`share.${link.id}.hint`)}</p>
          <div className="flex items-center gap-1">
            <input
              readOnly
              value={link.url}
              aria-label={t(`share.${link.id}.label`)}
              className={`flex-1 min-w-0 rounded border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] ${
                link.enabled ? "text-slate-700" : "text-slate-400 line-through"
              }`}
            />
            <button
              type="button"
              disabled={!link.enabled}
              onClick={() => copy(link.url)}
              title={t("share.copy")}
              aria-label={t("share.copy")}
              className="p-1.5 rounded border border-slate-200 hover:bg-slate-100 disabled:opacity-40"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
