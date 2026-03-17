import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { syncLocalMdxPostsToDatabase } from "@/services/post.service";

/**
 * 后台一键同步接口：
 * 将 content/posts/*.mdx 同步到数据库（创建或更新）。
 */
export async function POST() {
  try {
    const admin = await requireAdmin();

    const author = await prisma.user.upsert({
      where: { email: admin.email },
      update: { role: "ADMIN" },
      create: {
        email: admin.email,
        name: "Admin",
        passwordHash: "env-admin-login",
        role: "ADMIN"
      }
    });

    const result = await syncLocalMdxPostsToDatabase(author.id);

    // 中文说明：同步后主动刷新首页、列表页、标签页和文章详情页缓存。
    revalidatePath("/");
    revalidatePath("/blog");
    revalidatePath("/tags");
    result.changedSlugs.forEach((slug) => revalidatePath(`/blog/${slug}`));
    result.changedTags.forEach((tag) => revalidatePath(`/tags/${tag}`));

    return NextResponse.json({
      code: 0,
      message: "同步完成",
      data: result
    });
  } catch (error) {
    return NextResponse.json(
      {
        code: 500,
        message: error instanceof Error ? error.message : "同步失败",
        data: null
      },
      { status: 500 }
    );
  }
}
