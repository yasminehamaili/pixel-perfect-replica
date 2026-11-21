// ---------------------------------------------------------------------------
// OUTPUT SCHEMA: one block per department, like a Power BI report with one page per department.
// ---------------------------------------------------------------------------
const KPI_SHAPE = {
  id: "string (snake_case, stable, e.g. gross_margin_pct)",
  label: "string (short, chart-ready)",
  value: "number | null",
  unit: "string (e.g. EUR, %, hL, L, cases, days, hours, x)",
  period: "string | null (e.g. 'Q3 2026', 'Oct 2026', 'FY2025')",
  source: "'reported' (stated in the document) | 'calculated' (derived by you)",
  formula: "string | null (required when source = 'calculated', e.g. 'revenue - cogs')",
  previous_value: "number | null",
  change_pct: "number | null (vs previous_value, or vs target if that is all that exists)",
  target_value: "number | null",
  status: "'good' | 'warning' | 'critical' | 'neutral'",
  confidence: "'high' | 'medium' | 'low'"
};

const CHART_SHAPE = {
  id: "string",
  title: "string",
  type: "'line' | 'bar' | 'stacked_bar' | 'donut' | 'waterfall' | 'scatter' | 'gauge' | 'table'",
  x_label: "string | null",
  y_label: "string | null",
  unit: "string | null",
  series: [{ name: "string", data: [{ label: "string", value: "number" }] }],
  why_it_matters: "string (one sentence for the dashboard viewer)"
};

const DEPARTMENT_SHAPE = {
  kpis: [KPI_SHAPE],
  charts: [CHART_SHAPE],
  insights: ["string (max 3, each tied to a number in the data)"],
  data_gaps: ["string (KPIs from the catalog that could not be computed and which data is missing)"]
};

export const DASHBOARD_SCHEMA = {
  document_title: "string",
  document_date: "string | null (ISO date)",
  reporting_period: "string | null",
  currency: "string | null",
  summary: "string (max 3 sentences, executive level)",
  departments: {
    sales: DEPARTMENT_SHAPE,
    production: DEPARTMENT_SHAPE,
    stock: DEPARTMENT_SHAPE,
    procurement: DEPARTMENT_SHAPE,
    finance: DEPARTMENT_SHAPE
  },
  cross_department: {
    kpis: [KPI_SHAPE],
    insights: ["string (links between departments, e.g. sales run-rate vs stock coverage)"]
  },
  entities: { products: ["string"], suppliers: ["string"], customers: ["string"], channels: ["string"], regions: ["string"] },
  risks_or_alerts: [{ department: "string", severity: "'high' | 'medium' | 'low'", message: "string" }]
};

// ---------------------------------------------------------------------------
// KPI CATALOG: what a BI analyst would build for a beverage manufacturer.
// The model computes what the data allows and reports the rest as data_gaps.
// ---------------------------------------------------------------------------
export const KPI_CATALOG = {
  sales: {
    title: "Sales",
    kpis: [
      "Net revenue (total, and by product category: water, soft drinks, juices, energy drinks, beer/alcohol, other)",
      "Volume sold (hL, L, cases or units, whichever the document uses)",
      "Average selling price per liter / per case = revenue / volume",
      "Revenue growth % (MoM, QoQ, YoY when comparable periods exist)",
      "Revenue and volume by SKU, by pack format (PET, glass, can, keg), by channel (retail, wholesale, HoReCa, e-commerce, export), by region, by customer",
      "Top 5 / Top 10 products and customers as % of revenue (concentration)",
      "Sales vs target / budget (attainment %)",
      "Gross margin % by product or category (if cost data exists)",
      "Discounts, promotions and returns as % of gross sales",
      "Returnable packaging / deposit return rate (if applicable)",
      "Market share % (if the document provides market data)"
    ],
    charts: [
      "Revenue trend over time (line)",
      "Revenue by category (donut or stacked bar)",
      "Top customers / SKUs (bar)",
      "Actual vs target (bar or gauge)",
      "Revenue by channel or region (bar)"
    ]
  },
  production: {
    title: "Production",
    kpis: [
      "Total output (hL, L or units) and planned vs actual output (plan attainment %)",
      "Output by production line / plant / product",
      "Capacity utilization % = actual output / available capacity",
      "OEE % = availability x performance x quality (if the three components exist, else report any component alone)",
      "Downtime (hours) and downtime % of planned time, with main causes",
      "Yield % = good output / total input",
      "Scrap / waste rate % (product loss, broken bottles, rejected batches)",
      "Quality: batch rejection rate %, non-conformities, complaints per million units",
      "Production cost per liter (or per hL) = production cost / output",
      "Water usage ratio = liters of water per liter of product (key beverage sustainability KPI)",
      "Energy consumption per hL (kWh/hL) and CO2 or sugar/ingredient loss if reported",
      "Line speed (bottles or cans per minute) and changeover time"
    ],
    charts: [
      "Planned vs actual output (bar)",
      "OEE or capacity utilization trend (line or gauge)",
      "Downtime by cause (bar)",
      "Scrap rate by line (bar)",
      "Cost per liter trend (line)"
    ]
  },
  stock: {
    title: "Stock / Inventory",
    kpis: [
      "Total inventory value, split finished goods vs raw materials vs packaging (concentrate, sugar, CO2, preforms, bottles, cans, caps, labels, cartons)",
      "Inventory turnover = COGS / average inventory",
      "Days of inventory (DIO) = inventory / COGS x days in period",
      "Stock coverage in days = current stock / average daily demand or consumption",
      "Stock-out rate % and number of stock-outs by SKU",
      "Service level / fill rate % (orders fulfilled complete)",
      "Near-expiry or expired stock % of inventory (shelf-life risk, critical for beverages)",
      "Write-offs and shrinkage (value and % of inventory)",
      "Slow-moving / obsolete stock (items with no movement over X days)",
      "Overstock vs reorder point and safety stock gaps",
      "Warehouse utilization %"
    ],
    charts: [
      "Inventory value by category (stacked bar)",
      "Stock coverage days by SKU (bar with threshold)",
      "Expiry risk breakdown (donut)",
      "Inventory turnover trend (line)",
      "Top slow movers (table)"
    ]
  },
  procurement: {
    title: "Procurement",
    kpis: [
      "Total procurement spend and spend by category (PET preforms, glass, cans, sugar / sweeteners, concentrate, CO2, caps and labels, cartons, energy, services)",
      "Spend by supplier and top-5 supplier concentration %",
      "Purchase price variance (PPV) = (actual price - standard price) x quantity",
      "Unit price trend of key raw materials (sugar, PET, aluminum, glass)",
      "Supplier OTIF % (on time, in full) and average lead time in days",
      "Supplier quality: rejection / non-conformity rate %",
      "Contract coverage % (spend under contract) and single-source dependency",
      "Savings achieved vs target (value and %)",
      "Materials cost as % of COGS or of revenue",
      "Payment terms / DPO (days payable outstanding)",
      "Open purchase orders and delayed deliveries"
    ],
    charts: [
      "Spend by category (donut or bar)",
      "Top suppliers (bar)",
      "Raw material price trend (line)",
      "Supplier OTIF vs target (bar)",
      "Savings vs target (waterfall or bar)"
    ]
  },
  finance: {
    title: "Finance",
    kpis: [
      "Revenue, COGS, gross profit and gross margin %",
      "Operating expenses and operating margin %",
      "EBITDA and EBITDA margin %",
      "Net income and net margin %",
      "Cost per liter and contribution margin per liter or by product",
      "Budget vs actual variance (value and %) for revenue, costs, EBITDA",
      "Operating cash flow and free cash flow",
      "Working capital = current assets - current liabilities",
      "DSO (receivables days), DIO (inventory days), DPO (payables days) and cash conversion cycle = DSO + DIO - DPO",
      "Liquidity: current ratio, quick ratio",
      "Leverage: debt / equity, net debt / EBITDA, interest coverage",
      "ROCE or ROI, and CAPEX (value and % of revenue)"
    ],
    charts: [
      "Revenue, COGS and margin trend (line or combo)",
      "P&L bridge / waterfall from revenue to net income",
      "Budget vs actual (bar)",
      "Cash flow trend (bar)",
      "Cash conversion cycle components (stacked bar)"
    ]
  }
};

export const CROSS_DEPARTMENT_KPIS = [
  "Revenue per liter vs production cost per liter vs materials cost per liter (unit economics)",
  "Stock coverage (days) vs sales run-rate: risk of stock-out or overstock",
  "Production output vs sales volume: gap = inventory build-up or shortfall",
  "Materials cost % of COGS vs raw material price trend (procurement impact on margin)",
  "Scrap / waste cost as % of revenue (production impact on finance)",
  "Cash conversion cycle drivers: link DIO to stock, DPO to procurement terms, DSO to sales terms"
];

// ---------------------------------------------------------------------------
// EXTRACTION PROMPT: the analyst brief sent as the system message.
// ---------------------------------------------------------------------------
const catalogText = Object.entries(KPI_CATALOG)
  .map(([key, d]) =>
    `### ${key.toUpperCase()} (${d.title})\nKPIs to build:\n${d.kpis.map((k) => `- ${k}`).join("\n")}\nCharts to build:\n${d.charts.map((c) => `- ${c}`).join("\n")}`
  )
  .join("\n\n");

export const EXTRACTION_SYSTEM = `You are a senior BI / data analyst designing a Power BI dashboard for a BEVERAGE manufacturer (water, soft drinks, juices, energy drinks, possibly beer or spirits).
You are given one business document. Build the dataset behind the dashboard: KPIs and chart-ready data for 5 departments (Sales, Production, Stock/Inventory, Procurement, Finance) plus cross-department KPIs.

WORKING METHOD (follow in order, silently):
1. Read the whole document. Identify the reporting period, currency, units (hL, L, cases, units) and the products, lines, suppliers, customers, channels and regions mentioned.
2. Normalize units and currency. Never mix units in one KPI. If conversion is needed and the factor is stated in the document, convert; otherwise keep the original unit.
3. For each department, go through its KPI catalog below. For every KPI decide: (a) reported directly in the document, (b) calculable from reported numbers, or (c) not possible.
4. For (a) copy the value exactly. For (b) compute it carefully, set source = "calculated" and write the formula with the actual inputs used. For (c) do NOT include the KPI; list it in the department's data_gaps with the missing data.
5. Add previous_value and change_pct whenever the document offers a comparable period, budget or target. Never compute a change from numbers that are not comparable.
6. Set status: use the document's own targets or thresholds when they exist. Otherwise use common beverage-industry sense only when the direction is unambiguous (e.g. stock-outs rising, scrap rising, margin falling = warning or critical). If unsure, use "neutral".
7. Build the charts: only from data that really exists in the document. Each chart needs real data points, a clear title and a one-sentence why_it_matters. Prefer 2 to 5 charts per department, fewer if data is thin. A chart with fewer than 2 data points is not allowed.
8. Write insights: max 3 per department, each one must cite a number from the data. No generic advice.
9. Fill cross_department with the cross-department KPIs that the data allows, and risks_or_alerts with the most important issues (severity high only for clear, material problems).
10. Double check: every number must be traceable to the document or to a formula you wrote. Percentages in percent units (12.5 not 0.125). Numbers are plain numbers: no currency symbols, no thousands separators.

STRICT RULES:
- Return ONLY valid JSON that matches the schema. No markdown, no comments.
- NEVER invent, estimate or "typically assume" a figure. A missing KPI is better than a made-up one.
- If the document does not concern a department at all, return empty arrays for it and put one data_gaps entry saying so.
- Use stable snake_case ids so the frontend can reference KPIs (e.g. gross_margin_pct, stock_coverage_days, oee_pct).
- Keep labels short and consistent across departments.

KPI CATALOG BY DEPARTMENT:
${catalogText}

CROSS-DEPARTMENT KPIs (only if both sides exist in the data):
${CROSS_DEPARTMENT_KPIS.map((k) => `- ${k}`).join("\n")}`;

// ---------------------------------------------------------------------------
// REPORTS
// ---------------------------------------------------------------------------
export const FIELDS = {
  sales: { title: "Sales", focus: KPI_CATALOG.sales.kpis.join("; ") },
  production: { title: "Production", focus: KPI_CATALOG.production.kpis.join("; ") },
  stock: { title: "Stock / Inventory", focus: KPI_CATALOG.stock.kpis.join("; ") },
  procurement: { title: "Procurement", focus: KPI_CATALOG.procurement.kpis.join("; ") },
  finance: { title: "Finance", focus: KPI_CATALOG.finance.kpis.join("; ") }
};

export const REPORT_SYSTEM = `You are a senior business analyst for a beverage manufacturer, writing a professional report in English.
Base every statement on the provided KPI data and document text. If the document has no information for a section, say so plainly instead of guessing.
Always cite the KPI value, unit and period when you mention a figure, and say whether it is reported or calculated.
You may use the news context to comment on the market (consumer demand, sugar / PET / aluminum prices, energy costs, regulation such as sugar taxes or packaging rules, weather and seasonality), but label it clearly as market context and never present it as a figure from the document.
Structure the report with these sections:
1. Executive summary
2. Key figures (a compact table: KPI, value, vs previous / target, status)
3. Analysis and trends
4. Risks and points of attention
5. Market context (from news)
6. Recommendations (specific and actionable, tied to the numbers above)
Be concise, precise and professional.`;

export const CHAT_SYSTEM = `You are a professional business assistant for a beverage company dashboard.
You answer questions about the uploaded document(s), the department KPIs, the generated reports (Sales, Production, Stock/Inventory, Procurement, Finance) and the market context from recent news.
Rules:
- Answer only from the provided context. If the answer is not there, say so clearly and suggest what document or data would help.
- Quote figures exactly as they appear, with units and periods. Say when a KPI is calculated and show the formula if asked.
- Distinguish clearly between facts from the document and market context from news.
- When relevant, connect departments (for example sales volume vs stock coverage, or raw material prices vs margin).
- Keep a professional, concise tone. Use short lists or tables only when they help.`;
