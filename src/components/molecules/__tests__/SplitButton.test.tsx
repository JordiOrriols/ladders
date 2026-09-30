import React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SplitButton } from "../SplitButton";

describe("SplitButton", () => {
  it("runs the primary action", async () => {
    const onClick = vi.fn();
    render(
      <SplitButton
        label="Publish"
        eventId="publish"
        onClick={onClick}
        menuLabel="More save options"
        items={[]}
      />
    );

    await userEvent.click(screen.getByRole("button", { name: "Publish" }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("opens the menu and runs a secondary action", async () => {
    const onSelect = vi.fn();
    render(
      <SplitButton
        label="Publish"
        eventId="publish"
        onClick={vi.fn()}
        menuLabel="More save options"
        items={[{ label: "Save draft", eventId: "save_draft", onSelect }]}
      />
    );

    await userEvent.click(screen.getByRole("button", { name: "More save options" }));
    await userEvent.click(screen.getByRole("menuitem", { name: "Save draft" }));
    expect(onSelect).toHaveBeenCalledOnce();
  });

  it("supports keyboard navigation and disabled actions", async () => {
    const onDisabled = vi.fn();
    render(
      <SplitButton
        label="Publish"
        eventId="publish"
        onClick={vi.fn()}
        menuLabel="More save options"
        items={[
          { label: "Save draft", eventId: "save_draft", onSelect: vi.fn() },
          { label: "Unavailable", eventId: "unavailable", onSelect: onDisabled, disabled: true },
        ]}
      />
    );

    const trigger = screen.getByRole("button", { name: "More save options" });
    trigger.focus();
    await userEvent.keyboard("{Enter}");
    expect(screen.getByRole("menuitem", { name: "Save draft" })).toHaveFocus();
    expect(screen.getByRole("menuitem", { name: "Unavailable" })).toHaveAttribute("data-disabled");
    expect(onDisabled).not.toHaveBeenCalled();
  });
});
