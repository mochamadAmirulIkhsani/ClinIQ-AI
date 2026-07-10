import type { Metadata } from "next";
import { AuthShell } from "../_components/auth/auth-shell";
import { RegisterForm } from "../_components/auth/register-form";

export const metadata: Metadata = {
  title: "Daftar — clinIQ AI",
  description: "Buat akun belajar diagnosis di clinIQ AI.",
};

export default function RegisterPage() {
  return (
    <AuthShell
      eyebrow="new learner"
      title="Bangun naluri klinismu."
      description="Buat akun untuk berlatih memahami penyakit dari petunjuk kasus, menguji hipotesis, dan membaca penjelasan AI yang lebih masuk akal."
      alternateText="Sudah punya akun?"
      alternateHref="/login"
      alternateLabel="Masuk sekarang"
    >
      <RegisterForm />
    </AuthShell>
  );
}
