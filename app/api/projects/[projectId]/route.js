import { NextResponse } from 'next/server';
import { getProject, deleteProject } from '../../../../lib/projectStore.js';

export async function GET(req, { params }) {
  const { projectId } = await params;
  const project = getProject(projectId);
  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  return NextResponse.json(project);
}

export async function DELETE(req, { params }) {
  const { projectId } = await params;
  const ok = deleteProject(projectId);
  return NextResponse.json({ deleted: ok });
}
