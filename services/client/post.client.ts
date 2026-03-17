"use client";

import { getRequest, postRequest, putRequest, deleteRequest } from "@/lib/request";

export interface AdminPostPayload {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  tags: string[];
}

export const postClient = {
  list() {
    return getRequest<{ list: { id: string; title: string; slug: string; status: "DRAFT" | "PUBLISHED" | "ARCHIVED" }[] }>("/api/posts?page=1&pageSize=20");
  },
  detail(id: string) {
    return getRequest<{
      id: string;
      title: string;
      slug: string;
      excerpt?: string | null;
      content: string;
      category?: string | null;
      status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
      tags: { name: string }[];
    }>(`/api/posts/${id}`);
  },
  create(payload: AdminPostPayload) {
    return postRequest<{ id: string; slug: string }>("/api/posts", payload);
  },
  update(id: string, payload: AdminPostPayload) {
    return putRequest<{ id: string; slug: string }>(`/api/posts/${id}`, payload);
  },
  remove(id: string) {
    return deleteRequest<{ id: string }>(`/api/posts/${id}`);
  },
  sync() {
    return postRequest<{ total: number; created: number; updated: number }>("/api/admin/sync-posts");
  }
};
