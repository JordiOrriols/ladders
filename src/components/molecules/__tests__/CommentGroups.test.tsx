import React from "react";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { I18nextProvider } from "react-i18next";
import i18n from "@/i18n";
import { CommentGroups } from "../CommentGroups";

const renderGroups = () =>
  render(
    <I18nextProvider i18n={i18n}>
      <CommentGroups
        groups={[
          {
            id: "manager",
            label: "Manager",
            color: "#10b981",
            comments: { Technology: "Strong architecture decisions", People: "" },
          },
          {
            id: "peer",
            label: "Peer · Ada",
            color: "#6366f1",
            comments: { Technology: "Helpful reviews", Process: "Clear releases" },
          },
        ]}
      />
    </I18nextProvider>
  );

describe("CommentGroups", () => {
  it("groups non-empty comments by competency and evaluator", () => {
    renderGroups();
    expect(screen.getByTestId("comment-groups")).toBeInTheDocument();
    expect(screen.getByText("Strong architecture decisions")).toBeInTheDocument();
    expect(screen.getByText("Helpful reviews")).toBeInTheDocument();
    expect(screen.getByText("Clear releases")).toBeInTheDocument();
    expect(screen.queryByText("People")).not.toBeInTheDocument();
  });

  it("renders nothing when every comment is empty", () => {
    const { container } = render(
      <I18nextProvider i18n={i18n}>
        <CommentGroups
          groups={[{ id: "manager", label: "Manager", color: "#10b981", comments: {} }]}
        />
      </I18nextProvider>
    );
    expect(container).toBeEmptyDOMElement();
  });
});
