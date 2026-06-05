import { useEffect, useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useStore } from '@/lib/store';
import {
  Zap, ArrowRight, Check, ChevronDown, Star,
  Database, Shield, Globe, Workflow, Lock, Cpu,
  BarChart3, Users, Settings2, Layout,
} from 'lucide-react';

/* ── Data ── */
const NAV_LINKS = ['Product','Use Cases','Templates','Enterprise','Security','Pricing','Resources','Community'];

const MODELS = [
  { name:'Automatic',       provider:'Platform-routed', color:'#FF6600' },
  { name:'GPT-5.5',         provider:'OpenAI',          color:'#10A37F' },
  { name:'GPT-5.4 Mini',    provider:'OpenAI',          color:'#10A37F' },
  { name:'Claude Sonnet 4.6',provider:'Anthropic',      color:'#D97706' },
  { name:'Claude Opus 4.6', provider:'Anthropic',       color:'#D97706' },
  { name:'Gemini 3.1 Pro',  provider:'Google',          color:'#4285F4' },
  { name:'Gemini 3 Flash',  provider:'Google',          color:'#4285F4' },
  { name:'DeepSeek V4',     provider:'DeepSeek',        color:'#0EA5E9' },
  { name:'Llama 4 Scout',   provider:'Groq',            color:'#8B5CF6' },
  { name:'Mistral Small',   provider:'Mistral',         color:'#EF4444' },
];

const CATEGORIES = [
  { id:'internal_tool', label:'Internal Tool', icon:Settings2, color:'#FF6600' },
  { id:'dashboard',     label:'Dashboard',     icon:BarChart3,  color:'#4285F4' },
  { id:'client_portal', label:'Client Portal', icon:Users,      color:'#10B981' },
  { id:'crm',           label:'CRM App',       icon:Database,   color:'#8B5CF6' },
  { id:'ai_workflow',   label:'AI Workflow',   icon:Workflow,   color:'#F59E0B' },
  { id:'admin_panel',   label:'Admin Panel',   icon:Layout,     color:'#EF4444' },
];

const CHIPS = ['Sales CRM','KPI Dashboard','Employee Onboarding App','Customer Support Portal','Inventory Tracker','Approval Workflow'];

const FEATURES = [
  { icon:Zap,       title:'One-Click Launch',           desc:'Ship AI products globally in seconds — hosting, scaling, and infrastructure already handled.', c:'#FF6600' },
  { icon:Database,  title:'Visual Database Layer',      desc:'Manage data, content, and workflows visually without touching backend code.', c:'#4285F4' },
  { icon:Shield,    title:'AI-Native Backend',          desc:'Generate APIs, logic, automations, and storage instantly — no servers or boilerplate.', c:'#10B981' },
  { icon:Lock,      title:'Auth & Access Control',      desc:'Built-in auth, permissions, and user roles ready from day one.', c:'#8B5CF6' },
  { icon:Workflow,  title:'Agents & Workflows',         desc:'Let AI agents and automations run your operations in the background 24/7.', c:'#F59E0B' },
  { icon:Globe,     title:'Deep Integrations',          desc:'Connect AI models, payments, CRMs, email, and thousands of tools in one click.', c:'#EF4444' },
];

const COMPARISON = [
  { feature:'Ease of Use',        ours:'No technical background needed', theirs:'Headache for non-coders' },
  { feature:'What You Can Build', ours:'Full production-grade apps',     theirs:'Basic apps only' },
  { feature:'All-in-one Platform',ours:'Everything built-in',            theirs:'Requires external services' },
  { feature:'AI Models',          ours:'All latest models, auto-selected', theirs:'Limited or locked models' },
  { feature:'Custom Domain',      ours:'Included on every plan',         theirs:'Paid add-on or unavailable' },
  { feature:'Human Support',      ours:'Live chat & priority support',   theirs:'Little to no support' },
  { feature:'Error Handling',     ours:'Smart & automatic correction',   theirs:'Gets stuck often' },
  { feature:'Hosting & Scale',    ours:'Scales with you, built-in',      theirs:'Limited or self-managed' },
];

const PLANS = [
  { name:'Explorer', price:'$0', period:'/mo', desc:'Perfect for testing ideas, learning the platform, and building your first AI-powered products.', cta:'Start Building Free', highlight:false,
    features:['30 AI build credits / month','200 automation credits / month','Unlimited projects','Visual app builder','Built-in database & authentication','One-click deployment','Hosted on OneAtlas domain','Core AI generation tools'] },
  { name:'Studio', price:'$24', period:'/mo', desc:'Built for founders and creators launching production-ready applications.', cta:'Upgrade to Studio', highlight:false,
    features:['150 AI build credits / month','5,000 automation credits / month','Unlimited projects','Custom domains','Backend functions & API workflows','In-app code editing','GitHub synchronization','Remove OneAtlas branding','Faster build & deployment','Standard support'] },
  { name:'Scale', price:'$59', period:'/mo', desc:'Designed for startups and fast-moving teams building serious AI software.', cta:'Start Scaling', highlight:true, badge:'Most Popular',
    features:['500 AI build credits / month','20,000 automation credits / month','Advanced AI model access','Production-grade hosting','Shared team workspace','App analytics & monitoring','SEO & performance optimization','Staging environments','Priority support','Early access to new features'] },
  { name:'Orbit', price:'$149', period:'/mo', desc:'For high-growth companies running AI products at scale.', cta:'Contact Sales', highlight:false,
    features:['1,500 AI build credits / month','75,000 automation credits / month','Premium AI model routing','Dedicated infrastructure priority','Advanced permissions & access controls','Enterprise authentication (SSO/SAML)','Audit logs & usage insights','Dedicated onboarding','Slack-based support','White-glove migration support'] },
];

const FAQS = [
  { cat:'PLATFORM', q:'What is OneAtlas?', a:'OneAtlas is an AI-native platform for building full-stack apps, internal tools, client portals, and AI workflows without managing engineering complexity.' },
  { cat:'PLATFORM', q:'Who is OneAtlas built for?', a:'OneAtlas is built for founders, startups, agencies, operators, product teams, and businesses that want to ship software faster with smaller teams.' },
  { cat:'PLATFORM', q:'Do I need to know how to code?', a:'No. You can build and launch applications using prompts, visual editing, and AI-assisted workflows.' },
  { cat:'PLATFORM', q:'What makes OneAtlas different from no-code tools?', a:'OneAtlas combines AI generation, backend infrastructure, database, authentication, workflows, hosting, and deployment in one platform — instead of stitching multiple tools together.' },
  { cat:'BUILDING APPS', q:'What can I build with OneAtlas?', a:'You can build CRMs, dashboards, AI assistants, admin panels, customer portals, workflow systems, onboarding tools, support platforms, and custom business software.' },
  { cat:'BUILDING APPS', q:'Can I build AI-powered products?', a:'Yes. OneAtlas supports AI agents, copilots, document analysis, automated workflows, conversational interfaces, and AI-driven business operations.' },
  { cat:'BUILDING APPS', q:'Can I edit the app after it\'s generated?', a:'Yes. You can continuously modify layouts, workflows, logic, data structures, permissions, and UI as your product evolves.' },
  { cat:'BUILDING APPS', q:'Can I connect external APIs and services?', a:'Yes. OneAtlas supports integrations with APIs, payment providers, CRMs, analytics tools, databases, and third-party platforms.' },
  { cat:'DEPLOYMENT & SCALE', q:'Does OneAtlas handle hosting and deployment?', a:'Yes. Hosting, deployment, scaling, infrastructure, and environment setup are managed automatically.' },
  { cat:'DEPLOYMENT & SCALE', q:'Does OneAtlas include a database and backend?', a:'Yes. Every app includes a built-in database, backend logic, APIs, authentication, and storage layer.' },
  { cat:'DEPLOYMENT & SCALE', q:'Can I use OneAtlas for production applications?', a:'Yes. OneAtlas is designed for real-world business applications, not just prototypes or demos.' },
  { cat:'DEPLOYMENT & SCALE', q:'Can teams collaborate inside OneAtlas?', a:'Yes. Teams can collaborate across apps, workflows, operations, and shared workspaces with role-based access control.' },
  { cat:'SECURITY & OWNERSHIP', q:'Is my business data secure?', a:'Yes. OneAtlas includes authentication, permissions, protected infrastructure, and secure access controls built into the platform.' },
  { cat:'SECURITY & OWNERSHIP', q:'Do I own the apps I create?', a:'Yes. You retain ownership of your applications, workflows, data, and operational logic.' },
  { cat:'SECURITY & OWNERSHIP', q:'Can I export or extend my application outside OneAtlas?', a:'Yes. OneAtlas gives teams the flexibility to extend, evolve, and scale applications beyond the platform when needed.' },
];

const STEPS = [
  { n:'01 / 04', title:'From idea to working software', desc:'Tell OneAtlas what you want to build, and watch it generate a real product foundation — interfaces, workflows, data models, and app logic included from the very first prompt.' },
  { n:'02 / 04', title:'Your backend, already in motion', desc:'Authentication, databases, APIs, permissions, storage, and operational logic are automatically structured behind the scenes, so your app behaves like production software from day one.' },
  { n:'03 / 04', title:'Built to go live fast', desc:'OneAtlas comes with hosting, deployment, analytics, custom domains, environments, and scaling built in — eliminating the setup work between building and launching.' },
  { n:'04 / 04', title:'AI-native by default', desc:'Use the latest AI models, agents, and workflows inside your product without managing providers or integrations. OneAtlas intelligently routes tasks to the right models so your team can focus on building, not configuring.' },
];

const USE_CASES = [
  { audience:'Startup teams', tagline:'Ship before momentum fades', desc:'Launch new products, validate concepts, and iterate quickly without slowing down on development.', detail:'Generate complete applications, databases, authentication, and interfaces from simple instructions.' },
  { audience:'Product & innovation teams', tagline:'Test ideas in real environments', desc:'Explore new features, workflows, and experiments without waiting through engineering backlogs.', detail:'Turn rough concepts into usable software your team can review, refine, and deploy instantly.' },
  { audience:'Marketing & growth teams', tagline:'Launch without dependencies', desc:'Create launch pages, acquisition funnels, and branded web experiences at the speed campaigns move.', detail:'Publish optimized pages with hosting, analytics, SEO, and forms already connected.' },
  { audience:'Agencies & service businesses', tagline:'Deliver custom software at scale', desc:'Build client-facing platforms, dashboards, and workflows faster while handling more projects simultaneously.', detail:'Reduce repetitive setup work and accelerate delivery using AI-assisted app generation.' },
  { audience:'Operations & business teams', tagline:'Automate the work behind the scenes', desc:'Replace fragmented tools and manual processes with software built around how your company actually works.', detail:'Create approval systems, CRMs, onboarding tools, reporting dashboards, and operational workflows visually.' },
  { audience:'Independent builders', tagline:'Create products without technical overhead', desc:'Bring side projects, AI ideas, and business concepts to life without becoming a full-stack engineer.', detail:'Design, customize, and launch production-ready applications from a single workspace.' },
];

const INTEGRATION_CARDS = [
  { name:'Salesforce', cat:'Customer Operations', desc:'Sync pipeline data, automate workflows, and build internal tools directly on top of your CRM.' },
  { name:'Slack', cat:'Team Communication', desc:'Trigger alerts, approvals, and live updates directly inside the channels your team already uses.' },
  { name:'Notion', cat:'Knowledge & Workspaces', desc:'Connect docs and databases to power portals, dashboards, internal systems, and AI workflows.' },
  { name:'Google Sheets', cat:'Live Spreadsheet Data', desc:'Turn spreadsheets into connected app data for reporting, operations, and workflow automation.' },
  { name:'HubSpot', cat:'Revenue Workflows', desc:'Manage leads, automate customer journeys, and streamline sales operations across teams.' },
  { name:'Gmail', cat:'Automated Email Flows', desc:'Send onboarding emails, notifications, summaries, and customer communication automatically.' },
  { name:'Twilio', cat:'Customer Messaging', desc:'Build OTPs, reminders, alerts, and SMS workflows directly into your product experience.' },
  { name:'Google Drive', cat:'Documents & Storage', desc:'Store files, sync exports, and manage app-generated documents from one connected workspace.' },
];

/* ── Shared button helpers ── */
const AccentBtn = ({ children, className='', ...p }) => (
  <button {...p}
    className={'flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-white font-semibold text-[15px] transition-all ' + className}
    style={{ background:'#FF6600', borderRadius:12 }}
    onMouseEnter={e=>{ e.currentTarget.style.background='#E65C00'; e.currentTarget.style.transform='translateY(-1px)'; }}
    onMouseLeave={e=>{ e.currentTarget.style.background='#FF6600'; e.currentTarget.style.transform='translateY(0)'; }}>
    {children}
  </button>
);
const GhostBtn = ({ children, className='', ...p }) => (
  <button {...p}
    className={'flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-[15px] transition-all border ' + className}
    style={{ background:'#FFFFFF', borderColor:'#E5E7EB', color:'#111111', borderRadius:12 }}
    onMouseEnter={e=>e.currentTarget.style.background='#F5F5EE'}
    onMouseLeave={e=>e.currentTarget.style.background='#FFFFFF'}>
    {children}
  </button>
);

/* ── Nav ── */
function Navbar() {
  const [scrolled,setScrolled]=useState(false);
  const user=useStore(s=>s.user);
  useEffect(()=>{
    const fn=()=>setScrolled(window.scrollY>8);
    window.addEventListener('scroll',fn);
    return ()=>window.removeEventListener('scroll',fn);
  },[]);
  return (
    <nav className={'fixed top-0 left-0 right-0 z-50 transition-all duration-200 '+(scrolled?'nav-blur border-b':'border-b border-transparent')}
      style={{ height:72, background:scrolled?'rgba(245,245,238,0.92)':'transparent', borderColor:scrolled?'#E5E7EB':'transparent' }}>
      <div className="max-w-[1280px] mx-auto px-8 h-full flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{background:'#FF6600'}}>
            <Zap size={15} className="text-white"/>
          </div>
          <span className="font-bold text-lg" style={{color:'#111111',letterSpacing:'-0.02em'}}>OneAtlas</span>
        </div>
        <div className="hidden lg:flex items-center gap-7">
          {['Product','Use Cases','Templates','Enterprise','Security','Pricing'].map(l=>(
            <button key={l} className="text-[14px] font-medium transition-colors" style={{color:'#4B5563'}}
              onMouseEnter={e=>e.target.style.color='#111111'}
              onMouseLeave={e=>e.target.style.color='#4B5563'}>{l}</button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          {user ? (
            <Link to="/app/generate" className="px-5 py-2 rounded-xl text-white text-[14px] font-bold" style={{background:'#FF6600'}}
              onMouseEnter={e=>e.currentTarget.style.background='#E65C00'}
              onMouseLeave={e=>e.currentTarget.style.background='#FF6600'}>Open App →</Link>
          ) : (
            <>
              <Link to="/login" className="text-[14px] font-medium px-3 py-2" style={{color:'#4B5563'}}>Log In</Link>
              <Link to="/login" className="px-5 py-2 rounded-xl text-white text-[14px] font-bold transition-all" style={{background:'#FF6600',borderRadius:12}}
                onMouseEnter={e=>{e.currentTarget.style.background='#E65C00';e.currentTarget.style.transform='translateY(-1px)';}}
                onMouseLeave={e=>{e.currentTarget.style.background='#FF6600';e.currentTarget.style.transform='translateY(0)';}}>
                Start Building →
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

/* ── Hero ── */
function Hero() {
  const [demoPrompt, setDemoPrompt] = useState('');
  const [selectedModel, setSelectedModel] = useState('Claude Opus 4.6');
  const [buildMode, setBuildMode] = useState('Build');
  const [showModels, setShowModels] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [attached, setAttached] = useState([]);
  const user = useStore(s => s.user);
  const navigate = useNavigate();
  const fileRef = useRef(null);
  const imageRef = useRef(null);

  const modelIds = {
    'Automatic': 'auto', 'GPT-5.5': 'gpt-5.5', 'GPT-5.4 Mini': 'gpt-5.4-mini',
    'Claude Sonnet 4.6': 'claude-sonnet', 'Claude Opus 4.6': 'claude-opus',
    'Gemini 3.1 Pro': 'gemini-pro', 'Gemini 3 Flash': 'gemini-flash',
    'DeepSeek V4': 'deepseek-v4', 'Llama 4 Scout': 'llama-4-scout', 'Mistral Small': 'mistral-small',
  };

  const categoryPrompts = {
    internal_tool: 'Build an internal tool for my team that helps manage ',
    dashboard: 'Create a dashboard that shows ',
    client_portal: 'Build a client portal where customers can ',
    crm: 'Create a CRM app to manage leads, contacts, and deals for ',
    ai_workflow: 'Build an AI workflow that automates ',
    admin_panel: 'Create an admin panel to manage ',
  };

  const submitPrompt = () => {
    if (!demoPrompt.trim()) return;
    const payload = {
      prompt: demoPrompt.trim(),
      model: modelIds[selectedModel] || 'auto',
      mode: buildMode.toLowerCase(),
      autoStart: true,
    };
    sessionStorage.setItem('oa_pending_generation', JSON.stringify(payload));
    if (user) navigate('/app/generate');
    else navigate('/login');
  };

  const toggleVoice = () => {
    if (isRecording) { setIsRecording(false); return; }
    setIsRecording(true);
    setTimeout(() => {
      setIsRecording(false);
      setDemoPrompt(p => (p ? p + ' ' : '') + 'Build a customer feedback portal with AI-powered analysis');
    }, 2000);
  };

  return (
    <section className="pt-36 pb-20 px-5 md:px-8" style={{background:'#F5F5EE'}}>
      <div className="max-w-[1280px] mx-auto">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 mb-6 px-3 py-1.5 rounded-full border text-xs font-bold uppercase tracking-wider"
            style={{background:'#FFF3EB',border:'1px solid #FFD0A6',color:'#FF6600'}}>
            <span className="w-1.5 h-1.5 rounded-full pulse-soft" style={{background:'#FF6600'}}/>
            Now in public beta
          </div>
          <h1 className="font-bold mb-5" style={{fontSize:'clamp(40px,6vw,72px)',lineHeight:0.95,letterSpacing:'-0.04em',color:'#111111'}}>
            Where ideas become <span style={{color:'#FF6600'}}>tools</span>
          </h1>
          <p className="max-w-xl mx-auto text-lg" style={{color:'#6B7280',lineHeight:1.7}}>
            Describe what your team needs. OneAtlas generates a production-ready internal tool and deploys it instantly.
          </p>
        </div>

        <div className="max-w-3xl mx-auto mb-6">
          <div className="rounded-2xl border shadow-card" style={{background:'#FFFFFF',borderColor:'#E5E7EB',borderRadius:28,padding:24}}>
            <textarea value={demoPrompt} onChange={e=>setDemoPrompt(e.target.value)}
              onKeyDown={e=>{ if((e.metaKey||e.ctrlKey)&&e.key==='Enter') submitPrompt(); }}
              placeholder="Describe the internal tool your team needs..."
              className="w-full min-h-[80px] text-sm resize-none bg-transparent focus:outline-none"
              style={{color:'#111111'}}/>
            {attached.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {attached.map((f,i)=>(
                  <span key={i} className="flex items-center gap-1 px-2 py-1 rounded-lg border text-xs" style={{background:'#F9F9F6',borderColor:'#E5E7EB',color:'#6B7280'}}>
                    {f} <button onClick={()=>setAttached(p=>p.filter((_,j)=>j!==i))} style={{color:'#9CA3AF'}}>×</button>
                  </span>
                ))}
              </div>
            )}
            <div className="flex items-center justify-between mt-2 pt-3 border-t flex-wrap gap-2" style={{borderColor:'#ECECEC'}}>
              <div className="flex items-center gap-2 flex-wrap">
                <input ref={fileRef} type="file" multiple className="hidden" onChange={e=>{ setAttached(p=>[...p,...Array.from(e.target.files||[]).map(f=>f.name)]); e.target.value=''; }}/>
                <button onClick={()=>fileRef.current?.click()} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-all" style={{borderColor:'#E5E7EB',color:'#6B7280'}} title="Attach File">📎 <span className="hidden sm:inline">File</span></button>
                <input ref={imageRef} type="file" accept="image/*" multiple className="hidden" onChange={e=>{ setAttached(p=>[...p,...Array.from(e.target.files||[]).map(f=>f.name)]); e.target.value=''; }}/>
                <button onClick={()=>imageRef.current?.click()} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-all" style={{borderColor:'#E5E7EB',color:'#6B7280'}} title="Attach Image">🖼 <span className="hidden sm:inline">Image</span></button>
                <div className="flex rounded-lg border overflow-hidden" style={{borderColor:'#E5E7EB'}}>
                  {['Build','Plan'].map(m=>(
                    <button key={m} onClick={()=>setBuildMode(m)} className="px-3 py-1.5 text-xs font-semibold transition-all"
                      style={{background:buildMode===m?'#111111':'#FFFFFF',color:buildMode===m?'#FFFFFF':'#6B7280'}}>{m}</button>
                  ))}
                </div>
                <div className="relative">
                  <button onClick={()=>setShowModels(o=>!o)} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold" style={{background:'#F9F9F6',borderColor:'#E5E7EB',color:'#111111'}}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{background:'#FF6600'}}/>{selectedModel}<ChevronDown size={11} style={{color:'#9CA3AF'}}/>
                  </button>
                  {showModels && (
                    <div className="absolute top-full left-0 mt-1 z-50 w-56 rounded-xl border shadow-lg overflow-hidden max-h-64 overflow-y-auto" style={{background:'#FFFFFF',borderColor:'#E5E7EB'}} onMouseLeave={()=>setShowModels(false)}>
                      {MODELS.map(m=>(
                        <button key={m.name} onClick={()=>{setSelectedModel(m.name);setShowModels(false);}} className="w-full text-left px-3 py-2 text-xs font-medium hover:bg-[#F9F9F6]" style={{color:selectedModel===m.name?'#FF6600':'#111111'}}>{m.name}</button>
                      ))}
                    </div>
                  )}
                </div>
                <button onClick={toggleVoice} className="p-1.5 rounded-lg border transition-all" style={{borderColor:isRecording?'#FCA5A5':'#E5E7EB',color:isRecording?'#DC2626':'#9CA3AF',background:isRecording?'#FEF2F2':'transparent'}} title="Voice input">🎙️</button>
              </div>
              <button onClick={submitPrompt} disabled={!demoPrompt.trim()}
                className="flex items-center justify-center w-9 h-9 rounded-xl text-white transition-all disabled:opacity-40"
                style={{background:'#FF6600',borderRadius:12}}
                onMouseEnter={e=>{if(demoPrompt.trim())e.currentTarget.style.background='#E65C00';}}
                onMouseLeave={e=>e.currentTarget.style.background='#FF6600'}>
                <ArrowRight size={16}/>
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-3xl mx-auto mb-4">
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
            {CATEGORIES.map(cat=>(
              <button key={cat.id} onClick={()=>setDemoPrompt(categoryPrompts[cat.id]||'')}
                className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border transition-all"
                style={{background:'#FFFFFF',borderColor:'#E5E7EB',borderRadius:18}}
                onMouseEnter={e=>e.currentTarget.style.borderColor=cat.color}
                onMouseLeave={e=>e.currentTarget.style.borderColor='#E5E7EB'}>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{background:`${cat.color}18`}}>
                  <cat.icon size={14} style={{color:cat.color}}/>
                </div>
                <span className="text-[11px] font-semibold text-center leading-tight" style={{color:'#111111'}}>{cat.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="max-w-3xl mx-auto">
          <p className="text-xs font-semibold mb-2 text-center" style={{color:'#9CA3AF'}}>Try an example</p>
          <div className="flex flex-wrap gap-2 justify-center">
            {CHIPS.map(chip=>(
              <button key={chip} onClick={()=>setDemoPrompt(`Build a ${chip} for my team`)}
                className="px-3 py-1.5 rounded-full border text-xs font-medium transition-all"
                style={{background:'#FFFFFF',borderColor:'#E5E7EB',color:'#6B7280'}}
                onMouseEnter={e=>{e.currentTarget.style.borderColor='#FF6600';e.currentTarget.style.color='#FF6600';e.currentTarget.style.background='#FFF3EB';}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor='#E5E7EB';e.currentTarget.style.color='#6B7280';e.currentTarget.style.background='#FFFFFF';}}>
                {chip}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-16 pt-10 border-t" style={{borderColor:'#E5E7EB'}}>
          <p className="text-center text-xs font-bold uppercase tracking-widest mb-6" style={{color:'#9CA3AF'}}>Trusted by builders at every stage</p>
          <div className="flex items-center justify-center gap-6 md:gap-10 flex-wrap">
            {['ACME','PULSE','ECHO','LIGHT','ION','QUANTUM'].map(n=>(
              <span key={n} className="text-sm font-bold tracking-wider" style={{color:'#C4C4BC'}}>{n}</span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Steps ── */
function Steps() {
  return (
    <section className="py-28 px-8" style={{background:'#FFFFFF'}}>
      <div className="max-w-[1280px] mx-auto">
        <div className="text-center mb-14">
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{color:'#FF6600'}}>Meet OneAtlas</p>
          <h2 className="font-bold" style={{fontSize:'clamp(28px,4vw,48px)',lineHeight:1,letterSpacing:'-0.03em',color:'#111111'}}>
            From idea to live app in <span style={{color:'#FF6600'}}>4 steps</span>
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {STEPS.map(s=>(
            <div key={s.n} className="p-6 rounded-2xl border" style={{background:'#FFFFFF',borderColor:'#E5E7EB',borderRadius:24}}>
              <div className="text-xs font-bold mb-3" style={{color:'#FF6600'}}>{s.n}</div>
              <h3 className="font-bold mb-2" style={{fontSize:17,color:'#111111'}}>{s.title}</h3>
              <p style={{fontSize:14,color:'#6B7280',lineHeight:1.6}}>{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Features ── */
function Features() {
  return (
    <section className="py-28 px-8" style={{background:'#F5F5EE'}}>
      <div className="max-w-[1280px] mx-auto">
        <div className="text-center mb-14">
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{color:'#FF6600'}}>Platform</p>
          <h2 className="font-bold mb-4" style={{fontSize:'clamp(28px,4vw,48px)',lineHeight:1,letterSpacing:'-0.03em',color:'#111111'}}>
            Everything you need, <span style={{color:'#FF6600'}}>built-in.</span>
          </h2>
          <p className="max-w-lg mx-auto text-lg" style={{color:'#6B7280',lineHeight:1.7}}>
            One platform from idea to production — no stitching tools together, no managing infrastructure.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 stagger">
          {FEATURES.map(f=>(
            <div key={f.title} className="p-7 rounded-2xl border transition-all cursor-default"
              style={{background:'#FFFFFF',borderColor:'#E5E7EB',borderRadius:24,boxShadow:'0 1px 2px rgba(0,0,0,0.02)'}}
              onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow='0 4px 24px rgba(0,0,0,0.06)';}}
              onMouseLeave={e=>{e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow='0 1px 2px rgba(0,0,0,0.02)';}}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{background:`${f.c}18`}}>
                <f.icon size={18} style={{color:f.c}}/>
              </div>
              <h3 className="font-bold mb-2" style={{fontSize:17,color:'#111111'}}>{f.title}</h3>
              <p style={{fontSize:14,color:'#6B7280',lineHeight:1.6}}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Models section ── */
function Models() {
  return (
    <section className="py-28 px-8" style={{background:'#FFFFFF'}}>
      <div className="max-w-[1280px] mx-auto text-center">
        <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{color:'#FF6600'}}>The Model Universe</p>
        <h2 className="font-bold mb-4" style={{fontSize:'clamp(28px,4vw,48px)',lineHeight:1,letterSpacing:'-0.03em',color:'#111111'}}>
          Every frontier model. <span style={{color:'#FF6600'}}>One atlas.</span>
        </h2>
        <p className="max-w-lg mx-auto text-lg mb-14" style={{color:'#6B7280',lineHeight:1.7}}>
          10 state-of-the-art models across 8 providers. OneAtlas automatically routes each task to the optimal model.
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          {MODELS.map(m=>(
            <div key={m.name} className="px-4 py-3 rounded-2xl border flex items-center gap-2.5 transition-all cursor-default"
              style={{background:'#FFFFFF',borderColor:'#E5E7EB',borderRadius:18}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor=m.color;e.currentTarget.style.transform='translateY(-2px)';}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor='#E5E7EB';e.currentTarget.style.transform='translateY(0)';}}>
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{background:m.color}}/>
              <div className="text-left">
                <div className="text-sm font-bold" style={{color:'#111111'}}>{m.name}</div>
                <div className="text-xs" style={{color:'#9CA3AF'}}>{m.provider}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Use Cases (unique layout — not bolt.new clone) ── */
function UseCases() {
  return (
    <section className="py-28 px-5 md:px-8" style={{background:'#FFFFFF'}} id="use-cases">
      <div className="max-w-[1280px] mx-auto">
        <div className="text-center mb-16">
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{color:'#FF6600'}}>Built for people who move fast</p>
          <h2 className="font-bold mb-4" style={{fontSize:'clamp(28px,4vw,48px)',lineHeight:1,letterSpacing:'-0.03em',color:'#111111'}}>
            OneAtlas turns ideas into <span style={{color:'#FF6600'}}>working software</span>
          </h2>
          <p className="max-w-2xl mx-auto text-lg" style={{color:'#6B7280',lineHeight:1.7}}>
            Create AI apps, internal tools, customer portals, automations, and full products — without managing codebases, infrastructure, or complex workflows.
          </p>
        </div>
        <div className="space-y-4">
          {USE_CASES.map((uc, i) => (
            <div key={uc.audience}
              className="grid grid-cols-1 lg:grid-cols-12 gap-0 rounded-2xl border overflow-hidden transition-all"
              style={{background:'#FFFFFF',borderColor:'#E5E7EB',borderRadius:24}}
              onMouseEnter={e=>e.currentTarget.style.boxShadow='0 4px 24px rgba(0,0,0,0.06)'}
              onMouseLeave={e=>e.currentTarget.style.boxShadow='none'}>
              <div className="lg:col-span-1 flex lg:flex-col items-center justify-center py-4 lg:py-8 px-4" style={{background:i%2===0?'#FFF3EB':'#F9F9F6'}}>
                <span className="text-2xl font-bold" style={{color:'#FF6600',letterSpacing:'-0.02em'}}>{String(i+1).padStart(2,'0')}</span>
              </div>
              <div className="lg:col-span-5 p-6 lg:p-8 border-t lg:border-t-0 lg:border-l" style={{borderColor:'#ECECEC'}}>
                <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{color:'#9CA3AF'}}>{uc.audience}</p>
                <h3 className="font-bold mb-3" style={{fontSize:20,color:'#111111'}}>{uc.tagline}</h3>
                <p style={{fontSize:15,color:'#6B7280',lineHeight:1.6}}>{uc.desc}</p>
              </div>
              <div className="lg:col-span-6 p-6 lg:p-8 flex items-center border-t lg:border-t-0 lg:border-l" style={{borderColor:'#ECECEC',background:'#FAFAF8'}}>
                <p style={{fontSize:14,color:'#4B5563',lineHeight:1.7}}>{uc.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Integrations ── */
function Integrations() {
  return (
    <section className="py-28 px-5 md:px-8" style={{background:'#F5F5EE'}} id="integrations">
      <div className="max-w-[1280px] mx-auto">
        <div className="text-center mb-14">
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{color:'#FF6600'}}>Integrations</p>
          <h2 className="font-bold mb-4" style={{fontSize:'clamp(28px,4vw,48px)',lineHeight:1,letterSpacing:'-0.03em',color:'#111111'}}>
            Plug into the tools you already <span style={{color:'#FF6600'}}>run</span>
          </h2>
          <p className="max-w-2xl mx-auto text-lg" style={{color:'#6B7280',lineHeight:1.7}}>
            OneAtlas works with the systems your team already depends on — CRM, communication, spreadsheets, documents, and customer workflows. Connect your stack instantly without rebuilding infrastructure or managing APIs.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {INTEGRATION_CARDS.map(int=>(
            <div key={int.name} className="p-6 rounded-2xl border transition-all"
              style={{background:'#FFFFFF',borderColor:'#ECECEC',borderRadius:28,minHeight:220}}
              onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-4px)';e.currentTarget.style.borderColor='#D1D5DB';}}
              onMouseLeave={e=>{e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.borderColor='#ECECEC';}}>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{color:'#9CA3AF'}}>{int.cat}</p>
              <h3 className="font-bold mb-2" style={{fontSize:16,color:'#111111'}}>{int.name}</h3>
              <p style={{fontSize:13,color:'#6B7280',lineHeight:1.6}}>{int.desc}</p>
            </div>
          ))}
        </div>
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-center sm:text-left" style={{color:'#9CA3AF'}}>
            Also connects to <strong style={{color:'#6B7280',fontWeight:600}}>Stripe, Discord, LinkedIn, Google Calendar, TikTok, Resend, REST APIs, Webhooks</strong>, and more.
          </p>
          <Link to="/login" className="inline-flex items-center gap-1.5 text-sm font-bold shrink-0" style={{color:'#FF6600'}}>
            View all integrations <ArrowRight size={14}/>
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ── Comparison ── */
function Comparison() {
  return (
    <section className="py-28 px-8" style={{background:'#FFFFFF'}}>
      <div className="max-w-[1280px] mx-auto">
        <div className="text-center mb-14">
          <h2 className="font-bold mb-3" style={{fontSize:'clamp(28px,4vw,48px)',lineHeight:1,letterSpacing:'-0.03em',color:'#111111'}}>How we stack up</h2>
          <p style={{fontSize:17,color:'#6B7280'}}>See how OneAtlas compares to other app builders across the features that matter most.</p>
        </div>
        <div className="rounded-2xl border overflow-hidden" style={{borderColor:'#E5E7EB'}}>
          <div className="grid grid-cols-3 p-4 border-b" style={{borderColor:'#E5E7EB',background:'#F9F9F6'}}>
            <div className="text-xs font-bold uppercase tracking-wider" style={{color:'#9CA3AF'}}>Feature</div>
            <div className="text-sm font-bold" style={{color:'#FF6600'}}>OneAtlas</div>
            <div className="text-sm font-bold" style={{color:'#9CA3AF'}}>Others</div>
          </div>
          {COMPARISON.map((row,i)=>(
            <div key={row.feature} className="grid grid-cols-3 p-4 border-b last:border-0" style={{borderColor:'#E5E7EB',background:i%2===0?'#FFFFFF':'#FAFAF8'}}>
              <div className="text-sm font-medium" style={{color:'#111111'}}>{row.feature}</div>
              <div className="flex items-center gap-1.5"><Check size={13} style={{color:'#10B981'}}/><span className="text-sm" style={{color:'#111111'}}>{row.ours}</span></div>
              <div className="text-sm" style={{color:'#9CA3AF'}}>{row.theirs}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Pricing ── */
function Pricing() {
  const [annual,setAnnual]=useState(false);
  return (
    <section className="py-28 px-8" style={{background:'#F5F5EE'}}>
      <div className="max-w-[1280px] mx-auto">
        <div className="text-center mb-14">
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{color:'#FF6600'}}>Pricing</p>
          <h2 className="font-bold mb-3" style={{fontSize:'clamp(28px,4vw,48px)',lineHeight:1,letterSpacing:'-0.03em',color:'#111111'}}>
            Flexible plans for <span style={{color:'#FF6600'}}>builders, startups, and growing teams.</span>
          </h2>
          <p className="mb-8 text-lg" style={{color:'#6B7280'}}>Start free and scale as your team grows.</p>
          <div className="inline-flex items-center gap-1 p-1 rounded-xl border" style={{background:'#FFFFFF',borderColor:'#E5E7EB'}}>
            {[['Monthly',false],['Yearly',true]].map(([l,v])=>(
              <button key={l} onClick={()=>setAnnual(v)}
                className="px-4 py-1.5 rounded-lg text-sm font-semibold transition-all"
                style={{background:annual===v?'#111111':'transparent',color:annual===v?'#FFFFFF':'#6B7280'}}>
                {l}{v&&<span className="ml-1 text-xs" style={{color:annual?'#FF6600':'#9CA3AF'}}>Save 20%</span>}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {PLANS.map(plan=>(
            <div key={plan.name} className="p-6 rounded-2xl flex flex-col"
              style={{background:'#FFFFFF',border:plan.highlight?'1.5px solid #FF6600':'1px solid #E5E7EB',borderRadius:24}}>
              {plan.badge&&<div className="self-start mb-3 px-2.5 py-1 rounded-full text-xs font-bold" style={{background:'#FFF3EB',color:'#FF6600'}}>★ {plan.badge}</div>}
              <div className="font-bold mb-1" style={{fontSize:16,color:'#111111'}}>{plan.name}</div>
              <div className="flex items-end gap-1 mb-1">
                <span className="font-bold" style={{fontSize:34,color:'#111111',lineHeight:1,letterSpacing:'-0.02em'}}>{annual&&plan.price!=='$0'?plan.price:plan.price}</span>
                <span className="text-sm mb-1" style={{color:'#9CA3AF'}}>{plan.period}</span>
              </div>
              {annual&&plan.price!=='$0'&&<p className="text-xs mb-2" style={{color:'#9CA3AF'}}>Billed annually</p>}
              <p className="text-sm mb-5" style={{color:'#6B7280',lineHeight:1.5}}>{plan.desc}</p>
              <ul className="space-y-2.5 flex-1 mb-5">
                {plan.features.map(f=>(
                  <li key={f} className="flex items-start gap-2 text-sm" style={{color:'#374151'}}>
                    <Check size={13} style={{color:'#10B981',flexShrink:0,marginTop:2}}/>{f}
                  </li>
                ))}
              </ul>
              <Link to="/login" className="block text-center py-2.5 rounded-xl text-sm font-bold transition-all"
                style={{background:plan.highlight?'#FF6600':'#111111',color:'#FFFFFF',borderRadius:12,textDecoration:'none'}}
                onMouseEnter={e=>e.currentTarget.style.opacity='0.88'}
                onMouseLeave={e=>e.currentTarget.style.opacity='1'}>
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
        <div className="mt-6 p-8 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
          style={{background:'#111111',borderRadius:24}}>
          <div>
            <h3 className="font-bold text-white mb-2" style={{fontSize:20}}>Enterprise</h3>
            <p className="text-sm max-w-lg" style={{color:'#9CA3AF',lineHeight:1.6}}>
              Custom infrastructure, governance, and deployment solutions. Private cloud, compliance controls, dedicated account management, SLA-backed uptime, and flexible procurement.
            </p>
          </div>
          <Link to="/login" className="shrink-0 px-6 py-3 rounded-xl font-bold text-sm transition-all"
            style={{background:'#FFFFFF',color:'#111111',borderRadius:12,textDecoration:'none'}}
            onMouseEnter={e=>e.currentTarget.style.background='#F5F5EE'}
            onMouseLeave={e=>e.currentTarget.style.background='#FFFFFF'}>
            Talk to Enterprise Sales →
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ── FAQ ── */
function FAQ() {
  const [openQ,setOpenQ]=useState(null);
  const cats=[...new Set(FAQS.map(f=>f.cat))];
  const [activeCat,setActiveCat]=useState(cats[0]);
  return (
    <section className="py-28 px-8" style={{background:'#FFFFFF'}}>
      <div className="max-w-[1280px] mx-auto">
        <div className="text-center mb-14">
          <h2 className="font-bold mb-3" style={{fontSize:'clamp(28px,4vw,48px)',lineHeight:1,letterSpacing:'-0.03em',color:'#111111'}}>Frequently asked questions</h2>
          <p style={{color:'#6B7280'}}>Everything you need to know about OneAtlas.</p>
        </div>
        <div className="flex flex-col lg:flex-row gap-12">
          <div className="lg:w-44 flex-shrink-0 space-y-1">
            {cats.map(cat=>(
              <button key={cat} onClick={()=>setActiveCat(cat)}
                className="w-full text-left px-3 py-2 rounded-lg text-xs font-bold transition-all"
                style={{color:activeCat===cat?'#FF6600':'#6B7280',background:activeCat===cat?'#FFF3EB':'transparent'}}>
                {cat}
              </button>
            ))}
          </div>
          <div className="flex-1">
            {FAQS.filter(f=>f.cat===activeCat).map((faq,i)=>(
              <div key={faq.q} className="border-b" style={{borderColor:'#ECECEC'}}>
                <button className="w-full flex items-center justify-between py-5 text-left"
                  onClick={()=>setOpenQ(openQ===i?null:i)}>
                  <span className="font-semibold" style={{fontSize:15,color:'#111111'}}>{faq.q}</span>
                  <ChevronDown size={15} style={{color:'#9CA3AF',transform:openQ===i?'rotate(180deg)':'none',transition:'transform 0.2s',flexShrink:0,marginLeft:16}}/>
                </button>
                {openQ===i&&<div className="pb-5 slide-up" style={{color:'#6B7280',lineHeight:1.7,fontSize:14}}>{faq.a}</div>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── CTA ── */
function CTA() {
  return (
    <section className="py-20 px-8" style={{background:'#111111'}}>
      <div className="max-w-[1280px] mx-auto text-center">
        <h2 className="font-bold mb-4 text-white" style={{fontSize:'clamp(28px,4vw,48px)',lineHeight:1,letterSpacing:'-0.03em'}}>
          Ready to build the future<br/>with <span style={{color:'#FF6600'}}>OneAtlas?</span>
        </h2>
        <p className="mb-10 max-w-lg mx-auto text-lg" style={{color:'#9CA3AF',lineHeight:1.7}}>
          From idea to production — build, deploy, and scale AI apps faster with the all-in-one platform.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/login" className="px-8 py-4 rounded-xl font-bold text-white transition-all inline-block text-center"
            style={{background:'#FF6600',fontSize:16,borderRadius:12,textDecoration:'none'}}
            onMouseEnter={e=>e.currentTarget.style.background='#E65C00'}
            onMouseLeave={e=>e.currentTarget.style.background='#FF6600'}>
            Start for Free →
          </Link>
          <button className="px-8 py-4 rounded-xl font-bold border transition-all"
            style={{borderColor:'#2D2D2D',color:'#FFFFFF',fontSize:16,borderRadius:12}}
            onMouseEnter={e=>e.currentTarget.style.borderColor='#444444'}
            onMouseLeave={e=>e.currentTarget.style.borderColor='#2D2D2D'}>
            Talk to Sales
          </button>
        </div>
      </div>
    </section>
  );
}

/* ── Footer ── */
function Footer() {
  return (
    <footer className="py-12 px-8 border-t" style={{background:'#F5F5EE',borderColor:'#E5E7EB'}}>
      <div className="max-w-[1280px] mx-auto">
        <div className="flex flex-col md:flex-row items-start justify-between gap-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{background:'#FF6600'}}>
                <Zap size={13} className="text-white"/>
              </div>
              <span className="font-bold" style={{color:'#111111'}}>OneAtlas</span>
            </div>
            <p className="text-sm max-w-xs" style={{color:'#9CA3AF',lineHeight:1.6}}>The all-in-one platform to build, deploy, and scale AI-powered applications.</p>
          </div>
          {[
            {title:'Product', links:['Features','Templates','Pricing','Changelog']},
            {title:'Solutions', links:['Startups','Role Developers','Agencies','Enterprise']},
            {title:'Resources', links:['Docs','API Reference','Guides','Status']},
            {title:'Company',  links:['About','Careers','Blog','Contact']},
          ].map(col=>(
            <div key={col.title}>
              <div className="text-xs font-bold uppercase tracking-widest mb-4" style={{color:'#9CA3AF'}}>{col.title}</div>
              <div className="space-y-2">
                {col.links.map(l=>(
                  <div key={l} className="text-sm cursor-pointer transition-colors" style={{color:'#6B7280'}}
                    onMouseEnter={e=>e.target.style.color='#111111'}
                    onMouseLeave={e=>e.target.style.color='#6B7280'}>{l}</div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-10 pt-6 border-t flex flex-col md:flex-row items-center justify-between gap-4" style={{borderColor:'#E5E7EB'}}>
          <p className="text-sm" style={{color:'#9CA3AF'}}>© 2026 OneAtlas, Inc. All rights reserved.</p>
          <div className="flex gap-5">
            {['Terms of Service','Privacy Policy','Security'].map(l=>(
              <span key={l} className="text-sm cursor-pointer transition-colors" style={{color:'#9CA3AF'}}
                onMouseEnter={e=>e.target.style.color='#111111'}
                onMouseLeave={e=>e.target.style.color='#9CA3AF'}>{l}</span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ── Page ── */
export default function LandingPage() {
  const user=useStore(s=>s.user);
  const authLoading=useStore(s=>s.authLoading);
  const navigate=useNavigate();
  useEffect(()=>{ if(!authLoading&&user) navigate('/app/generate',{replace:true}); },[user,authLoading]);
  return (
    <div style={{background:'#F5F5EE',minHeight:'100vh'}}>
      <Navbar/>
      <Hero/>
      <Steps/>
      <Features/>
      <UseCases/>
      <Models/>
      <Integrations/>
      <Comparison/>
      <Pricing/>
      <FAQ/>
      <CTA/>
      <Footer/>
    </div>
  );
}
