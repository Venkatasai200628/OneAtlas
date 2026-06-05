import { buildIntentFromPrompt } from '@/lib/localPipeline';

function slugify(name) {
  return String(name || 'app').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export function getAppSubdomain(app) {
  if (app?.subdomain) return app.subdomain;
  const slug = slugify(app?.name || app?.intent?.appName || 'app');
  return `${slug}.oneatlas.dev`;
}

export function resolveAppPayload(app) {
  if (app?.intent && app?.schema && app?.appSpec) {
    return {
      projectId: app.id,
      prompt: app.prompt || '',
      intent: app.intent,
      schema: app.schema,
      appSpec: app.appSpec,
      name: app.name || app.intent?.appName,
    };
  }
  const prompt = app?.prompt || `Build a ${app?.name || 'business app'}`;
  const intent = buildIntentFromPrompt(prompt);
  return {
    projectId: app?.id || `proj_${Date.now()}`,
    prompt,
    intent,
    schema: null,
    appSpec: null,
    name: app?.name || intent.appName,
    needsGeneration: true,
  };
}

export function openProjectPreview(navigate, app) {
  const payload = resolveAppPayload(app);
  sessionStorage.setItem('oa_open_project', JSON.stringify(payload));
  navigate('/app/generate');
}

/** Select a template and open Build — user writes their own prompt before generating. */
export function startGenerationFromTemplate(navigate, { templateName, templateCategory, model, mode }) {
  sessionStorage.removeItem('oa_open_project');
  sessionStorage.setItem('oa_selected_template', JSON.stringify({
    templateName,
    templateCategory: templateCategory || null,
    model: model || 'auto',
    mode: mode || 'build',
  }));
  navigate('/app/generate');
}
