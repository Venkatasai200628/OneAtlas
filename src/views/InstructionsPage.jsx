import { useState } from 'react';
import { BookOpen, Zap, Database, Globe, Plug, Search, ChevronRight } from 'lucide-react';

const DOCS = [
  { section:'GET STARTED', items:[
    { slug:'welcome', icon:Zap, title:'Welcome to OneAtlas', content:`# Welcome to OneAtlas\n\nOneAtlas is not a code generator. It is an **intent-to-deployment platform**.\n\nYou describe what you want to build. The platform owns the full implementation lifecycle — frontend, backend, database, auth, workflows, integrations, hosting, deployment.\n\n## The 3-Stage Pipeline\n\n**Stage 1: Intent Extraction**\nParses your prompt into a structured AppIntent with appName, appType, entities, features, and integrations.\n\n**Stage 2: Schema Generation**\nConverts AppIntent into a DataSchema with typed entities, field types, relations, and tenantId on every table.\n\n**Stage 3: AppSpec Generation**\nProduces pages, API endpoints, auth rules, integration hooks, and workflow stubs.\n\nEach stage validates output and runs a 3-strategy repair engine on failure.\n\n## Getting Started\n\n1. Go to **Build** in the sidebar\n2. Type a description of your app\n3. Select **Build** mode (or **Plan** for a spec review first)\n4. Choose a model or use **Automatic** routing\n5. Press **⌘↵** to generate` },
    { slug:'quickstart', icon:Database, title:'Quickstart', content:`# Quickstart\n\n## Your first app in 2 minutes\n\n1. Click **Build** in the sidebar\n2. Type: *"Build a task manager for an engineering team. Tasks have priorities, assignees, and due dates. Slack notifications when tasks are overdue."*\n3. Leave the model on **Automatic**\n4. Press **Build**\n\nWatch the 3-stage pipeline execute in real time. When complete:\n- **App Preview** — shows your generated app rendered live\n- **Spec View** — full AppSpec breakdown (pages, endpoints, schema, workflows)\n- **JSON Output** — download all 3 stage artifacts\n\n## Adding API Keys\n\nGo to **Settings → API Keys** and add at least one provider key.\n\n> **Tip:** Add an **OpenRouter** key to cover all 10 models with a single key. OpenRouter acts as a universal fallback.\n\n## Supported Models\n\n| Model | Provider | Best for |\n|-------|----------|----------|\n| Automatic | Platform | Smart routing |\n| GPT-5.5 | OpenAI | Complex AppSpec |\n| Claude Opus 4.6 | Anthropic | Highest complexity |\n| Gemini 3.1 Pro | Google | Heavy generation |\n| Llama 4 Scout | Groq | Fast intent extraction |` },
  ]},
  { section:'BUILD', items:[
    { slug:'agents', icon:Zap, title:'AI Agents & Pipeline', content:`# AI Agents & Pipeline\n\n## How generation works\n\nOneAtlas uses a multi-agent pipeline where each stage is handled by the optimal model for that task:\n\n**Intent Agent** (fast model: Llama 4 Scout or GPT-5.4 Mini)\n- Parses natural language into structured AppIntent\n- Extracts entities, features, integrations, auth requirements\n\n**Schema Agent** (capable model: Claude Sonnet or DeepSeek V4)\n- Converts AppIntent into DataSchema\n- Designs typed entities with field definitions\n- Adds tenantId to every table (multi-tenant isolation)\n- Defines relations between entities\n\n**AppSpec Agent** (flagship model: Claude Opus or GPT-5.5)\n- Produces full AppSpec with pages, endpoints, auth rules\n- Generates WorkflowStubs for each integration trigger\n- Creates integration hooks with payload schemas\n\n## Repair Engine\n\nIf any stage produces invalid output, three repair strategies run:\n1. **Structural repair** — fixes missing required fields\n2. **Field repair** — fixes type mismatches\n3. **Consistency repair** — fixes cross-layer references` },
    { slug:'workflows', icon:Globe, title:'Workflows & Integrations', content:`# Workflows & Integrations\n\n## How triggers fire\n\nEvery integration in your prompt generates a WorkflowStub in the AppSpec:\n\nTrigger entity + event → integration action → payload mapping\n\nExample — "WhatsApp notification when a deal closes":\n- triggerEntity: Deal\n- triggerEvent: status_changed\n- triggerCondition: { status: "closed" }\n- actionType: send_whatsapp_template\n\n## Integration Registry\n\nAll 15 integrations have full registry definitions:\n- trigger/action schema\n- payload mapping\n- authentication type\n- stub vs implemented status\n\n**Fully implemented:** Slack, Salesforce, HubSpot, Gmail, Notion, Google Sheets, Stripe, Twilio, Google Drive, Webhook\n\n**Stubbed (schema defined, HTTP mocked):** Jira, GitHub, Airtable, Resend, Discord\n\n## Failed Integration Calls\n\nFailed integration actions are logged to the AuditLog but never break the original write operation.` },
  ]},
  { section:'DEPLOY', items:[
    { slug:'deployments', icon:Globe, title:'Deployments', content:`# Deployments\n\n## How deployment works\n\nWhen generation completes:\n1. AppSpec is validated\n2. Static assets generated\n3. Upload to Cloudflare R2\n4. Activate Cloudflare Pages deploy\n5. DNS subdomain record created/updated\n6. Deployment model updated\n\n## Subdomain routing\n\nEach app gets a unique subdomain:\n\`your-app-name.oneatlas.dev\`\n\nThe runtime engine resolves requests to the AppSpec in the database. It serves requests dynamically from a specification — it does not generate code files.\n\n## Rollback\n\nIf a deployment fails and a prior live deployment exists, the platform auto-restores the previous deployment and updates DNS.\n\n## Custom Domains\n\nPaid plans support custom domain mapping. Set your domain's CNAME to \`cname.oneatlas.dev\` in Settings → Organisation.` },
  ]},
  { section:'INTEGRATIONS', items:[
    { slug:'apis', icon:Plug, title:'APIs & Webhooks', content:`# APIs & Webhooks\n\n## REST API\n\nEvery generated app exposes a full REST API:\n\`GET /api/{entity}\` — list with pagination and filters\n\`POST /api/{entity}\` — create with validation\n\`GET /api/{entity}/{id}\` — get by id\n\`PATCH /api/{entity}/{id}\` — update\n\`DELETE /api/{entity}/{id}\` — delete\n\nAll routes enforce auth rules from AppSpec.authRules.\n\n## Webhook\n\nThe generic webhook integration fires a signed POST when a WorkflowStub trigger matches:\n\nX-OneAtlas-Signature: sha256=<hmac>\nContent-Type: application/json\n\n{\n  "event": "deal.status_changed",\n  "entity": "Deal",\n  "data": { ... },\n  "timestamp": "2026-06-01T12:00:00Z"\n}\n\n## Rate Limits\n\n- 100 req/min for generation endpoints (per org)\n- 1000 req/min for read endpoints (per org)\n- 429 returned with Retry-After header` },
  ]},
];

function renderMd(text) {
  return text.split('\n').map((line, i) => {
    if (line.startsWith('# ')) return <h1 key={i} className="font-bold mb-4 mt-6 first:mt-0" style={{fontSize:26,color:'#111111',letterSpacing:'-0.02em'}}>{line.slice(2)}</h1>;
    if (line.startsWith('## ')) return <h2 key={i} className="font-bold mb-3 mt-5" style={{fontSize:17,color:'#111111'}}>{line.slice(3)}</h2>;
    if (line.startsWith('> ')) return <blockquote key={i} className="border-l-4 pl-4 py-1 my-3 text-sm" style={{borderColor:'#FF6600',color:'#6B7280',background:'#FFF3EB',borderRadius:'0 8px 8px 0',paddingTop:8,paddingBottom:8}}>{line.slice(2)}</blockquote>;
    if (line.startsWith('- ')) return <li key={i} className="ml-4 mb-1 text-sm" style={{color:'#6B7280',listStyleType:'disc'}}>{line.slice(2)}</li>;
    if (line.startsWith('**') && line.endsWith('**')) return <p key={i} className="font-bold mb-1 text-sm" style={{color:'#111111'}}>{line.slice(2,-2)}</p>;
    if (line.startsWith('`') && line.endsWith('`') && !line.startsWith('``')) return <code key={i} className="text-xs px-2 py-0.5 rounded font-mono block mb-2" style={{background:'#F9F9F6',color:'#6B7280'}}>{line.slice(1,-1)}</code>;
    if (line.startsWith('|')) {
      const cells = line.split('|').filter(Boolean).map(c=>c.trim());
      if (cells.every(c=>c.match(/^-+$/))) return null;
      const isHeader = i > 0;
      return <div key={i} className="flex text-xs" style={{borderBottom:'1px solid #E5E7EB'}}>
        {cells.map((c,j)=><div key={j} className="py-1.5 px-3 flex-1" style={{color:j===0&&isHeader?'#111111':'#6B7280',fontWeight:j===0?600:400}}>{c}</div>)}
      </div>;
    }
    if (line.trim()==='') return <div key={i} className="h-2"/>;
    return <p key={i} className="text-sm mb-2" style={{color:'#6B7280',lineHeight:1.7}}>{line}</p>;
  });
}

export default function InstructionsPage() {
  const [active, setActive] = useState('welcome');
  const [search, setSearch] = useState('');
  const allItems = DOCS.flatMap(s => s.items);
  const current = allItems.find(i => i.slug === active);
  const filtered = search
    ? DOCS.map(s => ({ ...s, items: s.items.filter(i => i.title.toLowerCase().includes(search.toLowerCase())) })).filter(s => s.items.length > 0)
    : DOCS;
  return (
    <div className="h-full flex" style={{ background: '#F5F5EE' }}>
      {/* Sidebar */}
      <div className="w-56 flex-shrink-0 border-r flex flex-col" style={{ background: '#FFFFFF', borderColor: '#E5E7EB' }}>
        <div className="px-4 py-3 border-b" style={{ borderColor: '#E5E7EB' }}>
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl border" style={{ background: '#F9F9F6', borderColor: '#E5E7EB' }}>
            <Search size={12} style={{ color: '#9CA3AF' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search docs…"
              className="flex-1 text-xs bg-transparent outline-none" style={{ color: '#111111' }} />
          </div>
        </div>
        <div className="flex-1 overflow-auto py-2">
          {filtered.map(s => (
            <div key={s.section} className="mb-4">
              <p className="px-4 py-1 text-[10px] font-bold uppercase tracking-widest" style={{ color: '#9CA3AF' }}>{s.section}</p>
              {s.items.map(item => (
                <button key={item.slug} onClick={() => setActive(item.slug)}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-left text-xs font-semibold transition-all"
                  style={{ background: active === item.slug ? '#FFF3EB' : 'transparent', color: active === item.slug ? '#FF6600' : '#6B7280' }}
                  onMouseEnter={e => { if (active !== item.slug) e.currentTarget.style.background = '#F9F9F6'; }}
                  onMouseLeave={e => { if (active !== item.slug) e.currentTarget.style.background = 'transparent'; }}>
                  <item.icon size={13} style={{ flexShrink: 0 }} />
                  {item.title}
                  {active === item.slug && <ChevronRight size={11} style={{ marginLeft: 'auto' }} />}
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>
      {/* Content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-2xl mx-auto px-8 py-10">
          {current ? renderMd(current.content) : <p style={{ color: '#9CA3AF' }}>Select a topic.</p>}
        </div>
      </div>
    </div>
  );
}
