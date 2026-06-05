/** Derive unique visual identity per prompt + app type (not one purple theme for everything). */

import { resolveTemplateStyle } from './templateStyles.js';

/** Stable colors per app type — avoids every build looking like the same CRM shell. */
const APP_TYPE_STYLES = {
  space_mission: { primary: '#1e3a8a', accent: '#38bdf8', surface: '#eff6ff', shell: 'sidebar' },
  utilities: { primary: '#0369a1', accent: '#22d3ee', surface: '#ecfeff', shell: 'sidebar' },
  fleet_management: { primary: '#b45309', accent: '#fbbf24', surface: '#fffbeb', shell: 'sidebar' },
  research_platform: { primary: '#6d28d9', accent: '#a78bfa', surface: '#f5f3ff', shell: 'topnav' },
  crm: { primary: '#4f46e5', accent: '#818cf8', surface: '#eef2ff', shell: 'sidebar' },
  project_management: { primary: '#0f766e', accent: '#2dd4bf', surface: '#f0fdfa', shell: 'sidebar' },
  ecommerce: { primary: '#059669', accent: '#34d399', surface: '#ecfdf5', shell: 'sidebar' },
  hr_tool: { primary: '#be185d', accent: '#f472b6', surface: '#fdf2f8', shell: 'sidebar' },
  inventory: { primary: '#ca8a04', accent: '#facc15', surface: '#fefce8', shell: 'sidebar' },
  content_platform: { primary: '#7c2d12', accent: '#fb923c', surface: '#fff7ed', shell: 'topnav' },
  client_portal: { primary: '#0891b2', accent: '#22d3ee', surface: '#ecfeff', shell: 'minimal' },
  dashboard: { primary: '#7c3aed', accent: '#c084fc', surface: '#f5f3ff', shell: 'topnav' },
  analytics: { primary: '#4338ca', accent: '#818cf8', surface: '#eef2ff', shell: 'topnav' },
};

const STYLE_PRESETS = [
  { id: 'aurora', primary: '#6366f1', accent: '#a78bfa', surface: '#f5f3ff', shell: 'sidebar', font: 'Inter' },
  { id: 'ocean', primary: '#0ea5e9', accent: '#22d3ee', surface: '#f0f9ff', shell: 'sidebar', font: 'Inter' },
  { id: 'forest', primary: '#10b981', accent: '#34d399', surface: '#ecfdf5', shell: 'topnav', font: 'Inter' },
  { id: 'sunset', primary: '#f97316', accent: '#fb923c', surface: '#fff7ed', shell: 'sidebar', font: 'Inter' },
  { id: 'rose', primary: '#e11d48', accent: '#fb7185', surface: '#fff1f2', shell: 'minimal', font: 'Inter' },
  { id: 'slate', primary: '#475569', accent: '#64748b', surface: '#f8fafc', shell: 'sidebar', font: 'Inter' },
  { id: 'violet', primary: '#7c3aed', accent: '#a78bfa', surface: '#f5f3ff', shell: 'topnav', font: 'Inter' },
  { id: 'teal', primary: '#0d9488', accent: '#2dd4bf', surface: '#f0fdfa', shell: 'sidebar', font: 'Inter' },
  { id: 'amber', primary: '#d97706', accent: '#fbbf24', surface: '#fffbeb', shell: 'minimal', font: 'Inter' },
  { id: 'indigo', primary: '#4f46e5', accent: '#818cf8', surface: '#eef2ff', shell: 'sidebar', font: 'Inter' },
];

function hashString(s) {
  let h = 0;
  const str = String(s || '');
  for (let i = 0; i < str.length; i++) h = ((h << 5) - h) + str.charCodeAt(i) | 0;
  return Math.abs(h);
}

export function resolveDesignSystem({ prompt = '', appType = 'custom', templateName = null, templateCategory = null, appName = '' } = {}) {
  // Template selection locks visuals — prompt/app name must not change colors.
  if (templateName) {
    const templateStyle = resolveTemplateStyle(templateName, templateCategory);
    if (templateStyle) {
      return {
        primaryColor: templateStyle.primary,
        accentColor: templateStyle.accent,
        surfaceColor: templateStyle.surface,
        shellStyle: templateStyle.shell,
        fontFamily: templateStyle.fontFamily || 'Inter',
        theme: 'both',
        designStyle: templateStyle.templateKey || templateName,
        templateName,
        templateCategory: templateCategory || null,
        appName,
      };
    }
  }

  const typeStyle = APP_TYPE_STYLES[appType];
  if (typeStyle) {
    return {
      primaryColor: typeStyle.primary,
      accentColor: typeStyle.accent,
      surfaceColor: typeStyle.surface,
      shellStyle: typeStyle.shell,
      fontFamily: 'Inter',
      theme: 'both',
      designStyle: appType,
      appName,
    };
  }

  const preset = STYLE_PRESETS[hashString(`${prompt}|${appType}|${appName}`) % STYLE_PRESETS.length];
  return {
    primaryColor: preset.primary,
    accentColor: preset.accent,
    surfaceColor: preset.surface,
    shellStyle: preset.shell,
    fontFamily: preset.font,
    theme: 'both',
    designStyle: preset.id,
    appName,
  };
}
