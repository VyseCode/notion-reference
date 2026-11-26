import { redirect } from "next/navigation";
import { SearchView } from "@/components/SearchView";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { searchPages } from "@/lib/queries";

export const metadata = { title: "Search" };

export default async function SearchPage({
  searchParams,
}: PageProps<"/search">) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { q } = await searchParams;
  const query = typeof q === "string" ? q : "";

  await connectDB();
  const results = await searchPages(session.userId, query, {
    limit: 20,
    offset: 0,
  });

  return <SearchView initialQuery={query} initialResults={results} />;
}
