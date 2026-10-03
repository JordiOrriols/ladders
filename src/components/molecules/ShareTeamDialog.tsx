import React, { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { SharedTeamAccess, Team, TeamShare } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Props {
  team: Team | null;
  shares: TeamShare[];
  isOpen: boolean;
  loading?: boolean;
  onClose: () => void;
  onShare: (email: string, access: SharedTeamAccess) => Promise<void>;
  onChangeAccess: (userId: string, access: SharedTeamAccess) => Promise<void>;
  onRemove: (userId: string) => Promise<void>;
}

export function ShareTeamDialog({
  team,
  shares,
  isOpen,
  loading = false,
  onClose,
  onShare,
  onChangeAccess,
  onRemove,
}: Props) {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [access, setAccess] = useState<SharedTeamAccess>("viewer");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setEmail("");
    setAccess("viewer");
    setError(null);
  }, [isOpen]);

  const run = async (operation: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await operation();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  const handleShare = async (event: React.FormEvent) => {
    event.preventDefault();
    const nextEmail = email.trim().toLowerCase();
    if (!nextEmail) return;
    await run(async () => {
      await onShare(nextEmail, access);
      setEmail("");
    });
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent className="max-w-2xl" data-testid="share-team-dialog">
        <AlertDialogHeader>
          <AlertDialogTitle>{t("teams.shareTitle", { name: team?.name ?? "" })}</AlertDialogTitle>
          <AlertDialogDescription>{t("teams.shareDescription")}</AlertDialogDescription>
        </AlertDialogHeader>

        <form onSubmit={handleShare} className="grid gap-3 sm:grid-cols-[1fr_140px_auto]">
          <div>
            <Label htmlFor="share-email">{t("auth.email")}</Label>
            <Input
              id="share-email"
              data-testid="share-email-input"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="share-access">{t("teams.permission")}</Label>
            <select
              id="share-access"
              data-testid="share-access-select"
              value={access}
              onChange={(event) => setAccess(event.target.value as SharedTeamAccess)}
              className="mt-1 h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
            >
              <option value="viewer">{t("teams.viewer")}</option>
              <option value="editor">{t("teams.editor")}</option>
            </select>
          </div>
          <Button
            eventId="team_share_add"
            data-testid="share-team-submit"
            type="submit"
            disabled={busy || !email.trim()}
            className="self-end"
          >
            {t("teams.share")}
          </Button>
        </form>

        {error && (
          <p role="alert" data-testid="share-error" className="text-sm text-red-600">
            {error}
          </p>
        )}

        <div className="max-h-64 space-y-2 overflow-y-auto">
          {loading ? (
            <p className="text-sm text-slate-500">{t("pageMessage.loading")}</p>
          ) : shares.length === 0 ? (
            <p className="text-sm text-slate-500">{t("teams.noShares")}</p>
          ) : (
            shares.map((share) => (
              <div
                key={share.userId}
                data-testid="share-row"
                className="flex items-center gap-3 rounded-md border border-slate-200 px-3 py-2"
              >
                <span className="min-w-0 flex-1 truncate text-sm text-slate-700">
                  {share.email}
                </span>
                <select
                  data-testid="share-row-access"
                  aria-label={t("teams.permissionFor", { email: share.email })}
                  value={share.access}
                  disabled={busy}
                  onChange={(event) =>
                    void run(() =>
                      onChangeAccess(share.userId, event.target.value as SharedTeamAccess)
                    )
                  }
                  className="h-8 rounded-md border border-slate-200 bg-white px-2 text-xs"
                >
                  <option value="viewer">{t("teams.viewer")}</option>
                  <option value="editor">{t("teams.editor")}</option>
                </select>
                <Button
                  eventId="team_share_remove"
                  data-testid="share-row-remove"
                  variant="ghost"
                  size="icon-sm"
                  disabled={busy}
                  onClick={() => void run(() => onRemove(share.userId))}
                  aria-label={t("teams.removeShare", { email: share.email })}
                  type="button"
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            ))
          )}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>{t("buttons.close")}</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
