"use client";

import { deleteRequest, getRequest, patchRequest } from "@/lib/request";

export interface AdminUserItem {
  id: string;
  email: string;
  name: string | null;
  role: "ADMIN" | "READER";
  status: "ACTIVE" | "MUTED" | "DISABLED";
  createdAt: string;
  lastLoginAt?: string | null;
}

export const userClient = {
  list(params?: { keyword?: string; role?: "ADMIN" | "READER"; status?: "ACTIVE" | "MUTED" | "DISABLED" }) {
    const search = new URLSearchParams();
    if (params?.keyword) search.set("keyword", params.keyword);
    if (params?.role) search.set("role", params.role);
    if (params?.status) search.set("status", params.status);
    const query = search.toString();
    return getRequest<AdminUserItem[]>(`/api/admin/users${query ? `?${query}` : ""}`);
  },
  update(id: string, payload: { role?: "ADMIN" | "READER"; status?: "ACTIVE" | "MUTED" | "DISABLED" }) {
    return patchRequest<{ id: string; role: "ADMIN" | "READER"; status: "ACTIVE" | "MUTED" | "DISABLED" }>(`/api/admin/users/${id}`, payload);
  },
  remove(id: string) {
    return deleteRequest<{ id: string }>(`/api/admin/users/${id}`);
  }
};
