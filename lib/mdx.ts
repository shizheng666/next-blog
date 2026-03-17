import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import readingTime from "reading-time";
import { cache } from "react";

const contentRoot = path.join(process.cwd(), "content", "posts");

export interface ParsedMdxPost {
  content: string;
  frontmatter: Record<string, unknown>;
  readingTimeText: string;
}

/**
 * 读取并解析一篇 MDX 文件。
 * - 解析 frontmatter，供 SEO 与列表展示使用。
 * - 计算阅读时长，提升文章页体验。
 */
export const readMdxPost = cache(async (contentPath: string): Promise<ParsedMdxPost> => {
  const absolutePath = path.join(process.cwd(), contentPath);
  const source = await fs.readFile(absolutePath, "utf-8");
  const parsed = matter(source);

  return {
    content: parsed.content,
    frontmatter: parsed.data,
    readingTimeText: readingTime(parsed.content).text
  };
});

export function buildPostContentPath(slug: string): string {
  return `content/posts/${slug}.mdx`;
}

export async function writeMdxPost(slug: string, frontmatter: Record<string, unknown>, content: string): Promise<string> {
  await fs.mkdir(contentRoot, { recursive: true });
  const filePath = buildPostContentPath(slug);
  const absolutePath = path.join(process.cwd(), filePath);
  const fm = Object.entries(frontmatter)
    .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
    .join("\n");

  const source = `---\n${fm}\n---\n\n${content}`;
  await fs.writeFile(absolutePath, source, "utf-8");

  return filePath;
}

export async function removeMdxPost(contentPath: string): Promise<void> {
  const absolutePath = path.join(process.cwd(), contentPath);
  await fs.rm(absolutePath, { force: true });
}

export interface LocalMdxPostListItem {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  tags: string[];
  date: string;
  draft: boolean;
}

/**
 * 从 content/posts 读取本地文章列表。
 * 设计目的：在“纯文件内容模式”下，即使数据库暂时为空，也可以展示文章列表。
 */
export const listLocalMdxPosts = cache(async (): Promise<LocalMdxPostListItem[]> => {
  await fs.mkdir(contentRoot, { recursive: true });
  const files = await fs.readdir(contentRoot);
  const mdxFiles = files.filter((file) => file.endsWith(".mdx"));

  const posts = await Promise.all(
    mdxFiles.map(async (fileName) => {
      const slug = fileName.replace(/\.mdx$/, "");
      const contentPath = buildPostContentPath(slug);
      const parsed = await readMdxPost(contentPath);
      const frontmatter = parsed.frontmatter;

      return {
        slug,
        title: String(frontmatter.title || slug),
        excerpt: String(frontmatter.excerpt || ""),
        category: String(frontmatter.category || "general"),
        tags: Array.isArray(frontmatter.tags) ? frontmatter.tags.map((item) => String(item)) : [],
        date: String(frontmatter.date || new Date().toISOString()),
        draft: Boolean(frontmatter.draft || false)
      };
    })
  );

  return posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
});
