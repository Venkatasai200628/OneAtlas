const FIRST_NAMES = ['Sarah', 'Marcus', 'Emily', 'James', 'Aisha', 'David', 'Priya', 'Carlos', 'Mei', 'Jordan'];
const LAST_NAMES  = ['Chen', 'Johnson', 'Rodriguez', "O'Brien", 'Patel', 'Kim', 'Sharma', 'Rivera', 'Zhang', 'Taylor'];
const COMPANIES   = ['TechVault Inc.', 'Greenleaf Co.', 'BrightPath Solutions', 'NorthStar Dev', 'Luminary AI', 'Wave Systems', 'Apex Corp', 'Horizon Labs', 'Summit Group', 'Echo Technologies'];
const DOMAINS     = ['techvault.io', 'greenleaf.co', 'brightpath.com', 'northstar.dev', 'luminary.ai', 'wavesys.io', 'apexcorp.com', 'horizonlabs.co', 'summitgrp.com', 'echotech.io'];
const PHONES      = ['+1 415-555-0142', '+1 212-555-0198', '+1 310-555-0167', '+1 617-555-0123', '+1 408-555-0199', '+1 305-555-0177', '+1 512-555-0188', '+1 206-555-0155', '+1 303-555-0166', '+1 404-555-0177'];
const CITIES      = ['San Francisco', 'New York', 'Los Angeles', 'Boston', 'Austin', 'Seattle', 'Chicago', 'Denver', 'Atlanta', 'Miami'];
const STATES      = ['CA', 'NY', 'CA', 'MA', 'TX', 'WA', 'IL', 'CO', 'GA', 'FL'];
const INDUSTRIES  = ['Technology', 'Healthcare', 'Finance', 'Retail', 'Manufacturing', 'Education', 'Real Estate', 'Media', 'Energy', 'Consulting'];
const JOB_TITLES  = ['VP of Sales', 'Product Manager', 'CTO', 'Marketing Director', 'Operations Manager', 'CEO', 'Engineering Lead', 'Head of Growth', 'CFO', 'Business Analyst'];
const DEAL_NAMES  = [
  'Enterprise Platform License', 'Annual Support Contract', 'Professional Services Retainer',
  'Cloud Migration Project', 'Custom Integration Package', 'Startup Growth Bundle',
  'Team Expansion License', 'Premium Analytics Suite', 'API Access Agreement', 'Consulting Engagement'
];
const TASK_NAMES  = ['Q4 Revenue Review', 'Product Roadmap Planning', 'Team Onboarding', 'Client Kickoff', 'Sprint Planning', 'Security Audit', 'Performance Review', 'Market Research', 'Sales Training', 'System Upgrade'];
const PROJECT_NAMES = ['Mobile App Redesign', 'CRM Integration', 'Data Migration', 'API Development', 'Brand Refresh', 'Platform Scaling', 'Analytics Dashboard', 'Security Overhaul', 'Customer Portal', 'Payment Gateway'];
const DRONE_IDS = ['DF-AX12', 'DF-BX07', 'DF-CX19', 'DF-DX03', 'DF-EX44', 'DF-FX28', 'DF-GX51', 'DF-HX16', 'DF-IX33', 'DF-JX09'];
const MISSION_NAMES = ['Downtown Delivery Run', 'Warehouse Transfer', 'Medical Supply Drop', 'Last-Mile Route A', 'Express Parcel 42', 'Regional Hub Sweep', 'Priority Client Drop', 'Night Logistics Pass', 'Cross-City Relay', 'Scheduled Maintenance Ferry'];
const AMOUNTS     = [48000, 125000, 32500, 87000, 15750, 210000, 67500, 43000, 185000, 29500];
const PROBABILITIES = [10, 25, 50, 65, 80, 90, 35, 55, 70, 45];
const DESCRIPTIONS = [
  'Follow up on proposal sent last week',
  'Scheduled demo with engineering team',
  'Contract under legal review',
  'Awaiting procurement sign-off',
  'Implementation phase started',
];

function fullName(i) { return `${FIRST_NAMES[i % 10]} ${LAST_NAMES[i % 10]}`; }
function email(i, domain) { return `${FIRST_NAMES[i % 10].toLowerCase()}.${LAST_NAMES[i % 10].toLowerCase().replace("'", '')}@${domain || DOMAINS[i % 10]}`; }
function pastDate(daysAgo) { return new Date(Date.now() - daysAgo * 86400000).toISOString(); }
function futureDate(daysAhead) { return new Date(Date.now() + daysAhead * 86400000).toISOString().split('T')[0]; }

const FIELD_RULES = [
  { match: /first_name|firstName|givenName/i,   value: (i) => FIRST_NAMES[i % 10] },
  { match: /last_name|lastName|familyName|surname/i, value: (i) => LAST_NAMES[i % 10] },
  { match: /full_name|fullName|clientName|agentName|ownerName/i, value: (i) => fullName(i) },
  { match: /displayName|username|userName/i, value: (i) => `${FIRST_NAMES[i%10].toLowerCase()}${LAST_NAMES[i%10].slice(0,1)}` },

  { match: /email/i, value: (i) => email(i) },
  { match: /phone|mobile|cell/i, value: (i) => PHONES[i % 10] },

  { match: /company|organization|employer/i, value: (i) => COMPANIES[i % 10] },
  { match: /industry|sector|vertical/i, value: (i) => INDUSTRIES[i % 10] },
  { match: /website|url|domain/i, value: (i) => `https://www.${DOMAINS[i % 10]}` },

  { match: /city|town/i,  value: (i) => CITIES[i % 10] },
  { match: /state|province|region/i, value: (i) => STATES[i % 10] },
  { match: /country/i,    value: () => 'United States' },
  { match: /zipCode|zip|postalCode|postal_code/i, value: (i) => `${94100 + i * 17}` },
  { match: /address|street/i, value: (i) => `${100 + i * 100} Market St` },

  { match: /amount|value|price|revenue|cost|total|fee|budget|salary|income|mrr|arr/i, value: (i) => AMOUNTS[i % 10] },

  { match: /probability|likelihood|confidence|winRate/i, value: (i) => PROBABILITIES[i % 10] },
  { match: /currency/i,   value: () => 'USD' },
  { match: /title|jobTitle|job_title|position|role|designation/i, value: (i) => i === 0 ? 'admin' : JOB_TITLES[i % 10] },
  { match: /description|notes|note|comments|summary|bio|about|details|content|body/i, value: (i) => DESCRIPTIONS[i % 5] },
  { match: /tags|label|labels|category|categories/i, value: (i) => ['hot', 'warm', 'cold', 'priority', 'follow-up'][i % 5] },
  { match: /source|leadSource|referral/i, value: (i) => ['referral', 'website', 'cold_call', 'linkedin', 'event'][i % 5] },
  { match: /owner|assignedTo|assignee|userId|agentId|managerId|salesRep/i, value: (i) => `user-${(i % 3) + 1}` },

  { match: /close_date|closeDate|due_date|dueDate|deadline|endDate|expiryDate/i, value: (i) => futureDate(30 + i * 15) },
  { match: /start_date|startDate|openDate/i, value: (i) => pastDate(i * 7) },
  { match: /lastContact|lastActivity|lastSeen/i, value: (i) => pastDate(i * 3 + 1) },
  { match: /birthDate|birthday|dob/i, value: (i) => `${1980 + i * 3}-${String((i % 12) + 1).padStart(2,'0')}-15` },

  { match: /active|enabled|verified|confirmed|approved/i, value: (i) => i % 3 !== 2 },
  { match: /paid|completed/i, value: (i) => i < 2 },
  { match: /archived|deleted/i, value: () => false },

  { match: /count|quantity|qty|stock|inventory|number/i, value: (i) => (i + 1) * 10 },
  { match: /rating|score|stars/i, value: (i) => [4.5, 3.8, 5.0, 4.2, 3.5][i % 5] },
  { match: /age|years|experience/i, value: (i) => 25 + i * 3 },
  { match: /size|teamSize|employees|headcount/i, value: (i) => [12, 45, 8, 250, 3][i % 5] },

  { match: /dealName|deal_name/i, value: (i) => DEAL_NAMES[i % 10] },
  { match: /projectName|project_name|taskName|task_name/i, value: (i) => PROJECT_NAMES[i % 10] },
  { match: /serialNumber|serial_number|droneId|drone_id/i, value: (i) => DRONE_IDS[i % 10] },
  { match: /batteryHealth|battery_health|battery/i, value: (i) => [92, 78, 45, 88, 31, 67, 95, 54, 82, 29][i % 10] },
  { match: /trackingCode|tracking_code/i, value: (i) => `PKG-${10042 + i}` },
  { match: /destination|route/i, value: (i) => `${CITIES[i % 10]} Distribution Hub` },
  { match: /mission/i, value: (i) => MISSION_NAMES[i % 10] },
  { match: /password|hash|secret|token|apiKey/i, value: () => '[hashed]' },
  { match: /slug/i, value: (i) => `slug-item-${i+1}` },
  { match: /status/i, value: (i) => ['pending', 'processing', 'completed', 'cancelled'][i % 4] },
  { match: /name/i, value: (i) => fullName(i) },
];

const ENTITY_NAME_GENERATORS = {
  deal:        (i) => DEAL_NAMES[i % 10],
  opportunity: (i) => DEAL_NAMES[i % 10],
  task:        (i) => TASK_NAMES[i % 10],
  project:     (i) => PROJECT_NAMES[i % 10],
  ticket:      (i) => `Ticket #${1000 + i * 7}`,
  invoice:     (i) => `INV-${2024001 + i}`,
  order:       (i) => `ORD-${5000 + i * 17}`,
  product:     (i) => ['Analytics Suite Pro', 'Cloud Hosting Plan', 'Support Package', 'API Access', 'Enterprise License'][i % 5],
  property:    (i) => [`${100+i*50} Oak Ave`, '225 Market St Unit 4B', '1440 Broadway', '88 Pine Blvd', '500 Lake Shore Dr'][i % 5],
  listing:     (i) => [`${100+i*50} Oak Ave`, '225 Market St Unit 4B', '1440 Broadway', '88 Pine Blvd', '500 Lake Shore Dr'][i % 5],
  employee:    (i) => fullName(i),
  user:        (i) => fullName(i),
  contact:     (i) => fullName(i),
  lead:        (i) => fullName(i),
  customer:    (i) => COMPANIES[i % 10],
  account:     (i) => COMPANIES[i % 10],
  client:      (i) => COMPANIES[i % 10],
  drone:       (i) => `Drone ${DRONE_IDS[i % 10]}`,
  mission:     (i) => MISSION_NAMES[i % 10],
  delivery:    (i) => `Delivery ${10042 + i}`,
  incident:    (i) => `INC-${2400 + i}`,
  maintenancelog: (i) => `Service ${DRONE_IDS[i % 10]}`,
  researchproject: (i) => ['Neural Interface Study', 'Climate Data Modeling', 'Quantum Materials Lab', 'Urban Mobility Index', 'Genomics Collaboration'][i % 5],
  grant: (i) => `NSF-${24000 + i}`,
  publication: (i) => `Paper ${2024}-${100 + i}: Collaborative Research Findings`,
  peerreview: (i) => `Review ${i + 1} — blinded`,
  equipmentbooking: (i) => `Microscope Suite ${i + 1}`,
  budget: (i) => `FY-${2024 + (i % 2)} Allocation`,
  partnership: (i) => ['Acme Research Labs', 'Northwind Biotech', 'Summit Analytics', 'Helios Energy', 'BlueRiver AI'][i % 5],
};

export function generateSampleData(entity, count = 5) {
  const entityKey = (entity.name || '').toLowerCase();

  return Array.from({ length: count }, (_, i) => {
    const record = {
      id: `${entity.tableName || entityKey}-${i + 1}`,
      tenantId: 'tenant-demo',
      createdAt: pastDate((count - i) * 3),
    };

    const fields = (entity.fields || []).filter(f =>
      !['id', 'tenantId', 'createdAt', 'updatedAt'].includes(f.name)
    );

    for (const field of fields) {
      const fn = field.name;

      if (field.type === 'enum' && Array.isArray(field.enumValues) && field.enumValues.length) {
        record[fn] = field.enumValues[i % field.enumValues.length];
        continue;
      }

      if (field.type === 'boolean') {
        const rule = FIELD_RULES.find(r => r.match.test(fn));
        record[fn] = rule ? rule.value(i) : (i % 2 === 0);
        continue;
      }

      if (fn === 'name' && ENTITY_NAME_GENERATORS[entityKey]) {
        record[fn] = ENTITY_NAME_GENERATORS[entityKey](i);
        continue;
      }

      const rule = FIELD_RULES.find(r => r.match.test(fn));
      if (rule) {
        record[fn] = rule.value(i);
        continue;
      }

      if (fn.endsWith('Id') || fn.endsWith('_id')) {
        const related = fn.replace(/Id$/, '').replace(/_id$/, '').toLowerCase();
        record[fn] = `${related}-${(i % 3) + 1}`;
        continue;
      }

      if (field.type === 'integer' || field.type === 'float' || field.type === 'number') {
        record[fn] = (i + 1) * 1000;
      } else if (field.type === 'timestamp' || field.type === 'datetime') {
        record[fn] = pastDate(i * 5);
      } else if (field.type === 'date') {
        record[fn] = pastDate(i * 5).split('T')[0];
      } else if (field.type === 'uuid') {
        record[fn] = `${fn.toLowerCase()}-${i + 1}-demo`;
      } else {
        const lower = fn.toLowerCase();
        if (lower.includes('name')) record[fn] = fullName(i);
        else if (lower.includes('email')) record[fn] = email(i);
        else if (lower.includes('phone')) record[fn] = PHONES[i % 10];
        else if (lower.includes('url') || lower.includes('link')) record[fn] = `https://example.com/${fn}/${i+1}`;
        else if (lower.includes('color') || lower.includes('colour')) record[fn] = ['#6366f1','#10b981','#f59e0b','#ef4444','#3b82f6'][i%5];
        else if (lower.includes('code')) record[fn] = `CODE-${1000 + i * 7}`;
        else if (lower.includes('key')) record[fn] = `KEY-${String(Math.random()).slice(2,10).toUpperCase()}`;
        else record[fn] = null;
      }
    }

    return record;
  });
}

export function generateAllSampleData(schema, count = 5) {
  const safeCount = Number.isFinite(Number(count)) ? Math.max(1, Math.min(50, Number(count))) : 5;
  const result = {};
  for (const entity of (schema?.entities || [])) {
    result[entity.name] = generateSampleData(entity, safeCount);
  }
  return result;
}
