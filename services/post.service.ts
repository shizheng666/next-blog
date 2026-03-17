import fs from "node:fs/promises";
import type { PostStatus } from "@prisma/client";
import { cache } from "react";
import { prisma } from "@/lib/db";
import { buildPostContentPath, listLocalMdxPosts, readMdxPost, removeMdxPost, writeMdxPost } from "@/lib/mdx";
import { isPrismaUnavailableError } from "@/lib/prisma-errors";
import { upsertTags } from "@/services/tag.service";

export interface ListPostInput {
  page: number;
  pageSize: number;
  tag?: string;
  category?: string;
  keyword?: string;
  status?: "DRAFT" | "PUBLISHED" | "ARCHIVED";
}

export interface UpsertPostInput {
  title: string;
  slug: string;
  excerpt?: string | null;
  content: string;
  coverImage?: string | null;
  category?: string | null;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  tags: string[];
}

function serializePost(post: {
  id: bigint;
  slug: string;
  title: string;
  excerpt: string | null;
  coverImage: string | null;
  category: string | null;
  status: PostStatus;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  tags: { tag: { id: bigint; name: string; slug: string } }[];
}) {
  return {
    id: String(post.id),
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt,
    coverImage: post.coverImage,
    category: post.category,
    status: post.status,
    publishedAt: post.publishedAt?.toISOString() || null,
    createdAt: post.createdAt.toISOString(),
    updatedAt: post.updatedAt.toISOString(),
    tags: post.tags.map((item) => ({
      id: String(item.tag.id),
      name: item.tag.name,
      slug: item.tag.slug
    }))
  };
}

function matchesKeyword(value: string | null | undefined, keyword?: string): boolean {
  if (!keyword?.trim()) {
    return true;
  }
  return String(value || "").toLowerCase().includes(keyword.trim().toLowerCase());
}

async function contentPathExists(contentPath: string): Promise<boolean> {
  try {
    await fs.access(contentPath);
    return true;
  } catch {
    return false;
  }
}

async function listPostsFromLocalContent(input: ListPostInput) {
  const localPosts = await listLocalMdxPosts();
  const filtered = localPosts
    .filter((item) => (input.status ? (input.status === "PUBLISHED" ? !item.draft : item.draft) : true))
    .filter((item) => (input.category ? item.category === input.category : true))
    .filter((item) => (input.tag ? item.tags.map((tag) => tag.toLowerCase()).includes(input.tag.toLowerCase()) : true))
    .filter((item) => matchesKeyword(item.title, input.keyword) || matchesKeyword(item.excerpt, input.keyword));

  const start = (input.page - 1) * input.pageSize;
  const pageItems = filtered.slice(start, start + input.pageSize);

  return {
    total: filtered.length,
    page: input.page,
    pageSize: input.pageSize,
    list: pageItems.map((item) => ({
      id: `local-${item.slug}`,
      slug: item.slug,
      title: item.title,
      excerpt: item.excerpt,
      coverImage: null,
      category: item.category,
      status: item.draft ? "DRAFT" : "PUBLISHED",
      publishedAt: new Date(item.date).toISOString(),
      createdAt: new Date(item.date).toISOString(),
      updatedAt: new Date(item.date).toISOString(),
      tags: item.tags.map((tag) => ({
        id: `local-${tag}`,
        name: tag,
        slug: tag.toLowerCase().replace(/\s+/g, "-")
      }))
    }))
  };
}

/**
 * 文章列表查询。
 * - 对外支持分页、标签、分类、关键字、状态过滤。
 * - 为避免后续前端重复转换，这里统一做 BigInt/Date 序列化。
 */
export async function listPosts(input: ListPostInput) {
  const where = {
    status: input.status,
    category: input.category,
    ...(input.keyword
      ? {
          OR: [{ title: { contains: input.keyword } }, { excerpt: { contains: input.keyword } }]
        }
      : {}),
    ...(input.tag
      ? {
          tags: {
            some: {
              tag: {
                slug: input.tag
              }
            }
          }
        }
      : {})
  };

  try {
    const [total, posts] = await Promise.all([
      prisma.post.count({ where }),
      prisma.post.findMany({
        where,
        include: {
          tags: {
            include: {
              tag: true
            }
          }
        },
        orderBy: {
          publishedAt: "desc"
        },
        skip: (input.page - 1) * input.pageSize,
        take: input.pageSize
      })
    ]);

    const serialized = posts.map((post) => serializePost(post));
    if (serialized.length === 0) {
      return listPostsFromLocalContent(input);
    }

    return {
      total,
      page: input.page,
      pageSize: input.pageSize,
      list: serialized
    };
  } catch (error) {
    // 中文说明：数据库不可用时回退到本地 MDX，保证公开页面和构建仍可继续。
    if (isPrismaUnavailableError(error)) {
      return listPostsFromLocalContent(input);
    }
    throw error;
  }
}

export const getPostBySlug = cache(async (slug: string) => {
  let post;
  try {
    post = await prisma.post.findUnique({
      where: { slug },
      include: {
        tags: {
          include: {
            tag: true
          }
        }
      }
    });
  } catch (error) {
    if (isPrismaUnavailableError(error)) {
      post = null;
    } else {
      throw error;
    }
  }

  if (!post) {
    const localPath = buildPostContentPath(slug);
    try {
      const parsed = await readMdxPost(localPath);
      const frontmatter = parsed.frontmatter;
      return {
        id: `local-${slug}`,
        slug,
        title: String(frontmatter.title || slug),
        excerpt: frontmatter.excerpt ? String(frontmatter.excerpt) : null,
        coverImage: null,
        category: frontmatter.category ? String(frontmatter.category) : null,
        status: frontmatter.draft ? "DRAFT" : "PUBLISHED",
        publishedAt: frontmatter.date ? new Date(String(frontmatter.date)).toISOString() : null,
        createdAt: frontmatter.date ? new Date(String(frontmatter.date)).toISOString() : new Date().toISOString(),
        updatedAt: frontmatter.date ? new Date(String(frontmatter.date)).toISOString() : new Date().toISOString(),
        tags: Array.isArray(frontmatter.tags)
          ? frontmatter.tags.map((tag) => {
              const name = String(tag);
              return {
                id: `local-${name}`,
                name,
                slug: name.toLowerCase().replace(/\s+/g, "-")
              };
            })
          : [],
        content: parsed.content,
        frontmatter: parsed.frontmatter,
        readingTimeText: parsed.readingTimeText
      };
    } catch {
      return null;
    }
  }

  if (!(await contentPathExists(post.contentPath))) {
    return null;
  }

  const parsed = await readMdxPost(post.contentPath);
  return {
    ...serializePost(post),
    content: parsed.content,
    frontmatter: parsed.frontmatter,
    readingTimeText: parsed.readingTimeText
  };
});

export async function getPostByIdOrSlug(idOrSlug: string) {
  const isId = /^\d+$/.test(idOrSlug);
  if (isId) {
    const post = await prisma.post.findUnique({
      where: { id: BigInt(idOrSlug) },
      include: {
        tags: {
          include: {
            tag: true
          }
        }
      }
    });

    if (!post) {
      return null;
    }

    const parsed = await readMdxPost(post.contentPath);
    return {
      ...serializePost(post),
      content: parsed.content,
      frontmatter: parsed.frontmatter,
      readingTimeText: parsed.readingTimeText
    };
  }

  return getPostBySlug(idOrSlug);
}

/**
 * 创建文章：
 * 1) 先写入 MDX 文件（保证内容源存在）
 * 2) 再写 DB 元数据与标签关系
 */
export async function createPost(input: UpsertPostInput, authorId: bigint) {
  const tags = await upsertTags(input.tags);
  const contentPath = await writeMdxPost(
    input.slug,
    {
      title: input.title,
      excerpt: input.excerpt,
      tags: input.tags,
      category: input.category,
      date: new Date().toISOString()
    },
    input.content
  );

  const post = await prisma.post.create({
    data: {
      slug: input.slug,
      title: input.title,
      excerpt: input.excerpt,
      contentPath,
      coverImage: input.coverImage,
      category: input.category,
      status: input.status,
      publishedAt: input.status === "PUBLISHED" ? new Date() : null,
      authorId,
      tags: {
        create: tags.map((tag) => ({
          tagId: tag.id
        }))
      }
    },
    include: {
      tags: {
        include: {
          tag: true
        }
      }
    }
  });

  return serializePost(post);
}

export async function updatePost(id: bigint, input: UpsertPostInput) {
  const current = await prisma.post.findUnique({ where: { id } });
  if (!current) {
    throw new Error("文章不存在，无法更新。");
  }

  const tags = await upsertTags(input.tags);
  const contentPath = current.contentPath || buildPostContentPath(input.slug);

  await writeMdxPost(
    input.slug,
    {
      title: input.title,
      excerpt: input.excerpt,
      tags: input.tags,
      category: input.category,
      date: current.publishedAt?.toISOString() || new Date().toISOString()
    },
    input.content
  );

  const post = await prisma.post.update({
    where: { id },
    data: {
      slug: input.slug,
      title: input.title,
      excerpt: input.excerpt,
      contentPath,
      coverImage: input.coverImage,
      category: input.category,
      status: input.status,
      publishedAt: input.status === "PUBLISHED" ? current.publishedAt || new Date() : null,
      tags: {
        deleteMany: {},
        create: tags.map((tag) => ({
          tagId: tag.id
        }))
      }
    },
    include: {
      tags: {
        include: {
          tag: true
        }
      }
    }
  });

  return serializePost(post);
}

export async function deletePost(id: bigint) {
  const post = await prisma.post.findUnique({ where: { id } });
  if (!post) {
    throw new Error("文章不存在，无法删除。");
  }

  await prisma.post.delete({ where: { id } });
  await removeMdxPost(post.contentPath);

  return { id: String(id) };
}

export const listPublishedSlugs = cache(async () => {
  try {
    const list = await prisma.post.findMany({
      where: { status: "PUBLISHED" },
      select: { slug: true, contentPath: true }
    });
    const existing = await Promise.all(
      list.map(async (item) => ((await contentPathExists(item.contentPath)) ? item.slug : null))
    );
    const fromDb = existing.filter((item): item is string => Boolean(item));
    if (fromDb.length > 0) {
      return fromDb;
    }

    const localPosts = await listLocalMdxPosts();
    return localPosts.filter((item) => !item.draft).map((item) => item.slug);
  } catch (error) {
    if (isPrismaUnavailableError(error)) {
      const localPosts = await listLocalMdxPosts();
      return localPosts.filter((item) => !item.draft).map((item) => item.slug);
    }
    throw error;
  }
});

/**
 * 将 content/posts 下的 MDX 文件同步到数据库。
 * - 适用于你当前“纯文件内容模式”的初始化导入。
 * - 已存在 slug 会更新，不存在则创建。
 */
export async function syncLocalMdxPostsToDatabase(authorId: bigint) {
  const localPosts = await listLocalMdxPosts();
  let created = 0;
  let updated = 0;
  const changedSlugs = new Set<string>();
  const changedTags = new Set<string>();

  for (const localPost of localPosts) {
    const contentPath = buildPostContentPath(localPost.slug);
    const parsed = await readMdxPost(contentPath);
    const tags = await upsertTags(localPost.tags);
    localPost.tags.forEach((tag) => changedTags.add(tag.toLowerCase().replace(/\s+/g, "-")));
    const status: PostStatus = localPost.draft ? "DRAFT" : "PUBLISHED";
    const publishedAt = status === "PUBLISHED" ? new Date(localPost.date) : null;

    const existing = await prisma.post.findUnique({
      where: { slug: localPost.slug },
      select: { id: true }
    });

    if (existing) {
      await prisma.post.update({
        where: { id: existing.id },
        data: {
          title: localPost.title,
          excerpt: localPost.excerpt,
          category: localPost.category,
          status,
          publishedAt,
          contentPath,
          tags: {
            deleteMany: {},
            create: tags.map((tag) => ({ tagId: tag.id }))
          }
        }
      });
      updated += 1;
      changedSlugs.add(localPost.slug);
      continue;
    }

    await prisma.post.create({
      data: {
        slug: localPost.slug,
        title: localPost.title,
        excerpt: localPost.excerpt,
        category: localPost.category,
        status,
        publishedAt,
        contentPath,
        authorId,
        tags: {
          create: tags.map((tag) => ({ tagId: tag.id }))
        }
      }
    });
    created += 1;
    changedSlugs.add(localPost.slug);

    // 中文说明：如果 frontmatter 为空，补一份基础信息，避免后续编辑器读取不一致。
    if (!parsed.frontmatter || Object.keys(parsed.frontmatter).length === 0) {
      await writeMdxPost(
        localPost.slug,
        {
          title: localPost.title,
          excerpt: localPost.excerpt,
          tags: localPost.tags,
          category: localPost.category,
          date: localPost.date,
          draft: localPost.draft
        },
        parsed.content
      );
    }
  }

  return {
    total: localPosts.length,
    created,
    updated,
    changedSlugs: Array.from(changedSlugs),
    changedTags: Array.from(changedTags)
  };
}
