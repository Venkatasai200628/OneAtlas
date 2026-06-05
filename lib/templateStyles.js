/** Consistent visual identity per template name + category fallback. */

import { getTemplateVisual } from './templateCatalog.js';

const CATEGORY_STYLES = {  'AI Apps': { primary: '#2563eb', accent: '#60a5fa', surface: '#eff6ff', shell: 'topnav' },
  Dashboards: { primary: '#7c3aed', accent: '#c084fc', surface: '#f5f3ff', shell: 'topnav' },
  CRM: { primary: '#4f46e5', accent: '#818cf8', surface: '#eef2ff', shell: 'sidebar' },
  'Internal Tools': { primary: '#334155', accent: '#64748b', surface: '#f8fafc', shell: 'sidebar' },
  Marketplaces: { primary: '#db2777', accent: '#f472b6', surface: '#fdf2f8', shell: 'topnav' },
  Ecommerce: { primary: '#059669', accent: '#34d399', surface: '#ecfdf5', shell: 'sidebar' },
  Productivity: { primary: '#0d9488', accent: '#2dd4bf', surface: '#f0fdfa', shell: 'sidebar' },
  'Client Apps': { primary: '#0891b2', accent: '#22d3ee', surface: '#ecfeff', shell: 'minimal' },
};

const TEMPLATE_STYLES = {
  'AI Support Agent': CATEGORY_STYLES['AI Apps'],
  'AI Chatbot': { primary: '#1d4ed8', accent: '#93c5fd', surface: '#eff6ff', shell: 'topnav' },
  'AI Workflow Copilot': { primary: '#d97706', accent: '#fbbf24', surface: '#fffbeb', shell: 'topnav' },
  'KPI Dashboard': CATEGORY_STYLES.Dashboards,
  'Sales Pipeline CRM': CATEGORY_STYLES.CRM,
  'Admin Panel': CATEGORY_STYLES['Internal Tools'],
  'Approval Workflow': { primary: '#475569', accent: '#94a3b8', surface: '#f8fafc', shell: 'sidebar' },
  'Inventory Manager': CATEGORY_STYLES.Ecommerce,
  'Customer Portal': CATEGORY_STYLES['Client Apps'],
  'Project Management Tool': CATEGORY_STYLES.Productivity,
  'Task Tracker': { primary: '#0f766e', accent: '#5eead4', surface: '#f0fdfa', shell: 'sidebar' },
};

const NAME_PALETTE = [
  { primary: '#2563eb', accent: '#60a5fa', surface: '#eff6ff', shell: 'topnav' },
  { primary: '#7c3aed', accent: '#c084fc', surface: '#f5f3ff', shell: 'sidebar' },
  { primary: '#db2777', accent: '#f472b6', surface: '#fdf2f8', shell: 'topnav' },
  { primary: '#0d9488', accent: '#2dd4bf', surface: '#f0fdfa', shell: 'sidebar' },
  { primary: '#ea580c', accent: '#fb923c', surface: '#fff7ed', shell: 'minimal' },
  { primary: '#4f46e5', accent: '#818cf8', surface: '#eef2ff', shell: 'sidebar' },
  { primary: '#0891b2', accent: '#22d3ee', surface: '#ecfeff', shell: 'topnav' },
  { primary: '#65a30d', accent: '#a3e635', surface: '#f7fee7', shell: 'sidebar' },
];

function hashName(s) {
  let h = 0;
  for (let i = 0; i < String(s).length; i++) h = ((h << 5) - h) + String(s).charCodeAt(i) | 0;
  return Math.abs(h);
}

export function resolveTemplateStyle(templateName, templateCategory = null) {
  if (templateName) {
    const catalog = getTemplateVisual(templateName, templateCategory);
    if (catalog) return catalog;
  }
  if (templateName && TEMPLATE_STYLES[templateName]) {
    return { ...TEMPLATE_STYLES[templateName], templateKey: templateName };
  }
  if (templateCategory && CATEGORY_STYLES[templateCategory]) {
    return { ...CATEGORY_STYLES[templateCategory], templateKey: `category-${templateCategory}` };
  }
  return null;
}
