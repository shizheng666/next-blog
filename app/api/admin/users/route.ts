import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { toJsonSafe } from "@/lib/serialize";
import { listUsers } from "@/services/user.service";

const listUsersQuerySchema = z.object({
  keyword: z.string().trim().min(1).optional(),
  role: z.enum(["ADMIN", "READER"]).optional(),
  status: z.enum(["ACTIVE", "MUTED", "DISABLED"]).optional()
});

function getErrorResponse(error: unknown, fallbackMessage: string) {
  const message = error instanceof Error ? error.message : fallbackMessage;
  if (message.includes("未登录") || message.includes("登录态失效")) {
    return NextResponse.json({ code: 401, message, data: null }, { status: 401 });
  }
  if (message.includes("权限不足") || message.includes("禁用")) {
    return NextResponse.json({ code: 403, message, data: null }, { status: 403 });
  }
  return NextResponse.json({ code: 500, message, data: null }, { status: 500 });
}

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const parsed = listUsersQuerySchema.safeParse({
      keyword: request.nextUrl.searchParams.get("keyword") || undefined,
      role: request.nextUrl.searchParams.get("role") || undefined,
      status: request.nextUrl.searchParams.get("status") || undefined
    });

    if (!parsed.success) {
      return NextResponse.json({ code: 400, message: "查询参数不合法", data: parsed.error.flatten() }, { status: 400 });
    }

    const data = await listUsers(parsed.data);
    return NextResponse.json({ code: 0, message: "ok", data: toJsonSafe(data) });
  } catch (error) {
    return getErrorResponse(error, "获取用户列表失败");
  }
}
