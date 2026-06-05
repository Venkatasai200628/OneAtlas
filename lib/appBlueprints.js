/**
 * Context-aware UI blueprints — each app type gets purpose-built pages, not a generic sidebar template.
 */

import { resolveDesignSystem } from './designSystem.js';
import { buildPagesFromPromptList } from './promptParser.js';

function slugify(name) {
  return String(name || 'app').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function inferKanbanEntity(pages, entities) {
  const kanbanPage = pages.find(p => p.layout === 'kanban');
  return kanbanPage?.boundEntity || entities[0] || 'Record';
}

function statsForEntities(sampleKeys, primary) {
  return sampleKeys.slice(0, 4).map((key, i) => ({
    label: key.replace(/([A-Z])/g, ' $1').toUpperCase().trim(),
    valueKey: key,
    icon: key.toLowerCase(),
    format: i === 2 ? 'sum' : 'count',
    field: i === 2 ? 'value' : undefined,
  }));
}

export function getBlueprint(intent, schema, options = {}) {
  const { prompt = '', templateName = null, templateCategory = null } = options;
  const effectiveTemplate = templateName || intent?.templateName || null;
  const effectiveCategory = templateCategory || intent?.templateCategory || null;
  const type = intent?.appType || 'custom';
  const entities = (schema?.entities || []).map(e => e.name).filter(n => n !== 'User');
  const primary = entities[0] || 'Record';
  const appName = intent?.appName || 'App';
  const design = resolveDesignSystem({
    prompt,
    appType: type,
    templateName: effectiveTemplate,
    templateCategory: effectiveCategory,
    appName,
  });

  const basePreview = {
    ...design,
    appName,
    tagline: intent?.tagline || '',
  };

  // Explicit Pages: section from prompt wins over generic blueprints
  if (intent?.requestedPages?.length >= 2) {
    const custom = buildPagesFromPromptList(intent.requestedPages, entities, appName);
    if (custom?.pages?.length) {
      return {
        pages: custom.pages,
        sidebar: custom.sidebar,
        appPreview: {
          ...basePreview,
          defaultRoute: custom.defaultRoute,
          dashboardStats: statsForEntities(entities, primary),
          heroTitle: intent.tagline?.slice(0, 60) || appName,
        },
        kanban: custom.pages.find(p => p.layout === 'kanban')
          ? {
            entity: inferKanbanEntity(custom.pages, entities),
            columnField: 'status',
            columns: type === 'space_mission'
              ? ['planning', 'approved', 'active', 'emergency', 'completed']
              : ['scheduled', 'in_flight', 'completed', 'aborted'],
          }
          : undefined,
      };
    }
  }

  if (type === 'fleet_management') {
    const droneEntity = entities.find(e => /drone/i.test(e)) || 'Drone';
    const missionEntity = entities.find(e => /mission/i.test(e)) || 'Mission';
    return {
      pages: [
        { name: 'Dashboard', route: '/', layout: 'dashboard', boundEntity: null, components: ['StatCards', 'Chart', 'AlertFeed'], title: 'Fleet Dashboard', description: 'Active drones, missions, and alerts' },
        { name: 'Fleet Overview', route: '/fleet', layout: 'kanban', boundEntity: droneEntity, components: ['KanbanBoard', 'BatteryGauge'], title: 'Fleet Overview', description: 'Drone status by region and assignment' },
        { name: 'Drone Details', route: '/drones', layout: 'list', boundEntity: droneEntity, components: ['DataTable', 'Search', 'BatteryGauge'], title: 'Drone Registry', description: 'Registration, battery health, maintenance state' },
        { name: 'Mission Planner', route: '/missions', layout: 'list', boundEntity: missionEntity, components: ['DataTable', 'MissionScheduler'], title: 'Mission Planner', description: 'Schedule and assign delivery missions' },
        { name: 'Maintenance Center', route: '/maintenance', layout: 'list', boundEntity: entities.find(e => /maintenance/i.test(e)) || 'MaintenanceLog', components: ['DataTable', 'MaintenanceForm'], title: 'Maintenance Center', description: 'Logs, overdue checks, engineer updates' },
        { name: 'Incident Management', route: '/incidents', layout: 'list', boundEntity: entities.find(e => /incident/i.test(e)) || 'Incident', components: ['DataTable', 'SeverityBadge'], title: 'Incidents', description: 'Report and track critical events' },
        { name: 'Customer Deliveries', route: '/deliveries', layout: 'list', boundEntity: entities.find(e => /deliver/i.test(e)) || 'Delivery', components: ['DataTable', 'TrackingMap'], title: 'Customer Deliveries', description: 'Package tracking for customers' },
        { name: 'Analytics & Reports', route: '/analytics', layout: 'dashboard', boundEntity: null, components: ['StatCards', 'Chart', 'ExportButton'], title: 'Analytics', description: 'Fleet utilization and SLA metrics' },
        { name: 'User Management', route: '/users', layout: 'list', boundEntity: 'User', components: ['DataTable', 'RoleBadge'], title: 'Users & Roles', description: 'Super Admin, Fleet Manager, Operator roles' },
      ],
      sidebar: [
        { label: 'Dashboard', route: '/', icon: 'dashboard' },
        { label: 'Fleet Overview', route: '/fleet', icon: 'fleet' },
        { label: 'Drones', route: '/drones', icon: 'drone' },
        { label: 'Missions', route: '/missions', icon: 'missions' },
        { label: 'Maintenance', route: '/maintenance', icon: 'maintenance' },
        { label: 'Incidents', route: '/incidents', icon: 'incidents' },
        { label: 'Deliveries', route: '/deliveries', icon: 'deliveries' },
        { label: 'Analytics', route: '/analytics', icon: 'analytics' },
        { label: 'Users', route: '/users', icon: 'users' },
      ],
      appPreview: { ...basePreview, defaultRoute: '/', dashboardStats: statsForEntities(entities, droneEntity), heroTitle: 'Command your fleet' },
      kanban: { entity: droneEntity, columnField: 'status', columns: ['idle', 'preflight', 'in_flight', 'charging', 'maintenance'] },
    };
  }

  if (type === 'project_management' || (/task/i.test(primary) && type !== 'fleet_management')) {
    const taskEntity = entities.find(e => /task/i.test(e)) || primary;
    return {
      pages: [
        { name: 'Board', route: '/board', layout: 'kanban', boundEntity: taskEntity, components: ['KanbanBoard', 'Filters'], title: 'Task Board', description: 'Drag tasks across status columns' },
        { name: 'All Tasks', route: '/tasks', layout: 'list', boundEntity: taskEntity, components: ['DataTable', 'Search', 'Filters'], title: 'All Tasks', description: 'Search and filter every task' },
        { name: 'New Task', route: '/tasks/new', layout: 'form', boundEntity: taskEntity, components: ['TaskForm'], title: 'New Task', description: 'Create a task with priority, assignee, and due date' },
      ],
      sidebar: [
        { label: 'Board', route: '/board', icon: 'tasks' },
        { label: 'All Tasks', route: '/tasks', icon: 'tasks' },
        { label: 'New Task', route: '/tasks/new', icon: 'plus' },
      ],
      appPreview: { ...basePreview, defaultRoute: '/board', heroTitle: 'Ship work on time' },
      kanban: { entity: taskEntity, columnField: 'status', columns: ['todo', 'in_progress', 'review', 'done'] },
    };
  }

  if (type === 'crm' || /deal|contact|lead/i.test(entities.join(' '))) {
    const dealEntity = entities.find(e => /deal/i.test(e)) || 'Deal';
    const contactEntity = entities.find(e => /contact|lead/i.test(e)) || entities[0];
    return {
      pages: [
        { name: 'Pipeline', route: '/pipeline', layout: 'kanban', boundEntity: dealEntity, components: ['PipelineBoard', 'DealCards'], title: 'Sales Pipeline', description: 'Deals by stage — drag to advance' },
        { name: 'Contacts', route: '/contacts', layout: 'list', boundEntity: contactEntity, components: ['DataTable', 'Search'], title: 'Contacts', description: 'Manage leads and contacts' },
        { name: 'Analytics', route: '/analytics', layout: 'dashboard', boundEntity: null, components: ['StatCards', 'Chart'], title: 'Analytics', description: 'Revenue and pipeline metrics' },
        { name: 'New Deal', route: '/deals/new', layout: 'form', boundEntity: dealEntity, components: ['DealForm'], title: 'New Deal', description: 'Log a new opportunity' },
      ],
      sidebar: [
        { label: 'Pipeline', route: '/pipeline', icon: 'pipeline' },
        { label: 'Contacts', route: '/contacts', icon: 'contacts' },
        { label: 'Analytics', route: '/analytics', icon: 'analytics' },
        { label: 'New Deal', route: '/deals/new', icon: 'deals' },
      ],
      appPreview: {
        ...basePreview,
        defaultRoute: '/pipeline',
        dashboardStats: statsForEntities(entities, dealEntity),
        heroTitle: 'Close more deals',
      },
      kanban: { entity: dealEntity, columnField: 'stage', columns: ['prospect', 'qualified', 'proposal', 'closed', 'lost'] },
    };
  }

  if (type === 'dashboard' || /metric|kpi|analytics/i.test(intent?.features?.join(' ') || '')) {
    return {
      pages: [
        { name: 'Overview', route: '/', layout: 'dashboard', boundEntity: null, components: ['StatCards', 'Chart', 'TrendChart'], title: 'KPI Overview', description: 'Real-time performance metrics' },
        { name: 'Reports', route: '/reports', layout: 'list', boundEntity: entities.find(e => /report|metric/i.test(e)) || primary, components: ['DataTable'], title: 'Reports', description: 'Saved reports and exports' },
      ],
      sidebar: [
        { label: 'Overview', route: '/', icon: 'dashboard' },
        { label: 'Reports', route: '/reports', icon: 'reports' },
      ],
      appPreview: {
        ...basePreview,
        defaultRoute: '/',
        dashboardStats: statsForEntities(entities, primary),
        heroTitle: 'Metrics at a glance',
      },
    };
  }

  if (type === 'inventory' || /product|stock/i.test(entities.join(' '))) {
    const productEntity = entities.find(e => /product/i.test(e)) || primary;
    return {
      pages: [
        { name: 'Products', route: '/products', layout: 'list', boundEntity: productEntity, components: ['DataTable', 'StockBadge'], title: 'Products', description: 'Catalog with stock levels' },
        { name: 'Low Stock', route: '/alerts', layout: 'list', boundEntity: productEntity, components: ['AlertList'], title: 'Low Stock Alerts', description: 'Items below reorder threshold' },
        { name: 'Add Product', route: '/products/new', layout: 'form', boundEntity: productEntity, components: ['ProductForm'], title: 'Add Product', description: 'Add SKU, price, and stock' },
      ],
      sidebar: [
        { label: 'Products', route: '/products', icon: 'products' },
        { label: 'Low Stock', route: '/alerts', icon: 'inventory' },
        { label: 'Add Product', route: '/products/new', icon: 'plus' },
      ],
      appPreview: { ...basePreview, defaultRoute: '/products', heroTitle: 'Stock under control' },
    };
  }

  if (type === 'ecommerce') {
    const orderEntity = entities.find(e => /order/i.test(e)) || primary;
    const productEntity = entities.find(e => /product/i.test(e)) || entities[0];
    return {
      pages: [
        { name: 'Orders', route: '/orders', layout: 'list', boundEntity: orderEntity, components: ['DataTable', 'StatusBadge'], title: 'Orders', description: 'Order fulfillment queue' },
        { name: 'Products', route: '/products', layout: 'list', boundEntity: productEntity, components: ['DataTable'], title: 'Products', description: 'Product catalog' },
        { name: 'Revenue', route: '/revenue', layout: 'dashboard', boundEntity: null, components: ['StatCards', 'Chart'], title: 'Revenue', description: 'Sales and payment summary' },
      ],
      sidebar: [
        { label: 'Orders', route: '/orders', icon: 'orders' },
        { label: 'Products', route: '/products', icon: 'products' },
        { label: 'Revenue', route: '/revenue', icon: 'revenue' },
      ],
      appPreview: { ...basePreview, defaultRoute: '/orders', heroTitle: 'Run your store' },
    };
  }

  if (type === 'hr_tool') {
    const leaveEntity = entities.find(e => /leave/i.test(e)) || entities[1] || primary;
    const empEntity = entities.find(e => /employee/i.test(e)) || primary;
    return {
      pages: [
        { name: 'Employees', route: '/employees', layout: 'list', boundEntity: empEntity, components: ['DataTable'], title: 'Employees', description: 'Team directory' },
        { name: 'Leave Requests', route: '/leave', layout: 'list', boundEntity: leaveEntity, components: ['DataTable', 'ApproveButton'], title: 'Leave Requests', description: 'Pending and approved leave' },
        { name: 'Request Leave', route: '/leave/new', layout: 'form', boundEntity: leaveEntity, components: ['LeaveForm'], title: 'Request Leave', description: 'Submit a new leave request' },
      ],
      sidebar: [
        { label: 'Employees', route: '/employees', icon: 'employees' },
        { label: 'Leave', route: '/leave', icon: 'inbox' },
        { label: 'Request Leave', route: '/leave/new', icon: 'plus' },
      ],
      appPreview: { ...basePreview, defaultRoute: '/employees', heroTitle: 'People operations' },
    };
  }

  if (type === 'client_portal') {
    const ticketEntity = entities.find(e => /ticket/i.test(e)) || primary;
    const articleEntity = entities.find(e => /article|knowledge/i.test(e)) || entities[1] || primary;
    return {
      pages: [
        { name: 'My Tickets', route: '/tickets', layout: 'list', boundEntity: ticketEntity, components: ['DataTable', 'StatusBadge'], title: 'My Tickets', description: 'Track support requests' },
        { name: 'Submit Ticket', route: '/tickets/new', layout: 'form', boundEntity: ticketEntity, components: ['TicketForm'], title: 'Submit Ticket', description: 'Describe your issue' },
        { name: 'Knowledge Base', route: '/kb', layout: 'list', boundEntity: articleEntity, components: ['DataTable', 'Search'], title: 'Knowledge Base', description: 'Self-service articles' },
        { name: 'Analytics', route: '/analytics', layout: 'dashboard', boundEntity: null, components: ['StatCards', 'Chart'], title: 'Support Analytics', description: 'Ticket volume and resolution time' },
      ],
      sidebar: [
        { label: 'My Tickets', route: '/tickets', icon: 'tickets' },
        { label: 'Submit Ticket', route: '/tickets/new', icon: 'plus' },
        { label: 'Knowledge Base', route: '/kb', icon: 'reports' },
        { label: 'Analytics', route: '/analytics', icon: 'analytics' },
      ],
      appPreview: { ...basePreview, defaultRoute: '/tickets', heroTitle: "We're here to help" },
    };
  }

  if (type === 'internal_tool' || /onboarding|internal/i.test(intent?.tagline || '')) {
    const recordEntity = entities.find(e => !/user/i.test(e)) || primary;
    const taskEntity = entities.find(e => /task|onboarding/i.test(e)) || entities[1] || recordEntity;
    return {
      pages: [
        { name: 'Overview', route: '/', layout: 'dashboard', boundEntity: null, components: ['StatCards', 'Chart'], title: 'Overview', description: 'Progress and activity summary' },
        { name: 'Records', route: `/${slugify(recordEntity)}s`, layout: 'list', boundEntity: recordEntity, components: ['DataTable', 'Search'], title: recordEntity + 's', description: `Manage ${recordEntity} records` },
        { name: 'Tasks', route: '/tasks', layout: 'list', boundEntity: taskEntity, components: ['DataTable', 'Filters'], title: 'Tasks', description: 'Workflow tasks and checklists' },
        { name: 'Add Record', route: `/${slugify(recordEntity)}s/new`, layout: 'form', boundEntity: recordEntity, components: ['RecordForm'], title: 'Add ' + recordEntity, description: `Create a new ${recordEntity}` },
        { name: 'Reports', route: '/reports', layout: 'list', boundEntity: entities.find(e => /report|audit/i.test(e)) || recordEntity, components: ['DataTable'], title: 'Reports', description: 'Exports and audit trail' },
      ],
      sidebar: [
        { label: 'Overview', route: '/', icon: 'dashboard' },
        { label: 'Records', route: `/${slugify(recordEntity)}s`, icon: recordEntity.toLowerCase() },
        { label: 'Tasks', route: '/tasks', icon: 'tasks' },
        { label: 'Add Record', route: `/${slugify(recordEntity)}s/new`, icon: 'plus' },
        { label: 'Reports', route: '/reports', icon: 'reports' },
      ],
      appPreview: { ...basePreview, defaultRoute: '/', dashboardStats: statsForEntities(entities, recordEntity), heroTitle: 'Internal operations' },
    };
  }

  if (/approval/i.test(prompt) || entities.some(e => /approval/i.test(e))) {
    const reqEntity = entities.find(e => /approval|request/i.test(e)) || primary;
    const auditEntity = entities.find(e => /audit/i.test(e)) || entities[1] || primary;
    return {
      pages: [
        { name: 'Inbox', route: '/inbox', layout: 'list', boundEntity: reqEntity, components: ['DataTable', 'ApproveButton'], title: 'Approval Inbox', description: 'Pending requests awaiting action' },
        { name: 'My Requests', route: '/requests', layout: 'list', boundEntity: reqEntity, components: ['DataTable', 'StatusBadge'], title: 'My Requests', description: 'Requests you submitted' },
        { name: 'New Request', route: '/requests/new', layout: 'form', boundEntity: reqEntity, components: ['RecordForm'], title: 'New Request', description: 'Submit for approval' },
        { name: 'Audit Log', route: '/audit', layout: 'list', boundEntity: auditEntity, components: ['DataTable'], title: 'Audit Log', description: 'Full approval history' },
        { name: 'Analytics', route: '/analytics', layout: 'dashboard', boundEntity: null, components: ['StatCards', 'Chart'], title: 'Analytics', description: 'Approval throughput and SLA' },
      ],
      sidebar: [
        { label: 'Inbox', route: '/inbox', icon: 'inbox' },
        { label: 'My Requests', route: '/requests', icon: 'tasks' },
        { label: 'New Request', route: '/requests/new', icon: 'plus' },
        { label: 'Audit Log', route: '/audit', icon: 'reports' },
        { label: 'Analytics', route: '/analytics', icon: 'analytics' },
      ],
      appPreview: { ...basePreview, defaultRoute: '/inbox', heroTitle: 'Approvals made simple' },
    };
  }

  // Fallback — richer default (5 screens) instead of only list + form
  const mainEntity = primary;
  const secondary = entities.find(e => e !== mainEntity && !/user/i.test(e)) || 'Activity';
  return {
    pages: [
      { name: 'Overview', route: '/', layout: 'dashboard', boundEntity: null, components: ['StatCards', 'Chart'], title: 'Overview', description: 'Summary metrics and trends' },
      { name: mainEntity + 's', route: `/${slugify(mainEntity)}s`, layout: 'list', boundEntity: mainEntity, components: ['DataTable', 'Search'], title: mainEntity + 's', description: `Manage ${mainEntity} records` },
      { name: secondary + 's', route: `/${slugify(secondary)}s`, layout: 'list', boundEntity: secondary, components: ['DataTable', 'Filters'], title: secondary + 's', description: `Browse ${secondary} records` },
      { name: 'Add ' + mainEntity, route: `/${slugify(mainEntity)}s/new`, layout: 'form', boundEntity: mainEntity, components: ['RecordForm'], title: 'Add ' + mainEntity, description: `Create a new ${mainEntity}` },
      { name: 'Analytics', route: '/analytics', layout: 'dashboard', boundEntity: null, components: ['StatCards', 'Chart'], title: 'Analytics', description: 'Charts and KPIs' },
    ],
    sidebar: [
      { label: 'Overview', route: '/', icon: 'dashboard' },
      { label: mainEntity + 's', route: `/${slugify(mainEntity)}s`, icon: mainEntity.toLowerCase() },
      { label: secondary + 's', route: `/${slugify(secondary)}s`, icon: secondary.toLowerCase() },
      { label: 'Add ' + mainEntity, route: `/${slugify(mainEntity)}s/new`, icon: 'plus' },
      { label: 'Analytics', route: '/analytics', icon: 'analytics' },
    ],
    appPreview: { ...basePreview, defaultRoute: '/', dashboardStats: statsForEntities(entities, mainEntity), heroTitle: appName },
  };
}
