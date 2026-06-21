import type { Metadata } from "next";
import { LegalDoc } from "@/components/public/legal-doc";
import { ELIMINAR_CUENTA } from "@/lib/legal-content";
export const metadata: Metadata = { title: "eliminar-cuenta" };
export default function Page() { return <LegalDoc raw={ELIMINAR_CUENTA} />; }
