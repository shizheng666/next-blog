import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { countAdminUsers } from "@/services/user.service";

const updateUserSchema = z.object({
  role: z.enum(["ADMIN", "READER"]).optional(),
  status: z.enum(["ACTIVE", "MUTED", "DISABLED"]).optional()
});

function parseId(raw: string): bigint | null {
  try {
    return BigInt(raw);
  } catch {
    return null;
  }
}

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

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const currentAdmin = await requireAdmin();
    const { id } = await context.params;
    const userId = parseId(id);
    if (!userId) {
      return NextResponse.json({ code: 400, message: "用户 ID 非法", data: null }, { status: 400 });
    }

    const body = await request.json();
    const parsed = updateUserSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ code: 400, message: "用户更新参数不合法", data: parsed.error.flatten() }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.deletedAt) {
      return NextResponse.json({ code: 404, message: "用户不存在", data: null }, { status: 404 });
    }

    if (String(user.id) === currentAdmin.userId) {
      if (parsed.data.role === "READER") {
        return NextResponse.json({ code: 400, message: "不能将自己降级为普通用户", data: null }, { status: 400 });
      }
      if (parsed.data.status === "DISABLED") {
        return NextResponse.json({ code: 400, message: "不能禁用自己的账号", data: null }, { status: 400 });
      }
    }

    if (user.role === "ADMIN" && (parsed.data.role === "READER" || parsed.data.status === "DISABLED")) {
      const adminCount = await countAdminUsers();
      if (adminCount <= 1) {
        return NextResponse.json({ code: 400, message: "系统至少需要保留一个管理员账号", data: null }, { status: 400 });
      }
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(parsed.data.role ? { role: parsed.data.role } : {}),
        ...(parsed.data.status ? { status: parsed.data.status } : {})
      }
    });

    return NextResponse.json({
      code: 0,
      message: "用户信息更新成功",
      data: {
        id: String(updated.id),
        role: updated.role,
        status: updated.status
      }
    });
  } catch (error) {
    return getErrorResponse(error, "更新用户失败");
  }
}

export async function DELETE(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const currentAdmin = await requireAdmin();
    const { id } = await context.params;
    const userId = parseId(id);
    if (!userId) {
      return NextResponse.json({ code: 400, message: "用户 ID 非法", data: null }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.deletedAt) {
      return NextResponse.json({ code: 404, message: "用户不存在", data: null }, { status: 404 });
    }

    if (String(user.id) === currentAdmin.userId) {
      return NextResponse.json({ code: 400, message: "不能删除自己的账号", data: null }, { status: 400 });
    }

    if (user.role === "ADMIN") {
      const adminCount = await countAdminUsers();
      if (adminCount <= 1) {
        return NextResponse.json({ code: 400, message: "系统至少需要保留一个管理员账号", data: null }, { status: 400 });
      }
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        status: "DISABLED",
        deletedAt: new Date()
      }
    });

    return NextResponse.json({ code: 0, message: "用户已禁用并软删除", data: { id } });
  } catch (error) {
    return getErrorResponse(error, "删除用户失败");
  }
}
