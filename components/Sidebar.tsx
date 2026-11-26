"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type { PageDTO } from "@/lib/types";
import {
  ChevronIcon,
  CloseIcon,
  HomeIcon,
  LogoutIcon,
  MenuIcon,
  PlusIcon,
  SearchIcon,
  StarIcon,
} from "@/components/Icons";

type SidebarProps = {
  user: { name: string; email: string };
  pages: PageDTO[];
};

type TreeItemProps = {
  page: PageDTO;
  pages: PageDTO[];
  depth: number;
  currentId: string;
  expanded: Set<string>;
  onToggle: (id: string) => void;
  onFavorite: (page: PageDTO) => void;
  onCreate: (parentId: string) => void;
};

function TreeItem({
  page,
  pages,
  depth,
  currentId,
  expanded,
  onToggle,
  onFavorite,
  onCreate,
}: TreeItemProps) {
  const children = pages
    .filter((candidate) => candidate.parentId === page.id)
    .sort((a, b) => a.title.localeCompare(b.title));
  const hasChildren = children.length > 0;
  const isOpen = expanded.has(page.id);
  const active = currentId === page.id;

  return (
    <li>
      <div
        className={`group flex items-center rounded pr-1 text-sm transition-colors ${
          active
            ? "bg-[#e9e9e7] font-medium text-[#37352f]"
            : "text-[#5f5e5b] hover:bg-[#f1f1ef]"
        }`}
        style={{ paddingLeft: 6 + depth * 14 }}
      >
        <button
          type="button"
          onClick={() => onToggle(page.id)}
          className="flex h-6 w-5 shrink-0 items-center justify-center rounded text-[#a3a3a0] hover:bg-[#e3e3e1]"
          aria-label={isOpen ? "Collapse" : "Expand"}
        >
          {hasChildren ? (
            <ChevronIcon className="h-3.5 w-3.5" open={isOpen} />
          ) : (
            <span className="h-3.5 w-3.5" />
          )}
        </button>
        <Link
          href={`/doc/${page.id}`}
          className="flex min-w-0 flex-1 items-center gap-2 py-1.5"
        >
          <span className="w-5 shrink-0 text-center text-base leading-none">
            {page.icon || "📄"}
          </span>
          <span className="truncate">{page.title || "Untitled"}</span>
        </Link>
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={() => onCreate(page.id)}
            title="Add a subpage"
            aria-label="Add a subpage"
            className={`rounded p-1 text-[#9b9a97] hover:bg-[#e3e3e1] hover:text-[#37352f] ${
              page.favorite ? "hidden" : "hidden group-hover:block"
            }`}
          >
            <PlusIcon className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onFavorite(page)}
            title={page.favorite ? "Remove from favorites" : "Add to favorites"}
            aria-label="Toggle favorite"
            className={`rounded p-1 text-[#d9a441] hover:bg-[#e3e3e1] ${
              page.favorite ? "block" : "hidden group-hover:block"
            }`}
          >
            <StarIcon className="h-3.5 w-3.5" filled={page.favorite} />
          </button>
        </div>
      </div>
      {hasChildren && isOpen && (
        <ul>
          {children.map((child) => (
            <TreeItem
              key={child.id}
              page={child}
              pages={pages}
              depth={depth + 1}
              currentId={currentId}
              expanded={expanded}
              onToggle={onToggle}
              onFavorite={onFavorite}
              onCreate={onCreate}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

export function Sidebar({ user, pages }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const currentId = pathname.startsWith("/doc/")
    ? pathname.split("/")[2] ?? ""
    : "";

  const [filter, setFilter] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(() => {
    const ids = new Set<string>();
    for (const page of pages) if (page.parentId) ids.add(page.parentId);
    return ids;
  });

  const favorites = useMemo(
    () => pages.filter((page) => page.favorite),
    [pages],
  );

  const visiblePages = useMemo(() => {
    const term = filter.trim().toLowerCase();
    if (!term) return pages;
    return pages.filter((page) => page.title.toLowerCase().includes(term));
  }, [filter, pages]);

  const rootPages = visiblePages
    .filter((page) => page.parentId === null)
    .sort((a, b) => a.title.localeCompare(b.title));

  function toggle(id: string) {
    setExpanded((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function createPage(parentId?: string | null) {
    if (busy) return;
    setBusy(true);
    try {
      const response = await fetch("/api/pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Untitled", parentId: parentId ?? null }),
      });
      const data = (await response.json()) as {
        page?: { id: string };
        error?: string;
      };
      if (!response.ok || !data.page) {
        window.alert(data.error ?? "Could not create the page");
        return;
      }
      setMobileOpen(false);
      router.push(`/doc/${data.page.id}`);
      router.refresh();
    } catch {
      window.alert("Unable to reach the server. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function toggleFavorite(page: PageDTO) {
    try {
      await fetch(`/api/pages/${page.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ favorite: !page.favorite }),
      });
      router.refresh();
    } catch {
      window.alert("Could not update this page.");
    }
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <>
      <div className="fixed inset-x-0 top-0 z-30 flex h-12 items-center gap-2 border-b border-[#e9e9e7] bg-white px-3 md:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="rounded p-1.5 text-[#5f5e5b] hover:bg-[#f1f1ef]"
          aria-label="Open sidebar"
        >
          <MenuIcon className="h-5 w-5" />
        </button>
        <span className="text-sm font-semibold">Notion-ref</span>
      </div>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`notion-scroll fixed inset-y-0 left-0 z-50 flex w-64 shrink-0 flex-col overflow-y-auto border-r border-[#e9e9e7] bg-[#fbfbfa] transition-transform md:static md:z-auto md:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center gap-2 px-3 py-3">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-[#37352f] text-sm font-bold text-white">
            {user.name.slice(0, 1).toUpperCase() || "N"}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold leading-tight">
              {user.name}&apos;s workspace
            </p>
            <p className="truncate text-[11px] text-[#9b9a97]">{user.email}</p>
          </div>
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="rounded p-1 text-[#9b9a97] hover:bg-[#e9e9e7] md:hidden"
            aria-label="Close sidebar"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="px-2 pb-2">
          <div className="relative">
            <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[#9b9a97]">
              <SearchIcon className="h-4 w-4" />
            </span>
            <input
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              placeholder="Filter pages"
              aria-label="Filter pages"
              className="w-full rounded-md bg-[#f1f1ef] py-1.5 pl-8 pr-2 text-sm outline-none placeholder:text-[#a3a3a0] focus:bg-white focus:ring-1 focus:ring-[#c7c7c5]"
            />
          </div>
        </div>

        <nav className="space-y-0.5 px-2 pb-3">
          <Link
            href="/home"
            onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm hover:bg-[#f1f1ef] ${
              pathname === "/home" ? "bg-[#e9e9e7] font-medium" : "text-[#5f5e5b]"
            }`}
          >
            <HomeIcon className="h-4 w-4 text-[#9b9a97]" />
            Home
          </Link>
          <Link
            href="/search"
            onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm hover:bg-[#f1f1ef] ${
              pathname === "/search" ? "bg-[#e9e9e7] font-medium" : "text-[#5f5e5b]"
            }`}
          >
            <SearchIcon className="h-4 w-4 text-[#9b9a97]" />
            Search
          </Link>
        </nav>

        <div className="notion-scroll flex-1 overflow-y-auto px-2 pb-4">
          {filter.trim() ? (
            <div>
              <p className="px-2 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-[#a3a3a0]">
                Matching pages
              </p>
              {visiblePages.length === 0 ? (
                <p className="px-2 py-2 text-xs text-[#a3a3a0]">No matches</p>
              ) : (
                <ul>
                  {visiblePages.map((page) => (
                    <li key={page.id}>
                      <Link
                        href={`/doc/${page.id}`}
                        onClick={() => setMobileOpen(false)}
                        className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-[#f1f1ef] ${
                          currentId === page.id
                            ? "bg-[#e9e9e7] font-medium"
                            : "text-[#5f5e5b]"
                        }`}
                      >
                        <span className="w-5 text-center text-base leading-none">
                          {page.icon || "📄"}
                        </span>
                        <span className="truncate">{page.title || "Untitled"}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : (
            <>
              {favorites.length > 0 && (
                <div className="mb-3">
                  <p className="px-2 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-[#a3a3a0]">
                    Favorites
                  </p>
                  <ul>
                    {favorites.map((page) => (
                      <li key={page.id}>
                        <Link
                          href={`/doc/${page.id}`}
                          onClick={() => setMobileOpen(false)}
                          className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-[#f1f1ef] ${
                            currentId === page.id
                              ? "bg-[#e9e9e7] font-medium"
                              : "text-[#5f5e5b]"
                          }`}
                        >
                          <span className="w-5 text-center text-base leading-none">
                            {page.icon || "📄"}
                          </span>
                          <span className="truncate">
                            {page.title || "Untitled"}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex items-center justify-between px-2 pb-1 pt-2">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-[#a3a3a0]">
                  Private
                </p>
                <button
                  type="button"
                  onClick={() => createPage(null)}
                  disabled={busy}
                  className="rounded p-1 text-[#9b9a97] hover:bg-[#e9e9e7] hover:text-[#37352f] disabled:opacity-50"
                  title="New page"
                  aria-label="New page"
                >
                  <PlusIcon className="h-3.5 w-3.5" />
                </button>
              </div>
              {rootPages.length === 0 ? (
                <p className="px-2 py-2 text-xs text-[#a3a3a0]">
                  No pages yet. Create your first page.
                </p>
              ) : (
                <ul>
                  {rootPages.map((page) => (
                    <TreeItem
                      key={page.id}
                      page={page}
                      pages={pages}
                      depth={0}
                      currentId={currentId}
                      expanded={expanded}
                      onToggle={toggle}
                      onFavorite={toggleFavorite}
                      onCreate={createPage}
                    />
                  ))}
                </ul>
              )}
            </>
          )}
        </div>

        <div className="border-t border-[#e9e9e7] px-2 py-2">
          <button
            type="button"
            onClick={logout}
            className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-sm text-[#5f5e5b] hover:bg-[#f1f1ef]"
          >
            <LogoutIcon className="h-4 w-4 text-[#9b9a97]" />
            Sign out
          </button>
        </div>
      </aside>
    </>
  );
}
