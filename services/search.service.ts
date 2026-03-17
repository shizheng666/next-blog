import { prisma } from "@/lib/db";

/**
 * 简化版搜索实现：
 * - 当前使用 title/excerpt 的 contains 查询，满足 MVP 需求。
 * - 未来可切换 MySQL FULLTEXT 或外部搜索引擎（Meilisearch/Typesense）。
 */
export async function searchPosts(keyword: string) {
  if (!keyword.trim()) {
    return [];
  }

  return prisma.post.findMany({
    where: {
      status: "PUBLISHED",
      OR: [{ title: { contains: keyword } }, { excerpt: { contains: keyword } }]
    },
    orderBy: {
      publishedAt: "desc"
    },
    take: 20,
    include: {
      tags: {
        include: {
          tag: true
        }
      }
    }
  });
}
