"use client";

import { deleteRequest, getRequest } from "@/lib/request";
import { http } from "@/lib/http";
import type { ApiResponse } from "@/types/api";

export interface UploadItem {
  name: string;
  url: string;
  size: number;
  updatedAt: string;
}

export const uploadClient = {
  list() {
    return getRequest<UploadItem[]>("/api/upload");
  },
  async upload(file: File) {
    const formData = new FormData();
    formData.append("file", file);
    const response = await http.post<ApiResponse<{ url: string }>>("/api/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data"
      }
    });
    return response.data.data;
  },
  remove(name: string) {
    return deleteRequest<{ name: string }>(`/api/upload/${encodeURIComponent(name)}`);
  }
};
