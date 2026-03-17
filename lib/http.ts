"use client";

import axios, { AxiosError } from "axios";
import type { ApiResponse } from "@/types/api";

export class ApiClientError extends Error {
  code: number;
  status?: number;

  constructor(message: string, code = -1, status?: number) {
    super(message);
    this.name = "ApiClientError";
    this.code = code;
    this.status = status;
  }
}

export const http = axios.create({
  baseURL: "/",
  timeout: 10000,
  withCredentials: true
});

http.interceptors.response.use(
  (response) => {
    const payload = response.data as ApiResponse<unknown>;
    if (payload && typeof payload.code === "number" && payload.code !== 0) {
      throw new ApiClientError(payload.message || "请求失败", payload.code, response.status);
    }
    return response;
  },
  (error: AxiosError<ApiResponse<unknown>>) => {
    const status = error.response?.status;
    const message = error.response?.data?.message || error.message || "请求失败";
    throw new ApiClientError(message, error.response?.data?.code || -1, status);
  }
);
