import type { AppSpec, WorkflowStub, EntitySchema, FieldSchema } from "@/types";

function makeField(name: string, type: FieldSchema["type"], required: boolean, unique = false, relation?: string): FieldSchema {
  return { name, type, required, unique, ...(relation ? { relation } : {}) };
}

export function generateMockAppSpec(prompt: string, jobId: string): AppSpec {
  const isCRM = /crm|lead|deal|contact|salesforce|real.?estate/i.test(prompt);
  const isEcommerce = /ecommerce|shop|order|product|inventory/i.test(prompt);
  const isHR = /hr|employee|leave|onboarding|performance/i.test(prompt);
  const isTask = /task|project|sprint|todo|workflow/i.test(prompt);

  const basePages = [
    { name: "Dashboard", path: "/dashboard", components: ["StatCards", "ActivityFeed", "QuickActions"], layout: "sidebar" },
    { name: "Settings", path: "/settings", components: ["ProfileForm", "OrgSettings", "ApiKeys"], layout: "full" },
  ];

  const userEntity: EntitySchema = {
    name: "User",
    fields: [
      makeField("id", "string", true, true),
      makeField("email", "string", true, true),
      makeField("name", "string", true),
      makeField("role", "string", true),
      makeField("createdAt", "date", true),
    ],
  };

  let pages = [...basePages];
  let entities: EntitySchema[] = [userEntity];
  let workflowStubs: WorkflowStub[] = [];

  if (isCRM) {
    pages = [
      ...pages,
      { name: "Leads", path: "/leads", components: ["LeadsTable", "LeadForm", "LeadDetail"], layout: "sidebar" },
      { name: "Deals", path: "/deals", components: ["KanbanBoard", "DealForm", "DealDetail"], layout: "sidebar" },
      { name: "Contacts", path: "/contacts", components: ["ContactsTable", "ContactForm"], layout: "sidebar" },
      { name: "Analytics", path: "/analytics", components: ["PipelineChart", "ConversionFunnel", "RevenueChart"], layout: "sidebar" },
    ];
    entities = [
      ...entities,
      {
        name: "Lead",
        fields: [
          makeField("id", "string", true, true),
          makeField("name", "string", true),
          makeField("email", "string", true),
          makeField("status", "string", true),
          makeField("source", "string", false),
          makeField("value", "number", false),
          makeField("assignedTo", "relation", false, false, "User"),
        ],
      },
      {
        name: "Deal",
        fields: [
          makeField("id", "string", true, true),
          makeField("title", "string", true),
          makeField("value", "number", true),
          makeField("stage", "string", true),
          makeField("probability", "number", false),
          makeField("closeDate", "date", false),
        ],
      },
    ];
    workflowStubs = [
      {
        id: "ws-1", name: "Deal Closed Notification",
        triggerEntity: "Deal", triggerEvent: "status_changed",
        triggerCondition: { status: "closed" },
        actionType: "slack.send_message",
        payloadSchema: { channel: "#sales", message: "Deal closed: {{deal.title}}" },
        enabled: true,
      },
    ];
  } else if (isEcommerce) {
    pages = [
      ...pages,
      { name: "Products", path: "/products", components: ["ProductGrid", "ProductForm", "InventoryPanel"], layout: "sidebar" },
      { name: "Orders", path: "/orders", components: ["OrdersTable", "OrderDetail", "FulfillmentPanel"], layout: "sidebar" },
      { name: "Customers", path: "/customers", components: ["CustomersTable", "CustomerDetail"], layout: "sidebar" },
    ];
    entities = [
      ...entities,
      {
        name: "Product",
        fields: [
          makeField("id", "string", true, true),
          makeField("name", "string", true),
          makeField("sku", "string", true, true),
          makeField("price", "number", true),
          makeField("stock", "number", true),
          makeField("reorderThreshold", "number", false),
        ],
      },
      {
        name: "Order",
        fields: [
          makeField("id", "string", true, true),
          makeField("customerId", "relation", true, false, "User"),
          makeField("status", "string", true),
          makeField("total", "number", true),
          makeField("createdAt", "date", true),
        ],
      },
    ];
    workflowStubs = [
      {
        id: "ws-1", name: "Order Confirmation Email",
        triggerEntity: "Order", triggerEvent: "created",
        actionType: "gmail.send_email",
        payloadSchema: { to: "{{order.customerEmail}}", subject: "Order Confirmation #{{order.id}}" },
        enabled: true,
      },
    ];
  } else if (isHR) {
    pages = [
      ...pages,
      { name: "Employees", path: "/employees", components: ["EmployeeTable", "EmployeeProfile"], layout: "sidebar" },
      { name: "Leave Requests", path: "/leave", components: ["LeaveCalendar", "LeaveForm", "ApprovalQueue"], layout: "sidebar" },
    ];
    entities = [
      ...entities,
      {
        name: "Employee",
        fields: [
          makeField("id", "string", true, true),
          makeField("name", "string", true),
          makeField("department", "string", true),
          makeField("managerId", "relation", false, false, "User"),
          makeField("startDate", "date", true),
        ],
      },
      {
        name: "LeaveRequest",
        fields: [
          makeField("id", "string", true, true),
          makeField("employeeId", "relation", true, false, "Employee"),
          makeField("startDate", "date", true),
          makeField("endDate", "date", true),
          makeField("status", "string", true),
          makeField("reason", "string", false),
        ],
      },
    ];
    workflowStubs = [
      {
        id: "ws-1", name: "Leave Approved Notification",
        triggerEntity: "LeaveRequest", triggerEvent: "status_changed",
        triggerCondition: { status: "approved" },
        actionType: "slack.send_message",
        payloadSchema: { channel: "{{employee.managerSlack}}", message: "Leave approved for {{employee.name}}" },
        enabled: true,
      },
    ];
  } else if (isTask) {
    pages = [
      ...pages,
      { name: "Tasks", path: "/tasks", components: ["KanbanBoard", "TaskForm", "TaskDetail"], layout: "sidebar" },
      { name: "Projects", path: "/projects", components: ["ProjectList", "ProjectForm", "GanttChart"], layout: "sidebar" },
    ];
    entities = [
      ...entities,
      {
        name: "Task",
        fields: [
          makeField("id", "string", true, true),
          makeField("title", "string", true),
          makeField("status", "string", true),
          makeField("priority", "string", true),
          makeField("assigneeId", "relation", false, false, "User"),
          makeField("dueDate", "date", false),
        ],
      },
    ];
    workflowStubs = [
      {
        id: "ws-1", name: "Overdue Task Alert",
        triggerEntity: "Task", triggerEvent: "status_changed",
        triggerCondition: { dueDate: { $lt: "now" }, status: { $ne: "done" } },
        actionType: "slack.send_message",
        payloadSchema: { channel: "{{task.assigneeSlack}}", message: "Overdue: {{task.title}}" },
        enabled: true,
      },
    ];
  } else {
    pages = [
      ...pages,
      { name: "Records", path: "/records", components: ["DataTable", "RecordForm", "RecordDetail"], layout: "sidebar" },
    ];
    entities = [
      ...entities,
      {
        name: "Record",
        fields: [
          makeField("id", "string", true, true),
          makeField("title", "string", true),
          makeField("description", "string", false),
          makeField("status", "string", true),
          makeField("createdAt", "date", true),
        ],
      },
    ];
  }

  return {
    id: `spec-${Date.now()}`,
    jobId,
    pages,
    apiEndpoints: pages.flatMap(p => [
      { method: "GET" as const, path: `/api${p.path}`, entity: p.name, description: `List ${p.name}`, authRequired: true },
      { method: "POST" as const, path: `/api${p.path}`, entity: p.name, description: `Create ${p.name}`, authRequired: true },
      { method: "PUT" as const, path: `/api${p.path}/:id`, entity: p.name, description: `Update ${p.name}`, authRequired: true },
      { method: "DELETE" as const, path: `/api${p.path}/:id`, entity: p.name, description: `Delete ${p.name}`, authRequired: true },
    ]),
    authRules: [
      { path: "/api/*", roles: ["authenticated"], action: "allow" as const },
      { path: "/api/admin/*", roles: ["admin", "owner"], action: "allow" as const },
      { path: "/health", roles: [], action: "allow" as const },
    ],
    integrationHooks: workflowStubs.map(ws => ({
      integration: ws.actionType.split(".")[0] as "slack" | "gmail" | "twilio",
      trigger: `${ws.triggerEntity}.${ws.triggerEvent}`,
      action: ws.actionType.split(".")[1] ?? "send",
      payloadSchema: ws.payloadSchema,
    })),
    workflowStubs,
    dataSchema: { entities },
    version: 1,
    createdAt: new Date().toISOString(),
  };
}
