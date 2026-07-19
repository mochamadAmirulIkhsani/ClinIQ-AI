import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { DashboardSidebar } from "../_components/dashboard/dashboard-sidebar";
import { getCurrentUserServer } from "../_lib/auth-api";
import "./dashboard-shell.css";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await getCurrentUserServer();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="diagnostic-shell">
      <DashboardSidebar user={user} />
      <div className="diagnostic-main">{children}</div>
    </main>
  );
}
