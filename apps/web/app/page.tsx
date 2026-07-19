import type { Metadata } from "next";
import { LandingPage } from "./_components/landing/landing-page";
import "./landing.css";

export const metadata: Metadata = {
  title: "clinIQ AI — Belajar Diagnosis dari Petunjuk Klinis",
  description:
    "Latih cara membaca petunjuk klinis, menguji hipotesis diagnosis, dan memahami alasan di balik jawaban bersama clinIQ AI.",
};

export default function Home() {
  return <LandingPage />;
}
