import type { Metadata } from "next";
import Link from "next/link";
import { PostCard } from "@/components/blog/post-card";
import { buildPageMetadata } from "@/lib/seo";
import { listPosts } from "@/services/post.service";

interface BlogPageProps {
  searchParams: Promise<{ page?: string; keyword?: string }>;
}

export const revalidate = 300;

function buildBlogPageHref(page: number, keyword?: string) {
  const params = new URLSearchParams();
  if (page > 1) {
    params.set("page", String(page));
  }
  if (keyword?.trim()) {
    params.set("keyword", keyword.trim());
  }
  const query = params.toString();
  return query ? `/blog?${query}` : "/blog";
}

export async function generateMetadata({ searchParams }: BlogPageProps): Promise<Metadata> {
  const { keyword } = await searchParams;
  const normalizedKeyword = keyword?.trim();

  return buildPageMetadata({
    title: normalizedKeyword ? `搜索“${normalizedKeyword}”` : "文章列表",
    description: normalizedKeyword
      ? `查看 Customer Blog 中与“${normalizedKeyword}”相关的文章结果。`
      : "浏览 Customer Blog 的全部公开文章、教程与实践记录。",
    pathname: "/blog",
    keywords: normalizedKeyword ? [normalizedKeyword, "博客搜索"] : ["文章列表", "博客归档"],
    noIndex: Boolean(normalizedKeyword)
  });
}

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const { page = "1", keyword } = await searchParams;
  const pageNumber = Number(page) || 1;
  const normalizedKeyword = keyword?.trim();
  const result = await listPosts({
    page: pageNumber,
    pageSize: 10,
    status: "PUBLISHED",
    keyword: normalizedKeyword
  });
  const totalPages = Math.max(1, Math.ceil(result.total / result.pageSize));

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">文章列表</h1>
      <form className="mb-5 flex flex-col gap-2 sm:flex-row" action="/blog" method="get" role="search">
        <label className="sr-only" htmlFor="blog-search">
          搜索文章标题或摘要
        </label>
        <input
          id="blog-search"
          className="flex-1 rounded-md border bg-background px-3 py-2"
          defaultValue={normalizedKeyword}
          name="keyword"
          placeholder="搜索标题或摘要"
          type="search"
        />
        <button className="rounded-md border px-4 py-2 hover:bg-muted" type="submit">
          搜索
        </button>
      </form>
      <p className="mb-4 text-sm text-muted-foreground">
        {normalizedKeyword ? `关键词“${normalizedKeyword}”共找到 ${result.total} 篇文章。` : `共 ${result.total} 篇公开文章。`}
      </p>
      {result.list.length > 0 ? (
        <div className="grid gap-4">
          {result.list.map((post) => (
            <PostCard key={post.id} {...post} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed bg-card/60 p-6 text-sm text-muted-foreground">
          没有找到匹配的文章，试试更短的关键词，或者直接浏览全部内容。
        </div>
      )}
      {totalPages > 1 ? (
        <nav aria-label="文章分页" className="mt-6 flex items-center justify-between gap-3">
          <Link
            href={buildBlogPageHref(pageNumber - 1, normalizedKeyword)}
            aria-disabled={pageNumber <= 1}
            className={`rounded-full border px-4 py-2 text-sm transition-colors ${
              pageNumber <= 1 ? "pointer-events-none opacity-40" : "hover:bg-muted"
            }`}
          >
            上一页
          </Link>
          <p className="text-sm text-muted-foreground">
            第 {pageNumber} / {totalPages} 页
          </p>
          <Link
            href={buildBlogPageHref(pageNumber + 1, normalizedKeyword)}
            aria-disabled={pageNumber >= totalPages}
            className={`rounded-full border px-4 py-2 text-sm transition-colors ${
              pageNumber >= totalPages ? "pointer-events-none opacity-40" : "hover:bg-muted"
            }`}
          >
            下一页
          </Link>
        </nav>
      ) : null}
    </div>
  );
}
