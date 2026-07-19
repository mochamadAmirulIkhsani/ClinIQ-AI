"use client";

import { useEffect, useState } from "react";
import {
  getGlobalLeaderboard,
  getGroupLeaderboard,
  type LeaderboardData,
  type LeaderboardEntry,
} from "../../_lib/leaderboard-api";
import type { GroupSummary } from "../../_lib/groups-api";
import "./dashboard-leaderboard.css";

type DashboardLeaderboardProps = {
  group: GroupSummary | null;
};

type LeaderboardTab = "global" | "group";

const scoreFormatter = new Intl.NumberFormat("id-ID");

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.slice(0, 1).toUpperCase())
    .join("");
}

function podiumClass(entry: LeaderboardEntry): string {
  if (entry.position === 1) return " dashboard-leaderboard__rank--first";
  if (entry.position === 2) return " dashboard-leaderboard__rank--second";
  if (entry.position === 3) return " dashboard-leaderboard__rank--third";

  return "";
}

export function DashboardLeaderboard({ group }: DashboardLeaderboardProps) {
  const groupId = group?.id;
  const [tab, setTab] = useState<LeaderboardTab>(group ? "group" : "global");
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!groupId && tab === "group") {
      setTab("global");
    }
  }, [groupId, tab]);

  useEffect(() => {
    let isMounted = true;

    async function loadLeaderboard() {
      try {
        setIsLoading(true);
        setError("");

        const result =
          tab === "group" && groupId
            ? await getGroupLeaderboard(groupId)
            : await getGlobalLeaderboard();

        if (isMounted) {
          setData(result);
        }
      } catch (requestError) {
        if (isMounted) {
          setData(null);
          setError(
            requestError instanceof Error
              ? requestError.message
              : "Gagal memuat leaderboard.",
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadLeaderboard();

    return () => {
      isMounted = false;
    };
  }, [groupId, reloadKey, tab]);

  const entries = data?.entries ?? [];
  const currentUser = data?.current_user ?? null;
  const isCurrentUserVisible =
    currentUser !== null &&
    entries.some((entry) => entry.user_id === currentUser.user_id);

  return (
    <section
      className="dashboard-leaderboard diagnostic-panel"
      aria-labelledby="dashboard-leaderboard-title"
      aria-busy={isLoading}
    >
      <div className="dashboard-leaderboard__header">
        <div>
          <p className="diagnostic-eyebrow">competitive edge</p>
          <h2 id="dashboard-leaderboard-title">Leaderboard.</h2>
          <p className="dashboard-leaderboard__description">
            {tab === "group"
              ? "Peringkat anggota berdasarkan skor yang diperoleh setelah bergabung."
              : "Peringkat skor klinis seluruh pemain aktif."}
          </p>
        </div>

        {data ? (
          <span className="dashboard-leaderboard__count">
            {scoreFormatter.format(data.total_participants)} peserta
          </span>
        ) : null}
      </div>

      <div
        className="dashboard-leaderboard__tabs"
        role="tablist"
        aria-label="Jenis leaderboard"
      >
        <button
          type="button"
          role="tab"
          id="leaderboard-tab-global"
          aria-selected={tab === "global"}
          aria-controls="leaderboard-panel"
          className="dashboard-leaderboard__tab"
          onClick={() => setTab("global")}
        >
          Global
        </button>

        {group ? (
          <button
            type="button"
            role="tab"
            id="leaderboard-tab-group"
            aria-selected={tab === "group"}
            aria-controls="leaderboard-panel"
            className="dashboard-leaderboard__tab"
            onClick={() => setTab("group")}
          >
            Grup
          </button>
        ) : null}
      </div>

      <div
        id="leaderboard-panel"
        role="tabpanel"
        aria-labelledby={
          tab === "group" ? "leaderboard-tab-group" : "leaderboard-tab-global"
        }
        className="dashboard-leaderboard__panel"
      >
        {isLoading ? (
          <p className="dashboard-leaderboard__state" aria-live="polite">
            Memuat peringkat...
          </p>
        ) : error ? (
          <div className="dashboard-leaderboard__error" role="alert">
            <p>{error}</p>
            <button
              type="button"
              onClick={() => setReloadKey((current) => current + 1)}
            >
              Coba lagi
            </button>
          </div>
        ) : entries.length === 0 ? (
          <p className="dashboard-leaderboard__state">
            Belum ada skor yang tercatat.
          </p>
        ) : (
          <ol
            className="dashboard-leaderboard__list"
            aria-label={
              tab === "group"
                ? `Peringkat grup ${group?.name}`
                : "Peringkat global"
            }
          >
            {entries.map((entry) => {
              const isCurrentUser = entry.user_id === currentUser?.user_id;

              return (
                <li
                  key={entry.user_id}
                  className={`dashboard-leaderboard__entry${
                    isCurrentUser
                      ? " dashboard-leaderboard__entry--current"
                      : ""
                  }`}
                >
                  <span
                    className={`dashboard-leaderboard__rank${podiumClass(
                      entry,
                    )}`}
                    aria-label={`Peringkat ${entry.rank}`}
                  >
                    {entry.rank}
                  </span>

                  <span
                    className="dashboard-leaderboard__avatar"
                    aria-hidden="true"
                  >
                    {initials(entry.name)}
                  </span>

                  <span className="dashboard-leaderboard__identity">
                    <strong>{entry.name}</strong>
                    {isCurrentUser ? <small>Kamu</small> : null}
                  </span>

                  <strong className="dashboard-leaderboard__score">
                    {scoreFormatter.format(entry.score)}
                    <small> pts</small>
                  </strong>
                </li>
              );
            })}
          </ol>
        )}

        {!isLoading && !error && currentUser && !isCurrentUserVisible ? (
          <div className="dashboard-leaderboard__current-rank">
            <span>Peringkatmu</span>
            <strong>#{currentUser.rank}</strong>
            <small>{scoreFormatter.format(currentUser.score)} pts</small>
          </div>
        ) : null}
      </div>
    </section>
  );
}
