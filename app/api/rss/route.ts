import { NextResponse } from "next/server";
import { buildRssXml } from "@/lib/rss";
import { siteConfig } from "@/lib/seo";
import { listPosts } from "@/services/post.service";

export async function GET() {
  const posts = await listPosts({
    page: 1,
    pageSize: 50,
    status: "PUBLISHED"
  });

  const items = posts.list.map((post) => ({
    title: post.title,
    link: `${siteConfig.siteUrl}/blog/${post.slug}`,
    description: post.excerpt || "",
    pubDate: post.publishedAt || undefined
  }));

  const xml = buildRssXml(items);
  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8"
    }
  });
}
