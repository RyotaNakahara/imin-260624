process.env.DATABASE_URL = "file:./test.db";
process.env.NODE_ENV = "test";

const globalForPrisma = globalThis as unknown as { prisma?: unknown };
globalForPrisma.prisma = undefined;
