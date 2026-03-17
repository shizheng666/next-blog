"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useToast } from "@/components/shared/toast-provider";
import { accountClient, type AccountProfile } from "@/services/client/account.client";
import { Button } from "@/components/ui/button";

export default function AccountPage() {
  const [profile, setProfile] = useState<AccountProfile | null>(null);
  const [nickname, setNickname] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { showToast } = useToast();

  const loadProfile = useCallback(async () => {
    setLoading(true);
    try {
      const data = await accountClient.profile();
      setProfile(data);
      setNickname(data.name || "");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "加载账户信息失败", "error");
    }
    setLoading(false);
  }, [showToast]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);

    try {
      const result = await accountClient.updateNickname(nickname);
      setProfile((prev) => (prev ? { ...prev, name: result.name } : prev));
      showToast("昵称更新成功，历史评论昵称也已同步。", "success");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "昵称更新失败", "error");
    }
    setSubmitting(false);
  }

  return (
    <main aria-busy={loading || submitting} className="mx-auto max-w-2xl rounded-2xl border bg-card p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">账户设置</h1>
        <p className="mt-2 text-sm text-muted-foreground">你可以在这里修改昵称。修改后，历史评论中的昵称也会同步更新。</p>
      </div>

      {loading ? (
        <p aria-live="polite" className="text-sm text-muted-foreground">
          加载中...
        </p>
      ) : null}

      {profile ? (
        <div className="space-y-6">
          <div className="grid gap-4 rounded-xl border bg-muted/30 p-4 md:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">邮箱</p>
              <p className="mt-1 text-sm font-medium">{profile.email}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">角色</p>
              <p className="mt-1 text-sm font-medium">{profile.role}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">状态</p>
              <p className="mt-1 text-sm font-medium">{profile.status}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">注册时间</p>
              <p className="mt-1 text-sm font-medium">{new Date(profile.createdAt).toLocaleString()}</p>
            </div>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="mb-2 block text-sm font-medium" htmlFor="account-nickname">
                昵称
              </label>
              <input
                id="account-nickname"
                className="w-full rounded-xl border bg-background px-4 py-3"
                value={nickname}
                onChange={(event) => setNickname(event.target.value)}
                placeholder="请输入新的昵称"
                disabled={submitting}
                autoComplete="nickname"
                required
              />
              <p className="mt-2 text-xs text-muted-foreground">昵称会同步到你已发布的历史评论，建议使用站内长期识别名。</p>
            </div>
            <Button type="submit" disabled={submitting}>
              {submitting ? "保存中..." : "保存昵称"}
            </Button>
          </form>
        </div>
      ) : !loading ? (
        <div className="rounded-xl border border-dashed bg-muted/30 p-4 text-sm text-muted-foreground">
          暂时无法加载账户信息，请稍后重试。
        </div>
      ) : null}
    </main>
  );
}
