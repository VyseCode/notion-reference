export const BLOCK_TYPES = [
  "paragraph",
  "heading1",
  "heading2",
  "heading3",
  "bullet",
  "numbered",
  "todo",
  "quote",
  "code",
  "divider",
  "image",
] as const;

export type BlockType = (typeof BLOCK_TYPES)[number];

export const COVER_COLORS = [
  "#f5e6d3",
  "#f7d9d9",
  "#f6e8c3",
  "#dbe9d5",
  "#d9e8f5",
  "#e5ddf5",
  "#f5dcea",
  "#e8e6e3",
  "#2f3437",
] as const;

export const ICON_CHOICES = [
  "📄",
  "📝",
  "📚",
  "🎯",
  "🚀",
  "💡",
  "🎨",
  "🏗️",
  "🗓️",
  "🌱",
  "🧭",
  "🔥",
  "✨",
  "🧩",
  "🔌",
  "📖",
  "🗺️",
  "🧯",
] as const;

export type BlockDTO = {
  id: string;
  type: BlockType;
  content: string;
  checked: boolean;
  order: number;
};

export type PageDTO = {
  id: string;
  title: string;
  icon: string;
  coverColor: string;
  parentId: string | null;
  favorite: boolean;
  published: boolean;
  publicSlug: string;
  createdAt: string;
  updatedAt: string;
};

export type BreadcrumbDTO = {
  id: string;
  title: string;
  icon: string;
};

export type PageDetailDTO = {
  page: PageDTO;
  blocks: BlockDTO[];
  breadcrumbs: BreadcrumbDTO[];
};

export type PublicPageDTO = {
  title: string;
  icon: string;
  coverColor: string;
  createdAt: string;
  updatedAt: string;
};

export type SearchResultDTO = PageDTO & {
  snippet: string;
};

export type PaginationDTO = {
  total: number;
  hasMore: boolean;
};
