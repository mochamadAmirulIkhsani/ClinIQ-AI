import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import DashboardPage from "./page";

const replaceMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: replaceMock,
  }),
}));

function mockApiResponse(body: unknown, ok = true): Response {
  return {
    ok,
    status: ok ? 200 : 401,
    json: () => Promise.resolve(body),
  } as Response;
}

describe("Dashboard page", () => {
  beforeEach(() => {
    replaceMock.mockReset();
    vi.stubGlobal("fetch", vi.fn());
  });

  it("renders loading state first", () => {
    vi.mocked(fetch).mockImplementationOnce(
      () => new Promise<Response>(() => {}),
    );

    render(<DashboardPage />);

    expect(screen.queryByText("Memuat dashboard")).toBeTruthy();
    expect(screen.queryByText("Menyiapkan ruang kerja...")).toBeTruthy();
  });

  it("fetches current user and renders the user dashboard", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      mockApiResponse({
        success: true,
        message: "success",
        data: {
          id: "user-1",
          name: "Dok Bakar",
          email: "dok@klinik.id",
          status: true,
          avatar: null,
          role_id: "role-1",
          last_updated_password: null,
          last_activity: null,
          role: {
            id: "role-1",
            name: "User",
          },
        },
      }),
    );

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.queryByText("Halo, Dok Bakar.")).toBeTruthy();
    });

    const [url, options] = vi.mocked(fetch).mock.calls[0] as [
      string,
      RequestInit,
    ];

    expect(url).toContain("/api/dashboard/auth/me");
    expect(options.credentials).toBe("include");
    expect(screen.queryByText("dok@klinik.id")).toBeTruthy();
    expect(screen.queryByText("Profil user")).toBeTruthy();
    expect(screen.queryAllByText("User").length).toBeGreaterThan(0);
    expect(replaceMock).not.toHaveBeenCalled();
  });

  it("redirects to login when current user request fails", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      mockApiResponse(
        {
          success: false,
          message: "Unauthorized, token not found",
          data: null,
        },
        false,
      ),
    );

    render(<DashboardPage />);

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith("/login");
    });
  });
});
