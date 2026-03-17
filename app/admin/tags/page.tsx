"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useToast } from "@/components/shared/toast-provider";
import { tagClient, type TagItem } from "@/services/client/tag.client";
import { Button } from "@/components/ui/button";

export default function AdminTagsPage() {
  const [tags, setTags] = useState<TagItem[]>([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { showToast } = useToast();

  const loadTags = useCallback(async () => {
    setLoading(true);
    try {
      const data = await tagClient.list();
      setTags(data);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "加载标签失败", "error");
    }
    setLoading(false);
  }, [showToast]);

  useEffect(() => {
    void loadTags();
  }, [loadTags]);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);

    try {
      await tagClient.create(name);
      showToast("标签创建成功", "success");
      setName("");
      void loadTags();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "标签创建失败", "error");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await tagClient.remove(id);
      showToast("标签删除成功", "success");
      void loadTags();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "标签删除失败", "error");
    }
  }

  return (
    <main aria-busy={loading || submitting} className="mx-auto max-w-2xl rounded-xl border bg-card p-5">
      <h1 className="text-xl font-semibold">标签管理</h1>
      <form className="mt-4 flex gap-2" onSubmit={handleCreate}>
        <label className="sr-only" htmlFor="tag-name">
          新标签名称
        </label>
        <input id="tag-name" className="flex-1 rounded-md border bg-background px-3 py-2" value={name} onChange={(event) => setName(event.target.value)} placeholder="新标签名称" required />
        <Button type="submit" disabled={submitting}>
          {submitting ? "新增中..." : "新增标签"}
        </Button>
      </form>

      <div className="mt-5 space-y-2">
        {loading ? <p aria-live="polite" className="text-sm text-muted-foreground">加载中...</p> : null}
        {tags.length > 0 ? (
          tags.map((tag) => (
            <div key={tag.id} className="flex items-center justify-between rounded-md border p-3">
              <div>
                <p className="font-medium">{tag.name}</p>
                <p className="text-xs text-muted-foreground">slug: {tag.slug}</p>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={() => handleDelete(tag.id)}>
                删除
              </Button>
            </div>
          ))
        ) : !loading ? (
          <div className="rounded-xl border border-dashed bg-muted/30 p-4 text-sm text-muted-foreground">
            暂无标签，新增后会显示在这里。
          </div>
        ) : null}
      </div>
    </main>
  );
}
