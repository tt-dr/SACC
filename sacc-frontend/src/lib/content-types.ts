export type ContentModule = "news" | "docs" | "projects";

export type ContentStatus = "draft" | "published" | "archived";

export interface ContentItem {
  id: number;
  module: ContentModule;
  slug: string;
  title: string;
  category?: string;
  summary?: string;
  body?: string;
  tags: string[];
  status: ContentStatus;
  author?: string;
  role?: string;
  coverImage?: string;
  repoUrl?: string;
  progress?: string;
  techStack: string[];
  sortOrder: number;
  views?: number;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ContentInput {
  module: ContentModule;
  slug?: string;
  title: string;
  category?: string;
  summary?: string;
  body?: string;
  tags?: string[];
  status?: ContentStatus;
  author?: string;
  role?: string;
  coverImage?: string;
  repoUrl?: string;
  progress?: string;
  techStack?: string[];
  sortOrder?: number;
  publishedAt?: string;
}

export const CONTENT_MODULES: ContentModule[] = ["news", "docs", "projects"];

export const STATUS_LABELS: Record<ContentStatus, string> = {
  draft: "草稿",
  published: "已发布",
  archived: "已下线",
};

export const STATUS_TABS: Array<{ value: ContentStatus | "all"; label: string }> = [
  { value: "all", label: "全部" },
  { value: "draft", label: "草稿" },
  { value: "published", label: "已发布" },
  { value: "archived", label: "已下线" },
];
