"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GripVertical, Image as ImageIcon, Plus, Search, Trash2, Upload } from "lucide-react";
import { useRouter } from "next/navigation";

import {
  createAdminContent,
  deleteAdminContent,
  getAdminContentDetail,
  listAdminContent,
  reorderAdminContent,
  updateAdminContent,
  uploadAdminImage,
} from "@/lib/content-api";
import type { ContentItem, ContentInput, ContentModule, ContentStatus } from "@/lib/content-types";
import { STATUS_LABELS, STATUS_TABS } from "@/lib/content-types";
import { formatDisplayDate } from "@/lib/markdown";
import { cn } from "@/lib/utils";

import { ImageUploader } from "./ImageUploader";
import { MarkdownPreview } from "./MarkdownPreview";

interface ModuleConfig {
  title: string;
  subtitle: string;
  createLabel: string;
  saveLabel: string;
  searchPlaceholder: string;
  listTitle: string;
  listHint: string;
  listFoot: string;
  editorTitle: string;
  editorHint: string;
  emptyText: string;
  footerHint: string;
}

const MODULE_CONFIG: Record<ContentModule, ModuleConfig> = {
  docs: {
    title: "文档库管理",
    subtitle: "维护项目文档与技术方案，拖拽排序，发布后同步到官网文档库",
    createLabel: "新建文档",
    saveLabel: "保存文档",
    searchPlaceholder: "搜索文档 / 分类",
    listTitle: "文档列表",
    listHint: "字段：标题 / 分类 / 状态 / 更新时间，支持拖拽调整官网展示顺序",
    listFoot: "拖拽排序松手即保存；文档更新后同步到官网文档库",
    editorTitle: "文档编辑",
    editorHint: "使用 # 与 ## 标题组织结构，官网文档库会自动生成右侧目录",
    emptyText: "还没有文档，点击「新建文档」开始创建",
    footerHint: "Markdown 预览已启用：支持 # 标题、**加粗**、- 列表、`代码` 与图片粘贴",
  },
  news: {
    title: "成员动态管理",
    subtitle: "维护成员发布的技术博客，只有「已发布」状态才会在官网展示",
    createLabel: "新建博客",
    saveLabel: "保存并发布",
    searchPlaceholder: "搜索标题 / 作者 / 标签",
    listTitle: "成员博客列表",
    listHint: "字段：标题 / 作者 / 状态 / 发布时间，可按状态筛选",
    listFoot: "状态切换即保存；已下线内容在后台仍可见，可随时重新上架",
    editorTitle: "博客编辑",
    editorHint: "维护博客标题、作者、摘要与正文，发布后同步到官网成员动态",
    emptyText: "还没有博客，点击「新建博客」开始创建",
    footerHint: "Markdown 预览已启用：支持 # 标题、**加粗**、- 列表、`代码` 与图片粘贴",
  },
  projects: {
    title: "项目展示管理",
    subtitle: "维护 GitHub 项目卡片，拖拽排序，下线后官网不再展示",
    createLabel: "新建项目",
    saveLabel: "保存项目",
    searchPlaceholder: "搜索项目名称",
    listTitle: "项目拖拽排序",
    listHint: "拖动列表项即可调整项目在官网首页的展示顺序，顺序实时保存",
    listFoot: "排序变更实时保存，立即同步到官网项目页",
    editorTitle: "项目卡片编辑",
    editorHint: "维护项目名称、仓库链接、标签与进度",
    emptyText: "还没有项目，点击「新建项目」开始创建",
    footerHint: "Markdown 预览已启用：支持 # 标题、**加粗**、- 列表、`代码`",
  },
};

function cloneItem<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function createEmptyDraft(moduleKey: ContentModule): ContentItem {
  return {
    id: 0,
    module: moduleKey,
    slug: "",
    title: "",
    category: "",
    summary: "",
    body: "",
    tags: [],
    status: "draft",
    author: "",
    role: "",
    coverImage: "",
    repoUrl: "",
    progress: "",
    techStack: [],
    sortOrder: 0,
    publishedAt: "",
    createdAt: "",
    updatedAt: "",
  };
}

function sortContentItems(moduleKey: ContentModule, items: ContentItem[]): ContentItem[] {
  const sorted = [...items];
  if (moduleKey === "news") {
    sorted.sort(
      (left, right) =>
        (right.publishedAt ?? right.createdAt).localeCompare(left.publishedAt ?? left.createdAt) ||
        right.id - left.id,
    );
  } else {
    sorted.sort((left, right) => left.sortOrder - right.sortOrder || right.updatedAt.localeCompare(left.updatedAt));
  }
  return sorted;
}

function buildInput(draft: ContentItem): ContentInput {
  return {
    module: draft.module,
    slug: draft.slug,
    title: draft.title,
    category: draft.category,
    summary: draft.summary,
    body: draft.body,
    tags: draft.tags,
    status: draft.status,
    author: draft.author,
    role: draft.role,
    coverImage: draft.coverImage,
    repoUrl: draft.repoUrl,
    progress: draft.progress,
    techStack: draft.techStack,
    sortOrder: draft.sortOrder,
    publishedAt: draft.publishedAt,
  };
}

function parseTags(value: string): string[] {
  return value
    .split(/[,，/]/)
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function toDateInputValue(value?: string): string {
  return value ? value.slice(0, 10) : "";
}

interface Feedback {
  type: "success" | "warning" | "error";
  text: string;
}

function StatusBadge({ status }: { status: ContentStatus }) {
  const styles: Record<ContentStatus, string> = {
    draft: "bg-[#eef1f6] text-[#5a6780]",
    published: "bg-emerald-50 text-emerald-700",
    archived: "bg-orange-50 text-orange-600",
  };
  return (
    <span className={cn("inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[11px] font-medium", styles[status])}>
      {STATUS_LABELS[status]}
    </span>
  );
}

interface ContentManagementPageProps {
  moduleKey: ContentModule;
}

export function ContentManagementPage({ moduleKey }: ContentManagementPageProps) {
  const config = MODULE_CONFIG[moduleKey];
  const router = useRouter();
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [mockMode, setMockMode] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ContentStatus | "all">("all");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [draft, setDraft] = useState<ContentItem>(() => createEmptyDraft(moduleKey));
  const [saving, setSaving] = useState(false);
  const [contentTab, setContentTab] = useState<"edit" | "preview">("edit");
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const contentRef = useRef<HTMLTextAreaElement | null>(null);
  const coverInputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLElement | null>(null);
  const feedbackTimerRef = useRef<number | null>(null);

  const showFeedback = useCallback((type: Feedback["type"], text: string) => {
    setFeedback({ type, text });
    if (feedbackTimerRef.current !== null) {
      window.clearTimeout(feedbackTimerRef.current);
    }
    feedbackTimerRef.current = window.setTimeout(() => setFeedback(null), 3500);
  }, []);

  const selectItem = useCallback(
    (item: ContentItem) => {
      setSelectedId(item.id);
      setDraft(cloneItem(item));
      if (!mockMode) {
        void getAdminContentDetail(item.id).then((detail) => {
          if (detail) {
            setDraft((current) => (current.id === item.id ? { ...current, body: detail.body ?? "" } : current));
          }
        });
      }
    },
    [mockMode],
  );

  useEffect(() => {
    let cancelled = false;
    void listAdminContent(moduleKey)
      .then((result) => {
        if (cancelled) return;
        setItems(result.items);
        setMockMode(result.mode === "mock");
        const first = result.items[0];
        if (first) {
          setSelectedId(first.id);
          setDraft(cloneItem(first));
          if (result.mode === "api") {
            void getAdminContentDetail(first.id).then((detail) => {
              if (detail) {
                setDraft((current) =>
                  current.id === first.id ? { ...current, body: detail.body ?? "" } : current,
                );
              }
            });
          }
        } else {
          setSelectedId(null);
          setDraft(createEmptyDraft(moduleKey));
        }
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        showFeedback("error", error instanceof Error ? error.message : "内容加载失败");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [moduleKey, showFeedback]);

  useEffect(() => {
    const handleUnauthorized = () => router.push("/admin/login");
    window.addEventListener("sacc-admin:unauthorized", handleUnauthorized);
    return () => window.removeEventListener("sacc-admin:unauthorized", handleUnauthorized);
  }, [router]);

  useEffect(
    () => () => {
      if (feedbackTimerRef.current !== null) {
        window.clearTimeout(feedbackTimerRef.current);
      }
    },
    [],
  );

  const filteredItems = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return items.filter((item) => {
      if (statusFilter !== "all" && item.status !== statusFilter) return false;
      if (!keyword) return true;
      return [item.title, item.summary, item.author, item.category, item.progress, ...item.tags]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(keyword));
    });
  }, [items, search, statusFilter]);

  const stats = useMemo(() => {
    const published = items.filter((item) => item.status === "published").length;
    const drafts = items.filter((item) => item.status === "draft").length;
    if (moduleKey === "news") {
      return [
        { label: "博客总数", value: items.length },
        { label: "已发布", value: published },
        { label: "草稿", value: drafts },
      ];
    }
    if (moduleKey === "docs") {
      return [
        { label: "文档总数", value: items.length },
        { label: "已发布", value: published },
        { label: "分类数", value: new Set(items.map((item) => item.category).filter(Boolean)).size },
      ];
    }
    return [
      { label: "项目总数", value: items.length },
      { label: "展示中", value: published },
      { label: "有仓库链接", value: items.filter((item) => item.repoUrl).length },
    ];
  }, [items, moduleKey]);

  const handleFieldChange = (key: keyof ContentItem, value: string | string[]) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const insertIntoContent = (text: string) => {
    const textarea = contentRef.current;
    if (!textarea) {
      setDraft((current) => ({ ...current, body: `${current.body ?? ""}\n${text}` }));
      return;
    }
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const current = draft.body ?? "";
    const next = `${current.slice(0, start)}${text}${current.slice(end)}`;
    setDraft((prev) => ({ ...prev, body: next }));
    window.requestAnimationFrame(() => {
      textarea.focus();
      const position = start + text.length;
      textarea.setSelectionRange(position, position);
    });
  };

  const handlePaste = async (event: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const clipboardItems = event.clipboardData?.items;
    if (!clipboardItems) return;
    for (const item of clipboardItems) {
      if (!item.type.startsWith("image/")) continue;
      event.preventDefault();
      const file = item.getAsFile();
      if (!file) continue;
      const result = await uploadAdminImage(file);
      insertIntoContent(`![${result.filename}](${result.url})`);
      if (result.degraded) {
        showFeedback("warning", "上传接口未就绪，图片已本地插入（刷新后失效）");
      }
      break;
    }
  };

  const handleSave = async () => {
    if (!draft.title.trim()) {
      showFeedback("error", "标题不能为空");
      return;
    }
    setSaving(true);
    try {
      const input = buildInput(draft);
      const result = draft.id
        ? await updateAdminContent(draft.id, input)
        : await createAdminContent(input);
      const saved = result.item;
      setItems((prev) => {
        const exists = prev.some((item) => item.id === saved.id);
        const next = exists ? prev.map((item) => (item.id === saved.id ? saved : item)) : [saved, ...prev];
        return sortContentItems(moduleKey, next);
      });
      setSelectedId(saved.id);
      setDraft(cloneItem(saved));
      showFeedback(
        "success",
        result.degraded ? `已保存（接口未就绪，本地生效）：${saved.title}` : `「${saved.title}」已保存`,
      );
    } catch (error) {
      showFeedback("error", error instanceof Error ? error.message : "保存失败，请重试");
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (status: ContentStatus) => {
    const nextDraft = { ...draft, status };
    setDraft(nextDraft);
    if (!draft.id) return;
    setSaving(true);
    try {
      const result = await updateAdminContent(draft.id, buildInput(nextDraft));
      setItems((prev) => sortContentItems(moduleKey, prev.map((item) => (item.id === result.item.id ? result.item : item))));
      setDraft(cloneItem(result.item));
      showFeedback("success", `状态已切换为「${STATUS_LABELS[status]}」`);
    } catch (error) {
      setDraft(draft);
      showFeedback("error", error instanceof Error ? error.message : "状态切换失败");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!draft.id) return;
    const isProject = moduleKey === "projects";
    const confirmed = window.confirm(
      isProject
        ? `确认下线项目「${draft.title}」？下线后官网不再展示，可随时重新上架。`
        : `确认删除「${draft.title}」？此操作不可撤销。`,
    );
    if (!confirmed) return;

    setSaving(true);
    try {
      if (isProject) {
        const result = await updateAdminContent(draft.id, buildInput({ ...draft, status: "archived" }));
        setItems((prev) => sortContentItems(moduleKey, prev.map((item) => (item.id === result.item.id ? result.item : item))));
        setDraft(cloneItem(result.item));
        showFeedback("success", `项目「${draft.title}」已下线`);
      } else {
        const result = await deleteAdminContent(draft.id);
        const remaining = items.filter((item) => item.id !== draft.id);
        setItems(remaining);
        const next = remaining[0];
        setSelectedId(next?.id ?? null);
        setDraft(next ? cloneItem(next) : createEmptyDraft(moduleKey));
        showFeedback(
          "success",
          result.degraded ? `「${draft.title}」已删除（接口未就绪，本地生效）` : `「${draft.title}」已删除`,
        );
      }
    } catch (error) {
      showFeedback("error", error instanceof Error ? error.message : "操作失败，请重试");
    } finally {
      setSaving(false);
    }
  };

  const handleCreateNew = () => {
    setSelectedId(null);
    setDraft(createEmptyDraft(moduleKey));
    setContentTab("edit");
  };

  const handleDragStart = (event: React.DragEvent, index: number) => {
    setDragIndex(index);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", String(index));
  };

  const handleDragOver = (event: React.DragEvent, index: number) => {
    event.preventDefault();
    if (dragIndex === null || dragIndex === index) return;
    const reordered = [...items];
    const [moved] = reordered.splice(dragIndex, 1);
    reordered.splice(index, 0, moved);
    setItems(reordered.map((item, order) => ({ ...item, sortOrder: order })));
    setDragIndex(index);
  };

  const handleDragEnd = async () => {
    if (dragIndex === null) return;
    setDragIndex(null);
    try {
      const result = await reorderAdminContent(
        moduleKey,
        items.map((item) => item.id),
      );
      if (result.degraded) {
        showFeedback("warning", "排序接口未就绪，本次顺序已本地生效（刷新后恢复）");
      }
    } catch (error) {
      showFeedback("error", error instanceof Error ? error.message : "排序保存失败");
    }
  };

  const canDrag =
    !loading &&
    statusFilter === "all" &&
    search.trim() === "" &&
    (moduleKey === "docs" || moduleKey === "projects") &&
    filteredItems.length === items.length;

  const feedbackStyles: Record<Feedback["type"], string> = {
    success: "border-emerald-200 bg-emerald-50 text-emerald-800",
    warning: "border-amber-200 bg-amber-50 text-amber-800",
    error: "border-red-200 bg-red-50 text-red-700",
  };

  return (
    <section className="space-y-5">
      <div>
        <h1 className="text-[22px] font-bold text-[#111827]">{config.title}</h1>
        <p className="mt-1 text-xs text-[#64748b]">{config.subtitle}</p>
      </div>

      {mockMode && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          当前为本地演示模式：后端接口未连接，数据仅保存在内存中，刷新后恢复初始数据。待后端接口就绪后自动切换为真实 API；缺失接口：
          DELETE /api/v1/admin/content/:id、PUT /api/v1/admin/content/reorder。
        </div>
      )}

      {feedback && (
        <div
          className={cn("rounded-lg border px-3 py-2 text-xs font-medium", feedbackStyles[feedback.type])}
          role="status"
          aria-live="polite"
        >
          {feedback.text}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <label className="relative min-w-[260px] flex-1 sm:max-w-[360px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#8a95a8]" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                listRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
              }
            }}
            placeholder={config.searchPlaceholder}
            title="输入关键词后按回车，跳转到结果列表"
            className="h-9 w-full rounded-lg border border-[#e7ecf4] bg-white pl-9 pr-3 text-sm text-[#1d2638] outline-none transition-colors focus:border-[#ff7a00]"
          />
        </label>
        <button
          type="button"
          onClick={handleCreateNew}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#ff7a00] px-4 text-sm font-medium text-white transition-colors hover:bg-[#e96a00]"
        >
          <Plus className="size-4" />
          {config.createLabel}
        </button>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <article className="rounded-xl border border-[#e7ecf4] bg-white p-5">
          <h2 className="text-sm font-bold text-[#132544]">{config.editorTitle}</h2>
          <p className="mt-1 text-xs text-[#64748b]">{config.editorHint}</p>

          <div className="mt-4 space-y-3">
            {moduleKey === "news" && (
              <>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="标题">
                    <input
                      value={draft.title ?? ""}
                      onChange={(event) => handleFieldChange("title", event.target.value)}
                      placeholder="请输入博客标题"
                      className={inputClass}
                    />
                  </Field>
                  <Field label="作者">
                    <input
                      value={draft.author ?? ""}
                      onChange={(event) => handleFieldChange("author", event.target.value)}
                      placeholder="例如：林嘉豪"
                      className={inputClass}
                    />
                  </Field>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <Field label="发布时间">
                    <input
                      type="date"
                      value={toDateInputValue(draft.publishedAt)}
                      onChange={(event) => handleFieldChange("publishedAt", event.target.value)}
                      className={inputClass}
                    />
                  </Field>
                  <Field label="状态">
                    <StatusSelect value={draft.status} disabled={saving} onChange={(status) => void handleStatusChange(status)} />
                  </Field>
                  <Field label="标签">
                    <input
                      value={draft.tags?.join(" / ") ?? ""}
                      onChange={(event) => handleFieldChange("tags", parseTags(event.target.value))}
                      placeholder="Next.js / 性能"
                      className={inputClass}
                    />
                  </Field>
                </div>
                <div>
                  <span className="mb-1.5 block text-xs font-medium text-[#64748b]">封面图</span>
                  <div className="flex items-center gap-2">
                    <input
                      value={draft.coverImage ?? ""}
                      onChange={(event) => handleFieldChange("coverImage", event.target.value)}
                      placeholder="图片 URL，可通过右侧上传获取"
                      className={inputClass}
                    />
                    <button
                      type="button"
                      onClick={() => coverInputRef.current?.click()}
                      className="inline-flex h-9 shrink-0 items-center gap-1 rounded-lg border border-[#e7ecf4] px-3 text-xs font-medium text-[#203158] hover:bg-[#f2f4f7]"
                    >
                      <Upload className="size-3.5" />
                      上传
                    </button>
                    {draft.coverImage && (
                      <img
                        src={draft.coverImage}
                        alt="封面预览"
                        className="size-9 shrink-0 rounded-md border border-[#e7ecf4] object-cover"
                      />
                    )}
                    <input
                      ref={coverInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/gif,image/webp"
                      className="hidden"
                      onChange={async (event) => {
                        const file = event.target.files?.[0];
                        event.target.value = "";
                        if (!file) return;
                        const result = await uploadAdminImage(file);
                        handleFieldChange("coverImage", result.url);
                        if (result.degraded) {
                          showFeedback("warning", "上传接口未就绪，封面图仅本地预览（不持久化）");
                        }
                      }}
                    />
                  </div>
                </div>
              </>
            )}

            {moduleKey === "docs" && (
              <>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="文档标题">
                    <input
                      value={draft.title ?? ""}
                      onChange={(event) => handleFieldChange("title", event.target.value)}
                      placeholder="请输入文档标题"
                      className={inputClass}
                    />
                  </Field>
                  <Field label="分类">
                    <input
                      value={draft.category ?? ""}
                      onChange={(event) => handleFieldChange("category", event.target.value)}
                      placeholder="入门 / 规范 / 组件"
                      className={inputClass}
                    />
                  </Field>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="更新时间">
                    <input
                      type="date"
                      value={toDateInputValue(draft.publishedAt)}
                      onChange={(event) => handleFieldChange("publishedAt", event.target.value)}
                      className={inputClass}
                    />
                  </Field>
                  <Field label="状态">
                    <StatusSelect value={draft.status} disabled={saving} onChange={(status) => void handleStatusChange(status)} />
                  </Field>
                </div>
              </>
            )}

            {moduleKey === "projects" && (
              <>
                <Field label="项目名称">
                  <input
                    value={draft.title ?? ""}
                    onChange={(event) => handleFieldChange("title", event.target.value)}
                    placeholder="请输入项目名称"
                    className={inputClass}
                  />
                </Field>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="仓库链接">
                    <input
                      value={draft.repoUrl ?? ""}
                      onChange={(event) => handleFieldChange("repoUrl", event.target.value)}
                      placeholder="https://github.com/..."
                      className={inputClass}
                    />
                  </Field>
                  <Field label="进度">
                    <input
                      value={draft.progress ?? ""}
                      onChange={(event) => handleFieldChange("progress", event.target.value)}
                      placeholder="例如：60%"
                      className={inputClass}
                    />
                  </Field>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <Field label="展示日期">
                    <input
                      type="date"
                      value={toDateInputValue(draft.publishedAt)}
                      onChange={(event) => handleFieldChange("publishedAt", event.target.value)}
                      className={inputClass}
                    />
                  </Field>
                  <Field label="状态">
                    <StatusSelect value={draft.status} disabled={saving} onChange={(status) => void handleStatusChange(status)} />
                  </Field>
                  <Field label="项目标签">
                    <input
                      value={draft.tags?.join(" / ") ?? ""}
                      onChange={(event) => handleFieldChange("tags", parseTags(event.target.value))}
                      placeholder="AI / 前端"
                      className={inputClass}
                    />
                  </Field>
                </div>
              </>
            )}

            {moduleKey !== "news" && (
              <Field label={moduleKey === "docs" ? "简介" : "项目摘要"}>
                <textarea
                  rows={2}
                  value={draft.summary ?? ""}
                  onChange={(event) => handleFieldChange("summary", event.target.value)}
                  placeholder={moduleKey === "docs" ? "一句话描述文档定位" : "说明项目价值与定位"}
                  className={cn(inputClass, "resize-y")}
                />
              </Field>
            )}

            {moduleKey === "news" && (
              <Field label="摘要">
                <textarea
                  rows={3}
                  value={draft.summary ?? ""}
                  onChange={(event) => handleFieldChange("summary", event.target.value)}
                  placeholder="用于列表卡片的简介"
                  className={cn(inputClass, "resize-y")}
                />
              </Field>
            )}

            <Field label={moduleKey === "projects" ? "项目详情（Markdown）" : "正文（Markdown）"}>
              <div className="mb-2 inline-flex rounded-lg bg-[#eef1f6] p-0.5">
                <button
                  type="button"
                  onClick={() => setContentTab("edit")}
                  className={cn(
                    "rounded-md px-3 py-1 text-xs font-medium transition-colors",
                    contentTab === "edit" ? "bg-white text-[#132544] shadow-sm" : "text-[#64748b]",
                  )}
                >
                  编辑
                </button>
                <button
                  type="button"
                  onClick={() => setContentTab("preview")}
                  className={cn(
                    "rounded-md px-3 py-1 text-xs font-medium transition-colors",
                    contentTab === "preview" ? "bg-white text-[#132544] shadow-sm" : "text-[#64748b]",
                  )}
                >
                  预览
                </button>
              </div>
              {contentTab === "edit" ? (
                <textarea
                  ref={contentRef}
                  rows={moduleKey === "news" ? 8 : 10}
                  value={draft.body ?? ""}
                  onChange={(event) => handleFieldChange("body", event.target.value)}
                  onPaste={(event) => void handlePaste(event)}
                  placeholder="支持 Markdown：使用 # 与 ## 标题组织结构，可直接粘贴截图插入图片"
                  className={cn(inputClass, "resize-y font-mono text-[13px] leading-6")}
                />
              ) : (
                <MarkdownPreview source={draft.body ?? ""} />
              )}
            </Field>
          </div>

          <div className="mt-5 flex items-center gap-3">
            <button
              type="button"
              disabled={saving}
              onClick={() => void handleSave()}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#ff7a00] px-5 text-sm font-medium text-white transition-colors hover:bg-[#e96a00] disabled:opacity-50"
            >
              {config.saveLabel}
            </button>
            {draft.id ? (
              <button
                type="button"
                disabled={saving}
                onClick={() => void handleDelete()}
                className={cn(
                  "inline-flex h-9 items-center gap-1.5 rounded-lg border px-4 text-sm font-medium transition-colors disabled:opacity-50",
                  moduleKey === "projects"
                    ? "border-orange-200 bg-orange-50 text-orange-600 hover:bg-orange-100"
                    : "border-red-200 bg-red-50 text-red-600 hover:bg-red-100",
                )}
              >
                <Trash2 className="size-4" />
                {moduleKey === "projects" ? "下线" : "删除"}
              </button>
            ) : null}
            {saving ? <span className="text-xs text-[#8a95a8]">处理中…</span> : null}
          </div>
        </article>

        <aside className="space-y-5">
          <article className="rounded-xl border border-[#e7ecf4] bg-white p-5">
            <h2 className="text-sm font-bold text-[#132544]">
              {moduleKey === "docs" ? "文档状态统计" : moduleKey === "news" ? "博客发布状态" : "项目状态统计"}
            </h2>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {stats.map((item) => (
                <div key={item.label} className="rounded-lg bg-[#f7faff] px-2 py-3 text-center">
                  <strong className="block text-lg font-bold text-[#203158]">{item.value}</strong>
                  <span className="mt-0.5 block text-[11px] text-[#64748b]">{item.label}</span>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-xl border border-[#e7ecf4] bg-white p-5">
            <h2 className="flex items-center gap-1.5 text-sm font-bold text-[#132544]">
              <ImageIcon className="size-4 text-[#ff7a00]" />
              图床 · 上传图片
            </h2>
            <div className="mt-3">
              <ImageUploader
                onInsert={(url, filename) => insertIntoContent(`![${filename}](${url})`)}
                onNotify={showFeedback}
              />
            </div>
          </article>
        </aside>
      </div>

      <article ref={listRef} className="rounded-xl border border-[#e7ecf4] bg-white p-5 scroll-mt-6">
        <h2 className="text-sm font-bold text-[#132544]">{config.listTitle}</h2>
        <p className="mt-1 text-xs text-[#64748b]">{config.listHint}</p>

        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setStatusFilter(tab.value)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                statusFilter === tab.value
                  ? "bg-[#ff7a00] text-white"
                  : "bg-[#eef1f6] text-[#5a6780] hover:bg-[#e3e8f0]",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="mt-4">
          {loading ? (
            <p className="py-10 text-center text-xs text-[#8a95a8]">加载中…</p>
          ) : filteredItems.length === 0 ? (
            <p className="py-10 text-center text-xs text-[#8a95a8]">
              {search.trim()
                ? `没有找到与「${search.trim()}」相关的内容，换个关键词试试`
                : config.emptyText}
            </p>
          ) : moduleKey === "news" ? (
            <div className="overflow-hidden rounded-lg border border-[#e7ecf4]">
              <div className="grid grid-cols-[minmax(0,1fr)_120px_80px_110px] gap-2 bg-[#f2f4f7] px-3 py-2 text-[11px] font-semibold text-[#5a6780]">
                <span>标题</span>
                <span>作者</span>
                <span>状态</span>
                <span>发布时间</span>
              </div>
              <ul>
                {filteredItems.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => selectItem(item)}
                      className={cn(
                        "grid w-full grid-cols-[minmax(0,1fr)_120px_80px_110px] items-center gap-2 border-t border-[#e7ecf4] px-3 py-2.5 text-left text-xs transition-colors hover:bg-[#f7faff]",
                        selectedId === item.id && "bg-[#fff7ef]",
                      )}
                    >
                      <span className="truncate font-medium text-[#132544]">{item.title}</span>
                      <span className="truncate text-[#64748b]">{item.author || "匿名成员"}</span>
                      <StatusBadge status={item.status} />
                      <span className="text-[#8a95a8]">{formatDisplayDate(item.publishedAt ?? item.updatedAt)}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border border-[#e7ecf4]">
              <div
                className={cn(
                  "grid gap-2 bg-[#f2f4f7] px-3 py-2 text-[11px] font-semibold text-[#5a6780]",
                  moduleKey === "docs"
                    ? "grid-cols-[28px_minmax(0,1fr)_120px_90px_110px]"
                    : "grid-cols-[28px_minmax(0,1fr)_100px_90px_110px]",
                )}
              >
                <span />
                <span>标题</span>
                {moduleKey === "docs" ? <span>分类</span> : <span>进度</span>}
                <span>状态</span>
                <span>更新时间</span>
              </div>
              <ul>
                {filteredItems.map((item, index) => (
                  <li key={item.id}>
                    <div
                      draggable={canDrag}
                      onDragStart={(event) => handleDragStart(event, index)}
                      onDragOver={(event) => handleDragOver(event, index)}
                      onDragEnd={() => void handleDragEnd()}
                      onClick={() => selectItem(item)}
                      className={cn(
                        "grid cursor-pointer items-center gap-2 border-t border-[#e7ecf4] px-3 py-2.5 text-xs transition-colors hover:bg-[#f7faff]",
                        moduleKey === "docs"
                          ? "grid-cols-[28px_minmax(0,1fr)_120px_90px_110px]"
                          : "grid-cols-[28px_minmax(0,1fr)_100px_90px_110px]",
                        selectedId === item.id && "bg-[#fff7ef]",
                        dragIndex === index && "opacity-50",
                        canDrag && "cursor-grab active:cursor-grabbing",
                      )}
                    >
                      <span className="flex items-center gap-1 text-[#8a95a8]">
                        {canDrag ? <GripVertical className="size-4" /> : null}
                        <span className="text-[11px]">{index + 1}</span>
                      </span>
                      <span className="truncate font-medium text-[#132544]">{item.title}</span>
                      <span className="truncate text-[#64748b]">
                        {moduleKey === "docs" ? item.category || "文档" : item.progress || "—"}
                      </span>
                      <StatusBadge status={item.status} />
                      <span className="text-[#8a95a8]">
                        {formatDisplayDate(item.updatedAt || item.publishedAt || "")}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <p className="mt-3 text-[11px] text-[#8a95a8]">
          {config.listFoot} · 共 {filteredItems.length} 条
        </p>
      </article>

      <p className="text-[11px] text-[#8a95a8]">{config.footerHint}</p>
    </section>
  );
}

const inputClass =
  "w-full rounded-lg border border-[#e7ecf4] bg-white px-3 py-2 text-sm text-[#1d2638] outline-none transition-colors focus:border-[#ff7a00]";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-[#64748b]">{label}</span>
      {children}
    </label>
  );
}

function StatusSelect({
  value,
  disabled,
  onChange,
}: {
  value: ContentStatus;
  disabled?: boolean;
  onChange: (status: ContentStatus) => void;
}) {
  return (
    <select
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value as ContentStatus)}
      className={cn(inputClass, "h-9")}
    >
      <option value="draft">草稿</option>
      <option value="published">已发布</option>
      <option value="archived">已下线</option>
    </select>
  );
}
