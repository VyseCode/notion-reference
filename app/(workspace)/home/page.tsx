import Link from "next/link";
import { redirect } from "next/navigation";
import { CreatePageButton } from "@/components/CreatePageButton";
import { ClockIcon, FileIcon, StarIcon } from "@/components/Icons";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { getFavoritePages, getRecentPages } from "@/lib/queries";
import { User } from "@/models/User";
import type { PageDTO } from "@/lib/types";

export const metadata = { title: "Home" };

function PageCard({ page }: { page: PageDTO }) {
  return (
    <Link
      href={`/doc/${page.id}`}
      className="group flex min-h-[92px] flex-col justify-between rounded-lg border border-[#e9e9e7] bg-white p-3.5 transition hover:border-[#d3d3d0] hover:bg-[#fbfbfa] hover:shadow-sm"
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl leading-none">{page.icon || "📄"}</span>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-[#37352f]">
            {page.title || "Untitled"}
          </p>
          <p className="mt-0.5 line-clamp-2 text-xs text-[#9b9a97]">
            {page.published ? "Published · " : "Private · "}
            Updated {new Date(page.updatedAt).toLocaleDateString()}
          </p>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2 text-[11px] text-[#a3a3a0]">
        <FileIcon className="h-3.5 w-3.5" />
        Page
        {page.favorite && <StarIcon className="h-3.5 w-3.5 text-[#d9a441]" filled />}
      </div>
    </Link>
  );
}

function Section({
  title,
  icon,
  pages,
  empty,
}: {
  title: string;
  icon: React.ReactNode;
  pages: PageDTO[];
  empty: string;
}) {
  return (
    <section className="mb-9">
      <div className="mb-3 flex items-center gap-2">
        {icon}
        <h2 className="text-sm font-semibold text-[#37352f]">{title}</h2>
      </div>
      {pages.length === 0 ? (
        <p className="rounded-lg border border-dashed border-[#e0e0de] px-4 py-6 text-sm text-[#a3a3a0]">
          {empty}
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {pages.map((page) => (
            <PageCard key={page.id} page={page} />
          ))}
        </div>
      )}
    </section>
  );
}

export default async function HomePage() {
  const session = await getSession();
  if (!session) redirect("/login");

  await connectDB();
  const [me, recent, favorites] = await Promise.all([
    User.findById(session.userId).select("name").lean(),
    getRecentPages(session.userId, { limit: 12, offset: 0 }),
    getFavoritePages(session.userId, { limit: 12, offset: 0 }),
  ]);

  const firstName = (me?.name ?? "there").split(" ")[0];

  return (
    <main className="notion-scroll flex-1 overflow-y-auto px-5 py-8 sm:px-10 lg:px-14">
      <div className="mx-auto max-w-4xl">
        <header className="mb-9 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-[#37352f]">
              Good to see you, {firstName}
            </h1>
            <p className="mt-1 text-sm text-[#787774]">
              Your workspace, pages, and ideas — all in one place.
            </p>
          </div>
          <CreatePageButton />
        </header>

        <Section
          title="Recently visited"
          icon={<ClockIcon className="h-4 w-4 text-[#9b9a97]" />}
          pages={recent.pages}
          empty="No pages yet. Create one to get started."
        />

        <Section
          title="Favorites"
          icon={<StarIcon className="h-4 w-4 text-[#d9a441]" filled />}
          pages={favorites.pages}
          empty="Star a page in the sidebar to pin it here."
        />

        <section className="rounded-lg border border-[#e9e9e7] bg-[#fbfbfa] p-5">
          <h2 className="mb-3 text-sm font-semibold">Make it yours</h2>
          <div className="grid gap-4 text-sm text-[#787774] sm:grid-cols-3">
            <p>
              <strong className="block text-[#37352f]">Nest pages</strong>
              Build a tree with subpages and breadcrumbs.
            </p>
            <p>
              <strong className="block text-[#37352f]">Write in blocks</strong>
              Headings, to-dos, quotes, code, images, and more.
            </p>
            <p>
              <strong className="block text-[#37352f]">Share read-only</strong>
              Publish any page to a public link.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
