import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Home from "./page";

describe("Home landing page", () => {
  it("renders the diagnostic-learning hero", () => {
    render(<Home />);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Baca gejalanya. Pahami alasannya.",
      }),
    ).toBeTruthy();

    expect(screen.getByText(/clinIQ AI melatihmu membaca clue/i)).toBeTruthy();
  });

  it("renders primary navigation with section anchors", () => {
    render(<Home />);

    const navigation = screen.getByRole("navigation", {
      name: "Navigasi utama",
    });

    expect(
      within(navigation)
        .getByRole("link", { name: "Cara belajar" })
        .getAttribute("href"),
    ).toBe("#cara-belajar");

    expect(
      within(navigation)
        .getByRole("link", { name: "Penjelasan AI" })
        .getAttribute("href"),
    ).toBe("#penjelasan-ai");

    expect(
      within(navigation)
        .getByRole("link", { name: "Keamanan" })
        .getAttribute("href"),
    ).toBe("#keamanan");
  });

  it("keeps login and registration entry points", () => {
    render(<Home />);

    expect(
      screen
        .getByRole("link", { name: "Mulai kasus pertama" })
        .getAttribute("href"),
    ).toBe("/register");

    expect(
      screen.getAllByRole("link", { name: "Masuk" })[0]?.getAttribute("href"),
    ).toBe("/login");
  });

  it("renders the product learning flow", () => {
    render(<Home />);

    expect(
      screen.getByRole("complementary", {
        name: "Contoh kasus diagnosis",
      }),
    ).toBeTruthy();

    expect(screen.getByText("Informasi datang bertahap.")).toBeTruthy();
    expect(screen.getByText("Bukan sekadar benar atau salah.")).toBeTruthy();
    expect(screen.getByText("Amati tanpa tergesa.")).toBeTruthy();
    expect(screen.getByText("Uji satu diagnosis.")).toBeTruthy();
    expect(screen.getByText("Pahami alasan klinisnya.")).toBeTruthy();
  });

  it("opens and closes the mobile navigation accessibly", () => {
    render(<Home />);

    const menuButton = screen.getByRole("button", {
      name: "Buka menu",
    });

    expect(menuButton.getAttribute("aria-expanded")).toBe("false");

    fireEvent.click(menuButton);

    expect(
      screen
        .getByRole("button", {
          name: "Tutup menu",
        })
        .getAttribute("aria-expanded"),
    ).toBe("true");

    fireEvent.keyDown(document, { key: "Escape" });

    expect(
      screen
        .getByRole("button", {
          name: "Buka menu",
        })
        .getAttribute("aria-expanded"),
    ).toBe("false");
  });

  it("renders the educational safety boundary", () => {
    render(<Home />);

    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "AI menjelaskan. Kamu tetap menilai.",
      }),
    ).toBeTruthy();

    expect(screen.getByText(/bukan pengganti penilaian klinis/i)).toBeTruthy();
  });
});
