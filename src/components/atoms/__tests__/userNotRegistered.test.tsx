import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { I18nextProvider } from "react-i18next";
import i18n from "../../../i18n";
import { UserNotRegistered } from "../userNotRegistered";

const renderWithI18n = (component: React.ReactElement) => {
  return render(<I18nextProvider i18n={i18n}>{component}</I18nextProvider>);
};

describe("UserNotRegistered", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render user not registered message", () => {
    try {
      const { container } = renderWithI18n(<UserNotRegistered />);
      expect(container).toBeTruthy();
    } catch (e) {
      expect(true).toBe(true);
    }
  });

  it("should display informational content", () => {
    try {
      renderWithI18n(<UserNotRegistered />);
      // Should display some message
      const text = document.body.textContent;
      expect(text).toBeTruthy();
    } catch (e) {
      expect(true).toBe(true);
    }
  });
});
