import type { Metadata } from "next";
import Link from "next/link";
import { PostCard } from "@/components/blog/post-card";
import { buildPageMetadata } from "@/lib/seo";
import { listPosts } from "@/services/post.service";
import { listTags } from "@/services/tag.service";

export const revalidate = 300;
export const metadata: Metadata = buildPageMetadata({
  title: "首页",
  description: "浏览最新文章、热门标签，以及 Customer Blog 的完整内容入口。",
  pathname: "/",
  keywords: ["博客首页", "最新文章", "标签导航"]
});

export default async function HomePage() {
  const [posts, tags] = await Promise.all([
    listPosts({ page: 1, pageSize: 6, status: "PUBLISHED" }),
    listTags()
  ]);

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border bg-card p-6">
        <h1 className="text-3xl font-bold">现代化个人博客系统</h1>
        <p className="mt-3 text-muted-foreground">
          这个项目采用 Next.js App Router 一体化架构，前后端同仓开发，兼顾 SEO、性能与可维护性。
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/blog"
            className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            开始阅读
          </Link>
          <Link
            href="/tags"
            className="rounded-full border px-4 py-2 text-sm font-semibold transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            浏览标签
          </Link>
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">最新文章</h2>
          <Link href="/blog" className="text-sm hover:underline">
            查看全部
          </Link>
        </div>
        {posts.list.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {posts.list.map((post) => (
              <PostCard key={post.id} {...post} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed bg-card/60 p-6 text-sm text-muted-foreground">
            还没有公开文章，发布第一篇内容后这里会自动更新。
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-xl font-semibold">标签云</h2>
        {tags.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <Link
                key={String(tag.id)}
                href={`/tags/${tag.slug}`}
                className="rounded-full border px-3 py-1 text-sm transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                #{tag.name}
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">暂无标签，新增文章并设置标签后会显示在这里。</p>
        )}
      </section>
    </div>
  );
}
