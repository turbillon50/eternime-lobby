import type { Metadata } from "next";
import { LegalDoc } from "@/components/public/legal-doc";
import { EULA } from "@/lib/legal-content";
export const metadata: Metadata = { title: "eula" };
export default function Page() { return <LegalDoc raw={EULA} />; }
