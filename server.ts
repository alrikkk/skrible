import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Modality } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Helper to convert Markdown lines to Notion block format
function markdownToNotionBlocks(markdown: string) {
  const lines = markdown.split("\n");
  const blocks: any[] = [];

  for (let line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (trimmed.startsWith("# ")) {
      blocks.push({
        object: "block",
        type: "heading_1",
        heading_1: {
          rich_text: [{ type: "text", text: { content: trimmed.replace(/^#\s+/, "") } }],
        },
      });
    } else if (trimmed.startsWith("## ")) {
      blocks.push({
        object: "block",
        type: "heading_2",
        heading_2: {
          rich_text: [{ type: "text", text: { content: trimmed.replace(/^##\s+/, "") } }],
        },
      });
    } else if (trimmed.startsWith("### ")) {
      blocks.push({
        object: "block",
        type: "heading_3",
        heading_3: {
          rich_text: [{ type: "text", text: { content: trimmed.replace(/^###\s+/, "") } }],
        },
      });
    } else if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      blocks.push({
        object: "block",
        type: "bulleted_list_item",
        bulleted_list_item: {
          rich_text: [{ type: "text", text: { content: trimmed.replace(/^[-*]\s+/, "") } }],
        },
      });
    } else if (/^\d+\.\s+/.test(trimmed)) {
      blocks.push({
        object: "block",
        type: "numbered_list_item",
        numbered_list_item: {
          rich_text: [{ type: "text", text: { content: trimmed.replace(/^\d+\.\s+/, "") } }],
        },
      });
    } else if (trimmed.startsWith("> ")) {
      blocks.push({
        object: "block",
        type: "quote",
        quote: {
          rich_text: [{ type: "text", text: { content: trimmed.replace(/^>\s+/, "") } }],
        },
      });
    } else {
      const content = trimmed.slice(0, 2000);
      blocks.push({
        object: "block",
        type: "paragraph",
        paragraph: {
          rich_text: [{ type: "text", text: { content } }],
        },
      });
    }
  }

  return blocks.slice(0, 100); // Notion limit of 100 blocks per request
}

// POST /api/export-notion - Export untangled notes to Notion via API or Webhook
app.post("/api/export-notion", async (req, res) => {
  try {
    const { mode, webhookUrl, notionToken, pageId, markdown, title, routeDetected } = req.body;

    if (!markdown) {
      return res.status(400).json({ error: "Markdown content is required." });
    }

    const noteTitle = title || (routeDetected === "chef" ? "Dorm Chef Recipe - Skrible Note" : "Untangled Notes - Skrible Note");

    // MODE 1: Webhook Integration (Zapier / Make / N8N / Custom Notion Webhook)
    if (mode === "webhook" || webhookUrl) {
      if (!webhookUrl) {
        return res.status(400).json({ error: "Webhook URL is required." });
      }

      const webhookResponse = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: noteTitle,
          markdown,
          routeDetected,
          timestamp: new Date().toISOString(),
          source: "Skrible App",
        }),
      });

      if (!webhookResponse.ok) {
        const errorText = await webhookResponse.text();
        throw new Error(`Webhook endpoint returned status ${webhookResponse.status}: ${errorText || "Failed to trigger webhook"}`);
      }

      return res.json({
        success: true,
        message: "Successfully exported to Notion via Webhook!",
      });
    }

    // MODE 2: Direct Notion API Integration
    if (mode === "notion_api" || (notionToken && pageId)) {
      if (!notionToken || !pageId) {
        return res.status(400).json({ error: "Both Notion Internal Integration Token and Page/Database ID are required." });
      }

      // Format page ID (extract 32-char UUID or formatted UUID)
      const cleanPageId = pageId.trim().replace(/https:\/\/(www\.)?notion\.so\//, "").replace(/\?v=.*/, "").split("-").pop() || pageId.trim();
      
      const blocks = markdownToNotionBlocks(markdown);

      // Try creating new child page under target page ID
      let notionRes = await fetch("https://api.notion.com/v1/pages", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${notionToken.trim()}`,
          "Notion-Version": "2022-06-28",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          parent: { page_id: cleanPageId },
          properties: {
            title: {
              title: [{ text: { content: noteTitle } }],
            },
          },
          children: blocks,
        }),
      });

      // If creating page directly fails (e.g., if parent is database or block), fallback to appending blocks directly to page
      if (!notionRes.ok) {
        const firstErr = await notionRes.json();
        
        // Retry appending blocks directly to parent block ID
        notionRes = await fetch(`https://api.notion.com/v1/blocks/${cleanPageId}/children`, {
          method: "PATCH",
          headers: {
            "Authorization": `Bearer ${notionToken.trim()}`,
            "Notion-Version": "2022-06-28",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            children: [
              {
                object: "block",
                type: "heading_1",
                heading_1: { rich_text: [{ type: "text", text: { content: noteTitle } }] },
              },
              ...blocks,
            ],
          }),
        });

        if (!notionRes.ok) {
          const secondErr = await notionRes.json();
          throw new Error(
            secondErr.message || firstErr.message || "Notion API error. Please check your Integration Token & Page ID permissions."
          );
        }
      }

      const notionData = await notionRes.json();
      return res.json({
        success: true,
        pageUrl: notionData.url || `https://notion.so/${cleanPageId}`,
        message: "Successfully created page in Notion!",
      });
    }

    return res.status(400).json({ error: "Please specify either Notion Integration Token & Page ID or a Webhook URL." });
  } catch (err: any) {
    console.error("Error exporting to Notion:", err);
    res.status(500).json({ error: err.message || "Failed to export note to Notion." });
  }
});

// GET /api/config - Serve runtime public config to frontend
app.get("/api/config", (_req, res) => {
  res.json({
    supabaseUrl: process.env.SUPABASE_URL || "",
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY || "",
  });
});

// Helper to initialize GenAI client
function getGenAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is missing.");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// Robust helper to call generateContent with retry and fallback models on 503 / 429 high-demand errors
async function generateContentWithRetry(
  ai: GoogleGenAI,
  params: { contents: any; config?: any },
  modelsToTry: string[] = ["gemini-3.6-flash", "gemini-flash-latest", "gemini-3.1-flash-lite"]
) {
  let lastError: any = null;

  for (const model of modelsToTry) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          ...params,
          model,
        });
        return response;
      } catch (err: any) {
        lastError = err;
        const errMsg = err?.message || String(err);
        const status = err?.status || err?.code || 0;
        const isTransient =
          status === 503 ||
          status === 429 ||
          errMsg.includes("503") ||
          errMsg.includes("UNAVAILABLE") ||
          errMsg.includes("high demand") ||
          errMsg.includes("temporary");

        if (isTransient) {
          console.warn(`[Gemini API] Temporary error on model '${model}' (attempt ${attempt + 1}): ${errMsg}. Retrying/falling back...`);
          await new Promise((resolve) => setTimeout(resolve, 600 * (attempt + 1)));
          continue;
        }
        // If non-transient error, rethrow immediately
        throw err;
      }
    }
  }

  throw lastError;
}

// Untangle Endpoint
app.post("/api/untangle", async (req, res) => {
  try {
    const { prompt, route = "auto", budget, files = [], audio } = req.body;

    if (!prompt && (!files || files.length === 0) && !audio) {
      return res.status(400).json({ error: "Please provide text, image, or audio input." });
    }

    const ai = getGenAI();

    // Construct parts
    const parts: any[] = [];

    // Add attached images
    if (Array.isArray(files)) {
      for (const file of files) {
        if (file.data && file.mimeType) {
          parts.push({
            inlineData: {
              mimeType: file.mimeType,
              data: file.data.replace(/^data:[^;]+;base64,/, ""),
            },
          });
        }
      }
    }

    // Add audio input if present
    if (audio && audio.data && audio.mimeType) {
      parts.push({
        inlineData: {
          mimeType: audio.mimeType,
          data: audio.data.replace(/^data:[^;]+;base64,/, ""),
        },
      });
    }

    // Contextual string prompt
    let userText = prompt || "";
    if (budget) {
      userText += `\n[User's Specified Budget: $${budget}]`;
    }
    if (route && route !== "auto") {
      userText += `\n[Forced Route: ${route.toUpperCase()}]`;
    }

    if (userText.trim()) {
      parts.push({ text: userText });
    }

    // System instruction enforcing strict Skrible identity and output layout rules
    const systemInstruction = `
You are Skrible, an AI built to untangle chaotic student lives. You process text inputs, audio transcripts, or images (like whiteboard photos, fridge contents, receipts, handwritten notes) and output clean, structured, actionable summaries.

CRITICAL OUTPUT FORMAT RULES:
1. NEVER include conversational fluff (e.g., "Sure, I can help with that!", "Here is your recipe", "Hope this helps!", "Greetings"). Go straight to the data. No intros, no conclusions.
2. Format all text outputs using strict Markdown with bold headers and punchy bullet points to match a high-contrast Neo-Brutalism web layout.
3. Keep sentences short, direct, and under 15 words.

CORE CAPABILITIES & ROUTING INSTRUCTIONS:

IF ROUTE IS "notes" OR (ROUTE IS "auto" AND INPUT IS LECTURE NOTES, TRANSCRIPTS, WHITEBOARD IMAGES, TEXTBOOK PAGES, HANDWRITTEN NOTES, OR ACADEMIC CONCEPTS):
Act as the "Untangler Note Engine." Analyze the input and output EXACTLY this layout with no additional text before or after:

# 🧠 UNTANGLED NOTES: [Topic Name]
## 📌 THE BIG IDEA
- [1-sentence summary of the main concept]
## ⚡️ CRITICAL TAKEAWAYS
- [Key point 1]
- [Key point 2]
- [Key point 3]
## 📖 KEY VOCABULARY
- **[Term 1]**: [Simple definition]
- **[Term 2]**: [Simple definition]


IF ROUTE IS "chef" OR (ROUTE IS "auto" AND INPUT IS A BUDGET, FRIDGE PHOTOS, GROCERY RECEIPTS, OR INGREDIENT LISTS):
Act as the "Dorm Chef Budget Planner." Maximize ingredients used, stay strictly within budget (if budget specified, calculate against budget; if no budget specified, estimate budget as $10.00), and output EXACTLY this layout with no additional text before or after:

# 🍳 DORM CHEF: [Recipe Name]
## 💰 COST BREAKDOWN
- **Estimated Cost**: $[X.XX]
- **Remaining Budget**: $[X.XX]
## 🛒 INGREDIENTS USED
- [Ingredient 1]
- [Ingredient 2]
## ⏳ TIME & STEPS
- **Prep Time**: [X] minutes
1. [Step 1 - simple instructions for dorm cooking]
2. [Step 2]
`;

    const response = await generateContentWithRetry(ai, {
      contents: { parts },
      config: {
        systemInstruction,
        temperature: 0.2,
      },
    });

    const resultText = response.text || "";
    
    // Detect which route was generated based on header
    const routeDetected = resultText.includes("DORM CHEF:") ? "chef" : "notes";

    res.json({ result: resultText, routeDetected });
  } catch (error: any) {
    console.error("Error in /api/untangle:", error);
    res.status(500).json({ error: error?.message || "Failed to process untangle request." });
  }
});

// Flashcard Generation Tool
app.post("/api/flashcards", async (req, res) => {
  try {
    const { markdownNote } = req.body;
    if (!markdownNote) {
      return res.status(400).json({ error: "No note content provided." });
    }

    const ai = getGenAI();
    const prompt = `Convert the following untangled note into 3 to 5 study flashcards for quick revision.
Return JSON format as an array of objects: [{"question": "...", "answer": "...", "tag": "..."}]. Keep answers short and punchy (under 12 words).

Note Content:
${markdownNote}`;

    const response = await generateContentWithRetry(ai, {
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const flashcards = JSON.parse(response.text || "[]");
    res.json({ flashcards });
  } catch (error: any) {
    console.error("Error in /api/flashcards:", error);
    res.status(500).json({ error: error?.message || "Failed to generate flashcards." });
  }
});

// Text-to-Speech Endpoint
app.post("/api/tts", async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ error: "No text provided for TTS." });
    }

    const ai = getGenAI();
    // Clean markdown symbols for clearer speech
    const cleanText = text.replace(/[#*`_~[\]]/g, "").slice(0, 1000);

    // Try up to 2 attempts for TTS in case of transient 503 errors
    let response: any;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        response = await ai.models.generateContent({
          model: "gemini-3.1-flash-tts-preview",
          contents: [{ parts: [{ text: `Read with punchy clarity: ${cleanText}` }] }],
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: "Zephyr" },
              },
            },
          },
        });
        break;
      } catch (err: any) {
        if (attempt === 0 && (err?.status === 503 || err?.message?.includes("503") || err?.message?.includes("UNAVAILABLE"))) {
          await new Promise((resolve) => setTimeout(resolve, 800));
          continue;
        }
        throw err;
      }
    }

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
      throw new Error("No audio data generated.");
    }

    res.json({ audio: base64Audio });
  } catch (error: any) {
    console.error("Error in /api/tts:", error);
    res.status(500).json({ error: error?.message || "Failed to generate speech." });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Skrible Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
