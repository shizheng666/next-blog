import { prisma } from "@/lib/db";
import { isPrismaUnavailableError } from "@/lib/prisma-errors";
import { cache } from "react";

function slugifyTag(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, "-");
}

export async function upsertTags(tagNames: string[]): Promise<{ id: bigint; name: string; slug: string }[]> {
  const uniqueNames = Array.from(new Set(tagNames.map((tag) => tag.trim()).filter(Boolean)));

  const tags = await Promise.all(
    uniqueNames.map(async (name) => {
      const slug = slugifyTag(name);
      return prisma.tag.upsert({
        where: { slug },
        update: { name },
        create: { name, slug }
      });
    })
  );

  return tags;
}

export const listTags = cache(async () => {
  try {
    return await prisma.tag.findMany({
      orderBy: { name: "asc" }
    });
  } catch (error) {
    if (isPrismaUnavailableError(error)) {
      return [];
    }
    throw error;
  }
});
