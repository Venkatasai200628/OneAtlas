import { NextResponse } from 'next/server';
import { getAllProjects } from '../../../lib/projectStore.js';
import { getDb, saveProjectToDb } from '../../../lib/db.js';

export async function POST(req) {
  try {
    const body = await req.json();
    const { orgId, project } = body;
    if (!project?.name) {
      return NextResponse.json({ error: 'project required' }, { status: 400 });
    }
    const db = await getDb();
    if (!db) {
      return NextResponse.json({ stored: false, backend: 'localStorage', message: 'Set DATABASE_URL for PostgreSQL sync' });
    }
    const row = await saveProjectToDb(orgId || 'default-org', {
      name: project.name,
      prompt: project.prompt,
      appType: project.appType,
      status: project.status || 'live',
      intent: project.intent,
      schema: project.schema,
      appSpec: project.appSpec,
      createdBy: project.createdBy,
    });
    return NextResponse.json({ stored: true, backend: 'postgresql', project: row });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET() {
  const projects = getAllProjects().map(p => ({
    id: p.id,
    appName: p.appName,
    appType: p.appType,
    appSlug: p.appSlug,
    createdAt: p.createdAt,
    entityCount: p.entityCount,
    pageCount: p.pageCount,
    endpointCount: p.endpointCount,
    workflowCount: p.workflowCount,
    fileCount: Object.keys(p.files || {}).length,
    cost: p.cost,
  }));
  return NextResponse.json({ projects, total: projects.length });
}
