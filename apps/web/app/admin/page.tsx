import { redirect } from "next/navigation";
import { DashboardSidebar } from "../_components/dashboard/dashboard-sidebar";
import { canAccessAdmin, getCurrentUserServer } from "../_lib/auth-api";
import AdminClientPage from "./client";

import "../dashboard/dashboard-shell.css";

export default async function AdminPage() {
  const user = await getCurrentUserServer();

  if (!user || !canAccessAdmin(user)) {
    redirect("/dashboard");
  }

  return (
    <main className="diagnostic-shell">
      <DashboardSidebar user={user} />

      <div className="diagnostic-main">
        <AdminClientPage user={user} />
      </div>
    </main>
  );
}
