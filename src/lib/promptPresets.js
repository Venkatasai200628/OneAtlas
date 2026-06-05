/** Full evaluation prompts — used by suggestion chips and templates */

export const CHIP_PROMPTS = {
  'Sales CRM':
    'Build a CRM for a sales team. Manage contacts, deals with pipeline stages, activity tracking, and an admin analytics dashboard. Send a Slack message when a deal closes.',
  'KPI Dashboard':
    'Build a KPI dashboard with real-time metrics, revenue tracking, team performance charts, and exportable executive reports.',
  'Employee Onboarding App':
    'Build an employee onboarding hub with checklists, document uploads, manager approvals, and progress tracking for new hires.',
  'Customer Support Portal':
    'Build a customer support portal where users submit tickets, track status, browse a knowledge base, and receive email updates.',
  'Inventory Tracker':
    'Build an inventory system with products, stock movements, supplier records, and email alerts when stock drops below reorder threshold.',
  'Approval Workflow':
    'Build an approval workflow system. Employees submit requests, managers approve or reject, with audit trail and Slack notifications on approval.',
};

export const TEMPLATE_PROMPTS = {
  'AI Support Agent': 'Build an AI support agent with ticket routing, knowledge base search, automated responses, and admin analytics.',
  'AI Chatbot': 'Build a conversational AI chatbot with context memory, multi-turn dialogue, and admin conversation review.',
  'AI Research Assistant': 'Build a research assistant with document upload, source citations, summarization, and project folders for teams.',
  'AI Workflow Copilot': 'Build an AI workflow app that automates multi-step business processes with human-in-the-loop approvals and Slack notifications.',
  'AI Document Analyzer': 'Build a document analyzer that extracts entities, tables, and summaries from PDFs with review queues.',
  'AI Content Generator': 'Build a content studio with briefs, drafts, brand voice presets, and approval workflows.',
  'KPI Dashboard': CHIP_PROMPTS['KPI Dashboard'],
  'SaaS Analytics Dashboard': 'Build a SaaS metrics dashboard with MRR, churn, LTV, cohort charts, and Stripe revenue sync.',
  'Revenue Tracker': 'Build a revenue tracker with forecasts, quotas, and team leaderboard.',
  'Marketing Analytics': 'Build a marketing analytics hub with campaign ROI, channel attribution, and UTM breakdowns.',
  'Executive Reports': 'Build executive reporting with scheduled PDF exports and board-ready KPI tiles.',
  'Live Monitoring Dashboard': 'Build an operations dashboard with uptime, alerts, incident timeline, and on-call rotations.',
  'Sales Pipeline CRM': CHIP_PROMPTS['Sales CRM'],
  'Lead Tracker': 'Build a lead tracker with scoring, nurture stages, and HubSpot-style pipeline views.',
  'Client Management': 'Build client management with accounts, projects, invoices, and activity timelines.',
  'Customer Success Dashboard': 'Build a customer success workspace with health scores, renewals, and expansion plays.',
  'Deal Management Tool': 'Build a deal room with documents, e-signatures, and approval chains.',
  'Proposal Generator': 'Build a proposal generator with templates, pricing tables, and client acceptance tracking.',
  'Admin Panel': 'Build an admin panel with user management, role-based access control, audit logs, and org settings.',
  'Approval Workflow': CHIP_PROMPTS['Approval Workflow'],
  'Team Workspace': 'Build a team workspace with tasks, docs, mentions, and project channels.',
  'Operations Tracker': 'Build an operations tracker with SLAs, escalations, and daily standup boards.',
  'Resource Planner': 'Build a resource planner with capacity, allocations, and conflict detection.',
  'Company Knowledge Base': 'Build an internal wiki with search, versioning, and role-based spaces.',
  'Inventory Manager': CHIP_PROMPTS['Inventory Tracker'],
  'Order Tracking System': 'Build order tracking with fulfillment statuses, carriers, and returns.',
  'Product Catalog': 'Build a product catalog with variants, media galleries, and SEO fields.',
  'Customer Portal': CHIP_PROMPTS['Customer Support Portal'],
  'Project Management Tool': 'Build a project management tool with tasks, milestones, Gantt view, assignees, and Slack alerts when tasks are overdue.',
  'Task Tracker': 'Task manager for an engineering team. Tasks have priorities, assignees, due dates, and status columns. Slack message to team lead when a task is overdue.',
  'Sprint Planner': 'Build a sprint planner with backlog grooming, velocity charts, and retrospectives.',
  'Vendor Marketplace': 'Build a B2B vendor marketplace with RFQs, vendor scoring, and procurement approvals.',
  'Booking Platform': 'Build a booking platform with availability calendars, payments, and confirmation emails.',
};

export const CATEGORY_PROMPTS = {
  internal_tool: 'Build an internal tool with role-based access, record management, search, filters, and export. Include a focused workflow — not a generic admin dashboard.',
  dashboard: CHIP_PROMPTS['KPI Dashboard'],
  client_portal: CHIP_PROMPTS['Customer Support Portal'],
  crm: CHIP_PROMPTS['Sales CRM'],
  ai_workflow: 'Build an AI workflow app that automates multi-step business processes with human-in-the-loop approvals and Slack notifications.',
  admin_panel: 'Build an admin panel with user management, roles, audit logs, org settings, and security controls.',
};

export function getTemplatePrompt(name, desc) {
  return TEMPLATE_PROMPTS[name] || `Build a ${name}. ${desc}. Include authentication, database, dashboard, and one-click deployment.`;
}
