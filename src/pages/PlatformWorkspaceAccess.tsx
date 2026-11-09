import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Button,
  ErrorState,
  FormField,
  Input,
  NameDialog,
  SelectField,
  getWorkspaceLabels,
} from "@jordiorriols/ui";
import { useAsyncAction, useNameForm } from "@jordiorriols/ui/hooks";
import { useTranslation } from "react-i18next";
import { PlatformLayout } from "../components/PlatformLayout";
import { ConfirmDialog } from "../components/molecules/ConfirmDialog";
import {
  platformRepository,
  workspaceRepository,
  PLATFORM_APPS,
  type PlatformApp,
  type SharedWorkspaceRole,
  type WorkspaceAccess,
  type WorkspaceInvitation,
} from "../data/platform";
import { localizeError } from "../utils/localizeError";

type Directory = Awaited<ReturnType<typeof workspaceRepository.directory>>;

function WorkspaceAppAccess({ workspace, app }: { workspace: string; app: PlatformApp }) {
  const { t, i18n } = useTranslation();
  const labels = getWorkspaceLabels(i18n.language);
  const [data, setData] = useState<WorkspaceAccess>();
  const [error, setError] = useState<unknown>();
  const [recipient, setRecipient] = useState("");
  const [role, setRole] = useState<SharedWorkspaceRole>("viewer");
  const action = useAsyncAction();
  useEffect(() => {
    let active = true;
    void workspaceRepository.access(workspace, app).then(
      (data) => {
        if (active) setData(data);
      },
      (error: unknown) => {
        if (active) setError(error);
      }
    );
    return () => {
      active = false;
    };
  }, [workspace, app]);
  const roles: SharedWorkspaceRole[] =
    app === "planner" || app === "shiplog"
      ? ["viewer", "editor", "external"]
      : ["viewer", "editor"];
  const roleLabel = (role: SharedWorkspaceRole | "owner") =>
    role === "external" ? t("workspaceAccess.external") : labels.access[role];
  return (
    <section className="panel space-y-4" aria-label={labels.shareDialog.title(app)}>
      <h3 className="text-xl font-semibold">{labels.shareDialog.title(app)}</h3>
      {error ? (
        <p role="alert">{localizeError(error, t)}</p>
      ) : !data ? (
        <p>{t("pageMessage.loading")}</p>
      ) : (
        <>
          <form
            className="grid items-end gap-3 sm:grid-cols-[1fr_150px_auto]"
            onSubmit={(event) => {
              event.preventDefault();
              if (action.busy) return;
              void action.run(async () => {
                setData(await workspaceRepository.invite(workspace, app, recipient.trim(), role));
                setRecipient("");
              });
            }}
          >
            <FormField id="workspace-recipient" label={t("platform.recipientId")}>
              {(field) => (
                <Input
                  {...field}
                  required
                  value={recipient}
                  pattern="[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}"
                  onChange={(event) => setRecipient(event.target.value)}
                />
              )}
            </FormField>
            <FormField id="workspace-role" label={labels.shareDialog.permission}>
              {(field) => (
                <SelectField
                  {...field}
                  value={role}
                  onValueChange={(value) => {
                    const next = roles.find((role) => role === value);
                    if (next) setRole(next);
                  }}
                  options={roles.map((value) => ({ value, label: roleLabel(value) }))}
                />
              )}
            </FormField>
            <Button type="submit" disabled={action.busy || !recipient.trim()}>
              {t("workspaceAccess.invite")}
            </Button>
          </form>
          <p className="text-sm text-muted-foreground">{t("workspaceAccess.inviteHint")}</p>
          <ul className="space-y-3">
            {data.grants.map((grant) => (
              <li
                key={grant.account_id}
                className="flex flex-wrap items-center gap-3"
                data-testid={`workspace-grant-${grant.account_id}`}
              >
                <code className="break-all">{grant.account_id}</code>
                {grant.role === "owner" ? (
                  <span>{roleLabel(grant.role)}</span>
                ) : (
                  <>
                    <SelectField
                      aria-label={labels.shareDialog.accessFor(grant.account_id, app)}
                      value={grant.role}
                      disabled={action.busy}
                      onValueChange={(value) => {
                        const next = roles.find((role) => role === value);
                        if (next)
                          void action.run(async () => {
                            setData(
                              await workspaceRepository.update(
                                workspace,
                                app,
                                grant.account_id,
                                next
                              )
                            );
                          });
                      }}
                      options={roles.map((value) => ({ value, label: roleLabel(value) }))}
                    />
                    <Button
                      disabled={action.busy}
                      onClick={() =>
                        void action.run(async () => {
                          setData(
                            await workspaceRepository.remove(workspace, app, grant.account_id)
                          );
                        })
                      }
                    >
                      {labels.shareDialog.remove(grant.account_id)}
                    </Button>
                  </>
                )}
              </li>
            ))}
          </ul>
          <ul className="space-y-3">
            {data.invitations.map((invite) => (
              <li
                key={invite.id}
                data-testid={`workspace-pending-${invite.id}`}
                className="flex flex-wrap items-center gap-3"
              >
                <code className="break-all">{invite.account_id}</code>
                <span>
                  {roleLabel(invite.role)} - {t("platform.invitationPending")}
                </span>
                <Button
                  disabled={action.busy}
                  onClick={() =>
                    void action.run(async () => {
                      setData(await workspaceRepository.remove(workspace, app, invite.account_id));
                    })
                  }
                >
                  {t("platform.revokeInvitation")}
                </Button>
              </li>
            ))}
          </ul>
        </>
      )}
      {action.error && <p role="alert">{localizeError(action.error, t)}</p>}
    </section>
  );
}

export default function PlatformWorkspaceAccess() {
  const { t, i18n } = useTranslation();
  const labels = getWorkspaceLabels(i18n.language);
  const [data, setData] = useState<{
    account: string;
    directory: Directory;
    invitations: WorkspaceInvitation[];
  }>();
  const [error, setError] = useState<unknown>();
  const [revision, setRevision] = useState(0);
  const [workspace, setWorkspace] = useState("");
  const [app, setApp] = useState<PlatformApp>("ladders");
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const action = useAsyncAction();
  const reload = () => setRevision((value) => value + 1);
  const form = useNameForm({
    isOpen: creating,
    onClose: () => setCreating(false),
    onSubmit: async (name) => {
      const saved = await workspaceRepository.create(name);
      setWorkspace(saved.id);
      reload();
    },
  });
  useEffect(() => {
    let active = true;
    setError(undefined);
    void Promise.all([
      platformRepository.myAccountId(),
      workspaceRepository.directory(),
      workspaceRepository.invitations(),
    ]).then(
      ([account, directory, invitations]) => {
        if (active) setData({ account, directory, invitations });
      },
      (error: unknown) => {
        if (active) setError(error);
      }
    );
    return () => {
      active = false;
    };
  }, [revision]);
  const owned = data?.directory.filter((row) => row.role === "owner") ?? [];
  const workspaces = [...new Map(owned.map((row) => [row.id, row])).values()];
  const selected = workspaces.find((row) => row.id === workspace);
  const ownedApps = owned.filter((row) => row.id === workspace).map((row) => row.app);
  const selectedApp = ownedApps.includes(app) ? app : ownedApps[0];
  if (!labels.lifecycle) throw new Error("Workspace lifecycle labels unavailable");
  return (
    <PlatformLayout>
      <Link to="/">{t("platform.workspaces")}</Link>
      <h2 className="text-2xl font-semibold">{t("workspaceAccess.title")}</h2>
      {error ? (
        <ErrorState
          message={localizeError(error, t)}
          retryLabel={t("errors.retry")}
          onRetry={reload}
        />
      ) : !data ? (
        <p>{t("pageMessage.loading")}</p>
      ) : (
        <div className="space-y-6">
          <p>
            {t("platform.yourAccountId")}: <code data-testid="account-id">{data.account}</code>
          </p>
          <p>{t("workspaceAccess.intro")}</p>
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => setCreating(true)}>{labels.newWorkspace}</Button>
            <Button variant="outline" onClick={reload}>
              {t("errors.retry")}
            </Button>
          </div>
          <section aria-label={t("workspaceAccess.invitations")} className="space-y-3">
            <h3 className="font-semibold">{t("workspaceAccess.invitations")}</h3>
            {!data.invitations.length && <p>{t("platform.noInvitations")}</p>}
            <ul className="space-y-3">
              {data.invitations.map((invite) => (
                <li
                  key={invite.id}
                  data-testid={`workspace-invite-${invite.id}`}
                  className="flex flex-wrap items-center gap-3"
                >
                  <span>
                    {invite.name} - {invite.app} -{" "}
                    {invite.role === "external"
                      ? t("workspaceAccess.external")
                      : labels.access[invite.role]}
                  </span>
                  <Button
                    disabled={action.busy}
                    onClick={() =>
                      void action.run(async () => {
                        await workspaceRepository.answer(invite.id, true);
                        reload();
                      })
                    }
                  >
                    {t("platform.acceptInvitation")}
                  </Button>
                  <Button
                    disabled={action.busy}
                    onClick={() =>
                      void action.run(async () => {
                        await workspaceRepository.answer(invite.id, false);
                        reload();
                      })
                    }
                  >
                    {t("platform.declineInvitation")}
                  </Button>
                </li>
              ))}
            </ul>
          </section>
          {workspaces.length > 0 && (
            <FormField id="managed-workspace" label={labels.workspace}>
              {(field) => (
                <SelectField
                  {...field}
                  value={workspace}
                  onValueChange={setWorkspace}
                  options={workspaces.map((row) => ({ value: row.id, label: row.name }))}
                />
              )}
            </FormField>
          )}
          {selected && selectedApp && (
            <>
              <FormField id="managed-app" label={labels.shareDialog.app}>
                {(field) => (
                  <SelectField
                    {...field}
                    value={selectedApp}
                    onValueChange={(value) => {
                      const next = PLATFORM_APPS.find((app) => app === value);
                      if (next) setApp(next);
                    }}
                    options={ownedApps.map((value) => ({ value, label: value }))}
                  />
                )}
              </FormField>
              <WorkspaceAppAccess
                key={`${workspace}:${selectedApp}:${revision}`}
                workspace={workspace}
                app={selectedApp}
              />
              {ownedApps.length === PLATFORM_APPS.length && (
                <Button variant="destructive" onClick={() => setDeleting(true)}>
                  {labels.lifecycle.delete}
                </Button>
              )}
            </>
          )}
        </div>
      )}
      {action.error && <p role="alert">{localizeError(action.error, t)}</p>}
      <NameDialog
        isOpen={creating}
        onClose={() => setCreating(false)}
        form={{ ...form, error: form.error ? localizeError(form.error, t) : null }}
        labels={labels.create}
      />
      <ConfirmDialog
        isOpen={deleting}
        onCancel={() => setDeleting(false)}
        title={labels.lifecycle.deleteTitle}
        description={labels.lifecycle.deleteDescription}
        confirmLabel={labels.lifecycle.delete}
        onConfirm={() => {
          if (!action.busy)
            void action.run(async () => {
              await workspaceRepository.delete(workspace);
              setDeleting(false);
              setWorkspace("");
              reload();
            });
        }}
      />
    </PlatformLayout>
  );
}
