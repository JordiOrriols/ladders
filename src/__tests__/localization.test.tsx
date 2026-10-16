import React, { type ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { APP_LANGUAGES } from "@jordiorriols/ui";
import i18n from "@/i18n";
import App from "@/App";
import { Header } from "@/components/molecules/Header";
import { AssessmentHeader } from "@/components/organisms/AssessmentHeader";
import LevelSelector from "@/components/atoms/levelSelector";
import MemberCard from "@/components/atoms/memberCard";
import RadarChart from "@/components/atoms/radarChart";
import { CommentGroups, type CommentGroup } from "@/components/molecules/CommentGroups";
import { SmartGoalsPanel } from "@/components/organisms/SmartGoalsPanel";
import { createInMemoryRepository } from "@/data/__tests__/inMemoryRepository";
import { createRepositoryGoalStore } from "@/data/goalStore";

vi.mock("@/data/DataProvider", () => ({
  DataProvider: ({ children }: { children: ReactNode }) => children,
  useData: () => ({
    authEnabled: false,
    user: null,
    loading: false,
    authError: null,
    passwordRecovery: false,
  }),
}));

const changeLanguage = (locale: string) =>
  act(async () => {
    await i18n.changeLanguage(locale);
  });

afterEach(async () => {
  cleanup();
  await changeLanguage("en");
});

describe.each(APP_LANGUAGES.map(({ code }) => code))("localized UI: %s", (locale) => {
  it("translates both project switchers, navigation and competency labels", async () => {
    await changeLanguage(locale);
    render(
      <>
        <Header />
        <AssessmentHeader title="Ada" actions={[]} onBack={vi.fn()} />
        <LevelSelector
          vertical="Technology"
          currentLevel={0}
          goalLevel={2}
          selfAssessmentLevel={1}
          expanded
          onCurrentChange={vi.fn()}
          onGoalChange={vi.fn()}
        />
      </>
    );
    expect(document.documentElement.lang).toBe(locale);
    expect(screen.getAllByRole("button", { name: i18n.t("header.projectSwitcher") })).toHaveLength(
      2
    );
    expect(screen.getByRole("button", { name: i18n.t("header.back") })).toBeInTheDocument();
    expect(screen.getByText(i18n.t("verticals.Technology"))).toBeInTheDocument();
    expect(screen.getByText(i18n.t("competency.currentNotSet"))).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: i18n.t("competency.details", {
          vertical: i18n.t("verticals.Technology"),
          current: i18n.t("labels.currentNotSet"),
          goal: 2,
        }),
      })
    ).toBeInTheDocument();
  });

  it("translates member actions without translating names or job titles", async () => {
    await changeLanguage(locale);
    const name = "Ada Technology";
    render(
      <MemberCard
        member={{
          id: "ada",
          teamId: "team",
          name,
          role: "People Engineer",
          planningRole: null,
          vacationToken: null,
          currentLevels: { Technology: 3 },
          goalLevels: { Technology: 4 },
        }}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    );
    expect(screen.getByText(name)).toBeInTheDocument();
    expect(screen.getByText("People Engineer")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: i18n.t("members.edit", { name }) })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: i18n.t("members.delete", { name }) })
    ).toBeInTheDocument();
  });

  it("translates chart labels while preserving domain keys and plotted values", async () => {
    await changeLanguage("en");
    const levels = Object.freeze({ Technology: 4, People: 2 });
    const series = [{ id: "ada", label: "Ada", levels, color: "#10b981" }];
    const { container } = render(<RadarChart series={series} />);
    const path = container.querySelector("path[data-series='ada']")!.getAttribute("d");
    await changeLanguage(locale);
    expect(screen.getByText(i18n.t("verticals.Technology"))).toBeInTheDocument();
    expect(screen.getByLabelText(i18n.t("chart.description"))).toBeInTheDocument();
    expect(screen.getByRole("button", { name: i18n.t("chart.download") })).toBeInTheDocument();
    expect(container.querySelector("path[data-series='ada']")).toHaveAttribute("d", path);
    expect(levels).toEqual({ Technology: 4, People: 2 });
  });

  it("translates comment headings but passes original categories to moderation", async () => {
    await changeLanguage(locale);
    const group: CommentGroup = {
      id: "ada",
      label: "Ada",
      color: "#10b981",
      comments: { Technology: "Keep Technology as entered" },
    };
    const commentAction = vi.fn(() => null);
    render(<CommentGroups groups={[group]} commentAction={commentAction} />);
    expect(screen.getByText(i18n.t("verticals.Technology"))).toBeInTheDocument();
    expect(screen.getByText("Keep Technology as entered")).toBeInTheDocument();
    expect(commentAction).toHaveBeenCalledWith(group, "Technology");
    expect(group.comments).toEqual({ Technology: "Keep Technology as entered" });
  });

  it("formats goal dates and comment timestamps using the selected locale", async () => {
    await changeLanguage(locale);
    const repository = createInMemoryRepository();
    const member = await repository.createMember({ name: "Ada", role: "", templateId: null });
    const goal = await repository.createGoal(member.id, {
      title: "Technology mentoring",
      description: "Keep People as entered",
      dueDate: "2027-01-13",
      progress: 25,
    });
    const saved = await repository.appendGoalComment(goal.id, "A comment in its original language");
    render(<SmartGoalsPanel readOnly store={createRepositoryGoalStore(repository, member.id)} />);
    expect(await screen.findByText("Technology mentoring")).toBeInTheDocument();
    expect(screen.getByText("Keep People as entered")).toBeInTheDocument();
    expect(
      screen.getByText((text) =>
        text.includes(new Date("2027-01-13T00:00:00").toLocaleDateString(locale))
      )
    ).toBeInTheDocument();
    const timestamp = saved.comments[0]!.createdAt;
    expect(screen.getByText(new Date(timestamp).toLocaleString(locale))).toHaveAttribute(
      "dateTime",
      timestamp
    );
  });

  it("supplies translated footer attribution rather than the shared English default", async () => {
    await changeLanguage(locale);
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    );
    expect(screen.getByRole("contentinfo")).toHaveTextContent(i18n.t("footer.attribution"));
  });
});

it("uses the supported base language for regional language preferences", async () => {
  await changeLanguage("fr-FR");
  render(<Header />);
  expect(document.documentElement.lang).toBe("fr");
  expect(screen.getByTestId("language-selector")).toHaveTextContent("FR");
});

it("uses English document language for an unsupported locale", async () => {
  await changeLanguage("ja");
  expect(document.documentElement.lang).toBe("en");
});
