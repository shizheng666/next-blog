"use client";

import Link from "next/link";
import { ApiClientError } from "@/lib/http";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { useToast } from "@/components/shared/toast-provider";
import { authClient } from "@/services/client/auth.client";
import { Button } from "@/components/ui/button";

interface RegisterFormProps {
  from: string;
}

export function RegisterForm({ from }: RegisterFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { showToast } = useToast();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);

    try {
      await authClient.register({ email, password, nickname });
      showToast("注册成功，请登录后继续。", "success");
      router.push(`/login${from ? `?from=${encodeURIComponent(from)}` : ""}`);
    } catch (error) {
      if (error instanceof ApiClientError) {
        if (error.status === 409) {
          showToast("该邮箱已注册，请直接登录。", "error");
        } else {
          showToast(error.message || "注册失败", "error");
        }
      } else {
        showToast(error instanceof Error ? error.message : "注册失败", "error");
      }
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto max-w-md rounded-2xl border bg-card p-6">
      <h1 className="text-2xl font-bold">注册账号</h1>
      <p className="mt-2 text-sm text-muted-foreground">注册后即可使用昵称发表评论，并在后续修改账户设置。</p>
      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <input className="w-full rounded-md border bg-background px-3 py-2" value={nickname} onChange={(event) => setNickname(event.target.value)} placeholder="昵称" required />
        <input className="w-full rounded-md border bg-background px-3 py-2" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="邮箱" type="email" required />
        <input className="w-full rounded-md border bg-background px-3 py-2" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="密码（至少 6 位）" type="password" required />
        <Button className="w-full" type="submit" disabled={submitting}>{submitting ? "注册中..." : "注册"}</Button>
      </form>
      <p className="mt-4 text-sm text-muted-foreground">
        已有账号？
        <Link className="underline" href={`/login${from ? `?from=${encodeURIComponent(from)}` : ""}`}>
          去登录
        </Link>
      </p>
    </main>
  );
}
