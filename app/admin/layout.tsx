"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AdminLogoutButton } from "@/components/admin/admin-logout-button";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  return (
    <main className="space-y-4">
      <section className="rounded-xl border bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold">后台管理中心</h1>
            <p className="text-xs text-muted-foreground">前后端同仓：统一接口、统一类型、统一发布。</p>
          </div>
          <AdminLogoutButton />
        </div>

        <div className="mt-3 flex flex-wrap gap-3 text-sm">
          <Link href="/admin/posts" className="rounded-md border px-3 py-1 hover:bg-muted">
            文章管理
          </Link>
          <Link href="/admin/tags" className="rounded-md border px-3 py-1 hover:bg-muted">
            标签管理
          </Link>
          <Link href="/admin/comments" className="rounded-md border px-3 py-1 hover:bg-muted">
            评论审核
          </Link>
          <Link href="/admin/uploads" className="rounded-md border px-3 py-1 hover:bg-muted">
            素材管理
          </Link>
          <Link href="/admin/users" className="rounded-md border px-3 py-1 hover:bg-muted">
            用户管理
          </Link>
        </div>
      </section>
      {children}
    </main>
  );
}
