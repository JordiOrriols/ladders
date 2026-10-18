import { AppMain, AppPage } from "@jordiorriols/ui";
import { useAsyncAction, useWorkspaceList } from "@jordiorriols/ui/hooks";
import { Link2 } from "@jordiorriols/ui/icons";
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Header } from "@/components/molecules/Header";
import { Button } from "@/components/ui/button";
import { useData } from "@/data/DataProvider";
import { isValidToken } from "@/data/tokenApi";
import type { MemberInvite } from "@/types";
import { PageMessage } from "./PageMessage";

type State = { kind: "loading" } | { kind: "notFound" } | { kind: "ready"; invite: MemberInvite };

/** Links the signed-in account to the member an invite was created for. */
export default function JoinPage() {
  const { token } = useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { repository, workspaceApi } = useData();
  const directory = useWorkspaceList(workspaceApi, "ladders");
  const { run, busy, error } = useAsyncAction();
  const [state, setState] = useState<State>({ kind: "loading" });

  useEffect(() => {
    if (!repository) return;
    if (!isValidToken(token)) {
      setState({ kind: "notFound" });
      return;
    }
    let active = true;
    repository
      .previewMemberInvite(token)
      .then((invite) => active && setState({ kind: "ready", invite }))
      .catch(() => active && setState({ kind: "notFound" }));
    return () => {
      active = false;
    };
  }, [repository, token]);

  if (state.kind === "loading") return <PageMessage kind="loading" />;
  if (state.kind === "notFound")
    return (
      <PageMessage kind="notFound">
        <p className="text-sm text-slate-600">{t("join.invalid")}</p>
      </PageMessage>
    );

  const claim = () =>
    run(async () => {
      if (!repository || !token) return;
      const { workspaceId } = await repository.claimMemberInvite(token);
      directory.select(workspaceId);
      navigate("/", { replace: true });
    });

  return (
    <AppPage>
      <Header />
      <AppMain>
        <section
          className="mx-auto max-w-md space-y-4 rounded-2xl border border-slate-200 bg-white p-6"
          data-testid="join-invite"
        >
          <h1 className="text-xl font-semibold text-slate-900">{t("join.title")}</h1>
          <p className="text-slate-700">
            {t("join.description", {
              member: state.invite.memberName,
              workspace: state.invite.workspaceName,
            })}
          </p>
          <p className="text-sm text-slate-500">{t("join.access")}</p>
          {error && (
            <p role="alert" className="text-sm text-red-600">
              {t("join.failed", { message: error })}
            </p>
          )}
          <Button eventId="join_claim" onClick={() => void claim()} disabled={busy}>
            <Link2 className="h-4 w-4" />
            {t("join.claim")}
          </Button>
        </section>
      </AppMain>
    </AppPage>
  );
}
