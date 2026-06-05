/**
 * Stable reference deployments (certification catalog) — do not change IDs or subdomains.
 */

import { EVAL_PROMPTS, NORMAL_EVAL_PROMPTS, EDGE_EVAL_PROMPTS } from './evalPrompts.js';

function catalogSlug(item) {
  const base = item.label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return `cert-${item.cat}-${String(item.id).padStart(2, '0')}-${base}`;
}

export function getCatalogDeployments() {
  const baseTs = new Date('2026-06-01T00:00:00Z').getTime();
  return EVAL_PROMPTS.map((item, i) => ({
    id: `catalog_${item.cat}_${item.id}`,
    catalog: true,
    evalId: item.id,
    cat: item.cat,
    name: item.label,
    prompt: item.prompt,
    status: 'live',
    subdomain: `${catalogSlug(item)}.oneatlas.dev`,
    updatedAt: baseTs + i * 3600000,
    createdAt: new Date(baseTs + i * 3600000).toISOString(),
  }));
}

export function getCatalogDeploymentGroups() {
  return {
    normal: NORMAL_EVAL_PROMPTS.map(p => getCatalogDeployments().find(d => d.evalId === p.id)),
    edge: EDGE_EVAL_PROMPTS.map(p => getCatalogDeployments().find(d => d.evalId === p.id)),
  };
}

export { NORMAL_EVAL_PROMPTS, EDGE_EVAL_PROMPTS, EVAL_PROMPTS };
