import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { postUpsertSchema } from "@/lib/validators";
import { deletePost, getPostByIdOrSlug, updatePost } from "@/services/post.service";

function parseId(raw: string): bigint | null {
  try {
    return BigInt(raw);
  } catch {
    return null;
  }
}

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const data = await getPostByIdOrSlug(id);
    if (!data) {
      return NextResponse.json({ code: 404, message: "文章不存在", data: null }, { status: 404 });
    }
    return NextResponse.json({ code: 0, message: "ok", data });
  } catch (error) {
    return NextResponse.json(
      { code: 500, message: error instanceof Error ? error.message : "获取文章失败", data: null },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await context.params;
    const postId = parseId(id);
    if (!postId) {
      return NextResponse.json({ code: 400, message: "文章 ID 非法", data: null }, { status: 400 });
    }

    const body = await request.json();
    const parsed = postUpsertSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { code: 400, message: "文章参数不合法", data: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = await updatePost(postId, parsed.data);

    revalidatePath("/");
    revalidatePath("/blog");
    revalidatePath("/tags");
    revalidatePath(`/blog/${data.slug}`);
    data.tags.forEach((tag) => revalidatePath(`/tags/${tag.slug}`));

    return NextResponse.json({ code: 0, message: "更新成功", data });
  } catch (error) {
    return NextResponse.json(
      { code: 500, message: error instanceof Error ? error.message : "更新文章失败", data: null },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await context.params;
    const postId = parseId(id);
    if (!postId) {
      return NextResponse.json({ code: 400, message: "文章 ID 非法", data: null }, { status: 400 });
    }

    const data = await deletePost(postId);

    revalidatePath("/");
    revalidatePath("/blog");
    revalidatePath("/tags");

    return NextResponse.json({ code: 0, message: "删除成功", data });
  } catch (error) {
    return NextResponse.json(
      { code: 500, message: error instanceof Error ? error.message : "删除文章失败", data: null },
      { status: 500 }
    );
  }
}
