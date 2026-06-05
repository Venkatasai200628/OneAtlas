"use client";
import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Plus, Search, Edit2, Trash2, X, Check, ChevronRight, BarChart2, Users, Package, CheckSquare, TrendingUp, AlertCircle } from "lucide-react";
import type { AppSpec, EntitySchema } from "@/types";

// Generates realistic seed data based on entity name
function generateSeedData(entity: EntitySchema, count = 6): Record<string, unknown>[] {
  const nameMap: Record<string, string[][]> = {
    lead:    [["Alice Johnson","alice@acme.com","New","Website"],["Bob Smith","bob@corp.com","Qualified","Referral"],["Carol White","carol@tech.com","Proposal","Cold Email"],["David Lee","david@startup.com","Won","LinkedIn"],["Eve Chen","eve@company.com","Lost","Ad"],["Frank Doe","frank@biz.com","New","Event"]],
    deal:    [["Enterprise Deal","$45,000","Negotiation","85%"],["Growth Package","$12,000","Proposal","60%"],["Starter Plan","$2,400","Closed Won","100%"],["Pro Upgrade","$8,000","Discovery","30%"],["Annual Contract","$96,000","Closing","92%"],["Team License","$18,000","Demo","45%"]],
    contact: [["Alice Johnson","alice@acme.com","Acme Corp","CTO"],["Bob Smith","bob@corp.com","Corp Inc","CEO"],["Carol White","carol@tech.com","Tech Ltd","VP Sales"],["David Lee","david@startup.com","Startup","Founder"],["Eve Chen","eve@co.com","Company","Manager"],["Frank Doe","frank@biz.com","Biz LLC","Director"]],
    task:    [["Design new dashboard","High","In Progress","John"],["Fix API bug","Critical","Todo","Sarah"],["Write docs","Medium","Done","Mike"],["Code review","Low","In Progress","Anna"],["Deploy v2.0","High","Todo","John"],["Update tests","Medium","Done","Sarah"]],
    employee:[["Alice Johnson","Engineering","Senior Engineer","alice@co.com"],["Bob Smith","Marketing","Marketing Lead","bob@co.com"],["Carol White","Sales","Account Executive","carol@co.com"],["David Lee","Design","UX Designer","david@co.com"],["Eve Chen","Engineering","Backend Dev","eve@co.com"],["Frank Doe","HR","HR Manager","frank@co.com"]],
    product: [["MacBook Pro 14","Electronics","$1,299","In Stock"],["AirPods Pro","Audio","$249","Low Stock"],["iPad Air","Tablets","$599","In Stock"],["Apple Watch","Wearables","$399","Out of Stock"],["HomePod","Smart Home","$299","In Stock"],["iPhone 15","Phones","$799","In Stock"]],
    order:   [["ORD-001","Alice Johnson","$1,299","Delivered"],["ORD-002","Bob Smith","$249","Shipped"],["ORD-003","Carol White","$599","Processing"],["ORD-004","David Lee","$1,698","Delivered"],["ORD-005","Eve Chen","$399","Cancelled"],["ORD-006","Frank Doe","$799","Shipped"]],
    property:[["123 Oak St","House","$450,000","Active"],["456 Elm Ave","Condo","$280,000","Pending"],["789 Pine Rd","Commercial","$1,200,000","Active"],["321 Maple Dr","House","$380,000","Sold"],["654 Cedar Ln","Apartment","$195,000","Active"],["987 Birch Blvd","Office","$890,000","Active"]],
  };

  const key = entity.name.toLowerCase();
  const data = Object.entries(nameMap).find(([k]) => key.includes(k))?.[1];
  const fields = entity.fields.filter(f => f.name !== "id" && f.name !== "createdAt" && f.name !== "updatedAt" && f.name !== "orgId");

  return Array.from({ length: count }, (_, i) => {
    const row: Record<string, unknown> = { id: `row-${i + 1}` };
    fields.forEach((f, j) => {
      row[f.name] = data?.[i]?.[j] ?? (f.type === "number" ? Math.floor(Math.random() * 100) : `Sample ${f.name} ${i + 1}`);
    });
    return row;
  });
}

const STATUS_STYLES: Record<string, string> = {
  "Active": "bg-green-100 text-green-700", "In Stock": "bg-green-100 text-green-700",
  "Delivered": "bg-green-100 text-green-700", "Done": "bg-green-100 text-green-700",
  "Closed Won": "bg-green-100 text-green-700", "Won": "bg-green-100 text-green-700", "Sold": "bg-green-100 text-green-700",
  "Pending": "bg-yellow-100 text-yellow-700", "Processing": "bg-yellow-100 text-yellow-700",
  "In Progress": "bg-blue-100 text-blue-700", "Proposal": "bg-blue-100 text-blue-700", "Shipped": "bg-blue-100 text-blue-700",
  "New": "bg-purple-100 text-purple-700", "Negotiation": "bg-orange-100 text-orange-700",
  "Low Stock": "bg-orange-100 text-orange-700", "Out of Stock": "bg-red-100 text-red-700",
  "Lost": "bg-red-100 text-red-700", "Cancelled": "bg-red-100 text-red-700",
  "Critical": "bg-red-100 text-red-700", "High": "bg-orange-100 text-orange-700",
  "Medium": "bg-blue-100 text-blue-700", "Low": "bg-gray-100 text-gray-600",
  "Todo": "bg-gray-100 text-gray-600", "Discovery": "bg-purple-100 text-purple-700",
  "Qualified": "bg-indigo-100 text-indigo-700", "Demo": "bg-pink-100 text-pink-700",
};

interface AppPreviewProps {
  spec: AppSpec;
  projectName?: string;
}

export function AppPreview({ spec, projectName }: AppPreviewProps) {
  const pages = spec.pages || [];
  const entities = spec.dataSchema?.entities || [];
  const [activePage, setActivePage] = useState(0);
  const [tableData, setTableData] = useState<Record<string, Record<string, unknown>[]>>(() => {
    const d: Record<string, Record<string, unknown>[]> = {};
    entities.forEach(e => { d[e.name] = generateSeedData(e); });
    return d;
  });
  const [search, setSearch] = useState("");
  const [editingRow, setEditingRow] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newRowData, setNewRowData] = useState<Record<string, string>>({});

  const currentPage = pages[activePage];
  // Find entity for current page
  const pageEntity = entities.find(e =>
    currentPage?.name.toLowerCase().includes(e.name.toLowerCase()) ||
    e.name.toLowerCase().includes(currentPage?.name.toLowerCase().replace(/s$/, "") || "")
  ) || entities[0];

  const currentData = pageEntity ? (tableData[pageEntity.name] || []) : [];
  const filteredData = currentData.filter(row =>
    !search || Object.values(row).some(v => String(v).toLowerCase().includes(search.toLowerCase()))
  );
  const displayFields = pageEntity?.fields.filter(f => !["id","orgId","createdAt","updatedAt"].includes(f.name)).slice(0, 5) || [];

  const handleDelete = (id: string) => {
    if (!pageEntity) return;
    setTableData(prev => ({ ...prev, [pageEntity.name]: prev[pageEntity.name].filter(r => r.id !== id) }));
  };

  const handleAdd = () => {
    if (!pageEntity) return;
    const newRow: Record<string, unknown> = { id: `row-${Date.now()}` };
    displayFields.forEach(f => { newRow[f.name] = newRowData[f.name] || `New ${f.name}`; });
    setTableData(prev => ({ ...prev, [pageEntity.name]: [newRow, ...prev[pageEntity.name]] }));
    setShowAddForm(false);
    setNewRowData({});
  };

  // Dashboard page — show stats
  const isDashboard = currentPage?.name.toLowerCase().includes("dashboard") || currentPage?.name.toLowerCase().includes("analytic") || activePage === 0;

  const stats = entities.slice(0, 4).map((e, i) => ({
    label: `Total ${e.name}s`,
    value: tableData[e.name]?.length || 0,
    change: `+${[3, 2, 5, 1][i]} this week`,
    icon: [BarChart2, Users, Package, CheckSquare][i],
    color: ["text-blue-600","text-green-600","text-purple-600","text-orange-600"][i],
    bg: ["bg-blue-50","bg-green-50","bg-purple-50","bg-orange-50"][i],
  }));

  return (
    <div className="flex h-full text-[13px] bg-[#F9F9F7]">
      {/* Sidebar */}
      <div className="w-48 bg-white border-r border-[#E5E7EB] flex flex-col shrink-0">
        <div className="px-4 py-3 border-b border-[#E5E7EB]">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-[6px] bg-[#FF6600] flex items-center justify-center text-white text-[10px] font-bold">
              {(projectName || "A")[0].toUpperCase()}
            </div>
            <span className="text-[12px] font-semibold text-[#111111] truncate">{projectName || "My App"}</span>
          </div>
        </div>
        <nav className="p-2 flex-1 overflow-y-auto">
          {pages.map((page, i) => (
            <button key={i} onClick={() => { setActivePage(i); setSearch(""); setShowAddForm(false); }}
              className={cn("w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-[8px] text-[12px] mb-0.5 text-left transition-colors",
                activePage === i ? "bg-orange-50 text-[#FF6600] font-semibold" : "text-[#6B7280] hover:bg-[#F5F5EE] hover:text-[#111111]")}>
              <div className="flex items-center gap-2 min-w-0">
                <div className={cn("w-1.5 h-1.5 rounded-full shrink-0", activePage === i ? "bg-[#FF6600]" : "bg-[#D1D5DB]")} />
                <span className="truncate">{page.name}</span>
              </div>
              {activePage === i && <ChevronRight className="w-3 h-3 shrink-0" />}
            </button>
          ))}
        </nav>
        {/* Workflow stubs */}
        {spec.workflowStubs.length > 0 && (
          <div className="p-3 border-t border-[#E5E7EB]">
            <p className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide mb-2">Automations</p>
            {spec.workflowStubs.slice(0, 2).map((ws, i) => (
              <div key={i} className="flex items-center gap-1.5 py-1">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0 animate-pulse" />
                <span className="text-[10px] text-[#6B7280] truncate">{ws.name}</span>
              </div>
            ))}
          </div>
        )}
        <div className="p-3 border-t border-[#E5E7EB]">
          <div className="flex items-center gap-2 px-2 py-1.5 rounded-[8px] bg-[#F5F5EE]">
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[#FF6600] to-[#FF8533] flex items-center justify-center text-white text-[8px] font-bold shrink-0">A</div>
            <div className="min-w-0"><p className="text-[10px] font-medium text-[#111111] truncate">Admin</p><p className="text-[9px] text-[#9CA3AF]">owner</p></div>
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 overflow-auto">
        <div className="p-5">
          {/* Page header */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-[16px] font-bold text-[#111111]">{currentPage?.name}</h2>
              <p className="text-[11px] text-[#9CA3AF] mt-0.5">
                {isDashboard ? "Overview and key metrics" : `${filteredData.length} ${pageEntity?.name?.toLowerCase() || "record"}s`}
              </p>
            </div>
            {!isDashboard && pageEntity && (
              <button onClick={() => setShowAddForm(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-[#FF6600] text-white rounded-[8px] text-[12px] font-semibold hover:bg-[#E65C00] transition-colors">
                <Plus className="w-3.5 h-3.5" /> Add {pageEntity.name}
              </button>
            )}
          </div>

          {/* Dashboard: Stats grid */}
          {isDashboard && (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
                {stats.map((s, i) => { const Icon = s.icon; return (
                  <div key={i} className="bg-white border border-[#E5E7EB] rounded-[12px] p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[10px] text-[#9CA3AF] font-medium">{s.label}</p>
                      <div className={cn("w-6 h-6 rounded-[6px] flex items-center justify-center", s.bg)}>
                        <Icon className={cn("w-3.5 h-3.5", s.color)} />
                      </div>
                    </div>
                    <p className="text-[24px] font-bold text-[#111111]">{s.value}</p>
                    <p className="text-[10px] text-green-600 mt-1 flex items-center gap-1"><TrendingUp className="w-3 h-3" />{s.change}</p>
                  </div>
                ); })}
              </div>

              {/* Recent records */}
              {entities[0] && tableData[entities[0].name] && (
                <div className="bg-white border border-[#E5E7EB] rounded-[12px] overflow-hidden">
                  <div className="px-4 py-3 border-b border-[#E5E7EB] flex items-center justify-between">
                    <p className="text-[12px] font-semibold text-[#111111]">Recent {entities[0].name}s</p>
                    <button onClick={() => setActivePage(pages.findIndex(p => p.name !== "Dashboard" && p.name !== "Settings") || 1)}
                      className="text-[11px] text-[#FF6600] font-medium hover:underline">View all →</button>
                  </div>
                  {tableData[entities[0].name].slice(0, 4).map((row, i) => {
                    const f = entities[0].fields.filter(f => !["id","orgId","createdAt","updatedAt"].includes(f.name));
                    return (
                      <div key={i} className="flex items-center gap-3 px-4 py-3 border-b border-[#F0F0EA] last:border-0 hover:bg-[#F9F9F7]">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                          {String(row[f[0]?.name] || "?")[0].toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] font-medium text-[#111111] truncate">{String(row[f[0]?.name] || "—")}</p>
                          {f[1] && <p className="text-[11px] text-[#9CA3AF] truncate">{String(row[f[1].name] || "—")}</p>}
                        </div>
                        {f[2] && (
                          <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0", STATUS_STYLES[String(row[f[2].name])] || "bg-gray-100 text-gray-600")}>
                            {String(row[f[2].name] || "—")}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* Data Table for non-dashboard pages */}
          {!isDashboard && pageEntity && (
            <>
              {/* Add form */}
              {showAddForm && (
                <div className="bg-white border border-[#FF6600]/30 rounded-[12px] p-4 mb-4 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[12px] font-semibold text-[#111111]">Add {pageEntity.name}</p>
                    <button onClick={() => setShowAddForm(false)} className="text-[#9CA3AF] hover:text-[#111111]"><X className="w-4 h-4" /></button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    {displayFields.slice(0, 4).map(f => (
                      <div key={f.name}>
                        <label className="text-[10px] font-medium text-[#6B7280] uppercase tracking-wide">{f.name}</label>
                        <input value={newRowData[f.name] || ""} onChange={e => setNewRowData(p => ({ ...p, [f.name]: e.target.value }))}
                          placeholder={`Enter ${f.name}`}
                          className="w-full mt-1 h-8 px-2.5 rounded-[6px] border border-[#E5E7EB] text-[12px] focus:outline-none focus:border-[#FF6600]" />
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={handleAdd} className="flex items-center gap-1 px-3 py-1.5 bg-[#FF6600] text-white rounded-[6px] text-[12px] font-semibold hover:bg-[#E65C00]">
                      <Check className="w-3.5 h-3.5" /> Save
                    </button>
                    <button onClick={() => setShowAddForm(false)} className="px-3 py-1.5 border border-[#E5E7EB] rounded-[6px] text-[12px] text-[#6B7280] hover:bg-[#F5F5EE]">Cancel</button>
                  </div>
                </div>
              )}

              {/* Search */}
              <div className="relative mb-3">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#9CA3AF]" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder={`Search ${pageEntity.name}s…`}
                  className="w-full h-8 pl-8 pr-3 rounded-[8px] border border-[#E5E7EB] bg-white text-[12px] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#FF6600]" />
              </div>

              {/* Table */}
              <div className="bg-white border border-[#E5E7EB] rounded-[12px] overflow-hidden">
                <div className="px-4 py-2.5 bg-[#F9F9F7] border-b border-[#E5E7EB] flex items-center gap-3">
                  <div className="w-7 shrink-0" />
                  {displayFields.map(f => (
                    <p key={f.name} className="flex-1 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide truncate">{f.name}</p>
                  ))}
                  <div className="w-12 shrink-0" />
                </div>
                {filteredData.length === 0 ? (
                  <div className="py-10 text-center">
                    <AlertCircle className="w-6 h-6 text-[#D1D5DB] mx-auto mb-2" />
                    <p className="text-[12px] text-[#9CA3AF]">No records found</p>
                  </div>
                ) : (
                  filteredData.map((row) => (
                    <div key={String(row.id)} className="flex items-center gap-3 px-4 py-3 border-b border-[#F0F0EA] last:border-0 hover:bg-[#F9F9F7] transition-colors group">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-indigo-400 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                        {String(Object.values(row).find(v => typeof v === "string" && v.length > 1) || "?")[0].toUpperCase()}
                      </div>
                      {displayFields.map(f => (
                        <div key={f.name} className="flex-1 min-w-0">
                          {STATUS_STYLES[String(row[f.name])] ? (
                            <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full", STATUS_STYLES[String(row[f.name])])}>{String(row[f.name])}</span>
                          ) : (
                            <p className="text-[12px] text-[#111111] truncate">{String(row[f.name] ?? "—")}</p>
                          )}
                        </div>
                      ))}
                      <div className="w-12 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        <button onClick={() => setEditingRow(String(row.id))} className="p-1 rounded-[4px] text-[#9CA3AF] hover:text-[#111111] hover:bg-[#F0F0EA]">
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button onClick={() => handleDelete(String(row.id))} className="p-1 rounded-[4px] text-[#9CA3AF] hover:text-red-500 hover:bg-red-50">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <p className="text-[11px] text-[#9CA3AF] mt-2">{filteredData.length} record{filteredData.length !== 1 ? "s" : ""}</p>
            </>
          )}

          {/* Settings page */}
          {currentPage?.name === "Settings" && (
            <div className="bg-white border border-[#E5E7EB] rounded-[12px] p-5">
              <p className="text-[13px] font-semibold text-[#111111] mb-4">App Settings</p>
              <div className="space-y-4">
                {["App Name","Support Email","Timezone","Language"].map(label => (
                  <div key={label} className="flex items-center justify-between py-3 border-b border-[#F0F0EA] last:border-0">
                    <p className="text-[12px] text-[#6B7280]">{label}</p>
                    <p className="text-[12px] font-medium text-[#111111]">{label === "Timezone" ? "UTC+0" : label === "Language" ? "English" : "—"}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
