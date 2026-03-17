"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/blog", label: "文章", match: (pathname: string) => pathname.startsWith("/blog") },
  { href: "/tags", label: "标签", match: (pathname: string) => pathname.startsWith("/tags") },
  { href: "/api/rss", label: "RSS", match: () => false, target: "_blank" }
];

export function SiteNavLinks() {
  const pathname = usePathname();

  return navItems.map((item) => {
    const isActive = item.match(pathname);

    return (
      <Link
        key={item.href}
        href={item.href}
        target={item.target}
        rel={item.target === "_blank" ? "noreferrer" : undefined}
        aria-current={isActive ? "page" : undefined}
        className={`rounded-full px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
          isActive ? "bg-primary/10 font-semibold text-primary" : "text-foreground/80 hover:bg-muted"
        }`}
      >
        {item.label}
      </Link>
    );
  });
}
