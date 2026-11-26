import { notFound, redirect } from "next/navigation";
import { PageEditor } from "@/components/PageEditor";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { getPageDetail } from "@/lib/queries";

export const metadata = { title: "Page" };

export default async function DocPage({ params }: PageProps<"/doc/[id]">) {
  const { id } = await params;
  const session = await getSession();
  if (!session) redirect("/login");

  await connectDB();
  const detail = await getPageDetail(session.userId, id);
  if (!detail) notFound();

  return <PageEditor initial={detail} />;
}
