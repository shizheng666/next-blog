import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/seo";
import { listPosts } from "@/services/post.service";
import { listTags } from "@/services/tag.service";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [posts, tags] = await Promise.all([
    listPosts({ page: 1, pageSize: 500, status: "PUBLISHED" }),
    listTags()
  ]);

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: siteConfig.siteUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1
    },
    {
      url: `${siteConfig.siteUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9
    },
    {
      url: `${siteConfig.siteUrl}/tags`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7
    }
  ];

  const postPages: MetadataRoute.Sitemap = posts.list.map((post) => ({
    url: `${siteConfig.siteUrl}/blog/${post.slug}`,
    lastModified: new Date(post.updatedAt),
    changeFrequency: "weekly",
    priority: 0.8
  }));

  const tagPages: MetadataRoute.Sitemap = tags.map((tag) => ({
    url: `${siteConfig.siteUrl}/tags/${tag.slug}`,
    lastModified: tag.updatedAt,
    changeFrequency: "weekly",
    priority: 0.6
  }));

  return [...staticPages, ...postPages, ...tagPages];
}
