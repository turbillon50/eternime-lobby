import type { Metadata } from "next";
import { LegalDoc } from "@/components/public/legal-doc";
import { PRIVACIDAD } from "@/lib/legal-content";

export const metadata: Metadata = { title: "privacidad" };

export default function Page() {
  return <LegalDoc raw={PRIVACIDAD} />;
}
