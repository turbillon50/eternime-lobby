import type { Metadata } from "next";
import { HablarConEon } from "@/components/app/HablarConEon";
import { VoiceClone } from "@/components/app/VoiceClone";

export const metadata: Metadata = { title: "Habla con Eon" };

export default function HablarPage() {
  return (
    <>
      <HablarConEon />
      <div className="mx-auto mt-4 max-w-2xl pb-12">
        <VoiceClone />
      </div>
    </>
  );
}
