/**
 * Certification / benchmark prompts — stable IDs for deployments & evaluation.
 * 6 normal cases + 6 edge cases (12 total).
 */

export const EVAL_PROMPTS = [
  { id: 1, cat: 'normal', label: 'CRM Basic', prompt: 'Build a CRM with customer management, deal pipeline tracking, and contact history' },
  { id: 2, cat: 'normal', label: 'E-Commerce', prompt: 'Create an e-commerce platform with products, shopping cart, orders, and Stripe payments' },
  { id: 3, cat: 'normal', label: 'Project Mgmt', prompt: 'Build a project management tool with tasks, milestones, team assignments, and Slack notifications' },
  { id: 4, cat: 'normal', label: 'HR Tool', prompt: 'Create an HR platform with employee profiles, leave requests, performance reviews, and WhatsApp notifications' },
  { id: 5, cat: 'normal', label: 'Inventory', prompt: 'Build an inventory management system with products, suppliers, stock levels, and webhook reorder alerts' },
  { id: 6, cat: 'normal', label: 'Content Platform', prompt: 'Create a content management platform with articles, authors, categories, comments, and Gmail notifications' },
  { id: 7, cat: 'edge', label: 'Vague Prompt', prompt: 'make an app' },
  { id: 8, cat: 'edge', label: 'Long Complex', prompt: 'Build an enterprise CRM with multi-stage deal pipeline (Prospecting/Qualification/Proposal/Negotiation/Closed), contact management, email tracking, calendar integration, sales forecasting, territory management, custom fields, RBAC with admin/manager/rep roles, Slack notifications, HubSpot sync, Stripe billing, WhatsApp outreach, and analytics dashboard' },
  { id: 9, cat: 'edge', label: 'Many Integrations', prompt: 'Build a sales tool with Slack, Stripe, HubSpot, WhatsApp, Gmail integrations and a deal tracking pipeline' },
  { id: 10, cat: 'edge', label: 'Unusual Domain', prompt: 'Build an astrology-based professional matchmaking app with zodiac profiles, compatibility scoring, connection requests, and Slack community notifications' },
  { id: 11, cat: 'edge', label: 'Minimal', prompt: 'Build a SaaS' },
  { id: 12, cat: 'edge', label: 'Complex Relations', prompt: 'Build a hospital management system with patients, doctors, appointments, departments, medical records, prescriptions, billing, and WhatsApp appointment reminders' },
];

export const NORMAL_EVAL_PROMPTS = EVAL_PROMPTS.filter(p => p.cat === 'normal');
export const EDGE_EVAL_PROMPTS = EVAL_PROMPTS.filter(p => p.cat === 'edge');
