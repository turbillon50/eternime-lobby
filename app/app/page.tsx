import { getSession } from "@/lib/auth";
import { EonCompose } from "@/components/app/EonCompose";
export const dynamic = "force-dynamic";
export default async function AppHomePage(){
  const session = await getSession();
  const firstName = session?.name?.split(" ")[0] || "";
  return <EonCompose firstName={firstName}/>;
}
