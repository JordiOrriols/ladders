import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { I18nextProvider } from "react-i18next";
import i18n from "../../../i18n";
import type { Evaluation } from "@/types";
import { VersionPanel } from "../VersionPanel";
import { TemplatePanel } from "../TemplatePanel";

const renderWithI18n = (ui: React.ReactElement) =>
  render(<I18nextProvider i18n={i18n}>{ui}</I18nextProvider>);

const evaluation = (overrides: Partial<Evaluation>): Evaluation => ({
  id: "e",
  memberId: "m",
  kind: "manager",
  status: "published",
  authorName: null,
  currentLevels: { Technology: 2 },
  goalLevels: {},
  comments: {},
  createdAt: "2026-03-10T10:00:00.000Z",
  ...overrides,
});

describe("VersionPanel", () => {
  const list = [
    evaluation({ id: "m1" }),
    evaluation({ id: "p1", kind: "peer", authorName: "Alice", status: "draft" }),
    evaluation({ id: "p2", kind: "peer", authorName: "Bob" }),
  ];

  it("lists versions by month, filters by author and toggles compare", async () => {
    const onToggleCompare = vi.fn();
    const onSelect = vi.fn();
    renderWithI18n(
      <VersionPanel
        evaluations={list}
        selectedId="m1"
        compareIds={[]}
        onSelect={onSelect}
        onToggleCompare={onToggleCompare}
      />
    );
    expect(screen.getAllByText("March 2026")).toHaveLength(3);

    await userEvent.click(screen.getByRole("button", { name: "Peer · Alice" }));
    expect(screen.getAllByText("March 2026")).toHaveLength(2);

    const compareButtons = screen.getAllByRole("button", { name: "Show on chart" });
    await userEvent.click(compareButtons[1]!);
    expect(onToggleCompare).toHaveBeenCalledWith("p2");

    await userEvent.click(screen.getAllByText("March 2026")[1]!);
    expect(onSelect).toHaveBeenCalledWith("p2");
  });

  it("deletes after confirmation without exposing status actions", async () => {
    const onDelete = vi.fn();
    renderWithI18n(
      <VersionPanel
        evaluations={[list[1]!]}
        selectedId={null}
        compareIds={[]}
        onSelect={vi.fn()}
        onToggleCompare={vi.fn()}
        onDelete={onDelete}
        canDelete={() => true}
      />
    );
    expect(screen.queryByRole("button", { name: "Publish" })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Delete" }));
    expect(screen.getByText("Delete this version?")).toBeInTheDocument();
    await userEvent.click(screen.getAllByRole("button", { name: "Delete" }).at(-1)!);
    expect(onDelete).toHaveBeenCalledWith(list[1]);
  });
});

describe("TemplatePanel", () => {
  it("lets you pick a template and explains the level", async () => {
    const onChange = vi.fn();
    const { rerender } = renderWithI18n(<TemplatePanel templateId={null} onChange={onChange} />);
    await userEvent.selectOptions(screen.getByLabelText("Seniority template"), "D3");
    expect(onChange).toHaveBeenCalledWith("D3");

    rerender(
      <I18nextProvider i18n={i18n}>
        <TemplatePanel templateId="D3" onChange={onChange} />
      </I18nextProvider>
    );
    await userEvent.click(screen.getByRole("button", { name: "What this level means" }));
    expect(screen.getByText(/Process · L3 Challenges/)).toBeInTheDocument();
  });

  it("renders nothing read-only without a template", () => {
    const { container } = renderWithI18n(<TemplatePanel templateId={null} />);
    expect(container).toBeEmptyDOMElement();
  });
});
