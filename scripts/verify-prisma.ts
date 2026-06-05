import { prisma } from '../lib/prisma.js';

async function main() {
  const count = await prisma.organization.count();
  if (count < 0) throw new Error('Unexpected count');
  console.log('✅ Connected — organizations:', count);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error('Prisma verify failed:', e.message || e);
    await prisma.$disconnect();
    process.exit(1);
  });
