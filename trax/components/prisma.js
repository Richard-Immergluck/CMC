import { PrismaClient } from '@prisma/client';

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
  console.log('production prisma client created')
} else {
  if (!global.prisma) {
    global.prisma = new PrismaClient();
  }
  prisma = global.prisma;
  console.log('development prisma client created')
}

export default prisma;