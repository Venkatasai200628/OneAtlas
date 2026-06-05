/** Sync projects to PostgreSQL (Prisma) when DATABASE_URL is configured. */

export async function syncProjectToDb(project, orgId = 'default-org') {
  try {
    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orgId, project }),
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}
