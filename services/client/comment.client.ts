"use client";

import { deleteRequest, getRequest, patchRequest, postRequest } from "@/lib/request";

export interface CommentPayload {
  postId: string;
  authorName?: string;
  authorEmail?: string;
  content: string;
}

export interface AdminCommentItem {
  id: string;
  authorName?: string | null;
  authorEmail?: string | null;
  content: string;
  createdAt: string;
  isApproved: boolean;
  post?: {
    title: string;
    slug: string;
  };
}

export const commentClient = {
  create(payload: CommentPayload) {
    return postRequest<{ id: string }>("/api/comments", payload);
  },
  list(approved?: boolean) {
    const query = approved === undefined ? "" : `?approved=${approved}`;
    return getRequest<AdminCommentItem[]>(`/api/comments${query}`);
  },
  approve(id: string, approved: boolean) {
    return patchRequest<{ id: string; isApproved: boolean }>(`/api/comments/${id}?approved=${approved}`);
  },
  batchUpdate(payload: { ids: string[]; action: "approve" | "reject" | "delete" }) {
    return patchRequest<{ count: number }>("/api/comments", payload);
  },
  remove(id: string) {
    return deleteRequest<{ id: string }>(`/api/comments/${id}`);
  }
};
