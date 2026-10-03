import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
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
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string) => Promise<void>;
  /** When set, the dialog renames a team instead of creating one. */
  initialName?: string;
}

export function CreateTeamDialog({ isOpen, onClose, onCreate, initialName }: Props) {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const renaming = initialName !== undefined;

  useEffect(() => {
    if (!isOpen) return;
    setName(initialName ?? "");
    setError(null);
  }, [isOpen, initialName]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const nextName = name.trim();
    if (!nextName) return;
    setBusy(true);
    setError(null);
    try {
      await onCreate(nextName);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent data-testid="team-name-dialog">
        <form onSubmit={handleSubmit} className="space-y-4">
          <AlertDialogHeader>
            <AlertDialogTitle data-testid="team-name-dialog-title">
              {t(renaming ? "teams.renameTitle" : "teams.createTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t(renaming ? "teams.renameDescription" : "teams.createDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div>
            <Label htmlFor="team-name">{t("teams.name")}</Label>
            <Input
              id="team-name"
              data-testid="team-name-input"
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={120}
              required
              autoFocus
              className="mt-1"
            />
          </div>
          {error && (
            <p role="alert" className="text-sm text-red-600">
              {error}
            </p>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel type="button" data-testid="team-name-cancel">{t("buttons.cancel")}</AlertDialogCancel>
            <Button
              eventId={renaming ? "team_rename" : "team_create"}
              data-testid="team-name-submit"
              type="submit"
              disabled={busy || !name.trim() || name.trim() === initialName}
            >
              {t(renaming ? "teams.rename" : "teams.create")}
            </Button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
