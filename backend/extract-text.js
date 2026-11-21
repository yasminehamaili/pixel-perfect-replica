// Import the inner file: the package root runs a debug routine under ESM and crashes.
import pdf from "pdf-parse/lib/pdf-parse.js";
import mammoth from "mammoth";

// Converts an uploaded file buffer to plain text.
// Scanned PDFs (images only) return almost no text: add OCR (e.g. Tesseract) if you need them.
export async function extractText(file) {
  const name = file.originalname.toLowerCase();

  if (name.endsWith(".pdf")) {
    const data = await pdf(file.buffer);
    return data.text;
  }
  if (name.endsWith(".docx")) {
    const { value } = await mammoth.extractRawText({ buffer: file.buffer });
    return value;
  }
  if (name.endsWith(".txt") || name.endsWith(".csv") || name.endsWith(".md")) {
    return file.buffer.toString("utf-8");
  }
  throw new Error("Unsupported file type. Use PDF, DOCX, TXT or CSV.");
}
