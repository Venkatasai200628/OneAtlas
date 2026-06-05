import { prisma } from '../lib/prisma.js';

async function main() {
  const org = await prisma.organization.upsert({
    where: { slug: 'demo-org' },
    create: {
      name: 'Demo Organization',
      slug: 'demo-org',
      plan: 'explorer',
    },
    update: {},
  });

  await prisma.orgMember.upsert({
    where: { orgId_userId: { orgId: org.id, userId: 'seed-admin' } },
    create: {
      orgId: org.id,
      userId: 'seed-admin',
      email: 'admin@demo.oneatlas.app',
      role: 'owner',
    },
    update: {},
  });

  const existing = await prisma.project.findFirst({ where: { orgId: org.id, name: 'Sample CRM' } });
  if (!existing) {
    await prisma.project.create({
      data: {
        orgId: org.id,
        name: 'Sample CRM',
        prompt: 'Build a sales CRM with pipeline and contacts',
        appType: 'crm',
        status: 'live',
        createdBy: 'seed-admin',
        intent: { appName: 'Sample CRM', appType: 'crm' },
        dataSchema: { entities: [] },
        appSpec: { pages: [], sidebar: [] },
      },
    });
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
