"use client";

import Link from "next/link";
import { ChevronDown, LogOut, Settings, Shield } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { CurrentUser } from "@/lib/current-user";
import { authClient } from "@/services/client/auth.client";

interface UserMenuProps {
  currentUser: CurrentUser;
  onLogout: () => void;
}

export function UserMenu({ currentUser, onLogout }: UserMenuProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const menuId = useId();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await authClient.logout();
      setOpen(false);
      onLogout();
      router.push("/");
      router.refresh();
    } finally {
      setLoggingOut(false);
    }
  }

  const isAdmin = currentUser.role === "ADMIN";

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-controls={menuId}
        aria-haspopup="menu"
        className="group inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1.5 text-sm font-semibold text-primary shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:bg-primary/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      >
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
          {(currentUser.name || currentUser.email).slice(0, 1).toUpperCase()}
        </span>
        <span className="max-w-28 truncate">{currentUser.name || currentUser.email}</span>
        <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open ? (
        <div
          id={menuId}
          role="menu"
          className="absolute right-0 top-[calc(100%+10px)] z-50 w-56 overflow-hidden rounded-2xl border bg-card/95 p-2 shadow-2xl backdrop-blur"
        >
          <div className="rounded-xl bg-muted/50 px-3 py-2">
            <p className="truncate text-sm font-semibold">{currentUser.name || "未命名用户"}</p>
            <p className="truncate text-xs text-muted-foreground">{currentUser.email}</p>
          </div>

          <div className="mt-2 space-y-1">
            <Link
              href="/account"
              className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              onClick={() => setOpen(false)}
            >
              <Settings className="h-4 w-4" />
              账户设置
            </Link>

            {isAdmin ? (
              <Link
                href="/admin/posts"
                className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                onClick={() => setOpen(false)}
              >
                <Shield className="h-4 w-4" />
                管理后台
              </Link>
            ) : null}

            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-red-500 transition-colors hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:hover:bg-red-950/30"
            >
              <LogOut className="h-4 w-4" />
              {loggingOut ? "退出中..." : "退出登录"}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
