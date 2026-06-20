import type { Metadata } from "next";
import { LegalDoc } from "@/components/public/legal-doc";
import { COOKIES } from "@/lib/legal-content";

export const metadata: Metadata = { title: "cookies" };

export default function Page() {
  return <LegalDoc raw={COOKIES} />;
}
