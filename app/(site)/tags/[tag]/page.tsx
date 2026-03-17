import type { Metadata } from "next";
import { PostCard } from "@/components/blog/post-card";
import { decodeRouteSegment } from "@/lib/route-segment";
import { buildPageMetadata } from "@/lib/seo";
import { listPosts } from "@/services/post.service";
import { listTags } from "@/services/tag.service";

interface TagDetailPageProps {
  params: Promise<{ tag: string }>;
}

export async function generateMetadata({ params }: TagDetailPageProps): Promise<Metadata> {
  const { tag } = await params;
  const decodedTag = decodeRouteSegment(tag);
  const tags = await listTags();
  const currentTag = tags.find((item) => item.slug === decodedTag);
  const label = currentTag?.name || decodedTag;

  return buildPageMetadata({
    title: `标签：${label}`,
    description: `浏览 Next Blog 中与 ${label} 相关的全部公开文章。`,
    pathname: `/tags/${decodedTag}`,
    keywords: [label, "标签归档"]
  });
}

export default async function TagDetailPage({ params }: TagDetailPageProps) {
  const { tag } = await params;
  const decodedTag = decodeRouteSegment(tag);
  const result = await listPosts({
    page: 1,
    pageSize: 20,
    status: "PUBLISHED",
    tag: decodedTag
  });

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">标签：#{decodedTag}</h1>
      <p className="mb-4 text-sm text-muted-foreground">共收录 {result.total} 篇相关文章。</p>
      {result.list.length > 0 ? (
        <div className="grid gap-4">
          {result.list.map((post) => (
            <PostCard key={post.id} {...post} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed bg-card/60 p-6 text-sm text-muted-foreground">
          这个标签下暂时还没有公开文章。
        </div>
      )}
    </div>
  );
}
