"use client";

import Link from "next/link";
import type { CurrentUser } from "@/lib/current-user";
import { SiteNavLinks } from "@/components/shared/site-nav-links";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { UserMenu } from "@/components/shared/user-menu";
import { useState } from "react";

interface SiteNavProps {
  initialCurrentUser: CurrentUser | null;
}

export function SiteNav({ initialCurrentUser }: SiteNavProps) {
  // 中文说明：登录态由服务端首屏注入，避免导航加载后再额外请求一次当前用户。
  const [currentUser, setCurrentUser] = useState(initialCurrentUser);
  return (
    <div className="flex flex-wrap items-center justify-end gap-3">
      <nav aria-label="主导航" className="flex flex-wrap items-center gap-2">
        <SiteNavLinks />
      </nav>
      {currentUser ? (
        <UserMenu currentUser={currentUser} onLogout={() => setCurrentUser(null)} />
      ) : (
        <Link
          href="/login"
          className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          登录
        </Link>
      )}
      <ThemeToggle />
    </div>
  );
}
