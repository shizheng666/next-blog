import { NextRequest, NextResponse } from "next/server";
import { loadUserProfile, requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { accountUpdateSchema } from "@/lib/validators";

export async function GET() {
  try {
    const currentUser = await requireUser();
    const profile = await loadUserProfile(currentUser.userId);

    if (!profile) {
      return NextResponse.json({ code: 404, message: "用户不存在", data: null }, { status: 404 });
    }

    return NextResponse.json({
      code: 0,
      message: "ok",
      data: {
        id: String(profile.id),
        email: profile.email,
        name: profile.name,
        role: profile.role,
        status: profile.status,
        createdAt: profile.createdAt.toISOString()
      }
    });
  } catch (error) {
    return NextResponse.json(
      { code: 500, message: error instanceof Error ? error.message : "获取账户信息失败", data: null },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const currentUser = await requireUser();
    const body = await request.json();
    const parsed = accountUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ code: 400, message: "账户参数不合法", data: parsed.error.flatten() }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: BigInt(currentUser.userId) },
      data: {
        name: parsed.data.nickname,
        nicknameUpdatedAt: new Date()
      }
    });

    // 中文说明：昵称变更后，历史评论作者名同步更新，确保站内身份展示一致。
    await prisma.comment.updateMany({
      where: { userId: updatedUser.id },
      data: { authorName: updatedUser.name }
    });

    return NextResponse.json({
      code: 0,
      message: "昵称更新成功",
      data: {
        id: String(updatedUser.id),
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        status: updatedUser.status
      }
    });
  } catch (error) {
    return NextResponse.json(
      { code: 500, message: error instanceof Error ? error.message : "更新账户信息失败", data: null },
      { status: 500 }
    );
  }
}
