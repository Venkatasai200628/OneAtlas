/**
 * When to use deterministic blueprint engine vs LLM for generation stages.
 */

import { parseStructuredPrompt, shouldPrioritizeStructuredIntent } from './promptParser.js';

const BLUEPRINT_APP_TYPES = new Set([
  'space_mission',
  'utilities',
  'fleet_management',
  'research_platform',
  'crm',
  'project_management',
  'ecommerce',
  'hr_tool',
  'inventory',
  'content_platform',
  'client_portal',
  'dashboard',
]);

export function shouldUseBlueprintEngine(prompt, intent = null) {
  const parsed = parseStructuredPrompt(prompt);
  if (shouldPrioritizeStructuredIntent(parsed)) return true;
  if (intent?.requestedPages?.length >= 2) return true;
  if (intent?.appType && BLUEPRINT_APP_TYPES.has(intent.appType)) return true;
  if (Array.isArray(intent?.entities) && intent.entities.length >= 4 && intent.appType !== 'custom') return true;
  return false;
}
