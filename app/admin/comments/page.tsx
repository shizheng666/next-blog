"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useToast } from "@/components/shared/toast-provider";
import { commentClient, type AdminCommentItem } from "@/services/client/comment.client";
import { Button } from "@/components/ui/button";

export default function AdminCommentsPage() {
  const [comments, setComments] = useState<AdminCommentItem[]>([]);
  const [filter, setFilter] = useState<"all" | "approved" | "pending">("pending");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [batchLoading, setBatchLoading] = useState(false);
  const { showToast } = useToast();
  const allSelected = useMemo(() => comments.length > 0 && comments.every((comment) => selectedIds.includes(comment.id)), [comments, selectedIds]);
  const approvedFilter = filter === "all" ? undefined : filter === "approved";

  const loadComments = useCallback(
    async (nextApproved?: boolean) => {
      setLoading(true);
      try {
        const data = await commentClient.list(nextApproved);
        setComments(data);
        setSelectedIds([]);
      } catch (error) {
        showToast(error instanceof Error ? error.message : "加载评论失败", "error");
      }
      setLoading(false);
    },
    [showToast]
  );

  useEffect(() => {
    void loadComments(approvedFilter);
  }, [approvedFilter, loadComments]);

  async function handleApprove(id: string, approved: boolean) {
    try {
      await commentClient.approve(id, approved);
      showToast(approved ? "评论已通过" : "评论已设为未通过", "success");
      void loadComments(approvedFilter);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "审核操作失败", "error");
    }
  }

  function toggleSelect(id: string) {
    setSelectedIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  function toggleSelectAll() {
    setSelectedIds(allSelected ? [] : comments.map((comment) => comment.id));
  }

  async function handleBatchAction(action: "approve" | "reject" | "delete") {
    if (selectedIds.length === 0) {
      showToast("请先选择评论", "error");
      return;
    }

    setBatchLoading(true);
    try {
      const result = await commentClient.batchUpdate({ ids: selectedIds, action });
      showToast(
        action === "approve" ? `已批量通过 ${result.count} 条评论` : action === "reject" ? `已批量驳回 ${result.count} 条评论` : `已批量删除 ${result.count} 条评论`,
        "success"
      );
      void loadComments(approvedFilter);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "批量操作失败", "error");
    }
    setBatchLoading(false);
  }

  async function handleDelete(id: string) {
    try {
      await commentClient.remove(id);
      showToast("评论删除成功", "success");
      void loadComments(approvedFilter);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "删除失败", "error");
    }
  }

  return (
    <main aria-busy={loading || batchLoading} className="rounded-xl border bg-card p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">评论审核</h1>
        <div className="flex gap-2">
          <Button aria-pressed={filter === "pending"} variant={filter === "pending" ? "default" : "outline"} size="sm" onClick={() => setFilter("pending")}>
            待审核
          </Button>
          <Button aria-pressed={filter === "approved"} variant={filter === "approved" ? "default" : "outline"} size="sm" onClick={() => setFilter("approved")}>
            已通过
          </Button>
          <Button aria-pressed={filter === "all"} variant={filter === "all" ? "default" : "outline"} size="sm" onClick={() => setFilter("all")}>
            全部
          </Button>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2 rounded-md border p-3">
        <label className="flex items-center gap-2 text-sm">
          <input aria-label="全选当前评论列表" type="checkbox" checked={allSelected} onChange={toggleSelectAll} />
          全选当前列表
        </label>
        <Button size="sm" variant="outline" onClick={() => handleBatchAction("approve")} disabled={batchLoading || selectedIds.length === 0}>
          批量通过
        </Button>
        <Button size="sm" variant="outline" onClick={() => handleBatchAction("reject")} disabled={batchLoading || selectedIds.length === 0}>
          批量驳回
        </Button>
        <Button size="sm" variant="outline" onClick={() => handleBatchAction("delete")} disabled={batchLoading || selectedIds.length === 0}>
          批量删除
        </Button>
        <span aria-live="polite" className="text-xs text-muted-foreground">
          已选 {selectedIds.length} 条
        </span>
      </div>

      {loading ? (
        <p aria-live="polite" className="text-sm">
          加载中...
        </p>
      ) : null}

      <div className="space-y-3">
        {comments.length > 0 ? (
          comments.map((comment) => (
            <article key={comment.id} className="rounded-md border p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-start gap-3">
                  <input
                    aria-label={`选择评论 ${comment.authorName || "匿名用户"}`}
                    type="checkbox"
                    checked={selectedIds.includes(comment.id)}
                    onChange={() => toggleSelect(comment.id)}
                    className="mt-1"
                  />
                  <div>
                    <p className="text-sm font-medium">{comment.authorName || "匿名用户"}</p>
                    <p className="text-xs text-muted-foreground">{new Date(comment.createdAt).toLocaleString()}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleApprove(comment.id, true)} disabled={loading || batchLoading}>
                    通过
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleApprove(comment.id, false)} disabled={loading || batchLoading}>
                    驳回
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleDelete(comment.id)} disabled={loading || batchLoading}>
                    删除
                  </Button>
                </div>
              </div>

              {comment.post ? (
                <p className="mt-2 text-xs text-muted-foreground">
                  所属文章：
                  <Link className="underline" href={`/blog/${comment.post.slug}`} target="_blank">
                    {comment.post.title}
                  </Link>
                </p>
              ) : null}

              <p className="mt-2 text-sm leading-6">{comment.content}</p>
            </article>
          ))
        ) : !loading ? (
          <div className="rounded-xl border border-dashed bg-muted/30 p-4 text-sm text-muted-foreground">
            当前筛选条件下没有评论。
          </div>
        ) : null}
      </div>
    </main>
  );
}
