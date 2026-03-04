import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import path from 'path';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const createPrismaClient = () => {
  let url = process.env.DATABASE_URL ?? 'file:./dev.db';

  // If the url is a relative file path, make it absolute relative to the project root
  // libsql requires file:///absolute/path (3 slashes) for local files
  if (url.startsWith('file:./')) {
    const dbPath = url.replace('file:./', '');
    url = `file://${path.resolve(process.cwd(), dbPath)}`;
  } else if (url.startsWith('file:/') && !url.startsWith('file:///')) {
    url = `file://${url.slice(5)}`;
  }

  const adapter = new PrismaLibSql({ url });

  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  });
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
