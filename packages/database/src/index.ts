import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var prismaClientGlobal: PrismaClient | undefined;
}

export const prisma =
  globalThis.prismaClientGlobal ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.prismaClientGlobal = prisma;
}

/**
 * Executes a database operation within a user-isolated context for Row-Level Security
 */
export async function withUserContext<T>(
  userId: string,
  callback: (tx: PrismaClient) => Promise<T>
): Promise<T> {
  return await prisma.$transaction(async (tx) => {
    // Set PostgreSQL local session variable for RLS
    await tx.$executeRawUnsafe(`SET LOCAL app.current_user_id = '${userId.replace(/'/g, "''")}';`);
    return await callback(tx as unknown as PrismaClient);
  });
}

export * from "@prisma/client";
