import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { loadUserProfile, requireAdmin, requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { toJsonSafe } from "@/lib/serialize";
import { createComment, listPostComments } from "@/services/comment.service";

const createCommentSchema = z.object({
  postId: z.string().min(1),
  authorName: z.string().optional(),
  // 中文说明：前端未填写邮箱时会提交空字符串，这里统一转为 undefined，避免误判为非法邮箱。
  authorEmail: z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.string().email().optional()
  ),
  content: z.string().min(1)
});

const batchCommentSchema = z.object({
  ids: z.array(z.string().min(1)).min(1),
  action: z.enum(["approve", "reject", "delete"])
});

export async function POST(request: NextRequest) {
  try {
    const currentUser = await requireUser();
    if (currentUser.status === "MUTED") {
      return NextResponse.json({ code: 403, message: "当前账号已被禁言，暂时无法发表评论", data: null }, { status: 403 });
    }

    const body = await request.json();
    const parsed = createCommentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ code: 400, message: "评论参数不合法", data: parsed.error.flatten() }, { status: 400 });
    }

    const profile = await loadUserProfile(currentUser.userId);

    if (!profile) {
      return NextResponse.json({ code: 401, message: "请先登录后再发表评论", data: null }, { status: 401 });
    }

    if (profile.status === "MUTED") {
      return NextResponse.json({ code: 403, message: "当前账号已被禁言，暂时无法发表评论", data: null }, { status: 403 });
    }

    const data = await createComment({
      postId: BigInt(parsed.data.postId),
      userId: profile.id,
      authorName: profile.name || parsed.data.authorName,
      authorEmail: profile.email || parsed.data.authorEmail,
      content: parsed.data.content
    });

    return NextResponse.json({ code: 0, message: "评论已提交，待审核", data: { id: String(data.id) } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "评论提交失败";
    const status = message.includes("未登录") || message.includes("登录态失效") ? 401 : 500;
    const code = status === 401 ? 401 : 500;
    return NextResponse.json({ code, message, data: null }, { status });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    const parsed = batchCommentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ code: 400, message: "批量评论操作参数不合法", data: parsed.error.flatten() }, { status: 400 });
    }

    const ids = parsed.data.ids.map((id) => BigInt(id));

    if (parsed.data.action === "delete") {
      const result = await prisma.comment.deleteMany({
        where: {
          id: { in: ids }
        }
      });
      return NextResponse.json({ code: 0, message: `已删除 ${result.count} 条评论`, data: { count: result.count } });
    }

    const result = await prisma.comment.updateMany({
      where: {
        id: { in: ids }
      },
      data: {
        isApproved: parsed.data.action === "approve"
      }
    });

    return NextResponse.json({
      code: 0,
      message: parsed.data.action === "approve" ? `已通过 ${result.count} 条评论` : `已驳回 ${result.count} 条评论`,
      data: { count: result.count }
    });
  } catch (error) {
    return NextResponse.json(
      { code: 500, message: error instanceof Error ? error.message : "批量评论操作失败", data: null },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const postId = request.nextUrl.searchParams.get("postId");
    const approved = request.nextUrl.searchParams.get("approved");

    if (!postId) {
      // 中文说明：不传 postId 视为后台评论管理请求，返回最近评论。
      await requireAdmin();
      const where = approved === null ? {} : { isApproved: approved === "true" };
      const data = await prisma.comment.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: 100,
        include: {
          post: {
            select: {
              title: true,
              slug: true
            }
          }
        }
      });
      return NextResponse.json({ code: 0, message: "ok", data: toJsonSafe(data) });
    }

    const data = await listPostComments(BigInt(postId));
    return NextResponse.json({ code: 0, message: "ok", data: toJsonSafe(data) });
  } catch (error) {
    return NextResponse.json(
      { code: 500, message: error instanceof Error ? error.message : "获取评论失败", data: null },
      { status: 500 }
    );
  }
}
