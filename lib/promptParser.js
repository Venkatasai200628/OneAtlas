/**
 * Parse structured prompts (Roles, Features, Pages, Business Rules sections).
 */

function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function extractAppTitle(prompt) {
  const m = String(prompt || '').match(
    /(?:^|\n)\s*(?:build\s+(?:a|an)\s+)([^\n.:]+?)(?:\s+for\s+|\s+with\s+|\.|\n|$)/i,
  );
  if (m?.[1]) {
    return m[1]
      .replace(/\b(platform|application|app|system|portal|tool)\b/gi, '')
      .trim()
      .split(/\s+/)
      .slice(0, 5)
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ')
      .trim();
  }
  const words = String(prompt || '').trim().split(/\s+/).filter(w => w.length > 2);
  return words.slice(0, 4).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') || 'Custom App';
}

function parseBulletSection(prompt, headerPattern) {
  const re = new RegExp(`${headerPattern}\\s*:?\\s*\\n([\\s\\S]*?)(?=\\n[A-Z][^:\\n]{0,40}:|\\nGenerate:|$)`, 'i');
  const m = String(prompt || '').match(re);
  if (!m?.[1]) return [];
  return m[1]
    .split('\n')
    .map(l => l.replace(/^[\s\-•*]+/, '').trim())
    .filter(l => l.length > 1 && !/^generate:/i.test(l));
}

export function parseStructuredPrompt(prompt) {
  const text = String(prompt || '');
  const pages = parseBulletSection(text, 'Pages');
  const roles = parseBulletSection(text, 'Roles');
  const features = parseBulletSection(text, 'Features');
  const businessRules = parseBulletSection(text, 'Business Rules');
  const authLines = parseBulletSection(text, 'Authentication');

  return {
    pages,
    roles,
    features,
    businessRules,
    authLines,
    hasStructuredSections: pages.length > 0 || roles.length > 2 || features.length > 2,
    explicitPageCount: pages.length,
  };
}

export function isSpaceMissionPrompt(prompt) {
  const p = String(prompt || '').toLowerCase();
  return /\b(space\s+mission|spacecraft|astronaut|space\s+agency|launch\s+schedul|ground\s+engineer|flight\s+controller|telemetry|orbit|payload\s+management|multinational\s+space)\b/.test(p)
    || (/\bmission\s+control\b/.test(p) && /\b(space|spacecraft|launch|crew)\b/.test(p));
}

export function isFleetOrLogisticsPrompt(prompt) {
  if (isSpaceMissionPrompt(prompt)) return false;
  const p = String(prompt || '').toLowerCase();
  return /\b(drone|uav|smart\s+meter|reservoir|water\s+supply|pipeline\s+network|logistics\s+company|delivery\s+track|battery\s+health)\b/.test(p)
    || (/\bfleet\b/.test(p) && /\b(drone|delivery|logistics|truck|warehouse)\b/.test(p))
    || (/\baircraft\b/.test(p) && !/\bspacecraft|space\s+agency|astronaut\b/.test(p));
}

export function isWaterUtilityPrompt(prompt) {
  const p = String(prompt || '').toLowerCase();
  return /\b(water\s+supply|smart\s+city\s+water|reservoir|pipeline\s+network|smart\s+meter)\b/.test(p);
}

export function isStandaloneDashboardPrompt(prompt, parsed) {
  const p = String(prompt || '').toLowerCase();
  if (parsed?.explicitPageCount >= 3) return false;
  if (isFleetOrLogisticsPrompt(prompt)) return false;
  if (/crm|inventory|support portal|task manager|ecommerce|hr portal|approval/i.test(p)) return false;
  return /^build\s+(?:a\s+)?(?:kpi\s+|metrics\s+|analytics\s+)?dashboard\b/i.test(p.trim())
    || (/^(build\s+)?(?:a\s+)?kpi\s+dashboard/i.test(p.trim()) && parsed.explicitPageCount < 2)
    || (/\bdashboard\b/i.test(p) && parsed.explicitPageCount < 2 && !/drone|fleet|delivery|mission/i.test(p) && p.length < 280);
}

const PAGE_ENTITY_HINTS = [
  [/spacecraft/i, 'Spacecraft'],
  [/crew|astronaut/i, 'CrewMember'],
  [/launch\s+schedul|launch\s+center/i, 'LaunchWindow'],
  [/telemetry/i, 'TelemetryFeed'],
  [/payload/i, 'Payload'],
  [/research\s+oper|experiment/i, 'Experiment'],
  [/partner|collaboration/i, 'PartnerAgency'],
  [/communication\s+log/i, 'CommunicationLog'],
  [/budget|procurement/i, 'Budget'],
  [/drone|delivery\s+fleet/i, 'Drone'],
  [/mission\s+control|mission\s+plan/i, 'Mission'],
  [/flight|schedule/i, 'Mission'],
  [/maintenance|repair|service/i, 'MaintenanceLog'],
  [/incident|alert/i, 'Incident'],
  [/deliver|package|shipment/i, 'Delivery'],
  [/customer|client/i, 'Customer'],
  [/user|role|admin|team/i, 'User'],
  [/contact/i, 'Contact'],
  [/deal|opportunit/i, 'Deal'],
  [/research/i, 'ResearchProject'],
  [/grant/i, 'Grant'],
  [/publication/i, 'Publication'],
  [/peer|review/i, 'PeerReview'],
  [/equipment/i, 'EquipmentBooking'],
  [/budget/i, 'Budget'],
  [/partnership/i, 'Partnership'],
  [/task|sprint/i, 'Task'],
  [/ticket|support/i, 'Ticket'],
  [/product|catalog|sku/i, 'Product'],
  [/order|invoice/i, 'Order'],
  [/employee|staff|hr/i, 'Employee'],
  [/report|metric|kpi|analytic/i, 'Metric'],
  [/inventory|stock/i, 'Product'],
  [/approval|request/i, 'ApprovalRequest'],
];

export function inferEntityForPage(pageName, entities = []) {
  const n = String(pageName || '').toLowerCase();
  for (const [re, entity] of PAGE_ENTITY_HINTS) {
    if (re.test(n) && entities.includes(entity)) return entity;
  }
  for (const e of entities) {
    if (n.includes(e.toLowerCase())) return e;
  }
  if (/dashboard|overview|analytic|report|mission\s+control|security\s+admin|command\s+center/i.test(n)) return null;
  return entities.find(e => e !== 'User') || entities[0] || null;
}

export function inferLayoutForPage(pageName) {
  const n = String(pageName || '').toLowerCase();
  if (/dashboard|overview|analytic|report|kpi/i.test(n)) return 'dashboard';
  if (/planner|board|pipeline|kanban|fleet overview/i.test(n)) return 'kanban';
  if (/new|create|submit|add|register|plan\b/i.test(n) && !/planner/i.test(n)) return 'form';
  if (/detail|profile|settings/i.test(n)) return 'detail';
  return 'list';
}

export function pageNameToRoute(name) {
  const trimmed = String(name || '').trim();
  if (/^dashboard$/i.test(trimmed)) return '/';
  return `/${slugify(trimmed)}`;
}

/** Word-boundary keyword check — avoids "lead research" matching sales CRM. */
export function hasWord(prompt, word) {
  return new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(String(prompt || ''));
}

export function matchesSalesCrmIntent(prompt) {
  const p = String(prompt || '').toLowerCase();
  return /\b(sales\s+crm|crm\s+for|crm\s+app|crm\s+system)\b/.test(p)
    || /\bsales\s+(team|pipeline|rep)\b/.test(p)
    || /\bdeal\s+pipeline\b/.test(p)
    || /\blead\s+management\b/.test(p)
    || /\bcontact\s+management\b/.test(p)
    || (/\bsales\b/.test(p) && /\b(contact|deal|pipeline)\b/.test(p));
}

export function matchesApprovalWorkflowIntent(prompt) {
  const p = String(prompt || '').toLowerCase();
  return /\bapproval\s+workflow\b/.test(p)
    || /\bworkflow\s+system\b/.test(p)
    || /\bapproval\s+chain\b/.test(p);
}

export function matchesProjectManagementIntent(prompt) {
  const p = String(prompt || '').toLowerCase();
  return /\b(task\s+manager|project\s+management\s+tool|engineering\s+team|sprint\s+board|kanban\s+board)\b/.test(p)
    || (/\bproject\s+management\b/.test(p) && !/\bresearch\s+project\b/.test(p) && !/\buniversity\b/.test(p));
}

const SPACE_MISSION_ENTITIES = [
  'Spacecraft', 'Mission', 'CrewMember', 'LaunchWindow', 'TelemetryFeed',
  'Payload', 'Experiment', 'Incident', 'Budget', 'PartnerAgency', 'CommunicationLog', 'User',
];

const STRUCTURED_ENTITY_RULES = [
  [/spacecraft/i, 'Spacecraft'],
  [/crew|astronaut/i, 'CrewMember'],
  [/launch/i, 'LaunchWindow'],
  [/telemetry/i, 'TelemetryFeed'],
  [/payload/i, 'Payload'],
  [/experiment|research\s+oper/i, 'Experiment'],
  [/partner|agency/i, 'PartnerAgency'],
  [/communication\s+log/i, 'CommunicationLog'],
  [/drone|delivery\s+fleet/i, 'Drone'],
  [/mission|flight/i, 'Mission'],
  [/maintenance/i, 'MaintenanceLog'],
  [/incident/i, 'Incident'],
  [/deliver|package/i, 'Delivery'],
  [/research\s+project|project\s+management/i, 'ResearchProject'],
  [/grant/i, 'Grant'],
  [/publication|repository/i, 'Publication'],
  [/peer\s+review|review\s+center/i, 'PeerReview'],
  [/equipment|booking/i, 'EquipmentBooking'],
  [/budget/i, 'Budget'],
  [/partnership|industry\s+partner/i, 'Partnership'],
  [/customer|client/i, 'Customer'],
  [/ticket|support/i, 'Ticket'],
  [/inventory|stock|product/i, 'Product'],
  [/order|invoice/i, 'Order'],
  [/employee|staff|hr|onboarding/i, 'Employee'],
  [/contact/i, 'Contact'],
  [/deal|opportunit/i, 'Deal'],
  [/task/i, 'Task'],
  [/metric|analytic|report/i, 'Metric'],
  [/approval|request/i, 'ApprovalRequest'],
  [/user|role|admin/i, 'User'],
];

function collectEntitiesFromText(text, bucket) {
  for (const [re, entity] of STRUCTURED_ENTITY_RULES) {
    if (re.test(text)) bucket.add(entity);
  }
}

export function inferEntitiesFromStructuredPrompt(parsed, promptText = '') {
  const entities = new Set();
  for (const page of parsed.pages || []) collectEntitiesFromText(page, entities);
  for (const feature of parsed.features || []) collectEntitiesFromText(feature, entities);
  for (const role of parsed.roles || []) collectEntitiesFromText(role, entities);
  collectEntitiesFromText(promptText, entities);
  if (!entities.size) entities.add('Record');
  entities.add('User');
  return [...new Set([...entities].filter(Boolean))];
}

export function inferAppTypeFromPrompt(promptText, parsed, entities) {
  const p = String(promptText || '').toLowerCase();
  if (isSpaceMissionPrompt(promptText)) return 'space_mission';
  if (isWaterUtilityPrompt(promptText)) return 'utilities';
  if (isFleetOrLogisticsPrompt(promptText)) return 'fleet_management';
  if (/research|university|scholar|professor|grant|publication|peer\s+review/i.test(p)) return 'research_platform';
  if (entities.some(e => /ResearchProject|Grant|Publication|PeerReview/.test(e))) return 'research_platform';
  if (matchesSalesCrmIntent(promptText)) return 'crm';
  if (matchesProjectManagementIntent(promptText)) return 'project_management';
  if (/inventory|stock|supplier/i.test(p)) return 'inventory';
  if (/hr|employee|leave/i.test(p)) return 'hr_tool';
  if (/ecommerce|shop|storefront/i.test(p)) return 'ecommerce';
  if (/support\s+portal|help\s+desk/i.test(p)) return 'client_portal';
  if (isStandaloneDashboardPrompt(promptText, parsed)) return 'dashboard';
  return 'custom';
}

export function shouldPrioritizeStructuredIntent(parsed) {
  return parsed.pages.length >= 2
    || (parsed.pages.length >= 1 && parsed.roles.length >= 2 && parsed.features.length >= 2)
    || (parsed.roles.length >= 2 && parsed.features.length >= 3 && parsed.businessRules.length >= 2);
}

export function buildStructuredIntent(trimmed, parsed, integrations, templateName = null, templateCategory = null) {
  if (!shouldPrioritizeStructuredIntent(parsed)) return null;

  let entities = inferEntitiesFromStructuredPrompt(parsed, trimmed);
  const appType = inferAppTypeFromPrompt(trimmed, parsed, entities);
  if (appType === 'space_mission') {
    entities = [...new Set([...SPACE_MISSION_ENTITIES, ...entities])];
  }
  const appName = extractAppTitle(trimmed) || 'Custom App';

  return {
    appName,
    appType,
    tagline: parsed.features?.[0] || trimmed.slice(0, 120),
    features: parsed.features.length ? parsed.features : ['role-based access', 'structured workflows', 'search and filters'],
    entities,
    roles: parsed.roles.length ? parsed.roles : undefined,
    integrations_requested: integrations,
    assumptions: parsed.businessRules.length ? parsed.businessRules : ['Built from your structured prompt sections'],
    requestedPages: parsed.pages,
    businessRules: parsed.businessRules,
    authRequirements: parsed.authLines,
    templateName: templateName || undefined,
    templateCategory: templateCategory || undefined,
  };
}

export function buildPagesFromPromptList(pageNames, entities, appName) {
  const list = (pageNames || []).filter(Boolean);
  if (!list.length) return null;

  const pages = list.map(name => {
    const layout = inferLayoutForPage(name);
    const boundEntity = layout === 'dashboard' ? null : inferEntityForPage(name, entities);
    const components = layout === 'dashboard'
      ? ['StatCards', 'Chart', 'TrendChart']
      : layout === 'kanban'
        ? ['KanbanBoard', 'Filters']
        : layout === 'form'
          ? ['RecordForm']
          : ['DataTable', 'Search', 'Filters'];

    return {
      name,
      route: pageNameToRoute(name),
      layout,
      boundEntity,
      components,
      title: name,
      description: `${name} for ${appName}`,
    };
  });

  const sidebar = pages.map(p => ({
    label: p.name,
    route: p.route,
    icon: p.layout === 'dashboard' ? 'dashboard' : (p.boundEntity || p.name).toLowerCase(),
  }));

  return { pages, sidebar, defaultRoute: pages[0]?.route || '/' };
}
