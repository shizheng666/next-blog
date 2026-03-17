"use client";

import type { AxiosRequestConfig } from "axios";
import { http } from "@/lib/http";
import type { ApiResponse } from "@/types/api";

export async function request<T>(config: AxiosRequestConfig): Promise<T> {
  const response = await http.request<ApiResponse<T>>(config);
  return response.data.data;
}

export function getRequest<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  return request<T>({
    url,
    method: "GET",
    ...config
  });
}

export function postRequest<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
  return request<T>({
    url,
    method: "POST",
    data,
    ...config
  });
}

export function patchRequest<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
  return request<T>({
    url,
    method: "PATCH",
    data,
    ...config
  });
}

export function putRequest<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
  return request<T>({
    url,
    method: "PUT",
    data,
    ...config
  });
}

export function deleteRequest<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  return request<T>({
    url,
    method: "DELETE",
    ...config
  });
}
