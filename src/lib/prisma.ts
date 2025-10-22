import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Éviter l'initialisation de Prisma pendant le build
const createPrismaClient = () => {
  if (process.env.SKIP_ENV_VALIDATION === 'true' || !process.env.DATABASE_URL) {
    // Pendant le build, retourner un client vide qui ne se connecte pas
    return new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL || 'file:./dev.db'
        }
      },
      log: []
    });
  }
  return new PrismaClient();
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
