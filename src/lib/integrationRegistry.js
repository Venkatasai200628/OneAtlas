
export const INTEGRATION_REGISTRY = {
  slack: {
    id: 'slack',
    displayName: 'Slack',
    authType: 'oauth2',
    description: 'Send messages, DMs, and formatted blocks to Slack channels.',
    triggers: [
      { id: 'record_created',  label: 'Record Created' },
      { id: 'record_updated',  label: 'Record Updated' },
      { id: 'status_changed',  label: 'Status Changed' },
    ],
    actions: [
      {
        id: 'send_channel_message',
        label: 'Send Channel Message',
        inputSchema: { channel: 'string', text: 'string', username: 'string?' },
        outputSchema: { ts: 'string', ok: 'boolean' },
      },
      {
        id: 'send_dm',
        label: 'Send Direct Message',
        inputSchema: { user: 'string', text: 'string' },
        outputSchema: { ts: 'string', ok: 'boolean' },
      },
      {
        id: 'post_block',
        label: 'Post Formatted Block',
        inputSchema: { channel: 'string', blocks: 'Block[]' },
        outputSchema: { ts: 'string', ok: 'boolean' },
      },
    ],
  },

  stripe: {
    id: 'stripe',
    displayName: 'Stripe',
    authType: 'api_key',
    description: 'Handle payments, subscriptions, customers, and refunds.',
    triggers: [
      { id: 'payment_succeeded', label: 'Payment Succeeded' },
      { id: 'subscription_created', label: 'Subscription Created' },
      { id: 'subscription_cancelled', label: 'Subscription Cancelled' },
    ],
    actions: [
      {
        id: 'create_customer',
        label: 'Create Customer',
        inputSchema: { email: 'string', name: 'string', metadata: 'object?' },
        outputSchema: { id: 'string', email: 'string' },
      },
      {
        id: 'create_payment_intent',
        label: 'Create Payment Intent',
        inputSchema: { amount: 'number', currency: 'string', customer_id: 'string?' },
        outputSchema: { payment_intent_id: 'string', client_secret: 'string' },
      },
      {
        id: 'create_charge',
        label: 'Create Charge',
        inputSchema: { amount: 'number', currency: 'string', customer: 'string' },
        outputSchema: { id: 'string', status: 'string' },
      },
      {
        id: 'issue_refund',
        label: 'Issue Refund',
        inputSchema: { charge: 'string', amount: 'number?' },
        outputSchema: { id: 'string', status: 'string' },
      },
      {
        id: 'create_subscription',
        label: 'Create Subscription',
        inputSchema: { customer: 'string', price: 'string' },
        outputSchema: { id: 'string', status: 'string' },
      },
    ],
  },

  hubspot: {
    id: 'hubspot',
    displayName: 'HubSpot',
    authType: 'oauth2',
    description: 'Sync CRM contacts, deals, and sequences with HubSpot.',
    triggers: [
      { id: 'contact_created', label: 'Contact Created' },
      { id: 'deal_stage_changed', label: 'Deal Stage Changed' },
    ],
    actions: [
      {
        id: 'create_contact',
        label: 'Create Contact',
        inputSchema: { email: 'string', firstname: 'string', lastname: 'string', phone: 'string?' },
        outputSchema: { id: 'string', email: 'string' },
      },
      {
        id: 'update_deal_stage',
        label: 'Update Deal Stage',
        inputSchema: { dealId: 'string', stage: 'string' },
        outputSchema: { id: 'string', stage: 'string' },
      },
      {
        id: 'add_to_sequence',
        label: 'Add to Sequence',
        inputSchema: { contactId: 'string', sequenceId: 'string' },
        outputSchema: { enrollmentId: 'string' },
      },
    ],
  },

  salesforce: {
    id: 'salesforce',
    displayName: 'Salesforce',
    authType: 'oauth2',
    description: 'Create and sync Leads, Contacts, Opportunities, and Accounts.',
    triggers: [
      { id: 'crm_entity_synced', label: 'CRM Entity Synced' },
      { id: 'opportunity_closed', label: 'Opportunity Closed' },
    ],
    actions: [
      {
        id: 'create_lead',
        label: 'Create Lead',
        inputSchema: { FirstName: 'string', LastName: 'string', Email: 'string', Company: 'string' },
        outputSchema: { id: 'string', success: 'boolean' },
      },
      {
        id: 'create_opportunity',
        label: 'Create Opportunity',
        inputSchema: { Name: 'string', StageName: 'string', CloseDate: 'string', Amount: 'number?' },
        outputSchema: { id: 'string', success: 'boolean' },
      },
      {
        id: 'update_account',
        label: 'Update Account',
        inputSchema: { id: 'string', fields: 'object' },
        outputSchema: { id: 'string', success: 'boolean' },
      },
    ],
  },

  whatsapp: {
    id: 'whatsapp',
    displayName: 'WhatsApp (via Twilio)',
    authType: 'api_key',
    description: 'Send WhatsApp template messages and notifications via Twilio.',
    triggers: [
      { id: 'user_action', label: 'User Action in App' },
      { id: 'status_changed', label: 'Status Changed' },
    ],
    actions: [
      {
        id: 'send_template_message',
        label: 'Send Template Message',
        inputSchema: { to: 'string', templateSid: 'string', variables: 'object' },
        outputSchema: { sid: 'string', status: 'string' },
      },
      {
        id: 'send_notification',
        label: 'Send Notification',
        inputSchema: { to: 'string', body: 'string' },
        outputSchema: { sid: 'string', status: 'string' },
      },
    ],
  },

  gmail: {
    id: 'gmail',
    displayName: 'Gmail / Google Workspace',
    authType: 'oauth2',
    description: 'Send emails, create calendar events, update Google Sheets.',
    triggers: [
      { id: 'record_event', label: 'Record Event' },
    ],
    actions: [
      {
        id: 'send_email',
        label: 'Send Email',
        inputSchema: { to: 'string', subject: 'string', body: 'string', cc: 'string?' },
        outputSchema: { messageId: 'string', threadId: 'string' },
      },
      {
        id: 'create_calendar_event',
        label: 'Create Calendar Event',
        inputSchema: { summary: 'string', start: 'string', end: 'string', attendees: 'string[]?' },
        outputSchema: { eventId: 'string', htmlLink: 'string' },
      },
      {
        id: 'update_sheet',
        label: 'Update Google Sheet',
        inputSchema: { spreadsheetId: 'string', range: 'string', values: 'any[][]' },
        outputSchema: { updatedRange: 'string', updatedRows: 'number' },
      },
    ],
  },

  notion: {
    id: 'notion',
    displayName: 'Notion',
    authType: 'oauth2',
    description: 'Create pages, append blocks, and update Notion databases.',
    triggers: [
      { id: 'data_change', label: 'Data Change' },
      { id: 'record_created', label: 'Record Created' },
    ],
    actions: [
      {
        id: 'create_page',
        label: 'Create Page',
        inputSchema: { parent: 'string', title: 'string', properties: 'object?' },
        outputSchema: { id: 'string', url: 'string' },
      },
      {
        id: 'update_database_row',
        label: 'Update Database Row',
        inputSchema: { pageId: 'string', properties: 'object' },
        outputSchema: { id: 'string', lastEditedTime: 'string' },
      },
      {
        id: 'append_block',
        label: 'Append Block',
        inputSchema: { pageId: 'string', blocks: 'Block[]' },
        outputSchema: { results: 'Block[]' },
      },
    ],
  },

  twilio_sms: {
    id: 'twilio_sms',
    displayName: 'Twilio SMS',
    authType: 'api_key',
    description: 'Send SMS notifications and trigger OTP flows.',
    triggers: [
      { id: 'user_action', label: 'User Action' },
      { id: 'status_changed', label: 'Status Changed' },
    ],
    actions: [
      {
        id: 'send_sms',
        label: 'Send SMS',
        inputSchema: { to: 'string', body: 'string', from: 'string?' },
        outputSchema: { sid: 'string', status: 'string' },
      },
      {
        id: 'trigger_otp',
        label: 'Trigger OTP Flow',
        inputSchema: { to: 'string', channel: 'string' },
        outputSchema: { sid: 'string', status: 'string' },
      },
    ],
  },

  webhook: {
    id: 'webhook',
    displayName: 'Webhook (Generic)',
    authType: 'webhook_secret',
    description: 'POST a signed payload to any configured URL on any trigger.',
    triggers: [
      { id: 'any', label: 'Any Trigger' },
    ],
    actions: [
      {
        id: 'post_payload',
        label: 'POST Payload',
        inputSchema: { url: 'string', payload: 'object', secret: 'string?' },
        outputSchema: { status: 'number', body: 'string' },
      },
    ],
  },

  google_sheets: {
    id: 'google_sheets',
    displayName: 'Google Sheets',
    authType: 'oauth2',
    description: 'Append rows, update cells, create new sheet tabs on data export events.',
    triggers: [
      { id: 'data_export', label: 'Data Export Event' },
      { id: 'record_created', label: 'Record Created' },
    ],
    actions: [
      {
        id: 'append_row',
        label: 'Append Row',
        inputSchema: { spreadsheetId: 'string', sheetName: 'string', values: 'any[]' },
        outputSchema: { updatedRange: 'string', updatedRows: 'number' },
      },
      {
        id: 'update_cell',
        label: 'Update Cell',
        inputSchema: { spreadsheetId: 'string', range: 'string', value: 'any' },
        outputSchema: { updatedRange: 'string' },
      },
      {
        id: 'create_sheet_tab',
        label: 'Create Sheet Tab',
        inputSchema: { spreadsheetId: 'string', title: 'string' },
        outputSchema: { sheetId: 'number', title: 'string' },
      },
    ],
  },

  airtable: {
    id: 'airtable',
    displayName: 'Airtable',
    authType: 'api_key',
    description: '[STUB] Create records, update fields, trigger automations.',
    _stub: true,
    triggers: [{ id: 'record_event', label: 'Record Event' }],
    actions: [
      { id: 'create_record', label: 'Create Record', inputSchema: { baseId: 'string', tableId: 'string', fields: 'object' }, outputSchema: { id: 'string' } },
    ],
  },

  jira: {
    id: 'jira',
    displayName: 'Jira',
    authType: 'api_key',
    description: '[STUB] Create issues, update status, add comments, assign users.',
    _stub: true,
    triggers: [{ id: 'task_event', label: 'Task/Issue Event' }],
    actions: [
      { id: 'create_issue', label: 'Create Issue', inputSchema: { projectKey: 'string', summary: 'string', issueType: 'string' }, outputSchema: { id: 'string', key: 'string' } },
    ],
  },

  github: {
    id: 'github',
    displayName: 'GitHub',
    authType: 'api_key',
    description: '[STUB] Create issues, comment on PRs, trigger workflow dispatch.',
    _stub: true,
    triggers: [{ id: 'dev_workflow', label: 'Dev Workflow Trigger' }],
    actions: [
      { id: 'create_issue', label: 'Create Issue', inputSchema: { owner: 'string', repo: 'string', title: 'string', body: 'string?' }, outputSchema: { number: 'number', url: 'string' } },
    ],
  },

  zapier: {
    id: 'zapier',
    displayName: 'Zapier',
    authType: 'webhook_secret',
    description: '[STUB] Send structured payload to Zapier webhook URL.',
    _stub: true,
    triggers: [{ id: 'any', label: 'Any Trigger' }],
    actions: [
      { id: 'send_payload', label: 'Send Payload to Zapier', inputSchema: { webhookUrl: 'string', payload: 'object' }, outputSchema: { status: 'number' } },
    ],
  },
};

export function getIntegration(id) {
  return INTEGRATION_REGISTRY[id] || null;
}

export function validateIntegrationRef(integrationId, actionId) {
  const integration = INTEGRATION_REGISTRY[integrationId];
  if (!integration) return { valid: false, error: `Integration "${integrationId}" is not registered` };
  const action = integration.actions.find(a => a.id === actionId);
  if (!action) return { valid: false, error: `Action "${actionId}" not found in integration "${integrationId}"` };
  return { valid: true };
}
