import type { Metadata } from "next";
import { CloneStudio } from "@/components/app/CloneStudio";
export const metadata: Metadata = { title: "Mi clon" };
export default function ClonePage() { return <CloneStudio />; }
