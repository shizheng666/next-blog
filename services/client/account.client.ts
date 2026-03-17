"use client";

import { getRequest, patchRequest } from "@/lib/request";

export interface AccountProfile {
  id: string;
  email: string;
  name: string | null;
  role: string;
  status: string;
  createdAt: string;
}

export const accountClient = {
  profile() {
    return getRequest<AccountProfile>("/api/account");
  },
  updateNickname(nickname: string) {
    return patchRequest<{ id: string; name: string | null; email: string; role: string; status: string }>("/api/account", {
      nickname
    });
  }
};
