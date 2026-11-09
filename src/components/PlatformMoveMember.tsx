import React, { useState } from "react";
import { Button, FormField, SelectField } from "@jordiorriols/ui";
import { useAsyncAction } from "@jordiorriols/ui/hooks";
import { useTranslation } from "react-i18next";
import { platformRepository, type PlatformRoster } from "../data/platform";
import { localizeError } from "../utils/localizeError";

export function PlatformMoveMember({
  workspace,
  member,
  teams,
  onMoved,
}: {
  workspace: string;
  member: PlatformRoster["members"][number];
  teams: PlatformRoster["teams"];
  onMoved: () => void;
}) {
  const { t } = useTranslation();
  const [team, setTeam] = useState(member.team_id);
  const action = useAsyncAction();
  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        if (action.busy || team === member.team_id) return;
        void action.run(async () => {
          await platformRepository.moveMember(workspace, member.id, team);
          onMoved();
        });
      }}
    >
      <fieldset disabled={action.busy} className="space-y-3">
        <FormField id="member-team" label={t("tabs.team")}>
          {(field) => (
            <SelectField
              {...field}
              value={team}
              onValueChange={setTeam}
              options={teams.map((team) => ({ value: team.id, label: team.name }))}
            />
          )}
        </FormField>
        <Button type="submit" disabled={team === member.team_id}>
          {t("platform.moveMember")}
        </Button>
      </fieldset>
      {action.error && (
        <p role="alert" className="text-destructive">
          {localizeError(action.error, t)}
        </p>
      )}
    </form>
  );
}
