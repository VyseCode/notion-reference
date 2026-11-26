"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  BLOCK_TYPES,
  COVER_COLORS,
  ICON_CHOICES,
  type BlockDTO,
  type BlockType,
  type BreadcrumbDTO,
  type PageDTO,
  type PageDetailDTO,
} from "@/lib/types";
import { safeImageUrl } from "@/lib/urls";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  CheckIcon,
  MoreIcon,
  PlusIcon,
  ShareIcon,
  StarIcon,
  TrashIcon,
} from "@/components/Icons";

const BLOCK_LABELS: Record<BlockType, string> = {
  paragraph: "Text",
  heading1: "H1",
  heading2: "H2",
  heading3: "H3",
  bullet: "• List",
  numbered: "1. List",
  todo: "☑ Todo",
  quote: "Quote",
  code: "</> Code",
  divider: "Divider",
  image: "Image",
};

type BlockRowProps = {
  block: BlockDTO;
  selected: boolean;
  onSelect: () => void;
  onChange: (fields: Partial<BlockDTO>) => void;
  onSave: (fields: Partial<BlockDTO>) => void;
  onAdd: () => void;
  onMove: (direction: -1 | 1) => void;
  onEnter: () => void;
  onBackspaceEmpty: () => void;
};

function BlockRow({
  block,
  selected,
  onSelect,
  onChange,
  onSave,
  onAdd,
  onMove,
  onEnter,
  onBackspaceEmpty,
}: BlockRowProps) {
  const baseInput =
    "w-full resize-none bg-transparent outline-none placeholder:text-[#d3d3d0] [field-sizing:content]";

  function keyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      onEnter();
    }
    if (event.key === "Backspace" && block.content.length === 0) {
      event.preventDefault();
      onBackspaceEmpty();
    }
  }

  let editor: React.ReactNode;

  if (block.type === "divider") {
    editor = <hr className="my-4 border-t border-[#e9e9e7]" />;
  } else if (block.type === "image") {
    const url = safeImageUrl(block.content);
    editor = (
      <div className="py-1">
        <textarea
          rows={1}
          value={block.content}
          onChange={(event) => onChange({ content: event.target.value })}
          onBlur={() => onSave({ content: block.content })}
          placeholder="Paste an image URL (https://...)"
          className={`${baseInput} text-sm text-[#5f5e5b]`}
        />
        {url && (
          <div
            role="img"
            aria-label="Image preview"
            className="mt-2 h-56 w-full rounded-md bg-[#f1f1ef] bg-cover bg-center"
            style={{ backgroundImage: `url("${url.replace(/"/g, "%22")}")` }}
          />
        )}
      </div>
    );
  } else if (block.type === "todo") {
    editor = (
      <label className="flex items-start gap-2">
        <input
          type="checkbox"
          checked={block.checked}
          onChange={(event) => {
            onChange({ checked: event.target.checked });
            onSave({ checked: event.target.checked });
          }}
          className="mt-1.5 h-4 w-4 shrink-0 accent-[#2383e2]"
        />
        <textarea
          rows={1}
          value={block.content}
          onChange={(event) => onChange({ content: event.target.value })}
          onBlur={() => onSave({ content: block.content })}
          onKeyDown={keyDown}
          placeholder="To-do"
          className={`${baseInput} text-[15px] leading-7 ${
            block.checked ? "text-[#a3a3a0] line-through" : ""
          }`}
        />
      </label>
    );
  } else if (block.type === "code") {
    editor = (
      <textarea
        rows={3}
        value={block.content}
        onChange={(event) => onChange({ content: event.target.value })}
        onBlur={() => onSave({ content: block.content })}
        onKeyDown={keyDown}
        placeholder="Code"
        spellCheck={false}
        className="w-full resize-y rounded-md bg-[#f7f6f3] p-3 font-mono text-sm leading-6 outline-none placeholder:text-[#c4c4c1]"
      />
    );
  } else if (block.type === "quote") {
    editor = (
      <textarea
        rows={1}
        value={block.content}
        onChange={(event) => onChange({ content: event.target.value })}
        onBlur={() => onSave({ content: block.content })}
        onKeyDown={keyDown}
        placeholder="Quote"
        className={`${baseInput} border-l-[3px] border-[#37352f] pl-3 text-[15px] italic leading-7 text-[#5f5e5b]`}
      />
    );
  } else if (block.type.startsWith("heading")) {
    const size =
      block.type === "heading1"
        ? "text-3xl font-bold"
        : block.type === "heading2"
          ? "text-2xl font-semibold"
          : "text-xl font-semibold";
    editor = (
      <textarea
        rows={1}
        value={block.content}
        onChange={(event) => onChange({ content: event.target.value })}
        onBlur={() => onSave({ content: block.content })}
        onKeyDown={keyDown}
        placeholder="Heading"
        className={`${baseInput} ${size} leading-snug text-[#37352f]`}
      />
    );
  } else if (block.type === "bullet" || block.type === "numbered") {
    editor = (
      <div className="flex gap-2">
        <span className="w-4 shrink-0 select-none pt-0.5 text-[15px] leading-7 text-[#5f5e5b]">
          {block.type === "bullet" ? "•" : "1."}
        </span>
        <textarea
          rows={1}
          value={block.content}
          onChange={(event) => onChange({ content: event.target.value })}
          onBlur={() => onSave({ content: block.content })}
          onKeyDown={keyDown}
          placeholder="List item"
          className={`${baseInput} flex-1 text-[15px] leading-7`}
        />
      </div>
    );
  } else {
    editor = (
      <textarea
        rows={1}
        value={block.content}
        onChange={(event) => onChange({ content: event.target.value })}
        onBlur={() => onSave({ content: block.content })}
        onKeyDown={keyDown}
        placeholder="Write something, or press '/' for blocks"
        className={`${baseInput} min-h-7 py-0.5 text-[15px] leading-7`}
      />
    );
  }

  return (
    <div
      onFocus={onSelect}
      onClick={onSelect}
      className={`group relative rounded-sm py-0.5 transition-colors ${
        selected ? "bg-[#faf9f7]" : "hover:bg-[#fbfbfa]"
      }`}
    >
      <div
        className={`absolute -left-14 top-0.5 flex items-center gap-0.5 transition-opacity ${
          selected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        }`}
      >
        <button
          type="button"
          onClick={onAdd}
          title="Add block below"
          aria-label="Add block below"
          className="rounded p-1 text-[#a3a3a0] hover:bg-[#e9e9e7] hover:text-[#37352f]"
        >
          <PlusIcon className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => onMove(-1)}
          title="Move up"
          aria-label="Move block up"
          className="rounded p-1 text-[#a3a3a0] hover:bg-[#e9e9e7] hover:text-[#37352f]"
        >
          <ArrowUpIcon className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => onMove(1)}
          title="Move down"
          aria-label="Move block down"
          className="rounded p-1 text-[#a3a3a0] hover:bg-[#e9e9e7] hover:text-[#37352f]"
        >
          <ArrowDownIcon className="h-3.5 w-3.5" />
        </button>
      </div>
      {editor}
    </div>
  );
}

export function PageEditor({ initial }: { initial: PageDetailDTO }) {
  const router = useRouter();
  const [page, setPage] = useState<PageDTO>(initial.page);
  const [blocks, setBlocks] = useState<BlockDTO[]>(initial.blocks);
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbDTO[]>(
    initial.breadcrumbs,
  );
  const [selected, setSelected] = useState<string | null>(
    initial.blocks[0]?.id ?? null,
  );
  const [saved, setSaved] = useState(true);
  const [shareOpen, setShareOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [iconOpen, setIconOpen] = useState(false);
  const [coverOpen, setCoverOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);

  async function patchPage(fields: Record<string, unknown>) {
    setPage((previous) => ({ ...previous, ...fields }) as PageDTO);
    setSaved(false);
    try {
      const response = await fetch(`/api/pages/${page.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      });
      const data = (await response.json()) as {
        page?: PageDTO;
        breadcrumbs?: BreadcrumbDTO[];
        error?: string;
      };
      if (!response.ok || !data.page) throw new Error(data.error ?? "Update failed");
      setPage(data.page);
      if (data.breadcrumbs) setBreadcrumbs(data.breadcrumbs);
      setSaved(true);
      router.refresh();
    } catch (error) {
      setSaved(true);
      window.alert(error instanceof Error ? error.message : "Update failed");
    }
  }

  function localUpdate(id: string, fields: Partial<BlockDTO>) {
    setBlocks((previous) =>
      previous.map((block) =>
        block.id === id ? { ...block, ...fields } : block,
      ),
    );
  }

  async function saveBlock(id: string, fields: Partial<BlockDTO>) {
    setSaved(false);
    try {
      const response = await fetch(`/api/pages/${page.id}/blocks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      });
      const data = (await response.json()) as {
        block?: BlockDTO;
        error?: string;
      };
      if (!response.ok || !data.block) throw new Error(data.error ?? "Save failed");
      setBlocks((previous) =>
        previous.map((block) => (block.id === id ? data.block as BlockDTO : block)),
      );
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Save failed");
    } finally {
      setSaved(true);
    }
  }

  async function addBlock(afterId?: string, type: BlockType = "paragraph") {
    if (busy) return;
    setBusy(true);
    try {
      const response = await fetch(`/api/pages/${page.id}/blocks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
      const data = (await response.json()) as {
        block?: BlockDTO;
        error?: string;
      };
      if (!response.ok || !data.block) throw new Error(data.error ?? "Could not add block");
      setBlocks((previous) => {
        const next = [...previous];
        const index = afterId
          ? next.findIndex((block) => block.id === afterId)
          : next.length - 1;
        next.splice(index + 1, 0, data.block as BlockDTO);
        return next;
      });
      setSelected(data.block.id);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Could not add block");
    } finally {
      setBusy(false);
    }
  }

  async function deleteBlockById(id: string) {
    const response = await fetch(`/api/pages/${page.id}/blocks/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) return;
    setBlocks((previous) => previous.filter((block) => block.id !== id));
    setSelected(null);
  }

  async function moveBlock(id: string, direction: -1 | 1) {
    const index = blocks.findIndex((block) => block.id === id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= blocks.length) return;
    const ids = blocks.map((block) => block.id);
    [ids[index], ids[target]] = [ids[target], ids[index]];

    const response = await fetch(`/api/pages/${page.id}/blocks`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    });
    const data = (await response.json()) as {
      blocks?: BlockDTO[];
      error?: string;
    };
    if (response.ok && data.blocks) setBlocks(data.blocks);
  }

  function changeType(id: string, type: BlockType) {
    localUpdate(id, { type });
    void saveBlock(id, { type });
  }

  function handleEnter(id: string) {
    const current = blocks.find((block) => block.id === id);
    const listTypes: BlockType[] = ["bullet", "numbered", "todo"];
    const nextType =
      current && listTypes.includes(current.type) ? current.type : "paragraph";
    void addBlock(id, nextType);
  }

  function handleBackspaceEmpty(id: string) {
    if (blocks.length <= 1) return;
    const index = blocks.findIndex((block) => block.id === id);
    const previous = blocks[index - 1];
    void deleteBlockById(id);
    if (previous) setSelected(previous.id);
  }

  async function deletePage() {
    if (!window.confirm(`Delete "${page.title}" and all of its subpages?`)) return;
    const response = await fetch(`/api/pages/${page.id}`, { method: "DELETE" });
    if (response.ok) {
      router.push("/home");
      router.refresh();
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/p/${page.publicSlug}`,
      );
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      window.alert("Could not copy the link.");
    }
  }

  return (
    <main className="notion-scroll flex-1 overflow-y-auto">
      <div className="sticky top-0 z-20 flex h-12 items-center justify-between gap-2 border-b border-[#f0f0ee] bg-white/95 px-4 backdrop-blur">
        <div className="flex min-w-0 items-center gap-1 truncate text-sm text-[#787774]">
          {breadcrumbs.length > 0 ? (
            breadcrumbs.map((crumb, index) => (
              <span key={crumb.id} className="flex min-w-0 items-center gap-1">
                {index > 0 && <span className="text-[#c4c4c1]">/</span>}
                {index < breadcrumbs.length - 1 ? (
                  <Link
                    href={`/doc/${crumb.id}`}
                    className="max-w-[140px] truncate hover:text-[#37352f] hover:underline"
                  >
                    {crumb.icon} {crumb.title || "Untitled"}
                  </Link>
                ) : (
                  <span className="max-w-[180px] truncate text-[#37352f]">
                    {crumb.icon} {crumb.title || "Untitled"}
                  </span>
                )}
              </span>
            ))
          ) : (
            <span>Documents</span>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <span className="mr-2 hidden text-xs text-[#a3a3a0] sm:inline">
            {saved ? "Saved" : "Saving..."}
          </span>
          <button
            type="button"
            onClick={() => patchPage({ favorite: !page.favorite })}
            title={page.favorite ? "Remove from favorites" : "Add to favorites"}
            aria-label="Toggle favorite"
            className={`rounded p-1.5 text-[#d9a441] hover:bg-[#f1f1ef] ${
              page.favorite ? "" : "text-[#a3a3a0]"
            }`}
          >
            <StarIcon className="h-4 w-4" filled={page.favorite} />
          </button>
          <button
            type="button"
            onClick={() => setShareOpen((open) => !open)}
            className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-[#5f5e5b] hover:bg-[#f1f1ef]"
          >
            <ShareIcon className="h-4 w-4" />
            Share
          </button>
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-label="More page actions"
              className="rounded p-1.5 text-[#5f5e5b] hover:bg-[#f1f1ef]"
            >
              <MoreIcon className="h-4 w-4" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full z-30 mt-1 w-44 rounded-md border border-[#e9e9e7] bg-white py-1 shadow-lg">
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    void deletePage();
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                >
                  <TrashIcon className="h-4 w-4" />
                  Delete page
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {shareOpen && (
        <div className="border-b border-[#e9e9e7] bg-[#fbfbfa] px-5 py-3">
          <div className="mx-auto flex max-w-3xl flex-wrap items-center gap-3">
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={page.published}
                onChange={(event) => patchPage({ published: event.target.checked })}
                className="h-4 w-4 accent-[#2383e2]"
              />
              Publish to web
            </label>
            {page.published ? (
              <>
                <Link
                  href={`/p/${page.publicSlug}`}
                  target="_blank"
                  className="text-sm text-[#2383e2] hover:underline"
                >
                  /p/{page.publicSlug}
                </Link>
                <button
                  type="button"
                  onClick={copyLink}
                  className="flex items-center gap-1 rounded-md border border-[#e0e0de] bg-white px-2 py-1 text-xs hover:bg-[#f1f1ef]"
                >
                  {copied && <CheckIcon className="h-3.5 w-3.5 text-green-600" />}
                  {copied ? "Copied" : "Copy link"}
                </button>
              </>
            ) : (
              <span className="text-xs text-[#9b9a97]">
                Only you can see this page.
              </span>
            )}
          </div>
        </div>
      )}

      <div className="mx-auto max-w-3xl px-5 pb-32 pt-10 sm:px-10">
        {page.coverColor && (
          <div
            className="relative -mt-2 mb-5 h-40 w-full rounded-md sm:h-48"
            style={{ backgroundColor: page.coverColor }}
          >
            <div className="absolute bottom-3 right-3 flex gap-2">
              <button
                type="button"
                onClick={() => setCoverOpen((open) => !open)}
                className="rounded-md bg-black/40 px-2 py-1 text-xs text-white hover:bg-black/60"
              >
                Change cover
              </button>
              <button
                type="button"
                onClick={() => patchPage({ coverColor: "" })}
                className="rounded-md bg-black/40 px-2 py-1 text-xs text-white hover:bg-black/60"
              >
                Remove
              </button>
            </div>
          </div>
        )}

        <div className="relative mb-1 inline-block">
          <button
            type="button"
            onClick={() => setIconOpen((open) => !open)}
            title="Change icon"
            className="rounded-md px-1 text-5xl leading-none hover:bg-[#f1f1ef]"
          >
            {page.icon || "📄"}
          </button>
          {iconOpen && (
            <div className="absolute left-0 top-full z-30 mt-2 grid w-72 grid-cols-9 gap-1 rounded-md border border-[#e9e9e7] bg-white p-2 shadow-lg">
              {ICON_CHOICES.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => {
                    patchPage({ icon });
                    setIconOpen(false);
                  }}
                  className="rounded p-1 text-xl hover:bg-[#f1f1ef]"
                >
                  {icon}
                </button>
              ))}
              <button
                type="button"
                onClick={() => {
                  patchPage({ icon: "" });
                  setIconOpen(false);
                }}
                className="col-span-9 rounded px-2 py-1 text-xs text-[#787774] hover:bg-[#f1f1ef]"
              >
                Remove icon
              </button>
            </div>
          )}
        </div>

        <input
          value={page.title}
          onChange={(event) =>
            setPage((previous) => ({ ...previous, title: event.target.value }))
          }
          onBlur={() =>
            patchPage({ title: page.title.trim() || "Untitled" })
          }
          placeholder="Untitled"
          aria-label="Page title"
          className="w-full bg-transparent text-4xl font-bold tracking-tight text-[#37352f] outline-none placeholder:text-[#d3d3d0]"
        />

        {coverOpen && (
          <div className="mt-3 flex flex-wrap items-center gap-2 rounded-md border border-[#e9e9e7] bg-white p-2">
            {COVER_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => {
                  patchPage({ coverColor: color });
                  setCoverOpen(false);
                }}
                title={`Cover ${color}`}
                className="h-7 w-7 rounded border border-black/10 hover:ring-2 hover:ring-[#2383e2]"
                style={{ backgroundColor: color }}
              />
            ))}
            <button
              type="button"
              onClick={() => setCoverOpen(false)}
              className="ml-auto text-xs text-[#9b9a97] hover:text-[#37352f]"
            >
              Cancel
            </button>
          </div>
        )}

        {!page.coverColor && !coverOpen && (
          <button
            type="button"
            onClick={() => setCoverOpen(true)}
            className="mt-2 text-xs text-[#a3a3a0] hover:text-[#37352f] hover:underline"
          >
            + Add cover
          </button>
        )}

        <div className="mt-8 sm:pl-14">
          <div className="sticky top-12 z-10 mb-4 flex flex-wrap items-center gap-1 rounded-md border border-[#e9e9e7] bg-white/95 p-1.5 shadow-sm backdrop-blur">
            <span className="px-1.5 text-[10px] font-semibold uppercase tracking-wide text-[#a3a3a0]">
              Blocks
            </span>
            {BLOCK_TYPES.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => selected && changeType(selected, type)}
                disabled={!selected}
                className={`rounded px-1.5 py-1 text-[11px] transition-colors disabled:opacity-40 ${
                  selected &&
                  blocks.find((block) => block.id === selected)?.type === type
                    ? "bg-[#e9e9e7] font-semibold text-[#37352f]"
                    : "text-[#787774] hover:bg-[#f1f1ef]"
                }`}
              >
                {BLOCK_LABELS[type]}
              </button>
            ))}
            <button
              type="button"
              onClick={() => selected && deleteBlockById(selected)}
              disabled={!selected}
              title="Delete selected block"
              aria-label="Delete selected block"
              className="ml-auto rounded p-1 text-[#a3a3a0] hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
            >
              <TrashIcon className="h-3.5 w-3.5" />
            </button>
          </div>

          {blocks.map((block) => (
            <BlockRow
              key={block.id}
              block={block}
              selected={selected === block.id}
              onSelect={() => setSelected(block.id)}
              onChange={(fields) => localUpdate(block.id, fields)}
              onSave={(fields) => saveBlock(block.id, fields)}
              onAdd={() => addBlock(block.id)}
              onMove={(direction) => moveBlock(block.id, direction)}
              onEnter={() => handleEnter(block.id)}
              onBackspaceEmpty={() => handleBackspaceEmpty(block.id)}
            />
          ))}

          <button
            type="button"
            onClick={() => addBlock()}
            className="mt-4 flex w-full items-center gap-2 rounded-md px-1 py-2 text-sm text-[#a3a3a0] transition hover:bg-[#f7f7f5] hover:text-[#5f5e5b]"
          >
            <PlusIcon className="h-4 w-4" />
            Add a block
          </button>
        </div>
      </div>
    </main>
  );
}
