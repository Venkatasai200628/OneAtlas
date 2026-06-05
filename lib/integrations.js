
export const INTEGRATION_REGISTRY = {
  slack: {
    id: 'slack',
    displayName: 'Slack',
    authType: 'oauth2',
    implemented: true,
    triggers: [
      { id: 'record_created',  label: 'Record Created',  entityEvents: ['created'] },
      { id: 'record_updated',  label: 'Record Updated',  entityEvents: ['updated'] },
      { id: 'status_changed',  label: 'Status Changed',  entityEvents: ['status_changed'] },
    ],
    actions: [
      {
        id: 'send_channel_message',
        label: 'Send Channel Message',
        description: 'Post a message to a Slack channel',
        inputSchema: {
          channel:     { type: 'string', required: true,  description: 'Channel name or ID (#general)' },
          text:        { type: 'string', required: true,  description: 'Message text, supports {{field}} interpolation' },
          username:    { type: 'string', required: false, description: 'Bot display name' },
          icon_emoji:  { type: 'string', required: false, description: 'Emoji icon for the bot (:robot_face:)' },
        },
        outputSchema: { ok: { type: 'boolean' }, ts: { type: 'string' } },
      },
      {
        id: 'send_dm',
        label: 'Send Direct Message',
        description: 'Send a DM to a Slack user',
        inputSchema: {
          user_email: { type: 'string', required: true,  description: 'Recipient email address' },
          text:       { type: 'string', required: true,  description: 'Message text' },
        },
        outputSchema: { ok: { type: 'boolean' } },
      },
      {
        id: 'post_block',
        label: 'Post Block Kit Message',
        description: 'Post a rich formatted Block Kit message',
        inputSchema: {
          channel: { type: 'string',  required: true, description: 'Channel name or ID' },
          blocks:  { type: 'array',   required: true, description: 'Block Kit blocks array' },
        },
        outputSchema: { ok: { type: 'boolean' }, ts: { type: 'string' } },
      },
    ],
  },

  salesforce: {
    id: 'salesforce',
    displayName: 'Salesforce',
    authType: 'oauth2',
    implemented: true,
    triggers: [
      { id: 'crm_entity_synced', label: 'CRM Entity Synced', entityEvents: ['created', 'updated'] },
    ],
    actions: [
      {
        id: 'create_lead',
        label: 'Create Lead',
        description: 'Create a new Lead in Salesforce',
        inputSchema: {
          FirstName: { type: 'string', required: false },
          LastName:  { type: 'string', required: true },
          Company:   { type: 'string', required: true },
          Email:     { type: 'string', required: false },
          Phone:     { type: 'string', required: false },
          Status:    { type: 'string', required: false, description: 'Lead Status (Open, Working, Closed)' },
        },
        outputSchema: { id: { type: 'string' }, success: { type: 'boolean' } },
      },
      {
        id: 'upsert_contact',
        label: 'Upsert Contact',
        description: 'Create or update a Contact by email',
        inputSchema: {
          Email:     { type: 'string', required: true },
          FirstName: { type: 'string', required: false },
          LastName:  { type: 'string', required: true },
          AccountId: { type: 'string', required: false },
        },
        outputSchema: { id: { type: 'string' }, created: { type: 'boolean' } },
      },
      {
        id: 'update_opportunity',
        label: 'Update Opportunity',
        description: 'Update stage or amount on an Opportunity',
        inputSchema: {
          opportunity_id: { type: 'string', required: true },
          StageName:      { type: 'string', required: false },
          Amount:         { type: 'number', required: false },
          CloseDate:      { type: 'string', required: false },
        },
        outputSchema: { success: { type: 'boolean' } },
      },
    ],
  },

  hubspot: {
    id: 'hubspot',
    displayName: 'HubSpot',
    authType: 'oauth2',
    implemented: true,
    triggers: [
      { id: 'contact_event', label: 'Contact Event', entityEvents: ['created', 'updated'] },
      { id: 'deal_event',    label: 'Deal Event',    entityEvents: ['created', 'updated', 'status_changed'] },
    ],
    actions: [
      {
        id: 'upsert_contact',
        label: 'Upsert Contact',
        description: 'Create or update a HubSpot contact',
        inputSchema: {
          email:      { type: 'string', required: true },
          firstname:  { type: 'string', required: false },
          lastname:   { type: 'string', required: false },
          phone:      { type: 'string', required: false },
          company:    { type: 'string', required: false },
        },
        outputSchema: { id: { type: 'string' }, updated: { type: 'boolean' } },
      },
      {
        id: 'update_deal_stage',
        label: 'Update Deal Stage',
        description: 'Move a deal to a new pipeline stage',
        inputSchema: {
          deal_id:    { type: 'string', required: true },
          stage_id:   { type: 'string', required: true, description: 'HubSpot pipeline stage ID' },
          amount:     { type: 'number', required: false },
        },
        outputSchema: { success: { type: 'boolean' } },
      },
      {
        id: 'add_to_sequence',
        label: 'Add Contact to Sequence',
        description: 'Enroll a contact in a HubSpot email sequence',
        inputSchema: {
          contact_id:  { type: 'string', required: true },
          sequence_id: { type: 'string', required: true },
        },
        outputSchema: { enrollment_id: { type: 'string' } },
      },
    ],
  },

  whatsapp: {
    id: 'whatsapp',
    displayName: 'WhatsApp (via Twilio)',
    authType: 'api_key',
    implemented: true,
    triggers: [
      { id: 'user_action', label: 'User Action in App', entityEvents: ['created', 'updated', 'status_changed'] },
    ],
    actions: [
      {
        id: 'send_template_message',
        label: 'Send Template Message',
        description: 'Send a pre-approved WhatsApp template message',
        inputSchema: {
          to:              { type: 'string', required: true,  description: 'Recipient phone number with country code' },
          template_sid:    { type: 'string', required: true,  description: 'Twilio Content SID for the template' },
          template_vars:   { type: 'object', required: false, description: 'Key-value pairs for template variable substitution' },
        },
        outputSchema: { message_sid: { type: 'string' }, status: { type: 'string' } },
      },
      {
        id: 'send_notification',
        label: 'Send Notification',
        description: 'Send a freeform notification (within 24h session window)',
        inputSchema: {
          to:   { type: 'string', required: true },
          body: { type: 'string', required: true, description: 'Message body (max 1600 chars)' },
        },
        outputSchema: { message_sid: { type: 'string' } },
      },
    ],
  },

  gmail: {
    id: 'gmail',
    displayName: 'Gmail / Google Workspace',
    authType: 'oauth2',
    implemented: true,
    triggers: [
      { id: 'record_event', label: 'Record Event', entityEvents: ['created', 'updated', 'status_changed'] },
    ],
    actions: [
      {
        id: 'send_email',
        label: 'Send Email',
        description: 'Send an email via Gmail',
        inputSchema: {
          to:      { type: 'string', required: true,  description: 'Recipient email(s), comma-separated' },
          subject: { type: 'string', required: true },
          body:    { type: 'string', required: true,  description: 'HTML or plain text body' },
          cc:      { type: 'string', required: false },
        },
        outputSchema: { message_id: { type: 'string' }, thread_id: { type: 'string' } },
      },
      {
        id: 'create_calendar_event',
        label: 'Create Calendar Event',
        description: 'Create a Google Calendar event',
        inputSchema: {
          title:       { type: 'string', required: true },
          start_time:  { type: 'string', required: true,  description: 'ISO 8601 datetime' },
          end_time:    { type: 'string', required: true,  description: 'ISO 8601 datetime' },
          attendees:   { type: 'array',  required: false, description: 'Array of email strings' },
          description: { type: 'string', required: false },
        },
        outputSchema: { event_id: { type: 'string' }, link: { type: 'string' } },
      },
    ],
  },

  stripe: {
    id: 'stripe',
    displayName: 'Stripe',
    authType: 'api_key',
    implemented: true,
    triggers: [
      { id: 'subscription_event', label: 'Subscription Event', entityEvents: ['created', 'status_changed'] },
      { id: 'payment_event',      label: 'Payment Event',      entityEvents: ['created', 'updated'] },
    ],
    actions: [
      {
        id: 'create_customer',
        label: 'Create Customer',
        description: 'Create a Stripe customer',
        inputSchema: {
          email:    { type: 'string', required: true },
          name:     { type: 'string', required: false },
          metadata: { type: 'object', required: false },
        },
        outputSchema: { customer_id: { type: 'string' } },
      },
      {
        id: 'create_payment_intent',
        label: 'Create Payment Intent',
        description: 'Create a Stripe PaymentIntent for checkout',
        inputSchema: {
          amount:      { type: 'number', required: true,  description: 'Amount in cents' },
          currency:    { type: 'string', required: true,  description: 'ISO currency code (usd, eur)' },
          customer_id: { type: 'string', required: false },
          metadata:    { type: 'object', required: false },
        },
        outputSchema: { payment_intent_id: { type: 'string' }, client_secret: { type: 'string' } },
      },
      {
        id: 'create_charge',
        label: 'Create Charge',
        description: 'Create a one-time charge',
        inputSchema: {
          customer_id: { type: 'string', required: true },
          amount:      { type: 'number', required: true,  description: 'Amount in cents' },
          currency:    { type: 'string', required: true,  description: 'ISO currency code (usd, eur)' },
          description: { type: 'string', required: false },
        },
        outputSchema: { charge_id: { type: 'string' }, status: { type: 'string' } },
      },
      {
        id: 'cancel_subscription',
        label: 'Cancel Subscription',
        description: 'Cancel a Stripe subscription',
        inputSchema: {
          subscription_id: { type: 'string', required: true },
          cancel_at_period_end: { type: 'boolean', required: false, description: 'Delay cancellation to period end' },
        },
        outputSchema: { success: { type: 'boolean' } },
      },
    ],
  },

  notion: {
    id: 'notion',
    displayName: 'Notion',
    authType: 'oauth2',
    implemented: true,
    triggers: [
      { id: 'data_change', label: 'Data Change', entityEvents: ['created', 'updated', 'deleted'] },
    ],
    actions: [
      {
        id: 'create_page',
        label: 'Create Page',
        description: 'Create a new page in a Notion database',
        inputSchema: {
          database_id: { type: 'string', required: true },
          title:       { type: 'string', required: true },
          properties:  { type: 'object', required: false, description: 'Key-value pairs matching database schema' },
        },
        outputSchema: { page_id: { type: 'string' }, url: { type: 'string' } },
      },
      {
        id: 'update_database_row',
        label: 'Update Database Row',
        description: 'Update properties of an existing Notion database entry',
        inputSchema: {
          page_id:    { type: 'string', required: true },
          properties: { type: 'object', required: true },
        },
        outputSchema: { success: { type: 'boolean' } },
      },
    ],
  },

  webhook: {
    id: 'webhook',
    displayName: 'Generic Webhook',
    authType: 'webhook_secret',
    implemented: true,
    triggers: [
      { id: 'any_trigger', label: 'Any Trigger', entityEvents: ['created', 'updated', 'deleted', 'status_changed'] },
    ],
    actions: [
      {
        id: 'post_payload',
        label: 'POST Payload',
        description: 'Send a signed HMAC POST request to a configured URL',
        inputSchema: {
          url:     { type: 'string', required: true,  description: 'Target webhook URL' },
          payload: { type: 'object', required: true,  description: 'JSON payload body' },
          secret:  { type: 'string', required: false, description: 'HMAC secret for signature header X-OneAtlas-Signature' },
          headers: { type: 'object', required: false, description: 'Additional HTTP headers' },
        },
        outputSchema: { status: { type: 'number' }, response_body: { type: 'string' } },
      },
    ],
  },

  twilio_sms: {
    id: 'twilio_sms',
    displayName: 'Twilio SMS',
    authType: 'api_key',
    implemented: true,
    triggers: [
      { id: 'user_action',    label: 'User Action',    entityEvents: ['created', 'updated'] },
      { id: 'status_change',  label: 'Status Change',  entityEvents: ['status_changed'] },
    ],
    actions: [
      {
        id: 'send_sms',
        label: 'Send SMS',
        description: 'Send an SMS via Twilio',
        inputSchema: {
          to:   { type: 'string', required: true, description: 'E.164 phone number e.g. +14155551234' },
          body: { type: 'string', required: true, description: 'Message body (max 1600 chars)' },
          from: { type: 'string', required: false, description: 'Twilio sending number (defaults to configured number)' },
        },
        outputSchema: { message_sid: { type: 'string' }, status: { type: 'string' } },
      },
      {
        id: 'trigger_otp',
        label: 'Trigger OTP',
        description: 'Send a one-time password via Twilio Verify',
        inputSchema: {
          to:      { type: 'string', required: true, description: 'E.164 phone number' },
          channel: { type: 'string', required: false, description: 'sms or call (default: sms)' },
        },
        outputSchema: { verification_sid: { type: 'string' }, status: { type: 'string' } },
      },
    ],
  },

  jira: {
    id: 'jira',
    displayName: 'Jira',
    authType: 'api_key',
    implemented: false,
    triggers: [
      { id: 'task_event', label: 'Task/Issue Event', entityEvents: ['created', 'updated', 'status_changed'] },
    ],
    actions: [
      {
        id: 'create_issue',
        label: 'Create Issue',
        description: 'Create a Jira issue — NOT YET IMPLEMENTED',
        inputSchema: {
          project_key: { type: 'string', required: true },
          summary:     { type: 'string', required: true },
          issue_type:  { type: 'string', required: false, description: 'Bug, Story, Task, Epic' },
          description: { type: 'string', required: false },
          assignee:    { type: 'string', required: false, description: 'Jira account ID' },
        },
        outputSchema: { issue_id: { type: 'string' }, key: { type: 'string' } },
      },
    ],
  },

  github: {
    id: 'github',
    displayName: 'GitHub',
    authType: 'api_key',
    implemented: false,
    triggers: [
      { id: 'dev_workflow_trigger', label: 'Dev Workflow Trigger', entityEvents: ['created', 'updated'] },
    ],
    actions: [
      {
        id: 'create_issue',
        label: 'Create Issue',
        description: 'Create a GitHub issue — NOT YET IMPLEMENTED',
        inputSchema: {
          repo:   { type: 'string', required: true,  description: 'owner/repository' },
          title:  { type: 'string', required: true },
          body:   { type: 'string', required: false },
          labels: { type: 'array',  required: false },
        },
        outputSchema: { issue_number: { type: 'number' }, url: { type: 'string' } },
      },
    ],
  },

  airtable: {
    id: 'airtable',
    displayName: 'Airtable',
    authType: 'api_key',
    implemented: false,
    triggers: [
      { id: 'record_event', label: 'Record Event', entityEvents: ['created', 'updated', 'deleted'] },
    ],
    actions: [
      {
        id: 'create_record',
        label: 'Create Record',
        description: 'Create an Airtable record — NOT YET IMPLEMENTED',
        inputSchema: {
          base_id:   { type: 'string', required: true },
          table_name:{ type: 'string', required: true },
          fields:    { type: 'object', required: true },
        },
        outputSchema: { record_id: { type: 'string' } },
      },
    ],
  },

  zapier: {
    id: 'zapier',
    displayName: 'Zapier (via Webhook)',
    authType: 'webhook_secret',
    implemented: false,
    triggers: [
      { id: 'any_trigger', label: 'Any Trigger', entityEvents: ['created', 'updated', 'deleted', 'status_changed'] },
    ],
    actions: [
      {
        id: 'send_to_zapier',
        label: 'Send to Zapier Webhook',
        description: 'POST structured payload to Zapier webhook URL — NOT YET IMPLEMENTED',
        inputSchema: {
          webhook_url: { type: 'string', required: true, description: 'Zapier webhook URL' },
          payload:     { type: 'object', required: true },
        },
        outputSchema: { status: { type: 'string' } },
      },
    ],
  },

  google_sheets: {
    id: 'google_sheets',
    displayName: 'Google Sheets',
    authType: 'oauth2',
    implemented: false,
    triggers: [
      { id: 'data_export_event', label: 'Data Export Event', entityEvents: ['created', 'updated'] },
    ],
    actions: [
      {
        id: 'append_row',
        label: 'Append Row',
        description: 'Append a row to a Google Sheet — NOT YET IMPLEMENTED',
        inputSchema: {
          spreadsheet_id: { type: 'string', required: true },
          sheet_name:     { type: 'string', required: true },
          values:         { type: 'array',  required: true, description: 'Array of cell values' },
        },
        outputSchema: { updated_range: { type: 'string' }, updated_rows: { type: 'number' } },
      },
    ],
  },
};

export function getRegisteredIntegration(id) {
  return INTEGRATION_REGISTRY[id] || null;
}

export function getAllIntegrations() {
  return Object.values(INTEGRATION_REGISTRY);
}

export function isValidIntegration(id) {
  return id in INTEGRATION_REGISTRY;
}

export function isValidAction(integrationId, actionId) {
  const integration = INTEGRATION_REGISTRY[integrationId];
  if (!integration) return false;
  return integration.actions.some(a => a.id === actionId);
}
