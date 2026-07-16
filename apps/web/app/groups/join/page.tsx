"use client";

import Link from "next/link";
import { type FormEvent, useState } from "react";
import { joinGroupByCode, type GroupSummary } from "../../_lib/groups-api";
import "./join-group.css";

export default function JoinGroupPage() {
  const [inviteCode, setInviteCode] = useState("");
  const [joinedGroup, setJoinedGroup] = useState<GroupSummary | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedCode = inviteCode.trim().toUpperCase();

    if (!normalizedCode) {
      setError("Kode undangan tidak boleh kosong.");
      return;
    }

    try {
      setError("");
      setIsSubmitting(true);

      const group = await joinGroupByCode(normalizedCode);

      setJoinedGroup(group);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Grup gagal dimasuki.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="join-group-screen min-h-svh p-3 sm:p-5">
      <section className="join-group-shell mx-auto grid w-full max-w-6xl gap-3 lg:grid-cols-[minmax(0,1.08fr)_minmax(22rem,0.92fr)]">
        <div className="join-group-intro flex min-h-[32rem] flex-col justify-between gap-8">
          <div>
            <Link href="/dashboard" className="join-group-back">
              <span aria-hidden="true">←</span>
              Kembali ke dashboard
            </Link>

            <p className="diagnostic-eyebrow">study circle access</p>

            <h1>Belajar diagnosis bersama timmu.</h1>

            <p className="join-group-intro__copy">
              Masukkan kode undangan dari admin grup. Setelah bergabung, progres
              latihanmu dapat digunakan untuk leaderboard dan sesi belajar
              bersama.
            </p>
          </div>

          <div className="join-group-steps grid gap-2 sm:grid-cols-3">
            <article>
              <span>01</span>
              <strong>Dapatkan kode</strong>
              <p>Minta kode undangan dari pemilik grup.</p>
            </article>

            <article>
              <span>02</span>
              <strong>Gabung grup</strong>
              <p>Masukkan kode tanpa perlu mengetahui ID grup.</p>
            </article>

            <article>
              <span>03</span>
              <strong>Mulai belajar</strong>
              <p>Kembali ke dashboard dan lanjutkan latihan.</p>
            </article>
          </div>
        </div>

        <section className="join-group-panel flex min-h-[32rem] flex-col justify-center">
          {joinedGroup ? (
            <div
              className="join-group-success grid gap-5"
              role="status"
              aria-live="polite"
            >
              <div className="join-group-success__mark" aria-hidden="true">
                ✓
              </div>

              <div>
                <p className="diagnostic-eyebrow">group connected</p>
                <h2>Berhasil bergabung.</h2>
                <p>
                  Kamu sekarang menjadi anggota{" "}
                  <strong>{joinedGroup.name}</strong>.
                </p>
              </div>

              <div className="join-group-summary grid gap-3">
                <div>
                  <span>Nama grup</span>
                  <strong>{joinedGroup.name}</strong>
                </div>

                <div>
                  <span>Jumlah anggota</span>
                  <strong>{joinedGroup.member_count}</strong>
                </div>

                <div>
                  <span>Peranmu</span>
                  <strong>
                    {joinedGroup.my_role === "admin" ? "Admin" : "Member"}
                  </strong>
                </div>
              </div>

              <Link href="/dashboard" className="join-group-primary-action">
                Kembali ke dashboard
              </Link>
            </div>
          ) : (
            <div className="grid gap-6">
              <div>
                <p className="diagnostic-eyebrow">enter invitation</p>
                <h2>Masukkan kode grup.</h2>
                <p className="join-group-panel__copy">
                  Kode maksimal 20 karakter dan tidak peka terhadap huruf besar
                  atau kecil.
                </p>
              </div>

              <form
                className="join-group-form grid gap-4"
                data-testid="join-group-form"
                onSubmit={handleSubmit}
                noValidate
              >
                <div className="grid gap-2">
                  <label htmlFor="invite-code">Kode undangan</label>

                  <input
                    id="invite-code"
                    name="invite_code"
                    type="text"
                    value={inviteCode}
                    maxLength={20}
                    autoComplete="off"
                    autoCapitalize="characters"
                    spellCheck={false}
                    placeholder="Contoh: INVITEA1234"
                    onChange={(event) =>
                      setInviteCode(event.target.value.toUpperCase())
                    }
                    aria-invalid={Boolean(error)}
                    aria-describedby={error ? "join-group-error" : undefined}
                  />
                </div>

                {error ? (
                  <p
                    id="join-group-error"
                    role="alert"
                    className="join-group-error"
                  >
                    {error}
                  </p>
                ) : null}

                <button
                  type="submit"
                  className="join-group-submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Menghubungkan..." : "Gabung ke grup"}
                </button>
              </form>

              <p className="join-group-privacy">
                Kode hanya digunakan untuk menemukan grup dan membuat
                keanggotaan akunmu.
              </p>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
