import { getProject } from '../../../../../lib/projectStore.js';
import JSZip from 'jszip';

export async function GET(req, { params }) {
  const { projectId } = await params;
  const project = getProject(projectId);

  if (!project) {
    return new Response('Project not found', { status: 404 });
  }

  const zip = new JSZip();
  const root = project.appSlug || 'generated-app';

  for (const [filename, content] of Object.entries(project.files || {})) {
    zip.file(`${root}/${filename}`, content);
  }

  const buffer = await zip.generateAsync({ type: 'arraybuffer' });

  return new Response(buffer, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${root}.zip"`,
    },
  });
}
