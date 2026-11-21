import OpenAI from "openai";
import "dotenv/config";

// Works with any OpenAI-compatible provider (AI Grid, Together, DeepInfra, OpenRouter, Ollama, vLLM...).
// Everything is configured in .env, no code change needed.
const { LLM_BASE_URL, LLM_API_KEY, LLM_MODEL } = process.env;

if (!LLM_BASE_URL || !LLM_MODEL) {
  throw new Error("Missing LLM_BASE_URL or LLM_MODEL in backend/.env (see .env.example).");
}

const client = new OpenAI({
  apiKey: LLM_API_KEY || "not-needed",   // some local servers need no key
  baseURL: LLM_BASE_URL
});

// Gemma-friendly switches
const JSON_MODE = process.env.LLM_JSON_MODE !== "false";       // ask the API for JSON output
const MERGE_SYSTEM = process.env.LLM_MERGE_SYSTEM === "true";  // Gemma templates often have no "system" role

// If the provider has no system role, fold the system text into the first user message.
function prepare(messages) {
  if (!MERGE_SYSTEM) return messages;
  const system = messages.filter((m) => m.role === "system").map((m) => m.content).join("\n\n");
  const rest = messages.filter((m) => m.role !== "system");
  if (!system) return rest;
  const i = rest.findIndex((m) => m.role === "user");
  if (i === -1) return [{ role: "user", content: system }, ...rest];
  rest[i] = { ...rest[i], content: `${system}\n\n---\n\n${rest[i].content}` };
  return rest;
}

export async function chat(messages, { json = false, temperature = 0.2 } = {}) {
  const base = { model: LLM_MODEL, messages: prepare(messages), temperature };

  try {
    const res = await client.chat.completions.create({
      ...base,
      ...(json && JSON_MODE ? { response_format: { type: "json_object" } } : {})
    });
    return res.choices[0].message.content;
  } catch (err) {
    // Some providers reject response_format for Gemma: retry once without it.
    if (json && JSON_MODE && err.status === 400) {
      console.warn("Provider rejected JSON mode, retrying without it. Set LLM_JSON_MODE=false to skip this.");
      const res = await client.chat.completions.create(base);
      return res.choices[0].message.content;
    }
    throw err;
  }
}

// Pulls a JSON object out of the reply even if the model adds text or ```json fences.
function parseJson(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");
    if (start === -1 || end === -1) throw new Error("Model did not return JSON.");
    return JSON.parse(raw.slice(start, end + 1));
  }
}

export async function extractJson(system, user) {
  const attempt = async (extra = "") =>
    parseJson(
      await chat(
        [
          { role: "system", content: system },
          { role: "user", content: user + extra }
        ],
        { json: true, temperature: 0 }
      )
    );

  try {
    return await attempt();
  } catch {
    // One retry with a stricter reminder (small models sometimes break the JSON).
    return await attempt("\n\nReturn ONLY one valid JSON object. No text before or after it.");
  }
}
