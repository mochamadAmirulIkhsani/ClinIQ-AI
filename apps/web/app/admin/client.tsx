"use client";

import { type FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  bulkGenerateVignettes,
  generateVignette,
  getAdminUsers,
  resetUserPassword,
  toggleUserAccess,
  uploadICD,
  type AdminUser,
} from "../_lib/admin-api";
import type { AuthUser } from "../_lib/auth-api";
import { searchDiseases, type DiseaseSearchResult } from "../_lib/quiz-api";

import styles from "./admin.module.css";

type AdminClientPageProps = {
  user: AuthUser;
};

type BulkGenerationResult = {
  disease: string;
  success: boolean;
};

const difficultyOptions = [
  {
    value: "easy",
    label: "Easy",
  },
  {
    value: "medium",
    label: "Medium",
  },
  {
    value: "hard",
    label: "Hard",
  },
];

function getRoleName(user: AuthUser): string {
  return user.role?.name ?? (user.is_superadmin ? "Superadmin" : "Admin");
}

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export default function AdminClientPage({ user }: AdminClientPageProps) {
  const [icdFile, setIcdFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState("");

  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<DiseaseSearchResult[]>([]);
  const [selected, setSelected] = useState<DiseaseSearchResult | null>(null);
  const [difficulty, setDifficulty] = useState("medium");
  const [isGenerating, setIsGenerating] = useState(false);
  const [genResult, setGenResult] = useState("");

  const [bulkLimit, setBulkLimit] = useState("10");
  const [bulkDifficulty, setBulkDifficulty] = useState("medium");
  const [isBulk, setIsBulk] = useState(false);
  const [bulkResult, setBulkResult] = useState("");

  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [isUsersLoading, setIsUsersLoading] = useState(true);
  const [usersError, setUsersError] = useState("");
  const [usersAction, setUsersAction] = useState("");
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);

  const fileRef = useRef<HTMLInputElement>(null);

  const userStats = useMemo(() => {
    const active = adminUsers.filter((adminUser) => adminUser.status).length;

    const administrators = adminUsers.filter((adminUser) => {
      const roleName =
        typeof adminUser.role?.name === "string"
          ? adminUser.role.name.trim().toLowerCase()
          : "";

      return roleName === "admin" || roleName === "superadmin";
    }).length;

    return {
      total: adminUsers.length,
      active,
      disabled: adminUsers.length - active,
      administrators,
    };
  }, [adminUsers]);

  useEffect(() => {
    let mounted = true;

    async function loadUsers() {
      try {
        const result = await getAdminUsers({
          limit: 100,
        });

        if (mounted) {
          setAdminUsers(result.data);
          setUsersError("");
        }
      } catch (error) {
        if (mounted) {
          setUsersError(
            error instanceof Error ? error.message : "Gagal memuat user.",
          );
        }
      } finally {
        if (mounted) {
          setIsUsersLoading(false);
        }
      }
    }

    loadUsers();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!query.trim() || query.trim().length < 2 || selected) {
      setSuggestions([]);
      return;
    }

    let mounted = true;

    const timer = window.setTimeout(() => {
      searchDiseases(query.trim())
        .then((items) => {
          if (mounted) {
            setSuggestions(items);
          }
        })
        .catch(() => {
          if (mounted) {
            setSuggestions([]);
          }
        });
    }, 250);

    return () => {
      mounted = false;
      window.clearTimeout(timer);
    };
  }, [query, selected]);

  async function handleUpload(event: FormEvent) {
    event.preventDefault();

    if (!icdFile) {
      return;
    }

    try {
      setIsUploading(true);
      setUploadResult("");

      const result = await uploadICD(icdFile);

      setUploadResult(
        `${result.created} dibuat, ${result.updated} diperbarui, ` +
          `${result.errors} gagal.`,
      );

      setIcdFile(null);

      if (fileRef.current) {
        fileRef.current.value = "";
      }
    } catch (error) {
      setUploadResult(error instanceof Error ? error.message : "Upload gagal.");
    } finally {
      setIsUploading(false);
    }
  }

  async function handleGenerate(event: FormEvent) {
    event.preventDefault();

    if (!selected) {
      return;
    }

    try {
      setIsGenerating(true);
      setGenResult("");

      await generateVignette({
        disease_id: selected.id,
        difficulty,
      });

      setGenResult(`Vignette untuk ${selected.name} berhasil dibuat.`);
      setQuery("");
      setSelected(null);
      setSuggestions([]);
    } catch (error) {
      setGenResult(error instanceof Error ? error.message : "Generate gagal.");
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleBulk(event: FormEvent) {
    event.preventDefault();

    try {
      setIsBulk(true);
      setBulkResult("");

      const result = await bulkGenerateVignettes({
        limit: Number.parseInt(bulkLimit, 10) || 10,
        difficulty: bulkDifficulty,
      });

      if (Array.isArray(result)) {
        const items = result as BulkGenerationResult[];
        const successCount = items.filter((item) => item.success).length;

        setBulkResult(
          `${successCount} dari ${items.length} vignette berhasil dibuat.`,
        );

        return;
      }

      setBulkResult("Bulk generation selesai.");
    } catch (error) {
      setBulkResult(
        error instanceof Error ? error.message : "Bulk generate gagal.",
      );
    } finally {
      setIsBulk(false);
    }
  }

  async function handleToggleAccess(userId: string) {
    try {
      setPendingUserId(userId);
      setUsersAction("");
      setUsersError("");

      await toggleUserAccess(userId);

      setAdminUsers((current) =>
        current.map((adminUser) =>
          adminUser.id === userId
            ? {
                ...adminUser,
                status: !adminUser.status,
              }
            : adminUser,
        ),
      );

      setUsersAction("Akses pengguna berhasil diperbarui.");
    } catch (error) {
      setUsersError(
        error instanceof Error
          ? error.message
          : "Gagal memperbarui akses pengguna.",
      );
    } finally {
      setPendingUserId(null);
    }
  }

  async function handleResetPassword(userId: string) {
    try {
      setPendingUserId(userId);
      setUsersAction("");
      setUsersError("");

      const message = await resetUserPassword(userId);

      setUsersAction(message);
    } catch (error) {
      setUsersError(
        error instanceof Error ? error.message : "Gagal mereset password.",
      );
    } finally {
      setPendingUserId(null);
    }
  }

  return (
    <div className={styles.adminPage}>
      <section className={styles.bentoGrid}>
        <header className={`${styles.card} ${styles.heroCard}`}>
          <div className={styles.heroContent}>
            <p className={styles.heroEyebrow}>ClinIQ control room</p>

            <h1>
              Clinical content,
              <br />
              under control.
            </h1>

            <p className={styles.heroDescription}>
              Kelola sumber data klinis, buat vignette dengan AI, dan atur akses
              pengguna melalui satu ruang operasional.
            </p>
          </div>

          <div className={styles.heroDecoration}>
            <span className={styles.heroOrbPrimary} />
            <span className={styles.heroOrbSecondary} />

            <span className={styles.heroCode}>
              ADMIN
              <br />
              01
            </span>
          </div>
        </header>

        <aside
          className={`${styles.card} ${styles.overviewCard}`}
          aria-label="Ringkasan admin"
        >
          <div className={styles.adminIdentity}>
            <span className={styles.adminAvatar}>{getInitials(user.name)}</span>

            <div>
              <span className={styles.identityLabel}>Signed in as</span>
              <strong>{user.name}</strong>
              <small>{getRoleName(user)}</small>
            </div>
          </div>

          <dl className={styles.metrics}>
            <div>
              <dt>Users</dt>
              <dd>{userStats.total}</dd>
            </div>

            <div>
              <dt>Active</dt>
              <dd>{userStats.active}</dd>
            </div>

            <div>
              <dt>Disabled</dt>
              <dd>{userStats.disabled}</dd>
            </div>

            <div>
              <dt>Admins</dt>
              <dd>{userStats.administrators}</dd>
            </div>
          </dl>
        </aside>

        <article
          className={`${styles.card} ${styles.workflowCard} ${styles.uploadCard}`}
        >
          <div className={styles.cardHeader}>
            <span className={styles.cardIndex}>01</span>

            <div>
              <p className={styles.cardEyebrow}>Clinical data</p>
              <h2>Import ICD.</h2>
            </div>
          </div>

          <p className={styles.cardDescription}>
            Tambahkan atau perbarui disease catalog menggunakan file CSV.
          </p>

          <form onSubmit={handleUpload} className={styles.form}>
            <label className={styles.filePicker} htmlFor="icd-file">
              <input
                id="icd-file"
                ref={fileRef}
                className={styles.fileInput}
                type="file"
                accept=".csv,text/csv"
                onChange={(event) =>
                  setIcdFile(event.target.files?.[0] ?? null)
                }
                required
              />

              <span className={styles.fileBadge} aria-hidden="true">
                CSV
              </span>

              <span className={styles.fileCopy}>
                <strong>{icdFile?.name ?? "Pilih file ICD"}</strong>
                <small>icd_code, name, description</small>
              </span>
            </label>

            <button
              type="submit"
              disabled={!icdFile || isUploading}
              className={styles.primaryButton}
            >
              {isUploading ? "Mengunggah..." : "Upload dataset"}
            </button>

            {uploadResult ? (
              <p role="status" className={styles.resultMessage}>
                {uploadResult}
              </p>
            ) : null}
          </form>
        </article>

        <article
          className={`${styles.card} ${styles.workflowCard} ${styles.generateCard}`}
        >
          <div className={styles.cardHeader}>
            <span className={styles.cardIndex}>02</span>

            <div>
              <p className={styles.cardEyebrow}>Single generation</p>
              <h2>Build vignette.</h2>
            </div>
          </div>

          <p className={styles.cardDescription}>
            Pilih satu penyakit dan buat kasus klinis sesuai tingkat kesulitan.
          </p>

          <form onSubmit={handleGenerate} className={styles.form}>
            <div className={styles.searchField}>
              <label htmlFor="disease-search">Penyakit</label>

              <input
                id="disease-search"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setSelected(null);
                }}
                placeholder="Cari nama atau kode ICD..."
                autoComplete="off"
                aria-autocomplete="list"
                aria-controls="disease-suggestions"
              />

              {suggestions.length > 0 ? (
                <div
                  id="disease-suggestions"
                  className={styles.suggestionList}
                  role="listbox"
                  aria-label="Hasil pencarian penyakit"
                >
                  {suggestions.map((disease) => (
                    <button
                      key={disease.id}
                      type="button"
                      role="option"
                      aria-selected="false"
                      onClick={() => {
                        setSelected(disease);
                        setQuery(disease.name);
                        setSuggestions([]);
                      }}
                    >
                      <span>{disease.name}</span>
                      <small>{disease.icd_code}</small>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            <div className={styles.field}>
              <label htmlFor="difficulty">Difficulty</label>

              <select
                id="difficulty"
                value={difficulty}
                onChange={(event) => setDifficulty(event.target.value)}
              >
                {difficultyOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={!selected || isGenerating}
              className={styles.primaryButton}
            >
              {isGenerating ? "Menyusun kasus..." : "Generate vignette"}
            </button>

            {genResult ? (
              <p role="status" className={styles.resultMessage}>
                {genResult}
              </p>
            ) : null}
          </form>
        </article>

        <article
          className={`${styles.card} ${styles.workflowCard} ${styles.bulkCard}`}
        >
          <div className={styles.cardHeader}>
            <span className={styles.cardIndex}>03</span>

            <div>
              <p className={styles.cardEyebrow}>Automated batch</p>
              <h2>Generate in bulk.</h2>
            </div>
          </div>

          <p className={styles.cardDescription}>
            Isi disease catalog yang belum memiliki vignette secara bertahap.
          </p>

          <form onSubmit={handleBulk} className={styles.form}>
            <div className={styles.splitFields}>
              <div className={styles.field}>
                <label htmlFor="bulk-limit">Jumlah</label>

                <input
                  id="bulk-limit"
                  type="number"
                  min={1}
                  max={50}
                  value={bulkLimit}
                  onChange={(event) => setBulkLimit(event.target.value)}
                />
              </div>

              <div className={styles.field}>
                <label htmlFor="bulk-difficulty">Difficulty</label>

                <select
                  id="bulk-difficulty"
                  value={bulkDifficulty}
                  onChange={(event) => setBulkDifficulty(event.target.value)}
                >
                  {difficultyOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={isBulk}
              className={styles.primaryButton}
            >
              {isBulk ? "Memproses batch..." : "Start bulk generation"}
            </button>

            {bulkResult ? (
              <p role="status" className={styles.resultMessage}>
                {bulkResult}
              </p>
            ) : null}
          </form>
        </article>

        <section className={`${styles.card} ${styles.usersCard}`}>
          <div className={styles.usersHeader}>
            <div>
              <p className={styles.cardEyebrow}>Access management</p>
              <h2>User directory.</h2>
              <p>Kelola status akun dan reset kredensial pengguna.</p>
            </div>

            <div className={styles.userCount}>
              <span>Loaded records</span>
              <strong>{adminUsers.length}</strong>
            </div>
          </div>

          <div className={styles.feedbackArea} aria-live="polite">
            {usersAction ? (
              <p role="status" className={styles.successMessage}>
                {usersAction}
              </p>
            ) : null}

            {usersError ? (
              <p role="alert" className={styles.errorMessage}>
                {usersError}
              </p>
            ) : null}
          </div>

          {isUsersLoading ? (
            <div className={styles.emptyState}>
              <span className={styles.loadingDot} />
              <p>Memuat user directory...</p>
            </div>
          ) : adminUsers.length === 0 ? (
            <div className={styles.emptyState}>
              <strong>Directory kosong.</strong>
              <p>Belum ada pengguna yang dapat ditampilkan.</p>
            </div>
          ) : (
            <div className={styles.tableViewport}>
              <table className={styles.usersTable}>
                <thead>
                  <tr>
                    <th scope="col">User</th>
                    <th scope="col">Role</th>
                    <th scope="col">Status</th>
                    <th scope="col">Controls</th>
                  </tr>
                </thead>

                <tbody>
                  {adminUsers.map((adminUser) => {
                    const isPending = pendingUserId === adminUser.id;

                    return (
                      <tr key={adminUser.id}>
                        <td>
                          <div className={styles.userIdentity}>
                            <span
                              className={styles.userAvatar}
                              aria-hidden="true"
                            >
                              {getInitials(adminUser.name)}
                            </span>

                            <span>
                              <strong>{adminUser.name}</strong>
                              <small>{adminUser.email}</small>
                            </span>
                          </div>
                        </td>

                        <td>
                          <span className={styles.roleBadge}>
                            {adminUser.role?.name ?? "User"}
                          </span>
                        </td>

                        <td>
                          <span
                            className={`${styles.statusBadge} ${
                              adminUser.status
                                ? styles.statusActive
                                : styles.statusDisabled
                            }`}
                          >
                            <span aria-hidden="true" />
                            {adminUser.status ? "Active" : "Disabled"}
                          </span>
                        </td>

                        <td>
                          <div className={styles.tableActions}>
                            <button
                              type="button"
                              disabled={pendingUserId !== null}
                              onClick={() => handleToggleAccess(adminUser.id)}
                              className={styles.secondaryButton}
                            >
                              {isPending
                                ? "Memproses..."
                                : adminUser.status
                                  ? "Nonaktifkan"
                                  : "Aktifkan"}
                            </button>

                            <button
                              type="button"
                              disabled={pendingUserId !== null}
                              onClick={() => handleResetPassword(adminUser.id)}
                              className={styles.textButton}
                            >
                              Reset password
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </section>
    </div>
  );
}
