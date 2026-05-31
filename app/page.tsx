import { EternimeLobby } from "@/components/eternime-lobby";

export default function Home() {
  return <EternimeLobby clerkEnabled={Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY)} />;
}
