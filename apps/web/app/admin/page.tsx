import { redirect } from "next/navigation";
import { canAccessAdmin, getCurrentUserServer } from "../_lib/auth-api";
import AdminClientPage from "./client";

export default async function AdminPage() {
  const user = await getCurrentUserServer();

  if (!user || !canAccessAdmin(user)) {
    redirect("/dashboard");
  }

  return <AdminClientPage />;
}
