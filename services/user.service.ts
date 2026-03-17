import { prisma } from "@/lib/db";

export interface ListUsersInput {
  keyword?: string;
  role?: "ADMIN" | "READER";
  status?: "ACTIVE" | "MUTED" | "DISABLED";
}

export async function listUsers(input: ListUsersInput) {
  const where = {
    deletedAt: null,
    ...(input.role ? { role: input.role } : {}),
    ...(input.status ? { status: input.status } : {}),
    ...(input.keyword
      ? {
          OR: [
            { email: { contains: input.keyword } },
            { name: { contains: input.keyword } }
          ]
        }
      : {})
  };

  return prisma.user.findMany({
    where,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      status: true,
      createdAt: true,
      lastLoginAt: true
    }
  });
}

export async function countAdminUsers(): Promise<number> {
  return prisma.user.count({
    where: {
      role: "ADMIN",
      deletedAt: null,
      status: { not: "DISABLED" }
    }
  });
}
