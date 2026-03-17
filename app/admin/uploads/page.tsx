"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { useToast } from "@/components/shared/toast-provider";
import { uploadClient, type UploadItem } from "@/services/client/upload.client";
import { Button } from "@/components/ui/button";

function formatFileSize(size: number): string {
  if (size < 1024) {
    return `${size} B`;
  }
  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export default function AdminUploadsPage() {
  const [files, setFiles] = useState<UploadItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [pendingFileName, setPendingFileName] = useState<string | null>(null);
  const { showToast } = useToast();

  const loadFiles = useCallback(async () => {
    setLoading(true);
    try {
      const data = await uploadClient.list();
      setFiles(data || []);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "加载素材失败", "error");
    }
    setLoading(false);
  }, [showToast]);

  useEffect(() => {
    void loadFiles();
  }, [loadFiles]);

  async function handleDelete(name: string) {
    setPendingFileName(name);
    try {
      await uploadClient.remove(name);
      showToast("素材删除成功", "success");
      void loadFiles();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "删除素材失败", "error");
    } finally {
      setPendingFileName(null);
    }
  }

  async function handleCopy(url: string, name: string) {
    try {
      await navigator.clipboard.writeText(url);
      showToast(`已复制 ${name} 的链接`, "success");
    } catch {
      showToast("复制链接失败，请检查浏览器权限", "error");
    }
  }

  return (
    <main aria-busy={loading || Boolean(pendingFileName)} className="rounded-xl border bg-card p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">图片素材管理</h1>
          <p className="text-sm text-muted-foreground">用于查看和删除 `public/uploads` 中的图片资源。</p>
        </div>
        <Button type="button" variant="outline" onClick={() => void loadFiles()}>
          刷新列表
        </Button>
      </div>

      {loading ? <p aria-live="polite" className="text-sm">加载中...</p> : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {files.length > 0 ? (
          files.map((file) => (
            <article key={file.name} className="rounded-lg border p-3">
              <div className="relative mb-3 aspect-video overflow-hidden rounded-md bg-muted">
                <Image src={file.url} alt={file.name} fill className="object-cover" unoptimized />
              </div>
              <p className="truncate text-sm font-medium">{file.name}</p>
              <p className="mt-1 text-xs text-muted-foreground">大小：{formatFileSize(file.size)}</p>
              <p className="mt-1 text-xs text-muted-foreground">更新时间：{new Date(file.updatedAt).toLocaleString()}</p>
              <div className="mt-3 flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => void handleCopy(file.url, file.name)}>
                  复制链接
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => handleDelete(file.name)} disabled={pendingFileName === file.name}>
                  {pendingFileName === file.name ? "删除中..." : "删除"}
                </Button>
              </div>
            </article>
          ))
        ) : !loading ? (
          <div className="rounded-xl border border-dashed bg-muted/30 p-4 text-sm text-muted-foreground">
            暂无素材文件。
          </div>
        ) : null}
      </div>
    </main>
  );
}
