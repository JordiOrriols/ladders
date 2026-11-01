import React from "react";
import type { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { useData } from "@/data/DataProvider";
import { WelcomePage } from "@/pages/WelcomePage";
import { PageMessage } from "@/pages/PageMessage";
import { AppLayout } from "./AppLayout";
import { rememberInvite } from "@/utils/pendingInvite";

export function EntryGate({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const { user, loading, authError } = useData();
  const isSharedRoute = pathname.startsWith("/e/") || pathname.startsWith("/v/");

  if (loading && !isSharedRoute) {
    return <PageMessage kind="loading" />;
  }

  if (authError && !isSharedRoute) {
    return <AppLayout>{null}</AppLayout>;
  }

  if (!isSharedRoute && !user) {
    const invite = /^\/join\/([^/]+)$/.exec(pathname)?.[1];
    if (invite) rememberInvite(invite);
    return <WelcomePage />;
  }
  return children;
}
