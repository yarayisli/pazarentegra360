// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { ComponentProps } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { INITIAL_CREDENTIALS } from "../data/mockData";
import { Header } from "./Header";

afterEach(cleanup);

const renderHeader = (props: Partial<ComponentProps<typeof Header>> = {}) => {
  const handlers = { onManualSync: vi.fn(), onChangeStore: vi.fn(), onOpenQuestions: vi.fn() };
  render(
    <Header
      credentials={INITIAL_CREDENTIALS}
      isSyncing={false}
      activeStore="all"
      unreadQuestionsCount={0}
      {...handlers}
      {...props}
    />,
  );
  return handlers;
};

describe("Header", () => {
  it("shows the unread question badge only when there are unread questions", () => {
    renderHeader({ unreadQuestionsCount: 3 });
    expect(screen.getByText("3")).toBeInTheDocument();
    cleanup();
    renderHeader({ unreadQuestionsCount: 0 });
    expect(screen.queryByText("0")).not.toBeInTheDocument();
  });

  it("disables the sync button while syncing", () => {
    renderHeader({ isSyncing: true });
    expect(screen.getByText("Senkronize Ediliyor...").closest("button")).toBeDisabled();
  });

  it("reports store changes", () => {
    const { onChangeStore } = renderHeader();
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "n11" } });
    expect(onChangeStore).toHaveBeenCalledWith("n11");
  });

  it("shows the logout button only when a handler is given", () => {
    const onLogout = vi.fn();
    renderHeader({ onLogout });
    fireEvent.click(screen.getByLabelText("Çıkış yap"));
    expect(onLogout).toHaveBeenCalled();
    cleanup();
    renderHeader();
    expect(screen.queryByLabelText("Çıkış yap")).not.toBeInTheDocument();
  });
});
