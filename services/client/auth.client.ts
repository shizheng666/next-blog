"use client";

import { postRequest } from "@/lib/request";

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload extends LoginPayload {
  nickname: string;
}

export const authClient = {
  login(payload: LoginPayload) {
    return postRequest<{ role: string; name: string | null; redirectTo: string }>("/api/auth/login", payload);
  },
  register(payload: RegisterPayload) {
    return postRequest<{ id: string; email: string; role: string }>("/api/auth/register", payload);
  },
  logout() {
    return postRequest<null>("/api/auth/logout");
  }
};
