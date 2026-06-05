/**
 * Build workflow stubs + integration hooks from intent.integrations_requested.
 */

const INTEGRATION_ACTIONS = {
  slack: { action: 'send_channel_message', name: 'Slack notification', payload: { channel: '#general', message: '{{record.name}} updated' } },
  stripe: { action: 'create_payment_intent', name: 'Stripe payment', payload: { amount: '{{record.amount}}', currency: 'usd' } },
  gmail: { action: 'send_email', name: 'Email notification', payload: { subject: 'Update from app', to: 'team@company.com' } },
  whatsapp: { action: 'send_template', name: 'WhatsApp alert', payload: { to: '{{record.phone}}', template: 'status_update' } },
  hubspot: { action: 'upsert_contact', name: 'HubSpot sync', payload: { email: '{{record.email}}' } },
  salesforce: { action: 'upsert_lead', name: 'Salesforce sync', payload: { email: '{{record.email}}' } },
  notion: { action: 'create_page', name: 'Notion page', payload: { title: '{{record.name}}' } },
  google_sheets: { action: 'append_row', name: 'Google Sheets row', payload: { sheet: 'Records' } },
  gsheets: { action: 'append_row', name: 'Google Sheets row', payload: { sheet: 'Records' } },
  webhook: { action: 'post', name: 'Webhook dispatch', payload: { url: 'https://example.com/hook' } },
  twilio: { action: 'send_sms', name: 'Twilio SMS', payload: { to: '{{record.phone}}' } },
};

export function buildIntegrationStubs(intent, entityNames = []) {
  const primary = entityNames.find(e => e !== 'User') || entityNames[0] || 'Record';
  const requested = intent?.integrations_requested || [];
  const stubs = [];

  for (const integration of requested) {
    const id = integration === 'gsheets' ? 'google_sheets' : integration;
    const def = INTEGRATION_ACTIONS[integration] || INTEGRATION_ACTIONS[id];
    if (!def) continue;
    stubs.push({
      id: `ws-${integration}-1`,
      name: def.name,
      integration,
      action: def.action,
      trigger: { entity: primary, event: 'created' },
      triggerEntity: primary,
      triggerEvent: 'created',
      payloadSchema: def.payload,
      enabled: true,
    });
  }

  return stubs;
}

export function buildIntegrationHooks(workflowStubs = []) {
  return workflowStubs.map(ws => ({
    integration: ws.integration,
    integrationId: ws.integration,
    entity: ws.trigger?.entity || ws.triggerEntity,
    action: ws.action,
    payloadSchema: ws.payloadSchema,
    status: 'configured',
  }));
}

/** Extra preview pages when payments / messaging integrations are requested. */
export function buildIntegrationPages(intent) {
  const pages = [];
  const sidebar = [];
  const req = new Set(intent?.integrations_requested || []);

  if (req.has('stripe')) {
    pages.push({
      name: 'Payments',
      route: '/payments',
      layout: 'list',
      boundEntity: null,
      components: ['StripeCheckout', 'PaymentTable'],
      title: 'Payments',
      description: 'Stripe payment intents and checkout (preview mode)',
    });
    sidebar.push({ label: 'Payments', route: '/payments', icon: 'billing' });
  }

  if (req.has('slack') || req.has('whatsapp') || req.has('gmail')) {
    pages.push({
      name: 'Notifications',
      route: '/notifications',
      layout: 'list',
      boundEntity: null,
      components: ['WorkflowLog'],
      title: 'Notification log',
      description: 'Workflow triggers for connected channels',
    });
    sidebar.push({ label: 'Notifications', route: '/notifications', icon: 'inbox' });
  }

  return { pages, sidebar };
}
