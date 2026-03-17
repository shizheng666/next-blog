"use client";

import Link from "next/link";
import { ApiClientError } from "@/lib/http";
import { FormEvent, useState } from "react";
import { useToast } from "@/components/shared/toast-provider";
import { authClient } from "@/services/client/auth.client";
import { Button } from "@/components/ui/button";

interface LoginFormProps {
  from: string;
}

export function LoginForm({ from }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { showToast } = useToast();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);

    try {
      await authClient.login({ email, password });
      window.location.assign(from || "/");
    } catch (error) {
      if (error instanceof ApiClientError) {
        if (error.code === 40401) {
          showToast("账户不存在，请先注册。", "error");
        } else if (error.code === 40101) {
          showToast("密码错误，请检查后重试。", "error");
        } else if (error.code === 40301 || error.status === 403) {
          showToast("当前账号已被禁用，请联系管理员。", "error");
        } else {
          showToast(error.message || "登录失败", "error");
        }
      } else {
        showToast(error instanceof Error ? error.message : "登录失败", "error");
      }
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto max-w-md rounded-2xl border bg-card p-6">
      <h1 className="text-2xl font-bold">用户登录</h1>
      <p className="mt-2 text-sm text-muted-foreground">浏览文章不需要登录，但发表评论和账户设置需要登录。</p>
      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <input className="w-full rounded-md border bg-background px-3 py-2" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="邮箱" type="email" required />
        <input className="w-full rounded-md border bg-background px-3 py-2" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="密码" type="password" required />
        <Button className="w-full" type="submit" disabled={submitting}>{submitting ? "登录中..." : "登录"}</Button>
      </form>
      <p className="mt-4 text-sm text-muted-foreground">
        还没有账号？
        <Link className="underline" href={`/register${from ? `?from=${encodeURIComponent(from)}` : ""}`}>
          立即注册
        </Link>
      </p>
    </main>
  );
}
