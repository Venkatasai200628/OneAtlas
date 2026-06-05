/**
 * Stable visual identity per template name — same template → same colors every time.
 */

const SHELL_BY_CATEGORY = {
  'AI Apps': 'topnav',
  Dashboards: 'topnav',
  CRM: 'sidebar',
  'Internal Tools': 'sidebar',
  Marketplaces: 'topnav',
  Ecommerce: 'sidebar',
  Productivity: 'sidebar',
  'Client Apps': 'minimal',
};

function hashName(s) {
  let h = 0;
  for (let i = 0; i < String(s).length; i++) h = ((h << 5) - h) + String(s).charCodeAt(i) | 0;
  return Math.abs(h);
}

function hslToHex(h, s, l) {
  s /= 100;
  l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = n => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

/** Deterministic palette from template title (not prompt / app name). */
export function getTemplateVisual(templateName, templateCategory = null) {
  if (!templateName) return null;
  const h = Math.floor((hashName(templateName) * 137.508) % 360);
  const primary = hslToHex(h, 62, 42);
  const accent = hslToHex((h + 28) % 360, 70, 55);
  const surface = hslToHex(h, 45, 96);
  const shell = SHELL_BY_CATEGORY[templateCategory] || 'sidebar';
  return {
    primary,
    accent,
    surface,
    shell,
    templateKey: templateName,
    fontFamily: 'Inter',
  };
}
