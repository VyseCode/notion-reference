"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { PlusIcon } from "@/components/Icons";

export function CreatePageButton({
  label = "New page",
  className = "",
}: {
  label?: string;
  className?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function create() {
    if (busy) return;
    setBusy(true);
    try {
      const response = await fetch("/api/pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Untitled" }),
      });
      const data = (await response.json()) as {
        page?: { id: string };
        error?: string;
      };
      if (!response.ok || !data.page) {
        window.alert(data.error ?? "Could not create the page");
        return;
      }
      router.push(`/doc/${data.page.id}`);
      router.refresh();
    } catch {
      window.alert("Unable to reach the server. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={create}
      disabled={busy}
      className={`inline-flex items-center gap-1.5 rounded-md bg-[#37352f] px-3 py-2 text-sm font-medium text-white transition hover:bg-[#1f1e1d] disabled:opacity-60 ${className}`}
    >
      <PlusIcon className="h-4 w-4" />
      {busy ? "Creating..." : label}
    </button>
  );
}
