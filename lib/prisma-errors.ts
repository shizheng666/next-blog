import { Prisma } from "@prisma/client";

const prismaUnavailablePatterns = [
  "does not exist in the current database",
  "Can't reach database server",
  "Environment variable not found: DATABASE_URL"
];

export function isPrismaUnavailableError(error: unknown): boolean {
  if (error instanceof Prisma.PrismaClientInitializationError) {
    return true;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return error.code === "P1001";
  }

  if (!(error instanceof Error)) {
    return false;
  }

  return prismaUnavailablePatterns.some((pattern) => error.message.includes(pattern));
}
