import React from "react";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { I18nextProvider } from "react-i18next";
import i18n from "@/i18n";
import type { Evaluation } from "@/types";
import { EvaluationViewer } from "../EvaluationViewer";

const evaluation = (overrides: Partial<Evaluation>): Evaluation => ({
  id: "manager",
  memberId: "member",
  kind: "manager",
  status: "published",
  authorName: null,
  currentLevels: { Technology: 3 },
  goalLevels: {},
  comments: { Technology: "Manager perspective" },
  createdAt: "2026-09-01T00:00:00.000Z",
  ...overrides,
});

describe("EvaluationViewer comments", () => {
  it("shows selected and default-visible self comments", () => {
    render(
      <I18nextProvider i18n={i18n}>
        <EvaluationViewer
          evaluations={[
            evaluation({}),
            evaluation({
              id: "self",
              kind: "self",
              authorName: "Ada",
              comments: { Technology: "Self perspective" },
              createdAt: "2026-08-01T00:00:00.000Z",
            }),
          ]}
          templateId={null}
        />
      </I18nextProvider>
    );

    expect(screen.getByText("Manager perspective")).toBeInTheDocument();
    expect(screen.getByText("Self perspective")).toBeInTheDocument();
  });
});
