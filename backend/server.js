import express from "express";
import cors from "cors";
import multer from "multer";
import { randomUUID } from "node:crypto";
import "dotenv/config";

import { chat, extractJson } from "./llm.js";
import { extractText } from "./extract-text.js";
import { fetchNews, formatNews } from "./news.js";
import { DASHBOARD_SCHEMA, EXTRACTION_SYSTEM, FIELDS, REPORT_SYSTEM, CHAT_SYSTEM } from "./prompts.js";

const app = express();
app.use(cors({ origin: process.env.FRONTEND_ORIGIN || true }));
app.use(express.json({ limit: "2mb" }));
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

// In-memory store for the demo. Replace with PostgreSQL/MongoDB for production.
const store = new Map();

// Keep prompts within a safe size. For big documents, replace this with chunking + embeddings.
const MAX_CHARS = Number(process.env.MAX_DOC_CHARS) || 24000;
const clip = (t) => (t.length > MAX_CHARS ? t.slice(0, MAX_CHARS) : t);

// 1) Upload a document -> text -> dashboard JSON
app.post("/api/documents", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const text = await extractText(req.file);
    if (text.trim().length < 50) {
      return res.status(422).json({ error: "Little or no text found. The file may be a scan (OCR needed)." });
    }

    const dashboard = await extractJson(
      EXTRACTION_SYSTEM,
      `Schema:\n${JSON.stringify(DASHBOARD_SCHEMA, null, 2)}\n\nDocument:\n${clip(text)}`
    );

    const id = randomUUID();
    store.set(id, { id, filename: req.file.originalname, text, dashboard, reports: {}, news: [] });
    res.json({ id, filename: req.file.originalname, dashboard });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// 2) Generate the 5 reports (in parallel) + market news context
app.post("/api/documents/:id/reports", async (req, res) => {
  try {
    const doc = store.get(req.params.id);
    if (!doc) return res.status(404).json({ error: "Document not found" });

    const industry = req.body?.industry || "beverage industry";
    const news = await fetchNews(`${industry} supply chain OR sales OR market`);
    doc.news = news;
    const newsText = formatNews(news);

    const entries = await Promise.all(
      Object.entries(FIELDS).map(async ([key, field]) => {
        const report = await chat([
          { role: "system", content: REPORT_SYSTEM },
          {
            role: "user",
            content:
              `Write the "${field.title}" report.\nFocus areas: ${field.focus}\n\n` +
              `Department KPIs (JSON):\n${JSON.stringify(doc.dashboard.departments?.[key] ?? {})}\n\n` +
              `Cross-department KPIs (JSON):\n${JSON.stringify(doc.dashboard.cross_department ?? {})}\n\n` +
              `Document text:\n${clip(doc.text)}\n\n` +
              `Recent news (market context):\n${newsText}`
          }
        ]);
        return [key, report];
      })
    );

    doc.reports = Object.fromEntries(entries);
    res.json({ reports: doc.reports, news });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// 3) Chatbot: answers from the document, the reports and the news
app.post("/api/documents/:id/chat", async (req, res) => {
  try {
    const doc = store.get(req.params.id);
    if (!doc) return res.status(404).json({ error: "Document not found" });

    const { message, history = [] } = req.body;
    if (!message) return res.status(400).json({ error: "Missing message" });

    const context =
      `DOCUMENT: ${doc.filename}\n\nEXTRACTED DATA:\n${JSON.stringify(doc.dashboard)}\n\n` +
      `REPORTS:\n${Object.entries(doc.reports).map(([k, v]) => `## ${FIELDS[k].title}\n${v}`).join("\n\n")}\n\n` +
      `MARKET NEWS:\n${formatNews(doc.news)}\n\n` +
      `DOCUMENT TEXT:\n${clip(doc.text)}`;

    const answer = await chat([
      { role: "system", content: `${CHAT_SYSTEM}\n\nCONTEXT:\n${context}` },
      ...history.slice(-10),
      { role: "user", content: message }
    ], { temperature: 0.3 });

    res.json({ answer });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(process.env.PORT || 3001, () => console.log("API running on port", process.env.PORT || 3001));
