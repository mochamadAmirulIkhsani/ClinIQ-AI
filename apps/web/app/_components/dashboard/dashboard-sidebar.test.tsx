import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DashboardSidebar } from "./dashboard-sidebar";

const replaceMock = vi.fn();
const logoutUserMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: replaceMock,
  }),
}));

vi.mock("../../_lib/auth-api", async () => {
  const actual = await vi.importActual<typeof import("../../_lib/auth-api")>(
    "../../_lib/auth-api",
  );

  return {
    ...actual,
    logoutUser: () => logoutUserMock(),
  };
});

describe("DashboardSidebar", () => {
  const normalUser = {
    id: "user-1",
    name: "Normal User",
    email: "user@example.test",
    status: true,
    is_superadmin: false,
    role: {
      id: "role-user",
      name: "User",
      is_superadmin: false,
    },
  };

  const adminUser = {
    ...normalUser,
    id: "admin-1",
    name: "Admin User",
    email: "admin@example.test",
    role: {
      id: "role-admin",
      name: "Admin",
      is_superadmin: false,
    },
  };

  const superadminUser = {
    ...normalUser,
    id: "superadmin-1",
    name: "Super Admin",
    email: "superadmin@example.test",
    is_superadmin: true,
    role: {
      id: "role-superadmin",
      name: "Superadmin",
      is_superadmin: true,
    },
  };
  beforeEach(() => {
    replaceMock.mockReset();
    logoutUserMock.mockReset();
  });

  it("toggles mobile dashboard menu", () => {
    render(<DashboardSidebar user={normalUser} />);

    const menuButton = screen.getByRole("button", {
      name: /buka menu dashboard/i,
    });
    const sidebar = screen.getByRole("complementary");

    expect(menuButton).toHaveAttribute("aria-expanded", "false");
    expect(sidebar).toHaveAttribute("data-menu-open", "false");

    fireEvent.click(menuButton);

    expect(menuButton).toHaveAttribute("aria-expanded", "true");
    expect(sidebar).toHaveAttribute("data-menu-open", "true");
  });

  it("closes mobile menu with Escape", () => {
    render(<DashboardSidebar user={normalUser} />);

    fireEvent.click(
      screen.getByRole("button", {
        name: /buka menu dashboard/i,
      }),
    );

    fireEvent.keyDown(document, { key: "Escape" });

    expect(screen.getByRole("complementary")).toHaveAttribute(
      "data-menu-open",
      "false",
    );
  });

  it("opens account menu", () => {
    render(<DashboardSidebar user={normalUser} />);

    fireEvent.click(screen.getByRole("button", { name: /akun/i }));

    expect(screen.queryByRole("menu", { name: /menu akun/i })).toBeTruthy();
    expect(screen.queryByRole("menuitem", { name: "Logout" })).toBeTruthy();
  });

  it("logs out and redirects to login", async () => {
    logoutUserMock.mockResolvedValueOnce(true);

    render(<DashboardSidebar user={normalUser} />);

    fireEvent.click(screen.getByRole("button", { name: /akun/i }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Logout" }));

    await waitFor(() => {
      expect(logoutUserMock).toHaveBeenCalledTimes(1);
    });

    expect(replaceMock).toHaveBeenCalledWith("/login");
  });

  it("shows logout error", async () => {
    logoutUserMock.mockRejectedValueOnce(new Error("failed"));

    render(<DashboardSidebar user={normalUser} />);

    fireEvent.click(screen.getByRole("button", { name: /akun/i }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Logout" }));

    await waitFor(() => {
      expect(screen.queryByRole("alert")).toBeTruthy();
    });

    expect(screen.queryByText("Logout gagal. Coba lagi.")).toBeTruthy();
    expect(replaceMock).not.toHaveBeenCalled();
  });

  it("hides admin navigation from normal users", () => {
    render(<DashboardSidebar user={normalUser} />);

    expect(
      screen.queryByRole("link", {
        name: /admin/i,
      }),
    ).toBeNull();
  });

  it("shows admin navigation for Admin role", () => {
    render(<DashboardSidebar user={adminUser} />);

    expect(
      screen.getByRole("link", {
        name: /admin/i,
      }),
    ).toHaveAttribute("href", "/admin");
  });

  it("shows admin navigation for superadmin", () => {
    render(<DashboardSidebar user={superadminUser} />);

    expect(
      screen.getByRole("link", {
        name: /admin/i,
      }),
    ).toHaveAttribute("href", "/admin");
  });
});
