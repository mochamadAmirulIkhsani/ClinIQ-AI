"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getCurrentUser, type AuthUser } from "../_lib/auth-api";

function formatDate(value?: string | null): string {
  if (!value) return "Belum ada aktivitas";

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    getCurrentUser()
      .then((currentUser) => {
        if (isMounted) setUser(currentUser);
      })
      .catch(() => {
        router.replace("/login");
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [router]);

  if (isLoading) {
    return (
      <main className="grid min-h-svh place-items-center px-5">
        <section className="clay-panel w-full max-w-xl rounded-[2.4rem] p-8 text-center">
          <p className="text-sm font-black uppercase tracking-[0.22em] text-[var(--muted)]">
            Memuat dashboard
          </p>
          <h1 className="mt-4 font-[var(--font-display)] text-5xl font-semibold tracking-[-0.06em]">
            Menyiapkan ruang kerja...
          </h1>
        </section>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="grid min-h-svh place-items-center px-5">
        <section className="clay-panel w-full max-w-xl rounded-[2.4rem] p-8 text-center">
          <h1 className="font-[var(--font-display)] text-4xl font-semibold tracking-[-0.06em]">
            Mengarahkan ke halaman masuk.
          </h1>
        </section>
      </main>
    );
  }

  const roleName =
    user.role?.name ?? (user.is_superadmin ? "Superadmin" : "User");
  const statusLabel = user.status === false ? "Tidak aktif" : "Aktif";

  return (
    <main className="relative isolate min-h-svh overflow-hidden px-5 py-5 sm:px-8 lg:px-10">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-28 top-20 -z-10 h-80 w-80 rounded-[44%_56%_61%_39%/47%_39%_61%_53%] bg-[var(--fig-soft)] opacity-35 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-28 bottom-10 -z-10 h-96 w-96 rounded-[60%_40%_43%_57%/43%_57%_43%_57%] bg-[var(--absinthe)] opacity-35 blur-3xl"
      />

      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <Link
            href="/"
            className="focus-clay inline-flex items-center gap-3 rounded-full"
            aria-label="Kembali ke beranda clinIQ AI"
          >
            <span className="grid size-11 place-items-center rounded-[1.1rem] bg-[var(--ink)] text-sm font-black text-[var(--cream)] shadow-[7px_8px_18px_rgba(69,55,36,0.26)]">
              cQ
            </span>
            <span className="leading-none">
              <span className="block font-[var(--font-display)] text-xl font-semibold tracking-[-0.04em]">
                clinIQ AI
              </span>
              <span className="block text-xs font-bold uppercase tracking-[0.22em] text-[var(--muted)]">
                dashboard user
              </span>
            </span>
          </Link>

          <span className="clay-inset inline-flex w-fit rounded-full px-5 py-3 text-sm font-black text-[var(--absinthe-deep)]">
            {statusLabel}
          </span>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="clay-panel rounded-[2.4rem] p-6 sm:p-8 lg:p-10">
            <p className="mb-5 inline-flex rounded-full bg-[rgba(154,170,131,0.34)] px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-[var(--absinthe-deep)] shadow-[inset_4px_4px_10px_rgba(80,97,71,0.12),inset_-4px_-4px_10px_rgba(255,255,237,0.8)]">
              selamat datang
            </p>

            <h1 className="font-[var(--font-display)] text-5xl font-semibold leading-[0.94] tracking-[-0.07em] sm:text-6xl">
              Halo, {user.name}.
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-[var(--muted)]">
              Ini adalah ruang kerja awal untuk profil, sesi, dan aktivitas
              klinikmu. Fitur medis lain bisa masuk setelah alur user ini
              stabil.
            </p>

            <div className="mt-9 grid gap-3 sm:grid-cols-3">
              {[
                ["Role", roleName],
                ["Email", user.email],
                ["Aktivitas", formatDate(user.last_activity)],
              ].map(([label, value]) => (
                <article
                  key={label}
                  className="clay-inset rounded-[1.7rem] px-5 py-4"
                >
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--muted)]">
                    {label}
                  </p>
                  <p className="mt-2 break-words font-black text-[var(--ink)]">
                    {value}
                  </p>
                </article>
              ))}
            </div>
          </div>

          <aside
            aria-label="Ringkasan profil"
            className="clay-panel rounded-[2.4rem] p-6"
          >
            <div className="flex items-center gap-4">
              <div className="grid size-20 place-items-center rounded-[1.7rem] bg-[var(--fig)] font-[var(--font-display)] text-4xl font-semibold text-[var(--cream)] shadow-[12px_14px_26px_rgba(83,67,43,0.24)]">
                {user.name.slice(0, 1).toUpperCase()}
              </div>
              <div>
                <h2 className="font-[var(--font-display)] text-4xl font-semibold tracking-[-0.06em]">
                  Profil user
                </h2>
                <p className="font-bold text-[var(--muted)]">{roleName}</p>
              </div>
            </div>

            <dl className="mt-8 grid gap-3">
              <div className="clay-inset rounded-[1.5rem] p-4">
                <dt className="text-xs font-black uppercase tracking-[0.18em] text-[var(--muted)]">
                  User ID
                </dt>
                <dd className="mt-2 break-all font-black">{user.id}</dd>
              </div>

              <div className="clay-inset rounded-[1.5rem] p-4">
                <dt className="text-xs font-black uppercase tracking-[0.18em] text-[var(--muted)]">
                  Password terakhir diperbarui
                </dt>
                <dd className="mt-2 font-black">
                  {formatDate(user.last_updated_password)}
                </dd>
              </div>
            </dl>
          </aside>
        </section>
      </div>
    </main>
  );
}
