import type { Metadata } from "next";
import { VoiceClone } from "@/components/app/VoiceClone";

export const metadata: Metadata = { title: "Habla con Eon" };

export default function HablarPage() {
  return (
    <>
      <div id="clona-voz" className="mx-auto mt-4 max-w-2xl scroll-mt-20 pb-12">
        <VoiceClone />
      </div>
    </>
  );
}
