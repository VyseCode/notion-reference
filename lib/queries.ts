import { Types } from "mongoose";
import { Page } from "@/models/Page";
import { Block } from "@/models/Block";
import type {
  BlockDTO,
  BreadcrumbDTO,
  PageDTO,
  PageDetailDTO,
  PaginationDTO,
  PublicPageDTO,
  SearchResultDTO,
} from "@/lib/types";

export type LeanPage = {
  _id: Types.ObjectId;
  owner: Types.ObjectId;
  title: string;
  icon: string;
  coverColor: string;
  parentId: Types.ObjectId | null;
  favorite: boolean;
  published: boolean;
  publicSlug: string;
  createdAt: Date;
  updatedAt: Date;
};

type LeanBlock = {
  _id: Types.ObjectId;
  page: Types.ObjectId;
  type: BlockDTO["type"];
  content: string;
  checked: boolean;
  order: number;
};

const PAGE_FIELDS =
  "title icon coverColor parentId favorite published publicSlug createdAt updatedAt";

export function paginationFrom(
  searchParams: URLSearchParams,
  defaultLimit = 50,
) {
  const rawLimit = Number(searchParams.get("limit") ?? String(defaultLimit));
  const rawOffset = Number(searchParams.get("offset") ?? "0");
  const limit = Number.isFinite(rawLimit)
    ? Math.min(Math.max(Math.trunc(rawLimit), 1), 100)
    : defaultLimit;
  const offset = Number.isFinite(rawOffset)
    ? Math.max(Math.trunc(rawOffset), 0)
    : 0;
  return { limit, offset };
}

export function toPageDTO(doc: LeanPage): PageDTO {
  return {
    id: doc._id.toString(),
    title: doc.title,
    icon: doc.icon ?? "",
    coverColor: doc.coverColor ?? "",
    parentId: doc.parentId ? doc.parentId.toString() : null,
    favorite: doc.favorite ?? false,
    published: doc.published ?? false,
    publicSlug: doc.publicSlug,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

function toBlockDTO(doc: LeanBlock): BlockDTO {
  return {
    id: doc._id.toString(),
    type: doc.type,
    content: doc.content ?? "",
    checked: doc.checked ?? false,
    order: doc.order ?? 0,
  };
}

function pageFilter(userId: string, parentId?: string | null) {
  const filter: Record<string, unknown> = { owner: userId };
  if (parentId === undefined) return filter;
  if (parentId === null || parentId === "root") {
    filter.parentId = null;
  } else if (Types.ObjectId.isValid(parentId)) {
    filter.parentId = new Types.ObjectId(parentId);
  } else {
    filter.parentId = { $exists: false };
  }
  return filter;
}

export async function listPages(
  userId: string,
  options: {
    limit: number;
    offset: number;
    parentId?: string | null;
  },
): Promise<{ pages: PageDTO[] } & PaginationDTO> {
  const filter = pageFilter(userId, options.parentId);
  const [docs, total] = await Promise.all([
    Page.find(filter)
      .select(PAGE_FIELDS)
      .sort({ updatedAt: -1, _id: -1 })
      .skip(options.offset)
      .limit(options.limit)
      .lean(),
    Page.countDocuments(filter),
  ]);
  const pages = (docs as unknown as LeanPage[]).map(toPageDTO);
  return {
    pages,
    total,
    hasMore: options.offset + pages.length < total,
  };
}

export async function getRecentPages(
  userId: string,
  options: { limit: number; offset: number },
): Promise<{ pages: PageDTO[] } & PaginationDTO> {
  return listPages(userId, options);
}

export async function getFavoritePages(
  userId: string,
  options: { limit: number; offset: number },
): Promise<{ pages: PageDTO[] } & PaginationDTO> {
  const filter = { owner: userId, favorite: true };
  const [docs, total] = await Promise.all([
    Page.find(filter)
      .select(PAGE_FIELDS)
      .sort({ updatedAt: -1 })
      .skip(options.offset)
      .limit(options.limit)
      .lean(),
    Page.countDocuments(filter),
  ]);
  const pages = (docs as unknown as LeanPage[]).map(toPageDTO);
  return {
    pages,
    total,
    hasMore: options.offset + pages.length < total,
  };
}

async function breadcrumbsFor(page: LeanPage): Promise<BreadcrumbDTO[]> {
  const chain: BreadcrumbDTO[] = [];
  let current: LeanPage | null = page;
  const seen = new Set<string>();

  while (current && chain.length < 20) {
    const id = current._id.toString();
    if (seen.has(id)) break;
    seen.add(id);
    chain.unshift({ id, title: current.title, icon: current.icon ?? "" });
    if (!current.parentId) break;
    current = (await Page.findById(current.parentId)
      .select("title icon parentId")
      .lean()) as unknown as LeanPage | null;
  }

  return chain;
}

export async function getPageDetail(
  userId: string,
  pageId: string,
): Promise<PageDetailDTO | null> {
  if (!Types.ObjectId.isValid(pageId)) return null;
  const doc = (await Page.findOne({ _id: pageId, owner: userId })
    .select(PAGE_FIELDS)
    .lean()) as unknown as LeanPage | null;
  if (!doc) return null;

  const [blocks, breadcrumbs] = await Promise.all([
    Block.find({ page: doc._id })
      .select("type content checked order")
      .sort({ order: 1, _id: 1 })
      .lean(),
    breadcrumbsFor(doc),
  ]);

  return {
    page: toPageDTO(doc),
    blocks: (blocks as unknown as LeanBlock[]).map(toBlockDTO),
    breadcrumbs,
  };
}

export async function getPublicPage(
  slug: string,
): Promise<{ page: PublicPageDTO; blocks: BlockDTO[] } | null> {
  const doc = (await Page.findOne({ publicSlug: slug, published: true })
    .select("title icon coverColor createdAt updatedAt _id")
    .lean()) as unknown as LeanPage | null;
  if (!doc) return null;

  const blocks = (await Block.find({ page: doc._id })
    .select("type content checked order")
    .sort({ order: 1, _id: 1 })
    .lean()) as unknown as LeanBlock[];

  return {
    page: {
      title: doc.title,
      icon: doc.icon ?? "",
      coverColor: doc.coverColor ?? "",
      createdAt: doc.createdAt.toISOString(),
      updatedAt: doc.updatedAt.toISOString(),
    },
    blocks: blocks.map(toBlockDTO),
  };
}

export async function searchPages(
  userId: string,
  query: string,
  options: { limit: number; offset: number },
): Promise<{ results: SearchResultDTO[] } & PaginationDTO> {
  const term = query.trim();
  if (!term) return { results: [], total: 0, hasMore: false };

  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(escaped, "i");

  const [titleDocs, matchingBlocks] = await Promise.all([
    Page.find({ owner: userId, title: regex })
      .select(PAGE_FIELDS)
      .sort({ updatedAt: -1 })
      .limit(100)
      .lean(),
    Block.find({ content: regex })
      .select("page content")
      .limit(500)
      .lean(),
  ]);

  const snippets = new Map<string, string>();
  for (const block of matchingBlocks as unknown as Array<{
    page: Types.ObjectId;
    content: string;
  }>) {
    const key = block.page.toString();
    if (!snippets.has(key)) snippets.set(key, block.content.slice(0, 220));
  }

  const ids = [...snippets.keys()].map((id) => new Types.ObjectId(id));
  const linkedDocs = ids.length
    ? await Page.find({ owner: userId, _id: { $in: ids } })
        .select(PAGE_FIELDS)
        .lean()
    : [];

  const merged = new Map<string, LeanPage>();
  for (const doc of [...titleDocs, ...linkedDocs] as unknown as LeanPage[]) {
    merged.set(doc._id.toString(), doc);
  }

  const sorted = [...merged.values()].sort(
    (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime(),
  );
  const total = sorted.length;
  const slice = sorted.slice(options.offset, options.offset + options.limit);

  return {
    results: slice.map((doc) => ({
      ...toPageDTO(doc),
      snippet: snippets.get(doc._id.toString()) ?? "",
    })),
    total,
    hasMore: options.offset + slice.length < total,
  };
}

export async function isDescendant(
  userId: string,
  parentId: string,
  pageId: string,
): Promise<boolean> {
  let currentId: string | null = parentId;
  const seen = new Set<string>();

  while (currentId && !seen.has(currentId)) {
    if (currentId === pageId) return true;
    seen.add(currentId);
    if (!Types.ObjectId.isValid(currentId)) return false;
    const doc = (await Page.findOne({ _id: currentId, owner: userId })
      .select("parentId")
      .lean()) as { parentId: Types.ObjectId | null } | null;
    currentId = doc?.parentId ? doc.parentId.toString() : null;
  }

  return false;
}

export async function deletePageTree(
  userId: string,
  pageId: string,
): Promise<number | null> {
  if (!Types.ObjectId.isValid(pageId)) return null;
  if (!(await Page.exists({ _id: pageId, owner: userId }))) return null;

  const allIds: string[] = [pageId];
  const queue: string[] = [pageId];

  while (queue.length) {
    const current = queue.shift() as string;
    const children = (await Page.find({ owner: userId, parentId: current })
      .select("_id")
      .lean()) as Array<{ _id: Types.ObjectId }>;
    for (const child of children) {
      const id = child._id.toString();
      allIds.push(id);
      queue.push(id);
    }
  }

  await Block.deleteMany({ page: { $in: allIds } });
  const result = await Page.deleteMany({ _id: { $in: allIds }, owner: userId });
  return result.deletedCount;
}
