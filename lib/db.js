/**
 * Database access — uses Prisma when DATABASE_URL is set, otherwise no-op (localStorage mode).
 */

let prisma = null;

export async function getDb() {
  if (!process.env.DATABASE_URL) return null;
  if (prisma) return prisma;
  try {
    const mod = await import('./prisma.ts');
    prisma = mod.prisma;
    return prisma;
  } catch {
    return null;
  }
}

export async function ensureOrganization(orgId, name = 'Default Workspace') {
  const db = await getDb();
  if (!db) return null;
  const id = orgId || 'default-org';
  const slug = id.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'default-org';
  return db.organization.upsert({
    where: { id },
    create: { id, name, slug, plan: 'explorer' },
    update: {},
  });
}

export async function saveProjectToDb(orgId, project) {
  const db = await getDb();
  if (!db) return null;
  const resolvedOrgId = orgId && orgId !== 'default' ? orgId : 'default-org';
  await ensureOrganization(resolvedOrgId);

  if (project.id) {
    const existing = await db.project.findFirst({
      where: { orgId: resolvedOrgId, name: project.name },
      orderBy: { updatedAt: 'desc' },
    });
    if (existing) {
      return db.project.update({
        where: { id: existing.id },
        data: {
          prompt: project.prompt,
          appType: project.appType,
          status: project.status || 'live',
          intent: project.intent,
          dataSchema: project.schema,
          appSpec: project.appSpec,
          createdBy: project.createdBy,
        },
      });
    }
  }

  return db.project.create({
    data: {
      orgId: resolvedOrgId,
      name: project.name,
      prompt: project.prompt,
      appType: project.appType,
      status: project.status || 'live',
      intent: project.intent,
      dataSchema: project.schema,
      appSpec: project.appSpec,
      createdBy: project.createdBy,
    },
  });
}

export async function createDeploymentRecord(orgId, projectId, subdomain) {
  const db = await getDb();
  if (!db) return null;
  return db.deployment.create({
    data: { orgId, projectId, subdomain, status: 'live' },
  });
}
