// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LoginView } from "./LoginView";

afterEach(cleanup);

const fill = (label: string, value: string) => fireEvent.change(screen.getByLabelText(label), { target: { value } });

describe("LoginView", () => {
  it("submits the login form", async () => {
    const onSubmit = vi.fn().mockResolvedValue(null);
    render(<LoginView onSubmit={onSubmit} />);
    fill("E-posta", "a@example.com");
    fill("Parola", "secret-password");
    fireEvent.click(screen.getByRole("button", { name: "Giriş yap" }));
    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith("login", {
        email: "a@example.com",
        password: "secret-password",
        tenantName: "",
      }),
    );
  });

  it("shows the server error message", async () => {
    render(<LoginView onSubmit={vi.fn().mockResolvedValue("E-posta veya parola hatalı.")} />);
    fill("E-posta", "a@example.com");
    fill("Parola", "wrong-password");
    fireEvent.click(screen.getByRole("button", { name: "Giriş yap" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("E-posta veya parola hatalı.");
  });

  it("switches to registration and sends the store name", async () => {
    const onSubmit = vi.fn().mockResolvedValue(null);
    render(<LoginView onSubmit={onSubmit} />);
    fireEvent.click(screen.getByText("Hesabınız yok mu? Kayıt olun"));
    fill("Mağaza adı", "Mağazam");
    fill("E-posta", "a@example.com");
    fill("Parola", "secret-password");
    fireEvent.click(screen.getByRole("button", { name: "Kayıt ol" }));
    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith("register", {
        email: "a@example.com",
        password: "secret-password",
        tenantName: "Mağazam",
      }),
    );
  });
});
