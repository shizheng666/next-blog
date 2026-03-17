import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";

function parseId(raw: string): bigint | null {
  try {
    return BigInt(raw);
  } catch {
    return null;
  }
}

export async function DELETE(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await context.params;
    const tagId = parseId(id);
    if (!tagId) {
      return NextResponse.json({ code: 400, message: "标签 ID 非法", data: null }, { status: 400 });
    }

    const current = await prisma.tag.findUnique({ where: { id: tagId } });
    await prisma.tag.delete({ where: { id: tagId } });

    revalidatePath("/tags");
    if (current?.slug) {
      revalidatePath(`/tags/${current.slug}`);
    }

    return NextResponse.json({ code: 0, message: "标签删除成功", data: { id } });
  } catch (error) {
    return NextResponse.json(
      { code: 500, message: error instanceof Error ? error.message : "删除标签失败", data: null },
      { status: 500 }
    );
  }
}
