import { describe, it, expect, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseRepository } from "../supabaseRepository";

type Response = { data: unknown; error: { message: string } | null };

/** Minimal chainable stand-in for the PostgREST query builder. */
function fakeClient(queue: Response[]) {
  const calls: unknown[][] = [];
  const from = vi.fn((table: string) => {
    const builder: Record<string, unknown> = {};
    for (const method of ["select", "insert", "update", "delete", "eq", "order"]) {
      builder[method] = (...args: unknown[]) => {
        calls.push([table, method, ...args]);
        return builder;
      };
    }
    builder["single"] = builder["maybeSingle"] = () => builder;
    builder["then"] = (resolve: (r: Response) => unknown, reject: (e: unknown) => unknown) =>
      Promise.resolve(queue.shift() ?? { data: null, error: null }).then(resolve, reject);
    return builder;
  });
  return { client: { from } as unknown as SupabaseClient, calls };
}

const memberRow = {
  id: "m1",
  name: "Ada",
  role: null,
  template_id: "D3",
  self_token: "s",
  peer_token: "p",
  view_token: "v",
  view_enabled: true,
  created_at: "2026-01-01",
};

const evaluationRow = {
  id: "e1",
  member_id: "m1",
  kind: "manager",
  status: "draft",
  author_name: null,
  current_levels: { Technology: 2 },
  goal_levels: null,
  comments: {},
  created_at: "2026-01-02",
};

describe("supabaseRepository", () => {
  it("maps member rows to camelCase", async () => {
    const { client } = fakeClient([{ data: [memberRow], error: null }]);
    const [member] = await createSupabaseRepository(client).listMembers();
    expect(member).toMatchObject({
      id: "m1",
      role: "",
      templateId: "D3",
      selfToken: "s",
      viewEnabled: true,
    });
  });

  it("returns null for a missing member and throws on errors", async () => {
    const { client } = fakeClient([
      { data: null, error: null },
      { data: null, error: { message: "boom" } },
    ]);
    const repo = createSupabaseRepository(client);
    expect(await repo.getMember("x")).toBeNull();
    await expect(repo.getMember("x")).rejects.toThrow("boom");
  });

  it("creates and updates members with snake_case payloads", async () => {
    const { client, calls } = fakeClient([
      { data: memberRow, error: null },
      { data: memberRow, error: null },
    ]);
    const repo = createSupabaseRepository(client);
    await repo.createMember({ name: "Ada", role: "Dev", templateId: "D3" });
    await repo.updateMember("m1", { viewEnabled: false, templateId: null });
    expect(calls).toContainEqual([
      "members",
      "insert",
      { name: "Ada", role: "Dev", template_id: "D3" },
    ]);
    expect(calls).toContainEqual(["members", "update", { template_id: null, view_enabled: false }]);
  });

  it("creates, lists, updates and deletes evaluations", async () => {
    const { client, calls } = fakeClient([
      { data: evaluationRow, error: null },
      { data: [evaluationRow], error: null },
      { data: null, error: null },
      { data: null, error: null },
      { data: null, error: null },
    ]);
    const repo = createSupabaseRepository(client);
    const created = await repo.createEvaluation(
      "m1",
      "manager",
      {
        status: "draft",
        authorName: null,
        currentLevels: { Technology: 2 },
        goalLevels: {},
        comments: {},
      },
      "2026-01-02"
    );
    expect(created.goalLevels).toEqual({});
    expect(await repo.listEvaluations("m1")).toHaveLength(1);
    await repo.setEvaluationStatus("e1", "published");
    await repo.deleteEvaluation("e1");
    await repo.deleteMember("m1");
    expect(calls).toContainEqual(["evaluations", "eq", "member_id", "m1"]);
    expect(calls).toContainEqual(["evaluations", "update", { status: "published" }]);
    expect(calls.find((c) => c[1] === "insert")?.[2]).toMatchObject({
      member_id: "m1",
      kind: "manager",
      created_at: "2026-01-02",
    });
  });
});
