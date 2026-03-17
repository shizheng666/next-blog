import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { postListQuerySchema, postUpsertSchema } from "@/lib/validators";
import { createPost, listPosts } from "@/services/post.service";

export async function GET(request: NextRequest) {
  try {
    const query = Object.fromEntries(request.nextUrl.searchParams.entries());
    const parsed = postListQuerySchema.safeParse(query);

    if (!parsed.success) {
      return NextResponse.json(
        {
          code: 400,
          message: "查询参数不合法",
          data: parsed.error.flatten()
        },
        { status: 400 }
      );
    }

    const data = await listPosts(parsed.data);
    return NextResponse.json({ code: 0, message: "ok", data });
  } catch (error) {
    return NextResponse.json(
      {
        code: 500,
        message: error instanceof Error ? error.message : "获取文章列表失败",
        data: null
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await request.json();
    const parsed = postUpsertSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          code: 400,
          message: "文章参数不合法",
          data: parsed.error.flatten()
        },
        { status: 400 }
      );
    }

    // 中文说明：为了兼容“纯环境变量后台账号”的起步模式，
    // 这里会自动创建（或复用）一条 admin 用户记录，确保 Post.authorId 外键合法。
    const author = await prisma.user.upsert({
      where: { email: admin.email },
      update: {},
      create: {
        email: admin.email,
        name: "Admin",
        passwordHash: "env-admin-login",
        role: "ADMIN"
      }
    });

    const authorId = author.id;
    const data = await createPost(parsed.data, authorId);

    revalidatePath("/");
    revalidatePath("/blog");
    revalidatePath("/tags");
    revalidatePath(`/blog/${data.slug}`);
    data.tags.forEach((tag) => revalidatePath(`/tags/${tag.slug}`));

    return NextResponse.json({ code: 0, message: `创建成功，操作者：${admin.email}`, data });
  } catch (error) {
    return NextResponse.json(
      {
        code: 500,
        message: error instanceof Error ? error.message : "创建文章失败",
        data: null
      },
      { status: 500 }
    );
  }
}
