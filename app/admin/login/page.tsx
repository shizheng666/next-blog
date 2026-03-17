"use client";

import { FormEvent, useState } from "react";
import { useToast } from "@/components/shared/toast-provider";
import { authClient } from "@/services/client/auth.client";
import { Button } from "@/components/ui/button";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { showToast } = useToast();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);

    try {
      await authClient.login({ email, password });
      showToast("登录成功，正在跳转...", "success");
      window.location.assign("/");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "登录失败", "error");
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto max-w-md rounded-2xl border bg-card p-6">
      <h1 className="text-2xl font-bold">后台登录</h1>
      <p className="mt-2 text-sm text-muted-foreground">当前已切换为数据库用户登录，管理员账号需要在用户表中存在且角色为 `ADMIN`。</p>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <div>
          <label className="mb-1 block text-sm">邮箱</label>
          <input
            className="w-full rounded-md border bg-background px-3 py-2"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="admin@example.com"
            type="email"
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-sm">密码</label>
          <input
            className="w-full rounded-md border bg-background px-3 py-2"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="******"
            type="password"
            required
          />
        </div>
        <Button className="w-full" type="submit" disabled={submitting}>
          {submitting ? "登录中..." : "登录"}
        </Button>
      </form>

    </main>
  );
}
