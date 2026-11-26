import Link from "next/link";
import { notFound } from "next/navigation";
import { BlockContent } from "@/components/BlockContent";
import { connectDB } from "@/lib/db";
import { getPublicPage } from "@/lib/queries";

export default async function PublicPage({ params }: PageProps<"/p/[slug]">) {
  const { slug } = await params;
  await connectDB();
  const result = await getPublicPage(slug);
  if (!result) notFound();

  const { page, blocks } = result;

  return (
    <main className="min-h-screen bg-white">
      <header className="flex h-12 items-center justify-between border-b border-[#e9e9e7] px-5">
        <Link href="/" className="flex items-center gap-2 text-sm font-semibold">
          <span className="flex h-6 w-6 items-center justify-center rounded bg-[#37352f] text-xs font-bold text-white">
            N
          </span>
          Notion-ref
        </Link>
        <Link
          href="/login"
          className="rounded-md border border-[#e0e0de] px-3 py-1.5 text-xs text-[#5f5e5b] hover:bg-[#f7f7f5]"
        >
          Sign in
        </Link>
      </header>

      {page.coverColor && (
        <div
          className="h-44 w-full sm:h-56"
          style={{ backgroundColor: page.coverColor }}
        />
      )}

      <article className="mx-auto max-w-3xl px-6 pb-24 pt-12">
        <div className="mb-2 text-5xl leading-none">{page.icon || "📄"}</div>
        <h1 className="text-4xl font-bold tracking-tight text-[#37352f]">
          {page.title}
        </h1>
        <p className="mt-2 text-xs text-[#a3a3a0]">
          Published · Last updated {new Date(page.updatedAt).toLocaleDateString()}
        </p>

        <div className="mt-10">
          {blocks.map((block) => (
            <BlockContent key={block.id} block={block} />
          ))}
        </div>
      </article>

      <footer className="border-t border-[#e9e9e7] py-6 text-center text-xs text-[#a3a3a0]">
        Made with Notion-ref ·{" "}
        <Link href="/login" className="hover:underline">
          Create your own workspace
        </Link>
      </footer>
    </main>
  );
}
