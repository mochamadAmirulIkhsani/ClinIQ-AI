import type { ApiResult } from "./auth-api";

export type GroupRole = "admin" | "member";

export type GroupSummary = {
  id: string;
  name: string;
  description?: string | null;
  invite_code?: string;
  owner_id: string;
  member_count: number;
  my_role: GroupRole;
  createdAt?: string;
};

type JoinGroupResponse = {
  message: string;
  group_id: string;
  group: GroupSummary;
};

const configuredApiBaseUrl = process.env.NEXT_PUBLIC_API_URL?.replace(
  /\/$/,
  "",
);

const API_BASE_URL =
  configuredApiBaseUrl ??
  (process.env.NODE_ENV === "production" ? "" : "http://localhost:8000");

async function requestGroupsApi<T>(
  path: string,
  init?: RequestInit,
): Promise<ApiResult<T>> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      Accept: "application/json",
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
    credentials: "include",
    ...init,
  });

  const result = (await response.json()) as ApiResult<T>;

  if (!response.ok) {
    throw new Error(result.message || "Permintaan grup gagal diproses.");
  }

  return result;
}

export async function getMyGroups(): Promise<GroupSummary[]> {
  const result = await requestGroupsApi<GroupSummary[]>("/api/v1/groups");

  return result.data ?? [];
}

export async function joinGroupByCode(
  inviteCode: string,
): Promise<GroupSummary> {
  const result = await requestGroupsApi<JoinGroupResponse>(
    "/api/v1/groups/join",
    {
      method: "POST",
      body: JSON.stringify({
        invite_code: inviteCode,
      }),
    },
  );

  if (!result.data?.group) {
    throw new Error(result.message || "Data grup tidak tersedia.");
  }

  return result.data.group;
}
