const { PrismaClient } = require('@prisma/client');

const globalForPrisma = global;

const prisma = globalForPrisma.__prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'production' ? ['error'] : ['warn', 'error'],
});

if (!globalForPrisma.__prisma) {
  globalForPrisma.__prisma = prisma;
}

module.exports = prisma;
