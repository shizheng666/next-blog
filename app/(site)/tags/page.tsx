import type { Metadata } from "next";
import Link from "next/link";
import { buildPageMetadata } from "@/lib/seo";
import { listTags } from "@/services/tag.service";

export const metadata: Metadata = buildPageMetadata({
  title: "全部标签",
  description: "按主题浏览 Customer Blog 的全部标签与内容分类。",
  pathname: "/tags",
  keywords: ["博客标签", "内容分类"]
});

export default async function TagsPage() {
  const tags = await listTags();

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">全部标签</h1>
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
        <div className="rounded-2xl border border-dashed bg-card/60 p-6 text-sm text-muted-foreground">
          暂无标签，发布带标签的文章后这里会自动生成。
        </div>
      )}
    </div>
  );
}
