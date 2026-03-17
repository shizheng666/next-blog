"use client";

import { useCallback, useEffect, useState } from "react";
import { useToast } from "@/components/shared/toast-provider";
import { Button } from "@/components/ui/button";
import { userClient, type AdminUserItem } from "@/services/client/user.client";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [keyword, setKeyword] = useState("");
  const [role, setRole] = useState<"" | "ADMIN" | "READER">("");
  const [status, setStatus] = useState<"" | "ACTIVE" | "MUTED" | "DISABLED">("");
  const [loading, setLoading] = useState(false);
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);
  const { showToast } = useToast();
  const currentFilters = {
    keyword: keyword || undefined,
    role: role || undefined,
    status: status || undefined
  };

  const loadUsers = useCallback(async (filters: typeof currentFilters) => {
    setLoading(true);
    try {
      const data = await userClient.list(filters);
      setUsers(data);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "加载用户列表失败", "error");
    }
    setLoading(false);
  }, [showToast]);

  useEffect(() => {
    void loadUsers({
      keyword: undefined,
      role: undefined,
      status: undefined
    });
  }, [loadUsers]);

  async function handleRoleChange(id: string, nextRole: "ADMIN" | "READER") {
    setPendingUserId(id);
    try {
      await userClient.update(id, { role: nextRole });
      showToast(`用户角色已更新为 ${nextRole}`, "success");
      void loadUsers(currentFilters);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "角色更新失败", "error");
    } finally {
      setPendingUserId(null);
    }
  }

  async function handleStatusChange(id: string, nextStatus: "ACTIVE" | "MUTED" | "DISABLED") {
    setPendingUserId(id);
    try {
      await userClient.update(id, { status: nextStatus });
      showToast(`用户状态已更新为 ${nextStatus}`, "success");
      void loadUsers(currentFilters);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "状态更新失败", "error");
    } finally {
      setPendingUserId(null);
    }
  }

  async function handleDelete(id: string) {
    setPendingUserId(id);
    try {
      await userClient.remove(id);
      showToast("用户已禁用并软删除", "success");
      void loadUsers(currentFilters);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "删除用户失败", "error");
    } finally {
      setPendingUserId(null);
    }
  }

  return (
    <main aria-busy={loading || Boolean(pendingUserId)} className="rounded-xl border bg-card p-5">
      <div className="mb-5">
        <h1 className="text-xl font-semibold">用户管理</h1>
        <p className="mt-1 text-sm text-muted-foreground">管理员可以在这里修改用户角色、禁言、禁用或软删除账户。</p>
      </div>

      <form
        className="mb-5 grid gap-3 md:grid-cols-4"
        onSubmit={(event) => {
          event.preventDefault();
          void loadUsers(currentFilters);
        }}
      >
        <div>
          <label className="mb-1 block text-sm font-medium" htmlFor="user-keyword">
            关键词
          </label>
          <input
            id="user-keyword"
            className="w-full rounded-md border bg-background px-3 py-2"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="搜索邮箱或昵称"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium" htmlFor="user-role">
            角色
          </label>
          <select id="user-role" className="w-full rounded-md border bg-background px-3 py-2" value={role} onChange={(event) => setRole(event.target.value as "" | "ADMIN" | "READER")}>
            <option value="">全部角色</option>
            <option value="ADMIN">ADMIN</option>
            <option value="READER">READER</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium" htmlFor="user-status">
            状态
          </label>
          <select id="user-status" className="w-full rounded-md border bg-background px-3 py-2" value={status} onChange={(event) => setStatus(event.target.value as "" | "ACTIVE" | "MUTED" | "DISABLED")}>
            <option value="">全部状态</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="MUTED">MUTED</option>
            <option value="DISABLED">DISABLED</option>
          </select>
        </div>
        <div className="flex items-end">
          <Button type="submit" disabled={loading}>
            筛选用户
          </Button>
        </div>
      </form>

      {loading ? <p aria-live="polite" className="text-sm text-muted-foreground">加载中...</p> : null}

      <div className="space-y-3">
        {users.length > 0 ? (
          users.map((user) => (
            <article key={user.id} className="rounded-xl border p-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-base font-semibold">{user.name || "未命名用户"}</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full border px-2 py-1">角色：{user.role}</span>
                    <span className="rounded-full border px-2 py-1">状态：{user.status}</span>
                    <span className="rounded-full border px-2 py-1">注册：{new Date(user.createdAt).toLocaleDateString()}</span>
                    {user.lastLoginAt ? <span className="rounded-full border px-2 py-1">最近登录：{new Date(user.lastLoginAt).toLocaleDateString()}</span> : null}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {user.role === "READER" ? (
                    <Button type="button" variant="outline" size="sm" onClick={() => handleRoleChange(user.id, "ADMIN")} disabled={pendingUserId === user.id}>
                      设为管理员
                    </Button>
                  ) : (
                    <Button type="button" variant="outline" size="sm" onClick={() => handleRoleChange(user.id, "READER")} disabled={pendingUserId === user.id}>
                      降为普通用户
                    </Button>
                  )}

                  {user.status === "ACTIVE" ? (
                    <Button type="button" variant="outline" size="sm" onClick={() => handleStatusChange(user.id, "MUTED")} disabled={pendingUserId === user.id}>
                      禁言
                    </Button>
                  ) : null}

                  {user.status === "MUTED" ? (
                    <Button type="button" variant="outline" size="sm" onClick={() => handleStatusChange(user.id, "ACTIVE")} disabled={pendingUserId === user.id}>
                      解除禁言
                    </Button>
                  ) : null}

                  {user.status !== "DISABLED" ? (
                    <Button type="button" variant="outline" size="sm" onClick={() => handleStatusChange(user.id, "DISABLED")} disabled={pendingUserId === user.id}>
                      禁用
                    </Button>
                  ) : (
                    <Button type="button" variant="outline" size="sm" onClick={() => handleStatusChange(user.id, "ACTIVE")} disabled={pendingUserId === user.id}>
                      恢复
                    </Button>
                  )}

                  <Button type="button" variant="outline" size="sm" onClick={() => handleDelete(user.id)} disabled={pendingUserId === user.id}>
                    {pendingUserId === user.id ? "处理中..." : "删除账户"}
                  </Button>
                </div>
              </div>
            </article>
          ))
        ) : !loading ? (
          <div className="rounded-xl border border-dashed bg-muted/30 p-4 text-sm text-muted-foreground">
            当前筛选条件下没有用户。
          </div>
        ) : null}
      </div>
    </main>
  );
}
