
const projects = new Map();

export function saveProject({ jobId, intent, dataSchema, appSpec, files, appSlug, cost, latency }) {
  const project = {
    id: jobId,
    appName:   intent.appName,
    appType:   intent.appType,
    appSlug,
    createdAt: new Date().toISOString(),
    intent, dataSchema, appSpec, files, cost, latency,
    entityCount:  dataSchema?.entities?.length || 0,
    pageCount:    appSpec?.pages?.length || 0,
    endpointCount:appSpec?.apiEndpoints?.length || 0,
    workflowCount:appSpec?.workflowStubs?.length || 0,
  };
  projects.set(jobId, project);
  return project;
}

export function getProject(id) {
  return projects.get(id) || null;
}

export function getAllProjects() {
  return [...projects.values()].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export function deleteProject(id) {
  return projects.delete(id);
}
