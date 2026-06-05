import type { Template } from "@/types";

export const TEMPLATES: Template[] = [
  // AI Apps
  { id: "ai-support-agent", name: "AI Support Agent", category: "AI Apps", description: "Intelligent customer support with auto-routing and response generation", featured: true, usageCount: 4821 },
  { id: "ai-chatbot", name: "AI Chatbot", category: "AI Apps", description: "Conversational AI interface with context memory and multi-turn dialogue", featured: false, usageCount: 3210 },
  { id: "ai-research-assistant", name: "AI Research Assistant", category: "AI Apps", description: "Deep research tool with source aggregation and summarization", featured: true, usageCount: 2890 },
  { id: "ai-workflow-copilot", name: "AI Workflow Copilot", category: "AI Apps", description: "AI-driven automation for repetitive business processes", featured: false, usageCount: 1954 },
  { id: "ai-document-analyzer", name: "AI Document Analyzer", category: "AI Apps", description: "Parse, extract, and summarize insights from documents automatically", featured: false, usageCount: 2340 },
  { id: "ai-content-generator", name: "AI Content Generator", category: "AI Apps", description: "Generate marketing copy, blog posts, and social content at scale", featured: false, usageCount: 3102 },
  // Dashboards
  { id: "kpi-dashboard", name: "KPI Dashboard", category: "Dashboards", description: "Real-time metrics visualization with drill-down analytics", featured: true, usageCount: 5600 },
  { id: "saas-analytics", name: "SaaS Analytics Dashboard", category: "Dashboards", description: "MRR, churn, CAC, LTV — every metric your SaaS needs", featured: true, usageCount: 4102 },
  { id: "revenue-tracker", name: "Revenue Tracker", category: "Dashboards", description: "Track revenue streams, goals, and forecasts in one view", featured: false, usageCount: 2890 },
  { id: "marketing-analytics", name: "Marketing Analytics", category: "Dashboards", description: "Campaign performance, funnel metrics, and ROI tracking", featured: false, usageCount: 2341 },
  { id: "executive-reports", name: "Executive Reports", category: "Dashboards", description: "Board-ready dashboards with automated weekly summaries", featured: false, usageCount: 1820 },
  { id: "live-monitoring", name: "Live Monitoring Dashboard", category: "Dashboards", description: "Real-time system health, uptime, and alert management", featured: false, usageCount: 1654 },
  // CRM
  { id: "sales-pipeline-crm", name: "Sales Pipeline CRM", category: "CRM", description: "Full pipeline management from lead to closed deal", featured: true, usageCount: 6721 },
  { id: "lead-tracker", name: "Lead Tracker", category: "CRM", description: "Capture, qualify, and nurture leads across channels", featured: false, usageCount: 4320 },
  { id: "client-management", name: "Client Management", category: "CRM", description: "Manage contacts, accounts, and client relationships at scale", featured: false, usageCount: 3812 },
  { id: "customer-success", name: "Customer Success Dashboard", category: "CRM", description: "Health scores, renewals, and success metrics per account", featured: false, usageCount: 2901 },
  { id: "deal-management", name: "Deal Management Tool", category: "CRM", description: "Track deals, stages, and win rates with team visibility", featured: false, usageCount: 2540 },
  { id: "proposal-generator", name: "Proposal Generator", category: "CRM", description: "AI-powered proposal creation with templates and e-sign", featured: false, usageCount: 1890 },
  // Internal Tools
  { id: "admin-panel", name: "Admin Panel", category: "Internal Tools", description: "Full CRUD admin interface with role-based access and audit logs", featured: true, usageCount: 7102 },
  { id: "approval-workflow", name: "Approval Workflow", category: "Internal Tools", description: "Multi-stage approval routing with notifications and audit trail", featured: true, usageCount: 4521 },
  { id: "team-workspace", name: "Team Workspace", category: "Internal Tools", description: "Shared workspace with projects, tasks, and team collaboration", featured: false, usageCount: 3201 },
  { id: "operations-tracker", name: "Operations Tracker", category: "Internal Tools", description: "Track operational KPIs, tasks, and SLA compliance", featured: false, usageCount: 2890 },
  { id: "resource-planner", name: "Resource Planner", category: "Internal Tools", description: "Plan team capacity, allocations, and project timelines", featured: false, usageCount: 2341 },
  { id: "knowledge-base", name: "Company Knowledge Base", category: "Internal Tools", description: "Internal wiki with search, versioning, and AI-powered Q&A", featured: false, usageCount: 2102 },
  // Marketplaces
  { id: "job-marketplace", name: "Job Marketplace", category: "Marketplaces", description: "Post jobs, accept applications, and manage hiring pipelines", featured: false, usageCount: 1890 },
  { id: "freelancer-platform", name: "Freelancer Platform", category: "Marketplaces", description: "Connect clients and freelancers with escrow payments", featured: false, usageCount: 1654 },
  { id: "vendor-marketplace", name: "Vendor Marketplace", category: "Marketplaces", description: "Multi-vendor catalog with reviews and order management", featured: false, usageCount: 1420 },
  { id: "booking-platform", name: "Booking Platform", category: "Marketplaces", description: "Service booking with calendar, payments, and reminders", featured: false, usageCount: 2109 },
  { id: "service-directory", name: "Service Directory", category: "Marketplaces", description: "Searchable directory with ratings, filters, and lead capture", featured: false, usageCount: 1203 },
  { id: "community-marketplace", name: "Community Marketplace", category: "Marketplaces", description: "Buy and sell within a community with moderation tools", featured: false, usageCount: 987 },
  // Ecommerce
  { id: "inventory-manager", name: "Inventory Manager", category: "Ecommerce", description: "Track stock, movements, suppliers, and reorder alerts", featured: true, usageCount: 5102 },
  { id: "order-tracking", name: "Order Tracking System", category: "Ecommerce", description: "Real-time order status with customer notifications", featured: false, usageCount: 3890 },
  { id: "product-catalog", name: "Product Catalog", category: "Ecommerce", description: "Manage products, variants, pricing, and categories", featured: false, usageCount: 2890 },
  { id: "supplier-portal", name: "Supplier Portal", category: "Ecommerce", description: "Supplier onboarding, POs, and invoice management", featured: false, usageCount: 1654 },
  { id: "retail-dashboard", name: "Retail Dashboard", category: "Ecommerce", description: "Sales analytics, top products, and store performance", featured: false, usageCount: 2109 },
  { id: "subscription-storefront", name: "Subscription Storefront", category: "Ecommerce", description: "Sell subscriptions with Stripe, billing, and dunning", featured: false, usageCount: 1782 },
  // Productivity
  { id: "project-management", name: "Project Management Tool", category: "Productivity", description: "Projects, milestones, tasks, and team dependencies", featured: true, usageCount: 6821 },
  { id: "task-tracker", name: "Task Tracker", category: "Productivity", description: "Personal and team task management with priorities and deadlines", featured: false, usageCount: 4901 },
  { id: "sprint-planner", name: "Sprint Planner", category: "Productivity", description: "Agile sprint planning with velocity tracking and retrospectives", featured: false, usageCount: 3201 },
  { id: "notes-workspace", name: "Notes Workspace", category: "Productivity", description: "Rich notes with tags, search, and team sharing", featured: false, usageCount: 2890 },
  { id: "calendar-manager", name: "Calendar Manager", category: "Productivity", description: "Team calendar with scheduling, availability, and meeting links", featured: false, usageCount: 2341 },
  { id: "team-collaboration", name: "Team Collaboration Hub", category: "Productivity", description: "Channels, threads, files, and shared workspaces", featured: false, usageCount: 2012 },
  // Client Apps
  { id: "customer-portal", name: "Customer Portal", category: "Client Apps", description: "Self-service portal for customers to manage accounts and requests", featured: true, usageCount: 4521 },
  { id: "employee-dashboard", name: "Employee Dashboard", category: "Client Apps", description: "HR self-service with leave, payroll, and performance data", featured: false, usageCount: 3201 },
  { id: "vendor-workspace", name: "Vendor Workspace", category: "Client Apps", description: "Partner portal for vendors to manage orders and communications", featured: false, usageCount: 1890 },
  { id: "member-app", name: "Member App", category: "Client Apps", description: "Membership management with benefits, events, and community", featured: false, usageCount: 1654 },
  { id: "partner-hub", name: "Partner Hub", category: "Client Apps", description: "Partner onboarding, resources, and deal registration", featured: false, usageCount: 1420 },
  { id: "client-onboarding", name: "Client Onboarding App", category: "Client Apps", description: "Guided onboarding flow with tasks, checklists, and progress tracking", featured: false, usageCount: 2109 },
];

export const TEMPLATE_CATEGORIES = [
  "AI Apps",
  "Dashboards",
  "CRM",
  "Internal Tools",
  "Marketplaces",
  "Ecommerce",
  "Productivity",
  "Client Apps",
];
