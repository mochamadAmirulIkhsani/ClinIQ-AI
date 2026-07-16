import type { GroupDetails, GroupSummary } from "../../_lib/groups-api";
import "./dashboard-group-panel.css";

type DashboardGroupPanelProps = {
  group: GroupSummary | null;
  details: GroupDetails | null;
};

export function DashboardGroupPanel({
  group,
  details,
}: DashboardGroupPanelProps) {
  const members = details?.members ?? [];

  return (
    <section className="dashboard-group-panel grid gap-2">
      <div
        className="dashboard-group-status flex items-center justify-between gap-3"
        aria-label={
          group ? `Grup belajar: ${group.name}` : "Mode belajar: Solo player"
        }
      >
        <span>{group ? "study group" : "play mode"}</span>
        <strong>{group?.name ?? "Solo player"}</strong>
      </div>

      {group ? (
        <div className="dashboard-group-members">
          <div className="dashboard-group-members__header flex items-center justify-between gap-3">
            <span>members</span>
            <strong>{group.member_count}</strong>
          </div>

          {members.length > 0 ? (
            <ul
              className="dashboard-group-members__list grid gap-2"
              aria-label={`Anggota ${group.name}`}
            >
              {members.map((member) => (
                <li
                  key={member.id}
                  className="dashboard-group-member flex items-center gap-3"
                >
                  <span
                    className="dashboard-group-member__avatar"
                    aria-hidden="true"
                  >
                    {member.user.name.slice(0, 1).toUpperCase()}
                  </span>

                  <span className="dashboard-group-member__identity">
                    <strong>{member.user.name}</strong>
                    <small>{member.user.email}</small>
                  </span>

                  <span className="dashboard-group-member__role">
                    {member.is_admin ? "Admin" : "Member"}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="dashboard-group-members__empty">
              Daftar anggota belum tersedia.
            </p>
          )}
        </div>
      ) : null}
    </section>
  );
}
