import { z } from "zod";

export const postUpsertSchema = z.object({
  title: z.string().min(1, "标题不能为空").max(255, "标题过长"),
  slug: z
    .string()
    .min(1, "slug 不能为空")
    .max(191, "slug 过长")
    .regex(/^[a-z0-9-]+$/, "slug 仅支持小写字母、数字和中划线"),
  excerpt: z.string().max(500, "摘要过长").optional().nullable(),
  content: z.string().min(1, "正文不能为空"),
  coverImage: z.string().url("封面图 URL 非法").optional().nullable(),
  category: z.string().max(100, "分类过长").optional().nullable(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
  tags: z.array(z.string().min(1)).default([])
});

export const postListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(50).default(10),
  tag: z.string().optional(),
  category: z.string().optional(),
  keyword: z.string().optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional()
});

export const loginSchema = z.object({
  email: z.string().email("邮箱格式不正确"),
  password: z.string().min(1, "密码不能为空")
});

export const registerSchema = z.object({
  email: z.string().email("邮箱格式不正确"),
  password: z.string().min(6, "密码至少 6 位"),
  nickname: z.string().min(1, "昵称不能为空").max(100, "昵称过长")
});

export const accountUpdateSchema = z.object({
  nickname: z.string().min(1, "昵称不能为空").max(100, "昵称过长")
});

export const tagSchema = z.object({
  name: z.string().min(1, "标签名不能为空").max(100, "标签名过长")
});
