import { prisma } from "@/lib/db";
import { isPrismaUnavailableError } from "@/lib/prisma-errors";

export async function listPostComments(postId: bigint) {
  try {
    return await prisma.comment.findMany({
      where: {
        postId,
        isApproved: true
      },
      orderBy: {
        createdAt: "desc"
      }
    });
  } catch (error) {
    if (isPrismaUnavailableError(error)) {
      return [];
    }
    throw error;
  }
}

export async function createComment(input: {
  postId: bigint;
  userId: bigint;
  authorName?: string;
  authorEmail?: string;
  content: string;
}) {
  return prisma.comment.create({
    data: {
      postId: input.postId,
      userId: input.userId,
      authorName: input.authorName,
      authorEmail: input.authorEmail,
      content: input.content,
      isApproved: false
    }
  });
}
