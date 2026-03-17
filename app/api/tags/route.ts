import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { tagSchema } from "@/lib/validators";
import { prisma } from "@/lib/db";
import { toJsonSafe } from "@/lib/serialize";
import { listTags } from "@/services/tag.service";

function slugifyTag(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, "-");
}

export async function GET() {
  const data = await listTags();
  return NextResponse.json({ code: 0, message: "ok", data: toJsonSafe(data) });
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    const parsed = tagSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ code: 400, message: "标签参数不合法", data: parsed.error.flatten() }, { status: 400 });
    }

    const data = await prisma.tag.create({
      data: {
        name: parsed.data.name,
        slug: slugifyTag(parsed.data.name)
      }
    });

    revalidatePath("/tags");
    revalidatePath(`/tags/${data.slug}`);

    return NextResponse.json({ code: 0, message: "标签创建成功", data: toJsonSafe(data) });
  } catch (error) {
    return NextResponse.json(
      { code: 500, message: error instanceof Error ? error.message : "创建标签失败", data: null },
      { status: 500 }
    );
  }
}
