"use client";

import { ApiClientError } from "@/lib/http";
import type { CurrentUser } from "@/lib/current-user";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { useAuthDialog } from "@/hooks/use-auth-dialog";
import { useToast } from "@/components/shared/toast-provider";
import { commentClient } from "@/services/client/comment.client";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Button } from "@/components/ui/button";

interface CommentFormProps {
  postId: string;
  currentUser: CurrentUser | null;
}

export function CommentForm({ postId, currentUser }: CommentFormProps) {
  const router = useRouter();
  const [authorEmail, setAuthorEmail] = useState(currentUser?.email || "");
  const [content, setContent] = useState("");
  const { authDialog, showAuthDialog, closeAuthDialog, goToLogin } = useAuthDialog();
  const { showToast } = useToast();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!currentUser) {
      showAuthDialog({
        title: "登录后即可发表评论",
        description: "当前评论功能需要登录身份才能提交。你可以继续留在当前页面，或前往登录/注册后再回来发表评论。"
      });
      return;
    }

    try {
      await commentClient.create({
        postId,
        authorName: currentUser?.name || undefined,
        authorEmail: authorEmail.trim() || undefined,
        content
      });
      showToast("评论已提交，等待管理员审核。", "success");
      setAuthorEmail(currentUser?.email || "");
      setContent("");
      router.refresh();
    } catch (error) {
      if (error instanceof ApiClientError && error.status === 401) {
        showAuthDialog({
          title: "登录后即可发表评论",
          description: "当前评论功能需要登录身份才能提交。你可以继续留在当前页面，或前往登录/注册后再回来发表评论。"
        });
        return;
      }
      showToast(error instanceof Error ? error.message : "提交失败", "error");
    }
  }

  return (
    <>
      <form className="mt-8 space-y-3 rounded-xl border p-4" onSubmit={handleSubmit}>
        <h3 className="text-lg font-semibold">发表评论</h3>
        <div>
          <label className="mb-1 block text-sm font-medium" htmlFor="comment-nickname">
            评论昵称
          </label>
          <input
            id="comment-nickname"
            className="w-full rounded-md border bg-muted px-3 py-2 text-muted-foreground"
            value={currentUser?.name || "请先登录后再发表评论"}
            readOnly
            disabled
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium" htmlFor="comment-email">
            邮箱
          </label>
          <input
            id="comment-email"
            className="w-full rounded-md border bg-background px-3 py-2"
            placeholder="邮箱（自动采用当前登录邮箱）"
            type="email"
            value={authorEmail}
            onChange={(event) => setAuthorEmail(event.target.value)}
            readOnly={Boolean(currentUser?.email)}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium" htmlFor="comment-content">
            评论内容
          </label>
          <textarea
            id="comment-content"
            className="min-h-24 w-full rounded-md border bg-background px-3 py-2"
            placeholder="输入你的评论"
            value={content}
            onChange={(event) => setContent(event.target.value)}
            required
          />
        </div>
        <Button type="submit">提交评论</Button>
      </form>

      <ConfirmDialog
        open={authDialog.open}
        title={authDialog.title}
        description={authDialog.description}
        confirmText="前往登录"
        cancelText="留在当前页"
        onConfirm={goToLogin}
        onCancel={closeAuthDialog}
      />
    </>
  );
}
