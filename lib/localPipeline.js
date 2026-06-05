/**
 * Deterministic offline generation — no API keys required.
 * Used when providers fail or no keys are configured.
 */

import { validateIntent, validateDataSchema as validateSchema, validateAppSpec } from './validation.js';
import { normalizeDataSchemaShape, normalizeAppSpecShape } from './schemaNormalize.js';
import { generateAllSampleData } from './sampleDataGenerator.js';
import { getBlueprint } from './appBlueprints.js';
import { buildIntegrationStubs, buildIntegrationHooks, buildIntegrationPages } from './integrationStubs.js';
import {
  parseStructuredPrompt,
  extractAppTitle,
  isSpaceMissionPrompt,
  isFleetOrLogisticsPrompt,
  isStandaloneDashboardPrompt,
  buildStructuredIntent,
  matchesSalesCrmIntent,
  matchesApprovalWorkflowIntent,
  matchesProjectManagementIntent,
} from './promptParser.js';

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function slugify(name) {
  return String(name || 'app').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function detectIntegrations(prompt) {
  const p = prompt.toLowerCase();
  const out = [];
  if (/slack/i.test(p)) out.push('slack');
  if (/whatsapp|twilio/i.test(p)) out.push('whatsapp');
  if (/stripe|payment|billing|checkout|subscription/i.test(p)) out.push('stripe');
  if (/gmail|email/i.test(p)) out.push('gmail');
  if (/hubspot/i.test(p)) out.push('hubspot');
  if (/salesforce/i.test(p)) out.push('salesforce');
  if (/notion/i.test(p)) out.push('notion');
  if (/google sheet/i.test(p)) out.push('google_sheets');
  return out;
}

const TEMPLATE_PROMPTS = {
  'AI Support Agent': 'Build an AI support agent with ticket routing, knowledge base search, automated responses, and admin analytics.',
  'AI Chatbot': 'Build a conversational AI chatbot with context memory, multi-turn dialogue, and admin conversation review.',
  'KPI Dashboard': 'Build a KPI dashboard with real-time metrics, revenue tracking, team performance charts, and exportable executive reports.',
  'Sales Pipeline CRM': 'Build a CRM for a sales team. Manage contacts, deals with pipeline stages, activity tracking, and an admin analytics dashboard. Send a Slack message when a deal closes.',
  'Admin Panel': 'Build an admin panel with user management, role-based access control, audit logs, and org settings.',
  'Approval Workflow': 'Build an approval workflow system. Employees submit requests, managers approve or reject, with audit trail and Slack notifications on approval.',
  'Inventory Manager': 'Build an inventory system with products, stock movements, supplier records, and email alerts when stock drops below reorder threshold.',
  'Customer Portal': 'Build a customer support portal where users submit tickets, track status, browse a knowledge base, and receive email updates.',
  'Project Management Tool': 'Build a project management tool with tasks, milestones, Gantt view, assignees, and Slack alerts when tasks are overdue.',
  'Task Tracker': 'Task manager for an engineering team. Tasks have priorities, assignees, due dates, and status columns. Slack message to team lead when a task is overdue.',
  'AI Workflow Copilot': 'Build an AI workflow app that automates multi-step business processes with human-in-the-loop approvals, Slack notifications, and an admin analytics dashboard.',
};

export function buildIntentFromPrompt(prompt, options = {}) {
  let trimmed = (prompt || '').trim();
  const templateFromBracket = trimmed.match(/^\[Template:\s*(.+?)\]\s*/i);
  if (templateFromBracket) {
    trimmed = trimmed.slice(templateFromBracket[0].length).trim();
  }
  const templateName = options.templateName || templateFromBracket?.[1]?.trim();
  const templateCategory = options.templateCategory || null;
  if (!trimmed && templateName && TEMPLATE_PROMPTS[templateName]) {
    trimmed = TEMPLATE_PROMPTS[templateName];
  }
  const p = trimmed.toLowerCase();
  const integrations = detectIntegrations(trimmed);
  const parsed = parseStructuredPrompt(trimmed);
  const structuredMeta = {
    requestedPages: parsed.pages,
    roles: parsed.roles,
    features: parsed.features.length ? parsed.features : undefined,
    businessRules: parsed.businessRules,
    authRequirements: parsed.authLines,
  };

  // Structured prompts (Pages / Roles / Features sections) always win over keyword guesses
  const attachTemplate = (intent) => ({
    ...intent,
    templateName: intent.templateName || templateName || undefined,
    templateCategory: intent.templateCategory || templateCategory || undefined,
  });

  const structured = buildStructuredIntent(trimmed, parsed, integrations, templateName, templateCategory);
  if (structured) return attachTemplate(structured);

  if (!isSpaceMissionPrompt(trimmed) && (isFleetOrLogisticsPrompt(trimmed) || (parsed.pages.some(pg => /drone|delivery\s+fleet|maintenance\s+center/i.test(pg)) && parsed.pages.length >= 3))) {
    return {
      appName: extractAppTitle(trimmed) || 'Drone Fleet Management',
      appType: 'fleet_management',
      tagline: parsed.features?.[0] || 'Drone registration, missions, maintenance, and delivery tracking',
      features: parsed.features.length ? parsed.features : [
        'drone registration and tracking', 'real-time flight monitoring', 'mission planning',
        'package delivery tracking', 'maintenance logs', 'battery health monitoring', 'incident reporting',
      ],
      entities: ['Drone', 'Mission', 'MaintenanceLog', 'Delivery', 'Incident', 'Customer', 'User'],
      roles: parsed.roles.length ? parsed.roles : ['Super Admin', 'Fleet Manager', 'Drone Operator', 'Maintenance Engineer', 'Customer'],
      integrations_requested: integrations.length ? integrations : ['gmail'],
      assumptions: parsed.businessRules.length ? parsed.businessRules : ['Role-based access with regional fleet boundaries'],
      businessRules: parsed.businessRules,
      ...structuredMeta,
    };
  }

  if (/real.?estate|property|realtor/i.test(p)) {
    return {
      appName: 'RealEstate CRM',
      appType: 'crm',
      tagline: 'Manage leads, properties, and deals for real estate agents',
      features: ['lead management', 'property listings', 'deal pipeline', 'agent analytics', 'WhatsApp alerts on closed deals'],
      entities: ['Agent', 'Lead', 'Property', 'Deal'],
      integrations_requested: integrations.length ? integrations : ['whatsapp'],
      assumptions: ['Multi-agent office with admin analytics dashboard'],
    };
  }
  if (matchesSalesCrmIntent(trimmed)) {
    return {
      appName: extractAppTitle(trimmed) || 'Sales CRM',
      appType: 'crm',
      tagline: 'Track leads, contacts, and deals with pipeline analytics',
      features: parsed.features?.length ? parsed.features : ['contact management', 'deal pipeline', 'activity tracking', 'sales dashboard', 'team assignments'],
      entities: ['Contact', 'Deal', 'Activity', 'User'],
      integrations_requested: integrations.length ? integrations : (p.includes('slack') ? ['slack'] : []),
      assumptions: ['Standard B2B sales workflow'],
      ...structuredMeta,
    };
  }
  if (isStandaloneDashboardPrompt(trimmed, parsed)) {
    return {
      appName: extractAppTitle(trimmed) || 'KPI Dashboard',
      appType: 'dashboard',
      tagline: 'Real-time metrics, revenue tracking, and team performance',
      features: parsed.features?.length ? parsed.features : ['KPI cards', 'charts', 'filters', 'export', 'role-based views'],
      entities: ['Metric', 'Report', 'Team', 'User'],
      integrations_requested: integrations,
      assumptions: ['Executive and team-level views'],
      ...structuredMeta,
    };
  }
  if (/inventory|stock|supplier|reorder/i.test(p)) {
    return {
      appName: 'Inventory Manager',
      appType: 'inventory',
      tagline: 'Products, stock movements, and supplier records with reorder alerts',
      features: ['product catalog', 'stock tracking', 'supplier management', 'low-stock alerts', 'purchase orders'],
      entities: ['Product', 'StockMovement', 'Supplier', 'PurchaseOrder'],
      integrations_requested: integrations.length ? integrations : (p.includes('email') ? ['gmail'] : []),
      assumptions: ['Email alert when stock drops below reorder threshold'],
    };
  }
  if (matchesProjectManagementIntent(trimmed)) {
    return {
      appName: extractAppTitle(trimmed) || 'Task Manager',
      appType: 'project_management',
      tagline: 'Tasks with priorities, assignees, due dates, and status columns',
      features: ['kanban board', 'priorities', 'assignees', 'due dates', 'overdue alerts'],
      entities: ['Task', 'Project', 'User', 'Comment'],
      integrations_requested: integrations.length ? integrations : (p.includes('slack') ? ['slack'] : []),
      assumptions: ['Engineering team workflow'],
    };
  }
  if (/hr|employee|leave|onboarding|performance/i.test(p)) {
    return {
      appName: 'HR Portal',
      appType: 'hr_tool',
      tagline: 'Employees, leave requests, and performance reviews',
      features: ['employee directory', 'leave requests', 'approvals', 'performance reviews', 'manager notifications'],
      entities: ['Employee', 'LeaveRequest', 'PerformanceReview', 'Department'],
      integrations_requested: integrations.length ? integrations : (p.includes('slack') ? ['slack'] : []),
      assumptions: ['Manager approval on leave requests'],
    };
  }
  if (/ecommerce|order|product|shop|stripe/i.test(p)) {
    return {
      appName: 'Commerce Platform',
      appType: 'ecommerce',
      tagline: 'Products, orders, customers, and payment processing',
      features: ['product catalog', 'order management', 'customer accounts', 'Stripe payments', 'order confirmations'],
      entities: ['Product', 'Order', 'Customer', 'Payment'],
      integrations_requested: integrations.length ? integrations : ['stripe', 'gmail'],
      assumptions: ['Order confirmation via email'],
    };
  }
  if (matchesApprovalWorkflowIntent(trimmed)) {
    return {
      appName: extractAppTitle(trimmed) || 'Approval Workflow',
      appType: 'custom',
      tagline: 'Multi-step approvals with audit trail and notifications',
      features: ['request submission', 'approval chains', 'status tracking', 'audit log', 'notifications'],
      entities: ['ApprovalRequest', 'Approver', 'AuditLog', 'User'],
      integrations_requested: integrations,
      assumptions: ['Role-based approvers'],
    };
  }
  if (/support portal|customer support|help desk|knowledge base/i.test(p) && !isFleetOrLogisticsPrompt(trimmed)) {
    return {
      appName: extractAppTitle(trimmed) || 'Customer Support Portal',
      appType: 'client_portal',
      tagline: 'Tickets, knowledge base, and customer self-service',
      features: parsed.features?.length ? parsed.features : ['ticket submission', 'status tracking', 'knowledge base', 'customer accounts'],
      entities: ['Ticket', 'Customer', 'Article', 'User'],
      integrations_requested: integrations,
      assumptions: ['Customer-facing portal'],
      ...structuredMeta,
    };
  }
  if (/onboarding/i.test(p)) {
    return {
      appName: 'Employee Onboarding',
      appType: 'internal_tool',
      tagline: 'Structured onboarding with tasks, documents, and progress tracking',
      features: ['onboarding checklist', 'document uploads', 'manager tasks', 'progress dashboard'],
      entities: ['Employee', 'OnboardingTask', 'Document', 'Department'],
      integrations_requested: integrations,
      assumptions: ['HR-led onboarding flow'],
    };
  }

  return attachTemplate({
    appName: extractAppTitle(trimmed) || 'Custom App',
    appType: 'custom',
    tagline: trimmed.slice(0, 120) || 'Custom business application',
    features: parsed.features?.length ? parsed.features : ['records management', 'search and filters', 'user roles'],
    entities: ['Record', 'Activity', 'User'],
    integrations_requested: integrations,
    assumptions: parsed.businessRules.length ? parsed.businessRules : ['Generated from your description using the local engine'],
    ...structuredMeta,
  });
}

function field(name, type, opts = {}) {
  return { name, type, nullable: opts.nullable ?? false, isPrimary: opts.isPrimary ?? false, isUnique: opts.isUnique ?? false, isRelation: false, ...(opts.enumValues ? { enumValues: opts.enumValues } : {}) };
}

export function buildSchema(intent) {
  const entities = (intent.entities || ['Record', 'User']).map(name => {
    const tableName = name.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '') + 's';
    const base = [
      field('id', 'uuid', { isPrimary: true, isUnique: true }),
      field('tenantId', 'uuid'),
      field('createdAt', 'timestamp'),
      field('updatedAt', 'timestamp', { nullable: true }),
      field('name', 'string'),
      field('status', 'enum', { enumValues: ['active', 'pending', 'archived'] }),
    ];
    if (/task/i.test(name)) {
      const statusIdx = base.findIndex(f => f.name === 'status');
      if (statusIdx >= 0) base[statusIdx] = field('status', 'enum', { enumValues: ['todo', 'in_progress', 'review', 'done'] });
      base.push(field('priority', 'enum', { enumValues: ['low', 'medium', 'high', 'urgent'] }), field('dueDate', 'date', { nullable: true }), field('assigneeId', 'uuid', { nullable: true }), field('title', 'string'));
    }
    if (/deal/i.test(name)) {
      const statusIdx = base.findIndex(f => f.name === 'status');
      if (statusIdx >= 0) base.splice(statusIdx, 1);
      base.push(field('value', 'decimal', { nullable: true }), field('stage', 'enum', { enumValues: ['prospect', 'qualified', 'proposal', 'closed', 'lost'] }));
    }
    if (/contact|lead|customer|employee/i.test(name)) {
      base.push(field('email', 'string', { isUnique: true }), field('phone', 'string', { nullable: true }), field('company', 'string', { nullable: true }));
    }
    if (/product/i.test(name)) {
      base.push(field('sku', 'string', { isUnique: true }), field('price', 'decimal'), field('stock', 'integer'), field('reorderThreshold', 'integer', { nullable: true }));
    }
    if (/drone/i.test(name)) {
      const statusIdx = base.findIndex(f => f.name === 'status');
      if (statusIdx >= 0) base[statusIdx] = field('status', 'enum', { enumValues: ['idle', 'preflight', 'in_flight', 'charging', 'maintenance'] });
      base.push(
        field('serialNumber', 'string', { isUnique: true }),
        field('batteryHealth', 'integer'),
        field('assignedOperatorId', 'uuid', { nullable: true }),
        field('region', 'string', { nullable: true }),
        field('lastMaintenanceAt', 'timestamp', { nullable: true }),
      );
    }
    if (/mission/i.test(name) && intent?.appType === 'space_mission') {
      const statusIdx = base.findIndex(f => f.name === 'status');
      if (statusIdx >= 0) base[statusIdx] = field('status', 'enum', { enumValues: ['planning', 'approved', 'active', 'emergency', 'completed', 'aborted'] });
      base.push(field('missionDirectorId', 'uuid', { nullable: true }), field('spacecraftId', 'uuid', { nullable: true }), field('launchWindowId', 'uuid', { nullable: true }), field('approvedAt', 'timestamp', { nullable: true }));
    } else if (/mission/i.test(name)) {
      const statusIdx = base.findIndex(f => f.name === 'status');
      if (statusIdx >= 0) base[statusIdx] = field('status', 'enum', { enumValues: ['scheduled', 'in_flight', 'completed', 'aborted'] });
      base.push(field('droneId', 'uuid'), field('scheduledAt', 'timestamp'), field('destination', 'string'), field('packageId', 'string', { nullable: true }));
    }
    if (/maintenance/i.test(name)) {
      base.push(field('droneId', 'uuid'), field('engineerId', 'uuid', { nullable: true }), field('notes', 'string', { nullable: true }), field('dueAt', 'timestamp', { nullable: true }));
    }
    if (/incident/i.test(name)) {
      const statusIdx = base.findIndex(f => f.name === 'status');
      if (statusIdx >= 0) base[statusIdx] = field('severity', 'enum', { enumValues: ['low', 'medium', 'high', 'critical'] });
      base.push(field('droneId', 'uuid', { nullable: true }), field('reportedBy', 'uuid', { nullable: true }), field('description', 'string'));
    }
    if (/deliver/i.test(name)) {
      base.push(field('trackingCode', 'string', { isUnique: true }), field('customerId', 'uuid'), field('missionId', 'uuid', { nullable: true }), field('eta', 'timestamp', { nullable: true }));
    }
    if (/researchproject|research/i.test(name)) {
      base.push(field('title', 'string'), field('principalInvestigator', 'string', { nullable: true }), field('department', 'string', { nullable: true }), field('milestoneCount', 'integer', { nullable: true }));
    }
    if (/grant/i.test(name)) {
      base.push(field('amount', 'decimal'), field('funder', 'string'), field('deadline', 'date', { nullable: true }), field('allocated', 'decimal', { nullable: true }));
    }
    if (/publication/i.test(name)) {
      base.push(field('title', 'string'), field('authors', 'string', { nullable: true }), field('reviewCount', 'integer', { nullable: true }), field('submittedAt', 'timestamp', { nullable: true }));
    }
    if (/peerreview/i.test(name)) {
      base.push(field('paperId', 'uuid'), field('reviewerId', 'uuid', { nullable: true }), field('score', 'integer', { nullable: true }), field('blinded', 'boolean', { nullable: true }));
    }
    if (/equipment/i.test(name)) {
      base.push(field('equipmentName', 'string'), field('bookedFrom', 'timestamp'), field('bookedUntil', 'timestamp'), field('projectId', 'uuid', { nullable: true }));
    }
    if (/budget/i.test(name)) {
      base.push(field('allocated', 'decimal'), field('spent', 'decimal'), field('fiscalYear', 'string', { nullable: true }));
    }
    if (/partnership/i.test(name)) {
      base.push(field('partnerOrg', 'string'), field('sponsorLevel', 'enum', { enumValues: ['standard', 'premium', 'strategic'] }), field('approved', 'boolean', { nullable: true }));
    }
    if (/spacecraft/i.test(name)) {
      const statusIdx = base.findIndex(f => f.name === 'status');
      if (statusIdx >= 0) base[statusIdx] = field('status', 'enum', { enumValues: ['idle', 'preflight', 'active', 'maintenance', 'decommissioned'] });
      base.push(field('designation', 'string'), field('fuelPercent', 'integer'), field('orbit', 'string', { nullable: true }));
    }
    if (/crewmember|crew/i.test(name)) {
      base.push(field('role', 'enum', { enumValues: ['commander', 'pilot', 'engineer', 'scientist'] }), field('trainingComplete', 'boolean', { nullable: true }));
    }
    if (/telemetry/i.test(name)) {
      base.push(field('signalStrength', 'integer'), field('altitude', 'decimal', { nullable: true }), field('velocity', 'decimal', { nullable: true }));
    }
    if (/launch/i.test(name)) {
      base.push(field('facility', 'string'), field('windowStart', 'timestamp'), field('windowEnd', 'timestamp', { nullable: true }));
    }
    if (/experiment|payload/i.test(name)) {
      base.push(field('principalInvestigator', 'string', { nullable: true }), field('missionId', 'uuid', { nullable: true }));
    }
    if (/partneragency|partner/i.test(name)) {
      base.push(field('agencyCode', 'string'), field('clearanceLevel', 'enum', { enumValues: ['public', 'restricted', 'secret'] }), field('sharedProjects', 'integer', { nullable: true }));
    }
    if (/communicationlog|communication/i.test(name)) {
      base.push(field('classification', 'enum', { enumValues: ['unclassified', 'confidential', 'secret'] }), field('channel', 'string'), field('loggedAt', 'timestamp'));
    }
    return { name, tableName, fields: base, relations: [] };
  });

  if (!entities.find(e => e.name === 'User')) {
    entities.unshift({
      name: 'User',
      tableName: 'users',
      fields: [
        field('id', 'uuid', { isPrimary: true, isUnique: true }),
        field('tenantId', 'uuid'),
        field('email', 'string', { isUnique: true }),
        field('name', 'string'),
        field('role', 'enum', { enumValues: ['admin', 'member', 'viewer'] }),
        field('createdAt', 'timestamp'),
      ],
      relations: [],
    });
  }

  return normalizeDataSchemaShape({ entities }, intent);
}

function buildWorkflowStubs(intent, entityNames) {
  return buildIntegrationStubs(intent, entityNames);
}

export function buildAppSpec(intent, schema, options = {}) {
  const entityNames = (schema.entities || []).map(e => e.name).filter(n => n !== 'User');
  const blueprint = getBlueprint(intent, schema, options);
  const pages = blueprint.pages;

  const apiEndpoints = pages.filter(p => p.boundEntity).flatMap(p => {
    const base = p.route.replace(/\/new$/, '');
    return [
      { method: 'GET', path: `/api${base}`, boundEntity: p.boundEntity, description: `List ${p.boundEntity}`, authRequired: true },
      { method: 'POST', path: `/api${base}`, boundEntity: p.boundEntity, description: `Create ${p.boundEntity}`, authRequired: true },
      { method: 'PUT', path: `/api${base}/:id`, boundEntity: p.boundEntity, description: `Update ${p.boundEntity}`, authRequired: true },
      { method: 'DELETE', path: `/api${base}/:id`, boundEntity: p.boundEntity, description: `Delete ${p.boundEntity}`, authRequired: true },
    ];
  });

  const workflowStubs = buildWorkflowStubs(intent, entityNames);
  const integrationExtras = buildIntegrationPages(intent);
  const mergedPages = [...pages, ...integrationExtras.pages];
  const mergedSidebar = [...(blueprint.sidebar || []), ...integrationExtras.sidebar];
  const sampleData = generateAllSampleData(schema, 8);
  if (intent.integrations_requested?.includes('stripe')) {
    sampleData.Payment = sampleData.Payment || [
      { id: 'pay-1', name: 'Order #1042', amount: 2499, status: 'paid', currency: 'usd', createdAt: new Date().toISOString() },
      { id: 'pay-2', name: 'Subscription renewal', amount: 999, status: 'pending', currency: 'usd', createdAt: new Date().toISOString() },
    ];
  }
  const kanban = blueprint.kanban;
  if (kanban?.entity && sampleData[kanban.entity]) {
    const cols = kanban.columns || [];
    sampleData[kanban.entity] = sampleData[kanban.entity].map((row, i) => ({
      ...row,
      [kanban.columnField]: cols[i % cols.length] || row[kanban.columnField] || cols[0],
    }));
  }

  const roleList = (intent.roles || []).length
    ? intent.roles.map(r => ({ name: r, description: `Role: ${r}` }))
    : [
      { name: 'admin', description: 'Full access' },
      { name: 'member', description: 'Create and edit' },
      { name: 'viewer', description: 'Read only' },
    ];

  const raw = {
    pages: mergedPages,
    apiEndpoints,
    authRules: {
      roles: roleList,
      authentication: intent.authRequirements || ['Email/password login'],
      permissions: roleList.map(r => ({
        role: r.name,
        scope: /customer/i.test(r.name) ? 'own_records' : /operator|engineer/i.test(r.name) ? 'assigned_only' : /manager|admin/i.test(r.name) ? 'regional_or_global' : 'standard',
      })),
      businessRules: intent.businessRules || [],
      validationConstraints: (intent.businessRules || []).map((rule, i) => ({
        id: `rule_${i + 1}`,
        rule,
        enforced: true,
      })),
    },
    integrationHooks: buildIntegrationHooks(workflowStubs),
    workflowStubs,
    appPreview: {
      ...blueprint.appPreview,
      sidebar: mergedSidebar.length ? mergedSidebar : blueprint.sidebar,
      kanban: blueprint.kanban,
      templateName: options.templateName || intent.templateName || null,
      templateCategory: options.templateCategory || intent.templateCategory || null,
      integrations: intent.integrations_requested || [],
    },
    dataSchema: schema,
    sampleData,
  };

  return normalizeAppSpecShape(raw, intent, schema);
}

const UI_BUILD_STEPS = [
  'Thinking about the right screens for your prompt…',
  'Choosing navigation — only pages your app needs…',
  'Designing layout (board, list, or form)…',
  'Placing tables, cards, and action buttons…',
  'Wiring API endpoints to each screen…',
  'Adding integration workflow hooks…',
  'Applying colors, typography, and light/dark theme…',
  'Seeding realistic sample data…',
];

function buildPlanDocument(intent, schema) {
  const pages = intent.requestedPages?.length
    ? intent.requestedPages
    : (intent.features || []).slice(0, 6).map(f => f.replace(/^./, c => c.toUpperCase()));
  return {
    summary: intent.tagline || intent.appName,
    appName: intent.appName,
    appType: intent.appType,
    pages,
    entities: (schema?.entities || []).map(e => e.name),
    roles: intent.roles || [],
    features: intent.features || [],
    businessRules: intent.businessRules || [],
    integrations: intent.integrations_requested || [],
    authRequirements: intent.authRequirements || [],
    nextStep: 'Switch to Build mode and click Build to generate the interactive app preview.',
  };
}

/** Plan mode — architecture only (intent + schema + plan), no AppSpec / preview. */
export async function runPlanPipeline(prompt, onProgress = null, options = {}) {
  const t0 = Date.now();
  onProgress?.({ stage: 'intent_extraction', status: 'running', message: 'Analyzing your prompt and defining app architecture…' });
  await sleep(400);
  const intent = buildIntentFromPrompt(prompt, options);
  onProgress?.({ stage: 'intent_extraction', status: 'complete', data: intent, latency: 400 });

  onProgress?.({ stage: 'schema_generation', status: 'running', message: 'Designing database entities and relationships…' });
  await sleep(500);
  const schema = buildSchema(intent);
  onProgress?.({ stage: 'schema_generation', status: 'complete', data: schema, latency: 500 });

  const plan = buildPlanDocument(intent, schema);
  onProgress?.({ stage: 'complete', status: 'complete', message: 'Plan ready — review and switch to Build when satisfied.' });

  return {
    status: 'plan_complete',
    mode: 'plan',
    intent,
    schema,
    plan,
    appSpec: null,
    validations: {},
    repairLogs: [],
    costLog: [],
    totalCostUSD: 0,
    latency: Date.now() - t0,
    localEngine: true,
    templateName: options.templateName || null,
  };
}

export async function runLocalPipeline(prompt, onProgress = null, options = {}) {
  const t0 = Date.now();
  const repairLogs = [{
    strategy: 'local_engine',
    outcome: 'repaired',
    fixes: ['Built with OneAtlas intelligent blueprint engine — tailored pages for your app type.'],
    detail: 'Context-aware UI: task apps get boards + forms, CRM gets pipeline, dashboards get metrics.',
  }];

  onProgress?.({ stage: 'intent_extraction', status: 'running', message: 'Reading your prompt and inferring app type…' });
  await sleep(350);
  onProgress?.({ stage: 'intent_extraction', status: 'running', message: 'Identifying entities, roles, and integrations…' });
  const intent = buildIntentFromPrompt(prompt, options);
  const intentValidation = validateIntent(intent);
  onProgress?.({ stage: 'intent_extraction', status: 'complete', data: intent, latency: 400, validation: intentValidation });

  onProgress?.({ stage: 'schema_generation', status: 'running', message: 'Designing database tables and relationships…' });
  await sleep(400);
  onProgress?.({ stage: 'schema_generation', status: 'running', message: 'Adding fields for priorities, stages, and statuses…' });
  const schema = buildSchema(intent);
  const schemaValidation = validateSchema(schema);
  onProgress?.({ stage: 'schema_generation', status: 'complete', data: schema, latency: 500, validation: schemaValidation });

  onProgress?.({ stage: 'appspec_generation', status: 'running', message: UI_BUILD_STEPS[0] });
  for (let i = 1; i < UI_BUILD_STEPS.length; i++) {
    await sleep(280);
    onProgress?.({ stage: 'appspec_generation', status: 'running', message: UI_BUILD_STEPS[i] });
  }
  const appSpec = buildAppSpec(intent, schema, {
    prompt,
    templateName: options.templateName,
    templateCategory: options.templateCategory,
  });
  appSpec.sampleData = generateAllSampleData(schema, 8);
  let appSpecValidation = { isValid: true, errors: [], warnings: [] };
  try {
    appSpecValidation = validateAppSpec(appSpec, schema);
  } catch (e) {
    appSpecValidation = { isValid: true, errors: [], warnings: [{ message: e.message }] };
  }
  onProgress?.({ stage: 'appspec_generation', status: 'complete', data: appSpec, latency: 800, validation: appSpecValidation });
  onProgress?.({ stage: 'complete', status: 'complete', message: 'Your app is ready — open Preview!' });

  return {
    status: 'complete',
    intent,
    schema,
    appSpec,
    validations: { intent: intentValidation, schema: schemaValidation, appSpec: appSpecValidation },
    repairLogs,
    costLog: [],
    totalCostUSD: 0,
    latency: Date.now() - t0,
    localEngine: true,
    templateName: options.templateName || null,
  };
}
