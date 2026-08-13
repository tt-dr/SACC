"use client";

import { useRef, useState } from "react";
import { Check, Copy, Image as ImageIcon, Trash2, Upload } from "lucide-react";

import { uploadAdminImage } from "@/lib/content-api";

interface UploadedImage {
  id: string;
  name: string;
  url: string;
}

interface ImageUploaderProps {
  onInsert: (url: string, filename: string) => void;
  onNotify: (type: "success" | "warning" | "error", text: string) => void;
}

let imageIdCounter = 0;

function nextImageId(): string {
  imageIdCounter += 1;
  return `img-${Date.now()}-${imageIdCounter}`;
}

export function ImageUploader({ onInsert, onNotify }: ImageUploaderProps) {
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const addFiles = async (files: ArrayLike<File> | FileList) => {
    const candidates = Array.from(files).filter((file) => file.type.startsWith("image/"));
    if (candidates.length === 0) {
      onNotify("error", "仅支持图片文件（jpg / png / gif / webp）");
      return;
    }
    setUploading(true);
    for (const file of candidates) {
      if (file.size > 10 * 1024 * 1024) {
        onNotify("error", `${file.name} 超过 10MB，已跳过`);
        continue;
      }
      const result = await uploadAdminImage(file);
      if (result.degraded) {
        onNotify("warning", "上传接口未就绪，图片仅本地预览，不持久化");
      }
      setImages((prev) => [
        { id: nextImageId(), name: result.filename, url: result.url },
        ...prev,
      ]);
    }
    setUploading(false);
  };

  const copyMarkdown = async (image: UploadedImage) => {
    const markdown = `![${image.name}](${image.url})`;
    try {
      await navigator.clipboard.writeText(markdown);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = markdown;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
    setCopiedId(image.id);
    window.setTimeout(() => setCopiedId(null), 1500);
  };

  return (
    <div className="space-y-3">
      <div
        className="flex cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-[#d5deeb] bg-[#f7faff] px-4 py-6 text-center transition-colors hover:border-[#ff7a00] hover:bg-[#fff7ef]"
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          void addFiles(event.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
      >
        <Upload className="mb-1 size-5 text-[#ff7a00]" />
        <span className="text-xs font-medium text-[#203158]">拖拽图片到此处 / 点击上传</span>
        <span className="text-[11px] text-[#8a95a8]">支持粘贴截图到正文编辑区 · 单文件 ≤ 10MB</span>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        multiple
        className="hidden"
        onChange={(event) => {
          if (event.target.files) {
            void addFiles(event.target.files);
          }
          event.target.value = "";
        }}
      />
      {uploading && <p className="text-xs text-[#8a95a8]">上传中…</p>}
      {images.length > 0 && (
        <ul className="space-y-2">
          {images.map((image) => (
            <li key={image.id} className="flex items-center gap-2 rounded-lg border border-[#e7ecf4] p-2">
              <img src={image.url} alt={image.name} className="size-9 shrink-0 rounded-md object-cover" />
              <span className="min-w-0 flex-1 truncate text-xs text-[#203158]">{image.name}</span>
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-[#ff6a00] hover:bg-[#fff7ef]"
                onClick={() => {
                  onInsert(image.url, image.name);
                }}
                title="插入到正文末尾"
              >
                <ImageIcon className="size-3.5" />
                插入
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-[#203158] hover:bg-[#f2f4f7]"
                onClick={() => void copyMarkdown(image)}
                title="复制 Markdown 链接"
              >
                {copiedId === image.id ? <Check className="size-3.5 text-green-600" /> : <Copy className="size-3.5" />}
                {copiedId === image.id ? "已复制" : "复制"}
              </button>
              <button
                type="button"
                className="inline-flex items-center rounded-md p-1.5 text-[#b42318] hover:bg-[#fef3f2]"
                onClick={() => setImages((prev) => prev.filter((item) => item.id !== image.id))}
                title="移除"
              >
                <Trash2 className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
