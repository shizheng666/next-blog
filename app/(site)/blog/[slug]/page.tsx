import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import { CommentForm } from "@/components/blog/comment-form";
import { CommentList } from "@/components/blog/comment-list";
import { getCurrentUserProfile } from "@/lib/auth";
import { buildPageMetadata, buildPostJsonLd, siteConfig } from "@/lib/seo";
import { listPostComments } from "@/services/comment.service";
import { getPostBySlug, listPublishedSlugs } from "@/services/post.service";

interface BlogDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const slugs = await listPublishedSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: BlogDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) {
    return { title: "文章不存在" };
  }

  const metadata = buildPageMetadata({
    title: post.title,
    description: post.excerpt || siteConfig.description,
    pathname: `/blog/${post.slug}`,
    keywords: post.tags.map((tag) => tag.name),
    openGraphType: "article"
  });

  return {
    ...metadata,
    openGraph: {
      ...metadata.openGraph,
      type: "article",
      publishedTime: post.publishedAt || undefined,
      modifiedTime: post.updatedAt,
      authors: [siteConfig.author],
      tags: post.tags.map((tag) => tag.name)
    }
  };
}

export default async function BlogDetailPage({ params }: BlogDetailPageProps) {
  const { slug } = await params;
  const [post, currentUser] = await Promise.all([getPostBySlug(slug), getCurrentUserProfile()]);

  if (!post || post.status !== "PUBLISHED") {
    notFound();
  }

  const comments = /^\d+$/.test(post.id)
    ? (await listPostComments(BigInt(post.id))).map((comment) => ({
        id: String(comment.id),
        authorName: comment.authorName,
        content: comment.content,
        createdAt: comment.createdAt.toISOString()
      }))
    : [];

  const jsonLd = buildPostJsonLd({
    title: post.title,
    description: post.excerpt || "",
    publishedAt: post.publishedAt,
    modifiedAt: post.updatedAt,
    slug: post.slug,
    tags: post.tags.map((tag) => tag.name)
  });

  return (
    <article className="rounded-2xl border bg-card p-6">
      <header>
        <h1 className="text-3xl font-bold">{post.title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : "草稿"} · {post.readingTimeText}
        </p>
        {post.tags.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <span key={tag.id} className="rounded-full border px-2 py-1 text-xs text-muted-foreground">
                #{tag.name}
              </span>
            ))}
          </div>
        ) : null}
      </header>

      <div className="prose-content mt-6">
        <MDXRemote source={post.content} />
      </div>

      {/^\d+$/.test(post.id) ? <CommentForm postId={post.id} currentUser={currentUser} /> : null}
      <CommentList comments={comments} />

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </article>
  );
}
