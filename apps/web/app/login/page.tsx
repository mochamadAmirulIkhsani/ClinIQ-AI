import type { Metadata } from "next";
import { AuthShell } from "../_components/auth/auth-shell";
import { LoginForm } from "../_components/auth/login-form";

export const metadata: Metadata = {
  title: "Masuk — clinIQ AI",
  description: "Masuk ke ruang belajar diagnosis clinIQ AI.",
};

export default function LoginPage() {
  return (
    <AuthShell
      eyebrow="diagnostic access"
      title="Masuk ke ruang diagnosis."
      description="Lanjutkan latihan membaca clue klinis, pilih dugaan penyakit, lalu pelajari alasan AI saat jawabanmu benar atau meleset."
      alternateText="Belum punya akun?"
      alternateHref="/register"
      alternateLabel="Buat akun belajar"
    >
      <LoginForm />
    </AuthShell>
  );
}
