import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { SiteNav } from "@/components/shared/site-nav";
import { ThemeProvider } from "@/components/shared/theme-provider";
import { ToastProvider } from "@/components/shared/toast-provider";
import { getCurrentUserProfile } from "@/lib/auth";
import { buildBaseMetadata } from "@/lib/seo";

export const metadata: Metadata = buildBaseMetadata();

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const currentUser = await getCurrentUserProfile();

  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <ToastProvider>
            <a
              href="#main-content"
              className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-card focus:px-4 focus:py-2 focus:text-sm focus:shadow-lg"
            >
              跳到正文
            </a>
            <div className="mx-auto min-h-screen max-w-5xl px-4 py-6 md:px-6">
              <header className="mb-8 flex items-center justify-between rounded-xl border bg-card/80 p-4 backdrop-blur">
                <div>
                  <Link href="/" className="text-lg font-bold">
                    Next Blog
                  </Link>
                  <p className="text-xs text-muted-foreground">Next.js 15 全栈博客实践</p>
                </div>
                <SiteNav initialCurrentUser={currentUser} />
              </header>
              <div id="main-content">{children}</div>
              <footer className="mt-10 border-t pt-4 text-xs text-muted-foreground">
                一个现代化、SEO 友好、前后端同仓的个人博客系统。
              </footer>
            </div>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
