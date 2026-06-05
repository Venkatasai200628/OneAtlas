import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTemplatePrompt } from '@/lib/promptPresets';
import { getTemplateVisual } from '../../lib/templateCatalog.js';
import { startGenerationFromTemplate } from '@/lib/projectNavigation';
import { Search, Star } from 'lucide-react';

const CATS = ['All','AI Apps','Dashboards','CRM','Internal Tools','Marketplaces','Ecommerce','Productivity','Client Apps'];

const TEMPLATES = [
  { id:1,  cat:'AI Apps',       name:'AI Support Agent',        desc:'Intelligent customer support with auto-routing and response generation', uses:4821, featured:true  },
  { id:2,  cat:'AI Apps',       name:'AI Chatbot',              desc:'Conversational AI interface with context memory and multi-turn dialogue', uses:3210, featured:false },
  { id:3,  cat:'AI Apps',       name:'AI Research Assistant',   desc:'Deep research tool with source aggregation and summarization', uses:2890, featured:true  },
  { id:4,  cat:'AI Apps',       name:'AI Workflow Copilot',     desc:'AI-driven automation for repetitive business processes', uses:1954, featured:false },
  { id:5,  cat:'AI Apps',       name:'AI Document Analyzer',    desc:'Extract insights and structured data from uploaded documents', uses:1543, featured:false },
  { id:6,  cat:'AI Apps',       name:'AI Content Generator',    desc:'Multi-format content creation with brand voice and approval workflows', uses:1389, featured:false },
  { id:7,  cat:'Dashboards',    name:'KPI Dashboard',           desc:'Real-time key performance indicators with drill-down analytics', uses:5100, featured:true  },
  { id:8,  cat:'Dashboards',    name:'SaaS Analytics Dashboard',desc:'MRR, churn, LTV, and acquisition metrics for SaaS businesses', uses:3560, featured:true  },
  { id:9,  cat:'Dashboards',    name:'Revenue Tracker',         desc:'Real-time revenue tracking with forecasting and quota management', uses:2890, featured:false },
  { id:10, cat:'Dashboards',    name:'Marketing Analytics',     desc:'Campaign performance, attribution, and channel analytics', uses:1720, featured:false },
  { id:11, cat:'Dashboards',    name:'Executive Reports',       desc:'Board-ready dashboards with automated weekly reports', uses:1430, featured:false },
  { id:12, cat:'Dashboards',    name:'Live Monitoring Dashboard',desc:'System health, uptime, and alert management dashboard', uses:980,  featured:false },
  { id:13, cat:'CRM',           name:'Sales Pipeline CRM',      desc:'Full sales pipeline with deals, contacts, and activity tracking', uses:6200, featured:true  },
  { id:14, cat:'CRM',           name:'Lead Tracker',            desc:'Lead capture, scoring, and nurture pipeline with integrations', uses:3890, featured:false },
  { id:15, cat:'CRM',           name:'Client Management',       desc:'Client relationship management with project tracking and invoicing', uses:2430, featured:false },
  { id:16, cat:'CRM',           name:'Customer Success Dashboard',desc:'Health scores, renewal tracking, and expansion management', uses:1980, featured:false },
  { id:17, cat:'CRM',           name:'Deal Management Tool',    desc:'Deal room with document sharing, e-signature, and approval flows', uses:1765, featured:false },
  { id:18, cat:'CRM',           name:'Proposal Generator',      desc:'Automated proposal creation with templates and client approval', uses:1243, featured:false },
  { id:19, cat:'Internal Tools',name:'Admin Panel',             desc:'Full-featured admin dashboard for managing users, data, and settings', uses:8500, featured:true  },
  { id:20, cat:'Internal Tools',name:'Approval Workflow',       desc:'Multi-step approval flows with notifications and audit trail', uses:4100, featured:false },
  { id:21, cat:'Internal Tools',name:'Team Workspace',          desc:'Collaborative workspace with tasks, docs, and team communication', uses:3670, featured:false },
  { id:22, cat:'Internal Tools',name:'Operations Tracker',      desc:'Day-to-day operations management with SLA tracking and reporting', uses:2230, featured:false },
  { id:23, cat:'Internal Tools',name:'Resource Planner',        desc:'Team capacity planning, resource allocation, and project scheduling', uses:1890, featured:false },
  { id:24, cat:'Internal Tools',name:'Company Knowledge Base',  desc:'Internal wiki with search, versioning, and team permissions', uses:1765, featured:false },
  { id:25, cat:'Marketplaces',  name:'Job Marketplace',         desc:'Two-sided job board with applications, interviews, and hiring workflows', uses:2200, featured:false },
  { id:26, cat:'Marketplaces',  name:'Freelancer Platform',     desc:'Freelance marketplace with profiles, proposals, payments, and reviews', uses:1890, featured:false },
  { id:27, cat:'Marketplaces',  name:'Vendor Marketplace',      desc:'B2B vendor directory with RFQ, evaluation, and procurement workflows', uses:1254, featured:false },
  { id:28, cat:'Marketplaces',  name:'Booking Platform',        desc:'Service booking with availability, payments, and automated confirmations', uses:1987, featured:false },
  { id:29, cat:'Marketplaces',  name:'Service Directory',       desc:'Local services directory with reviews, booking, and messaging', uses:1243, featured:false },
  { id:30, cat:'Marketplaces',  name:'Community Marketplace',   desc:'P2P buying/selling platform with listings and dispute resolution', uses:932,  featured:false },
  { id:31, cat:'Ecommerce',     name:'Inventory Manager',       desc:'Multi-location inventory with stock alerts, orders, and supplier management', uses:4800, featured:true  },
  { id:32, cat:'Ecommerce',     name:'Order Tracking System',   desc:'End-to-end order management with fulfillment, shipping, and returns', uses:3890, featured:false },
  { id:33, cat:'Ecommerce',     name:'Product Catalog',         desc:'Rich product catalog with variants, media, SEO, and category management', uses:2340, featured:false },
  { id:34, cat:'Ecommerce',     name:'Supplier Portal',         desc:'Supplier onboarding, PO management, and performance tracking', uses:1765, featured:false },
  { id:35, cat:'Ecommerce',     name:'Retail Dashboard',        desc:'Multi-store retail operations with POS integration and analytics', uses:1243, featured:false },
  { id:36, cat:'Ecommerce',     name:'Subscription Storefront', desc:'Subscription product store with recurring billing and member perks', uses:932,  featured:false },
  { id:37, cat:'Productivity',  name:'Project Management Tool', desc:'Full project management with tasks, milestones, Gantt, and team views', uses:7900, featured:true  },
  { id:38, cat:'Productivity',  name:'Task Tracker',            desc:'Simple and powerful task management with priorities and deadlines', uses:5800, featured:false },
  { id:39, cat:'Productivity',  name:'Sprint Planner',          desc:'Agile sprint planning with backlog, velocity tracking, and retrospectives', uses:3670, featured:false },
  { id:40, cat:'Productivity',  name:'Notes Workspace',         desc:'Rich text notes with tags, search, and AI-powered summaries', uses:2430, featured:false },
  { id:41, cat:'Productivity',  name:'Calendar Manager',        desc:'Team calendar with scheduling, availability, and meeting management', uses:2100, featured:false },
  { id:42, cat:'Productivity',  name:'Team Collaboration Hub',  desc:'All-in-one team hub with channels, docs, tasks, and video calls', uses:1890, featured:false },
  { id:43, cat:'Client Apps',   name:'Customer Portal',         desc:'Self-service portal for customers with support, billing, and account management', uses:4100, featured:true  },
  { id:44, cat:'Client Apps',   name:'Employee Dashboard',      desc:'Employee self-service for HR, benefits, PTO, and company news', uses:3560, featured:false },
  { id:45, cat:'Client Apps',   name:'Vendor Workspace',        desc:'Secure vendor collaboration space with document sharing and approvals', uses:1890, featured:false },
  { id:46, cat:'Client Apps',   name:'Member App',              desc:'Member management with profiles, events, forums, and exclusive content', uses:1765, featured:false },
  { id:47, cat:'Client Apps',   name:'Partner Hub',             desc:'Partner enablement portal with training, resources, and deal registration', uses:1243, featured:false },
  { id:48, cat:'Client Apps',   name:'Client Onboarding App',   desc:'Structured onboarding flow with tasks, milestones, and success tracking', uses:932,  featured:false },
];

export default function TemplatesPage() {
  const navigate = useNavigate();
  const [cat, setCat] = useState('All');
  const [search, setSearch] = useState('');

  const filtered = TEMPLATES.filter(t => {
    const matchCat = cat === 'All' || t.cat === cat;
    const matchSearch = !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.desc.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const handleUse = (t) => {
    startGenerationFromTemplate(navigate, { templateName: t.name, templateCategory: t.cat });
  };

  return (
    <div className="h-full flex flex-col" style={{ background: '#F5F5EE' }}>
      {/* Page header */}
      <div className="shrink-0 px-8 pt-8 pb-0" style={{ background: '#F5F5EE' }}>
        <h1 className="font-bold mb-1" style={{ fontSize: 28, color: '#111111', letterSpacing: '-0.02em' }}>Template Library</h1>
        <p className="text-sm mb-6" style={{ color: '#6B7280' }}>
          {TEMPLATES.length}+ production-ready templates. Click any to start building instantly.
        </p>

        {/* Search */}
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl border mb-5 max-w-sm"
          style={{ background: '#FFFFFF', borderColor: '#E5E7EB' }}>
          <Search size={14} style={{ color: '#9CA3AF' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search templates..."
            className="flex-1 text-sm bg-transparent outline-none" style={{ color: '#111111' }} />
        </div>

        {/* Category filters */}
        <div className="flex items-center gap-2 flex-wrap mb-6">
          {CATS.map(c => (
            <button key={c} onClick={() => setCat(c)}
              className="px-4 py-2 rounded-xl text-sm font-semibold transition-all border"
              style={{
                background: cat === c ? '#FF6600' : '#FFFFFF',
                color: cat === c ? '#FFFFFF' : '#6B7280',
                borderColor: cat === c ? '#FF6600' : '#E5E7EB',
              }}
              onMouseEnter={e => { if (cat !== c) { e.currentTarget.style.borderColor = '#FF6600'; e.currentTarget.style.color = '#FF6600'; } }}
              onMouseLeave={e => { if (cat !== c) { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.color = '#6B7280'; } }}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-auto px-8 pb-8">
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-sm" style={{ color: '#9CA3AF' }}>No templates match your search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {filtered.map(t => {
              const vis = getTemplateVisual(t.name, t.cat);
              return (
              <div key={t.id} className="rounded-2xl border overflow-hidden transition-all group"
                style={{ background: '#FFFFFF', borderColor: '#E5E7EB' }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 24px rgba(0,0,0,0.07)'; e.currentTarget.style.borderColor = vis.primary; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = '#E5E7EB'; }}>
                <div className="h-2" style={{ background: `linear-gradient(90deg, ${vis.primary}, ${vis.accent})` }} />
                <div className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#9CA3AF' }}>{t.cat}</span>
                    <span className="w-4 h-4 rounded-full border-2 border-white shadow-sm" style={{ background: vis.primary }} title="Template theme color" />
                  </div>
                  <h3 className="font-bold text-sm mb-2" style={{ color: '#111111' }}>{t.name}</h3>
                  <p className="text-xs mb-4" style={{ color: '#6B7280', lineHeight: 1.55 }}>{t.desc}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs" style={{ color: '#9CA3AF' }}>{t.uses.toLocaleString()} uses</span>
                    <button onClick={() => handleUse(t)}
                      className="flex items-center gap-1 text-xs font-bold transition-all opacity-0 group-hover:opacity-100"
                      style={{ color: vis.primary }}>
                      Use template →
                    </button>
                  </div>
                </div>
              </div>
            );})}
          </div>
        )}
      </div>
    </div>
  );
}
