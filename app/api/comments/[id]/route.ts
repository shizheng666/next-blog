import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";

function parseId(raw: string): bigint | null {
  try {
    return BigInt(raw);
  } catch {
    return null;
  }
}

/**
 * 评论审核接口：
 * PATCH /api/comments/:id?approved=true|false
 */
export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await context.params;
    const commentId = parseId(id);
    if (!commentId) {
      return NextResponse.json({ code: 400, message: "评论 ID 非法", data: null }, { status: 400 });
    }

    const approved = request.nextUrl.searchParams.get("approved") === "true";
    const data = await prisma.comment.update({
      where: { id: commentId },
      data: { isApproved: approved }
    });

    return NextResponse.json({
      code: 0,
      message: approved ? "评论已通过" : "评论已设为未通过",
      data: {
        id: String(data.id),
        isApproved: data.isApproved
      }
    });
  } catch (error) {
    return NextResponse.json(
      { code: 500, message: error instanceof Error ? error.message : "评论审核失败", data: null },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await context.params;
    const commentId = parseId(id);
    if (!commentId) {
      return NextResponse.json({ code: 400, message: "评论 ID 非法", data: null }, { status: 400 });
    }

    await prisma.comment.delete({ where: { id: commentId } });
    return NextResponse.json({ code: 0, message: "评论删除成功", data: { id } });
  } catch (error) {
    return NextResponse.json(
      { code: 500, message: error instanceof Error ? error.message : "评论删除失败", data: null },
      { status: 500 }
    );
  }
}
