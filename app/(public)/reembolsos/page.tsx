import type { Metadata } from "next";
import { LegalDoc } from "@/components/public/legal-doc";
import { REEMBOLSOS } from "@/lib/legal-content";
export const metadata: Metadata = { title: "reembolsos" };
export default function Page() { return <LegalDoc raw={REEMBOLSOS} />; }
