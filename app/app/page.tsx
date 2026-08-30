import { getSession } from "@/lib/auth";
import { EonCompose } from "@/components/app/EonCompose";
export const dynamic = "force-dynamic";
export default async function AppHomePage(){
  const session = await getSession();
  const firstName = session?.name?.split(" ")[0] || "";
  return <div className="eon-home-dashboard"><EonCompose firstName={firstName}/></div>;
}
