import type { Metadata } from "next";
import { LegalDoc } from "@/components/public/legal-doc";
import { TERMINOS } from "@/lib/legal-content";

export const metadata: Metadata = { title: "terminos" };

export default function Page() {
  return <LegalDoc raw={TERMINOS} />;
}
