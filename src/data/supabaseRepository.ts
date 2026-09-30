import type { SupabaseClient } from "@supabase/supabase-js";
import type { Evaluation, EvaluationInput, TeamMember } from "@/types";
import type { MemberPatch, Repository } from "./repository";

export type MemberRow = {
  id: string;
  name: string;
  role: string | null;
  template_id: string | null;
  self_token: string;
  peer_token: string;
  view_token: string;
  view_enabled: boolean;
  created_at: string;
};

export type EvaluationRow = {
  id: string;
  member_id: string;
  kind: Evaluation["kind"];
  status: Evaluation["status"];
  author_name: string | null;
  current_levels: Evaluation["currentLevels"];
  goal_levels: Evaluation["goalLevels"];
  comments: Evaluation["comments"];
  created_at: string;
};

const MEMBER_COLUMNS =
  "id,name,role,template_id,self_token,peer_token,view_token,view_enabled,created_at";
const EVALUATION_COLUMNS =
  "id,member_id,kind,status,author_name,current_levels,goal_levels,comments,created_at";

const toMember = (row: MemberRow): TeamMember => ({
  id: row.id,
  name: row.name,
  role: row.role ?? "",
  templateId: row.template_id,
  selfToken: row.self_token,
  peerToken: row.peer_token,
  viewToken: row.view_token,
  viewEnabled: row.view_enabled,
  createdAt: row.created_at,
});

export const toEvaluation = (row: EvaluationRow): Evaluation => ({
  id: row.id,
  memberId: row.member_id,
  kind: row.kind,
  status: row.status,
  authorName: row.author_name,
  currentLevels: row.current_levels ?? {},
  goalLevels: row.goal_levels ?? {},
  comments: row.comments ?? {},
  createdAt: row.created_at,
});

export const toEvaluationPayload = (input: EvaluationInput) => ({
  status: input.status,
  author_name: input.authorName,
  current_levels: input.currentLevels,
  goal_levels: input.goalLevels,
  comments: input.comments,
});

function toMemberPatch(patch: MemberPatch) {
  const row: Record<string, unknown> = {};
  if (patch.name !== undefined) row["name"] = patch.name;
  if (patch.role !== undefined) row["role"] = patch.role;
  if (patch.templateId !== undefined) row["template_id"] = patch.templateId;
  if (patch.viewEnabled !== undefined) row["view_enabled"] = patch.viewEnabled;
  return row;
}

function unwrap<T>({ data, error }: { data: T | null; error: { message: string } | null }): T {
  if (error) throw new Error(error.message);
  if (data === null) throw new Error("Empty response");
  return data;
}

export function createSupabaseRepository(client: SupabaseClient): Repository {
  return {
    kind: "remote",
    async listMembers() {
      const rows = unwrap<MemberRow[]>(
        await client.from("members").select(MEMBER_COLUMNS).order("created_at")
      );
      return rows.map(toMember);
    },
    async getMember(id) {
      const { data, error } = await client
        .from("members")
        .select(MEMBER_COLUMNS)
        .eq("id", id)
        .maybeSingle<MemberRow>();
      if (error) throw new Error(error.message);
      return data ? toMember(data) : null;
    },
    async createMember(profile) {
      const row = unwrap<MemberRow>(
        await client
          .from("members")
          .insert({ name: profile.name, role: profile.role, template_id: profile.templateId })
          .select(MEMBER_COLUMNS)
          .single<MemberRow>()
      );
      return toMember(row);
    },
    async updateMember(id, patch) {
      const row = unwrap<MemberRow>(
        await client
          .from("members")
          .update(toMemberPatch(patch))
          .eq("id", id)
          .select(MEMBER_COLUMNS)
          .single<MemberRow>()
      );
      return toMember(row);
    },
    async deleteMember(id) {
      const { error } = await client.from("members").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    async listEvaluations(memberId) {
      let query = client.from("evaluations").select(EVALUATION_COLUMNS);
      if (memberId) query = query.eq("member_id", memberId);
      const rows = unwrap<EvaluationRow[]>(await query.order("created_at", { ascending: false }));
      return rows.map(toEvaluation);
    },
    async createEvaluation(memberId, kind, input, createdAt) {
      const row = unwrap<EvaluationRow>(
        await client
          .from("evaluations")
          .insert({
            ...toEvaluationPayload(input),
            member_id: memberId,
            kind,
            ...(createdAt ? { created_at: createdAt } : {}),
          })
          .select(EVALUATION_COLUMNS)
          .single<EvaluationRow>()
      );
      return toEvaluation(row);
    },
    async setEvaluationStatus(id, status) {
      const { error } = await client.from("evaluations").update({ status }).eq("id", id);
      if (error) throw new Error(error.message);
    },
    async deleteEvaluation(id) {
      const { error } = await client.from("evaluations").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
  };
}
