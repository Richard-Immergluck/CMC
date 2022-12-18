import { PrismaClient } from '@prisma/client';

// My overcomplicated attempt to get prisma to work in dev and prod
// let prisma;

// if (process.env.NODE_ENV === 'production') {
//   prisma = new PrismaClient();
//   console.log('production prisma client created')
// } else {
//   if (!global.prisma) {
//     global.prisma = new PrismaClient();
//   }
//   prisma = global.prisma;
//   console.log('development prisma client created')
// }

const prisma =  new PrismaClient();

export default prisma;