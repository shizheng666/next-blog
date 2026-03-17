"use client";

import { deleteRequest, getRequest, postRequest } from "@/lib/request";

export interface TagItem {
  id: string;
  name: string;
  slug: string;
}

export const tagClient = {
  list() {
    return getRequest<TagItem[]>("/api/tags");
  },
  create(name: string) {
    return postRequest<TagItem>("/api/tags", { name });
  },
  remove(id: string) {
    return deleteRequest<{ id: string }>(`/api/tags/${id}`);
  }
};
