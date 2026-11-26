"use client";

import Link from "next/link";
import { useState } from "react";
import type { PaginationDTO, SearchResultDTO } from "@/lib/types";
import { FileIcon, SearchIcon } from "@/components/Icons";

type Results = { results: SearchResultDTO[] } & PaginationDTO;

export function SearchView({
  initialQuery,
  initialResults,
}: {
  initialQuery: string;
  initialResults: Results;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState(initialResults);
  const [loading, setLoading] = useState(false);

  async function search(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    try {
      const response = await fetch(
        `/api/search?q=${encodeURIComponent(query)}&limit=20`,
      );
      const data = (await response.json()) as Results;
      if (response.ok) setResults(data);
    } catch {
      window.alert("Search failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="notion-scroll flex-1 overflow-y-auto px-5 py-8 sm:px-10 lg:px-14">
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-5 text-3xl font-semibold tracking-tight">Search</h1>
        <form onSubmit={search} className="relative mb-7">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#a3a3a0]">
            <SearchIcon className="h-5 w-5" />
          </span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search page titles and block text"
            aria-label="Search pages"
            className="w-full rounded-lg border border-[#e0e0de] bg-white py-3 pl-11 pr-24 text-sm outline-none placeholder:text-[#a3a3a0] focus:border-[#37352f] focus:ring-1 focus:ring-[#37352f]"
          />
          <button
            type="submit"
            disabled={loading}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md bg-[#37352f] px-3 py-1.5 text-sm text-white hover:bg-[#1f1e1d] disabled:opacity-60"
          >
            {loading ? "..." : "Search"}
          </button>
        </form>

        {!initialQuery && !results.results.length ? (
          <p className="rounded-lg border border-dashed border-[#e0e0de] px-4 py-8 text-center text-sm text-[#a3a3a0]">
            Type above to find pages by title or by anything written inside them.
          </p>
        ) : results.results.length === 0 ? (
          <p className="rounded-lg border border-dashed border-[#e0e0de] px-4 py-8 text-center text-sm text-[#a3a3a0]">
            No pages matched your search.
          </p>
        ) : (
          <>
            <p className="mb-3 text-xs text-[#a3a3a0]">
              {results.total} {results.total === 1 ? "result" : "results"}
            </p>
            <div className="divide-y divide-[#f0f0ee] overflow-hidden rounded-lg border border-[#e9e9e7] bg-white">
              {results.results.map((page) => (
                <Link
                  key={page.id}
                  href={`/doc/${page.id}`}
                  className="block px-4 py-3 transition hover:bg-[#faf9f7]"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl leading-none">{page.icon || "📄"}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-[#37352f]">
                        {page.title || "Untitled"}
                      </p>
                      {page.snippet && (
                        <p className="mt-0.5 truncate text-xs text-[#9b9a97]">
                          {page.snippet}
                        </p>
                      )}
                    </div>
                    <FileIcon className="h-4 w-4 shrink-0 text-[#c4c4c1]" />
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
