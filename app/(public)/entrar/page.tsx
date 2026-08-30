import { redirect } from "next/navigation";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function EntrarPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const suffix = typeof params.redirect_url === "string" ? `?redirect_url=${encodeURIComponent(params.redirect_url)}` : "";
  redirect(`/sign-in${suffix}`);
}
