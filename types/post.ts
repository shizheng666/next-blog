export type PostStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export interface PostListItem {
  id: string;
  slug: string;
  title: string;
  excerpt?: string | null;
  coverImage?: string | null;
  category?: string | null;
  status: PostStatus;
  publishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  tags: { id: string; name: string; slug: string }[];
}

export interface PostDetail extends PostListItem {
  content: string;
  readingTimeText: string;
}
