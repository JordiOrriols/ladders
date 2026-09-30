import { describe, it, expect, beforeEach } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { createLocalRepository } from "@/data/localRepository";
import {
  createLocalSelfStore,
  createManagerStore,
  createPeerTokenStore,
} from "@/data/evaluationStore";
import type { EvaluationStore } from "@/data/evaluationStore";
import { EditorValidationError, useEvaluationEditor } from "../useEvaluationEditor";

const renderEditor = async (store: EvaluationStore) => {
  const hook = renderHook(() => useEvaluationEditor(store));
  await waitFor(() => expect(hook.result.current.loadState).toBe("ready"));
  return hook;
};

describe("useEvaluationEditor", () => {
  beforeEach(() => localStorage.clear());

  it("creates a new manager version on every save, creating the member first", async () => {
    const repo = createLocalRepository();
    const store = createManagerStore(repo, null);
    const { result } = await renderEditor(store);

    await expect(result.current.save("draft")).rejects.toBeInstanceOf(EditorValidationError);

    act(() => {
      result.current.setName("Ada");
      result.current.setTemplateId("D2");
      result.current.handleCurrentChange("Technology", 2);
    });
    expect(result.current.dirty).toBe(true);

    await act(async () => {
      await result.current.save("draft");
    });
    act(() => result.current.handleCurrentChange("Technology", 3));
    await act(async () => {
      await result.current.save("published");
    });

    const memberId = result.current.memberId!;
    expect((await repo.getMember(memberId))?.templateId).toBe("D2");
    const versions = await repo.listEvaluations(memberId);
    expect(versions.map((v) => v.status).sort()).toEqual(["draft", "published"]);
    expect(result.current.evaluations).toHaveLength(2);
    expect(result.current.dirty).toBe(false);
  });

  it("loads a selected version into the form and deletes versions", async () => {
    const repo = createLocalRepository();
    const member = await repo.createMember({ name: "Bo", role: "", templateId: null });
    const base = { authorName: null, goalLevels: {}, comments: {} };
    const old = await repo.createEvaluation(
      member.id,
      "manager",
      { ...base, status: "published", currentLevels: { Technology: 1 } },
      "2026-01-01T00:00:00.000Z"
    );
    await repo.createEvaluation(
      member.id,
      "manager",
      { ...base, status: "draft", currentLevels: { Technology: 4 } },
      "2026-02-01T00:00:00.000Z"
    );
    const self = await repo.createEvaluation(member.id, "self", {
      ...base,
      status: "published",
      currentLevels: { Technology: 2 },
    });

    const { result } = await renderEditor(createManagerStore(repo, member.id));
    expect(result.current.form.currentLevels).toEqual({ Technology: 4 });
    expect(result.current.compareIds).toEqual([self.id]);

    act(() => result.current.selectVersion(old.id));
    expect(result.current.form.currentLevels).toEqual({ Technology: 1 });
    expect(result.current.editingId).toBe(old.id);

    act(() => result.current.selectVersion(self.id));
    expect(result.current.compareIds).toEqual([]);

    await act(async () => {
      await result.current.setVersionStatus(old, "draft");
      await result.current.deleteVersion(old);
    });
    expect(result.current.evaluations.map((e) => e.id)).not.toContain(old.id);
    expect(result.current.editingId).toBeNull();
  });

  it("keeps anonymous self-assessments on the device with history", async () => {
    const { result } = await renderEditor(createLocalSelfStore());
    act(() => {
      result.current.setName("Me");
      result.current.handleCurrentChange("People", 2);
    });
    await act(async () => {
      await result.current.save("draft");
    });

    const reloaded = await renderEditor(createLocalSelfStore());
    expect(reloaded.result.current.profile.name).toBe("Me");
    expect(reloaded.result.current.evaluations).toHaveLength(1);
    expect(reloaded.result.current.evaluations[0]?.kind).toBe("self");
  });

  it("migrates the legacy self-assessment storage into a draft version", async () => {
    localStorage.setItem(
      "self-assessment-data",
      JSON.stringify({
        version: 1,
        data: {
          name: "Old",
          role: "Dev",
          currentLevels: { Technology: 2 },
          goalLevels: {},
          comments: {},
        },
      })
    );
    const { result } = await renderEditor(createLocalSelfStore());
    expect(result.current.profile.name).toBe("Old");
    expect(result.current.evaluations[0]?.status).toBe("draft");
    expect(result.current.form.currentLevels).toEqual({ Technology: 2 });
  });

  it("reports not found for unknown peer links", async () => {
    const store = createPeerTokenStore("not-a-token");
    const { result } = renderHook(() => useEvaluationEditor(store));
    await waitFor(() => expect(result.current.loadState).not.toBe("loading"));
    expect(["notFound", "error"]).toContain(result.current.loadState);
  });
});
