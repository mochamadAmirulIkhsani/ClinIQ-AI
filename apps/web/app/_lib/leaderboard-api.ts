import type { ApiResult } from "./auth-api";

export type LeaderboardEntry = {
  user_id: string;
  name: string;
  score: number;
  rank: number;
  position: number;
};

export type LeaderboardData = {
  scope: "global" | "group";
  group: {
    id: string;
    name: string;
  } | null;
  entries: LeaderboardEntry[];
  current_user: LeaderboardEntry | null;
  total_participants: number;
};

const configuredApiBaseUrl = process.env.NEXT_PUBLIC_API_URL?.replace(
  /\/$/,
  "",
);

const API_BASE_URL =
  configuredApiBaseUrl ??
  (process.env.NODE_ENV === "production" ? "" : "http://localhost:8000");

async function requestLeaderboardApi(path: string): Promise<LeaderboardData> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      Accept: "application/json",
    },
    credentials: "include",
  });

  const result = (await response.json()) as ApiResult<LeaderboardData>;

  if (!response.ok) {
    throw new Error(result.message || "Gagal memuat leaderboard.");
  }

  if (!result.data) {
    throw new Error("Data leaderboard tidak tersedia.");
  }

  return result.data;
}

export async function getGlobalLeaderboard(
  limit = 10,
): Promise<LeaderboardData> {
  return requestLeaderboardApi(`/api/v1/leaderboards/global?limit=${limit}`);
}

export async function getGroupLeaderboard(
  groupId: string,
  limit = 10,
): Promise<LeaderboardData> {
  return requestLeaderboardApi(
    `/api/v1/leaderboards/group/${encodeURIComponent(groupId)}?limit=${limit}`,
  );
}
