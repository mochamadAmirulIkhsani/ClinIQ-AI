import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import JoinGroupPage from "./page";

function mockApiResponse(body: unknown, ok = true): Response {
  return {
    ok,
    status: ok ? 201 : 400,
    json: () => Promise.resolve(body),
  } as Response;
}

describe("Join group page", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  it("renders invite code form", () => {
    render(<JoinGroupPage />);

    expect(screen.getByLabelText("Kode undangan")).toBeTruthy();
    expect(
      screen.getByRole("button", { name: /gabung ke grup/i }),
    ).toBeTruthy();
  });

  it("validates empty invite code", () => {
    render(<JoinGroupPage />);

    fireEvent.submit(screen.getByTestId("join-group-form"));

    expect(screen.getByText("Kode undangan tidak boleh kosong.")).toBeTruthy();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("joins group using normalized invite code", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      mockApiResponse({
        success: true,
        message: "success",
        data: {
          message: "Successfully joined group",
          group_id: "group-1",
          group: {
            id: "group-1",
            name: "Kelompok Belajar A",
            description: "Kelompok belajar untuk latihan quiz.",
            owner_id: "owner-1",
            member_count: 2,
            my_role: "member",
          },
        },
      }),
    );

    render(<JoinGroupPage />);

    fireEvent.change(screen.getByLabelText("Kode undangan"), {
      target: {
        value: "invitea1234",
      },
    });

    fireEvent.submit(screen.getByTestId("join-group-form"));

    await waitFor(() => {
      expect(screen.getByRole("status")).toHaveTextContent(
        "Berhasil bergabung.",
      );
    });

    const [url, options] = vi.mocked(fetch).mock.calls[0] as [
      string,
      RequestInit,
    ];

    expect(url).toContain("/api/v1/groups/join");
    expect(options.method).toBe("POST");
    expect(options.credentials).toBe("include");
    expect(options.body).toBe(
      JSON.stringify({
        invite_code: "INVITEA1234",
      }),
    );

    const successPanel = screen.getByRole("status");

    expect(successPanel).toHaveTextContent("Kelompok Belajar A");
    expect(successPanel).toHaveTextContent("Jumlah anggota");
    expect(successPanel).toHaveTextContent("2");
    expect(successPanel).toHaveTextContent("Member");

    expect(
      within(successPanel).getByRole("link", {
        name: /kembali ke dashboard/i,
      }),
    ).toHaveAttribute("href", "/dashboard");
  });

  it("shows backend error", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      mockApiResponse(
        {
          success: false,
          message: "Group not found for this invite code",
          data: null,
        },
        false,
      ),
    );

    render(<JoinGroupPage />);

    fireEvent.change(screen.getByLabelText("Kode undangan"), {
      target: {
        value: "UNKNOWN",
      },
    });

    fireEvent.submit(screen.getByTestId("join-group-form"));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Group not found for this invite code",
      );
    });
  });
});
