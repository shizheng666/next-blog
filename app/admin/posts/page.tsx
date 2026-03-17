"use client";

import { ChangeEvent, FormEvent, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/shared/toast-provider";
import { postClient } from "@/services/client/post.client";
import { uploadClient } from "@/services/client/upload.client";
import { Button } from "@/components/ui/button";

interface AdminPost {
  id: string;
  title: string;
  slug: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
}

export default function AdminPostsPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<AdminPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const { showToast } = useToast();
  const [form, setForm] = useState({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    category: "",
    status: "DRAFT" as "DRAFT" | "PUBLISHED" | "ARCHIVED",
    tags: ""
  });

  const loadPosts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await postClient.list();
      setPosts(data.list || []);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "加载文章失败", "error");
    }
    setLoading(false);
  }, [showToast]);

  useEffect(() => {
    void loadPosts();
  }, [loadPosts]);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);

    const payload = {
      ...form,
      tags: form.tags
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
    };

    try {
      if (editingId) {
        await postClient.update(editingId, payload);
        showToast("文章更新成功", "success");
      } else {
        await postClient.create(payload);
        showToast("文章创建成功", "success");
      }

      router.refresh();

      setForm({
        title: "",
        slug: "",
        excerpt: "",
        content: "",
        category: "",
        status: "DRAFT",
        tags: ""
      });
      setEditingId(null);
      void loadPosts();
    } catch (error) {
      showToast(error instanceof Error ? error.message : editingId ? "更新失败" : "创建失败", "error");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleEdit(id: string) {
    try {
      const post = await postClient.detail(id);
      setEditingId(post.id);
      setForm({
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt || "",
        content: post.content,
        category: post.category || "",
        status: post.status,
        tags: post.tags.map((tag) => tag.name).join(",")
      });
      showToast("已进入编辑模式，修改后点击保存更新。", "info");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "加载文章详情失败", "error");
    }
  }

  async function handleDelete(id: string) {
    try {
      await postClient.remove(id);
      showToast("文章删除成功", "success");
      void loadPosts();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "删除失败", "error");
    }
  }

  async function handleSyncFromMdx() {
    setSyncing(true);
    try {
      const result = await postClient.sync();
      showToast(`同步完成：总计 ${result.total} 篇，新增 ${result.created} 篇，更新 ${result.updated} 篇`, "success");
      void loadPosts();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "同步失败", "error");
    }
    setSyncing(false);
  }

  async function handleUploadImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setUploadingImage(true);

    try {
      const result = await uploadClient.upload(file);
      const url = String(result.url || "");
      setForm((prev) => ({
        ...prev,
        content: prev.content ? `${prev.content}\n\n![上传图片](${url})\n` : `![上传图片](${url})\n`
      }));
      showToast(`图片上传成功，已插入正文：${url}`, "success");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "图片上传失败", "error");
    }

    setUploadingImage(false);
    event.target.value = "";
  }

  function resetForm() {
    setEditingId(null);
    setForm({
      title: "",
      slug: "",
      excerpt: "",
      content: "",
      category: "",
      status: "DRAFT",
      tags: ""
    });
    showToast("已退出编辑模式", "info");
  }

  return (
    <main aria-busy={loading || syncing || submitting || uploadingImage} className="grid gap-6 lg:grid-cols-2">
      <section className="rounded-xl border bg-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-xl font-semibold">文章管理</h1>
          <Button type="button" variant="outline" onClick={handleSyncFromMdx} disabled={syncing}>
            {syncing ? "同步中..." : "从 content 同步"}
          </Button>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          这是一个起步版后台，可用于创建/编辑/删除文章。编辑模式会自动回填正文与标签。
        </p>

        <form className="mt-5 space-y-3" onSubmit={handleCreate}>
          <div>
            <label className="mb-1 block text-sm font-medium" htmlFor="post-title">
              标题
            </label>
            <input id="post-title" className="w-full rounded-md border bg-background px-3 py-2" placeholder="文章标题" value={form.title} onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))} required />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium" htmlFor="post-slug">
              Slug
            </label>
            <input id="post-slug" className="w-full rounded-md border bg-background px-3 py-2" placeholder="例如：my-first-post" value={form.slug} onChange={(event) => setForm((prev) => ({ ...prev, slug: event.target.value }))} required />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium" htmlFor="post-excerpt">
              摘要
            </label>
            <input id="post-excerpt" className="w-full rounded-md border bg-background px-3 py-2" placeholder="文章摘要" value={form.excerpt} onChange={(event) => setForm((prev) => ({ ...prev, excerpt: event.target.value }))} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium" htmlFor="post-category">
              分类
            </label>
            <input id="post-category" className="w-full rounded-md border bg-background px-3 py-2" placeholder="分类名称" value={form.category} onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium" htmlFor="post-tags">
              标签
            </label>
            <input id="post-tags" className="w-full rounded-md border bg-background px-3 py-2" placeholder="多个标签请用逗号分隔" value={form.tags} onChange={(event) => setForm((prev) => ({ ...prev, tags: event.target.value }))} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium" htmlFor="post-status">
              状态
            </label>
            <select id="post-status" className="w-full rounded-md border bg-background px-3 py-2" value={form.status} onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value as "DRAFT" | "PUBLISHED" | "ARCHIVED" }))}>
              <option value="DRAFT">草稿</option>
              <option value="PUBLISHED">发布</option>
              <option value="ARCHIVED">归档</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium" htmlFor="post-content">
              MDX 正文
            </label>
            <textarea id="post-content" className="min-h-40 w-full rounded-md border bg-background px-3 py-2" placeholder="正文内容" value={form.content} onChange={(event) => setForm((prev) => ({ ...prev, content: event.target.value }))} required />
          </div>
          <div className="rounded-md border border-dashed p-3">
            <label className="mb-1 block text-sm font-medium" htmlFor="post-image-upload">
              图片上传（上传后自动插入正文）
            </label>
            <input id="post-image-upload" type="file" accept="image/*" onChange={handleUploadImage} disabled={uploadingImage} />
            <p className="mt-1 text-xs text-muted-foreground">{uploadingImage ? "图片上传中..." : "支持 jpg/png/webp 等常见图片格式"}</p>
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={submitting || syncing || uploadingImage}>
              {submitting ? "保存中..." : editingId ? "保存更新" : "创建文章"}
            </Button>
            {editingId ? <Button type="button" variant="outline" onClick={resetForm}>取消编辑</Button> : null}
          </div>
        </form>
      </section>

      <section className="rounded-xl border bg-card p-5">
        <h2 className="text-lg font-semibold">文章列表</h2>
        {loading ? <p aria-live="polite" className="mt-3 text-sm">加载中...</p> : null}
        <div className="mt-3 space-y-3">
          {posts.length > 0 ? (
            posts.map((post) => (
              <div key={post.id} className="flex items-center justify-between rounded-md border p-3">
                <div>
                  <p className="font-medium">{post.title}</p>
                  <p className="text-xs text-muted-foreground">/{post.slug} · {post.status}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(post.id)}>编辑</Button>
                  <Button variant="outline" size="sm" onClick={() => handleDelete(post.id)}>删除</Button>
                </div>
              </div>
            ))
          ) : !loading ? (
            <div className="rounded-xl border border-dashed bg-muted/30 p-4 text-sm text-muted-foreground">
              还没有文章，创建后会显示在这里。
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}
