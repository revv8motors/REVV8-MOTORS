import express from "express";
import { createServer as createViteServer } from "vite";
import cors from "cors";
import path from "path";
import crypto from "crypto";
import fs from "fs";

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Helper to verify Firebase ID Token using Google Identity Toolkit
async function verifyFirebaseToken(idToken: string) {
  try {
    const configPath = path.join(process.cwd(), "firebase-applet-config.json");
    if (!fs.existsSync(configPath)) return null;
    const configData = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    const apiKey = configData.apiKey;
    
    if (!apiKey) return null;

    const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken })
    });

    if (!res.ok) return null;
    const data = await res.json();
    return data.users && data.users.length > 0 ? data.users[0] : null;
  } catch (error) {
    console.error("Token verification failed", error);
    return null;
  }
}

// Encryption helpers
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "default_dev_key_32_chars_long_1234"; // In production, this should be set in .env
const IV_LENGTH = 16;

function decryptStr(text: string) {
  const textParts = text.split(':');
  const ivStr = textParts.shift();
  if (!ivStr) return null;
  const iv = Buffer.from(ivStr, 'hex');
  const encryptedText = Buffer.from(textParts.join(':'), 'hex');
  const keyBuffer = Buffer.alloc(32, ENCRYPTION_KEY);
  const decipher = crypto.createDecipheriv('aes-256-cbc', keyBuffer, iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}

function encryptStr(text: string) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const keyBuffer = Buffer.alloc(32, ENCRYPTION_KEY);
  const cipher = crypto.createCipheriv('aes-256-cbc', keyBuffer, iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

app.post("/api/admin/encrypt", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, error: "Unauthorized" });
  }

  const token = authHeader.split("Bearer ")[1];
  const user = await verifyFirebaseToken(token);
  if (!user) return res.status(401).json({ success: false, error: "Invalid token" });

  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ success: false, error: "Missing text" });
    res.json({ success: true, encrypted: encryptStr(text) });
  } catch (err: any) {
    res.status(500).json({ success: false, error: "Encryption failed" });
  }
});

const rateLimits = new Map<string, { count: number, resetAt: number }>();

app.post("/api/admin/ai/generate", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, error: "Unauthorized" });
  }

  const token = authHeader.split("Bearer ")[1];
  const user = await verifyFirebaseToken(token);
  
  if (!user) {
    return res.status(401).json({ success: false, error: "Invalid token" });
  }

  // Rate Limiting: 10 requests per minute per admin
  const now = Date.now();
  const limitWindow = 60000;
  let userLimit = rateLimits.get(user.localId);
  
  if (!userLimit || userLimit.resetAt < now) {
    userLimit = { count: 1, resetAt: now + limitWindow };
  } else {
    userLimit.count++;
  }
  rateLimits.set(user.localId, userLimit);

  if (userLimit.count > 10) {
    console.warn(`[AI Rate Limit] Admin ${user.localId} exceeded limits`);
    return res.status(429).json({ success: false, error: "Too many requests. Please wait a minute." });
  }

  // Verify Admin using standard rules or just check if they are in the DB?
  // For simplicity since the ID is known and we must verify them as admin:
  // Usually, Firebase rules just check if the user is in the `site_admin` collection or something similar, or check admin credentials.
  // Wait, let's fetch the site settings from Firestore using REST to get the encrypted AI Key!

  try {
    const configPath = path.join(process.cwd(), "firebase-applet-config.json");
    if (!fs.existsSync(configPath)) {
       return res.status(500).json({ success: false, error: "Firebase config missing" });
    }
    const configData = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    const projectId = configData.projectId;
    const dbId = configData.firestoreDatabaseId || "(default)";
    
    // Check if user is admin
    let isAdminUser = user.email === 'revv8motors@gmail.com';
    
    if (!isAdminUser) {
       const adminRes = await fetch(`https://firestore.googleapis.com/v1/projects/${projectId}/databases/${dbId}/documents/user_roles/${user.localId}`, {
           headers: { "Authorization": `Bearer ${token}` }
       });
       if (adminRes.ok) {
           const roleData = await adminRes.json();
           if (roleData.fields?.role?.stringValue === 'admin') {
               isAdminUser = true;
           }
       }
    }

    if (!isAdminUser) {
       return res.status(403).json({ success: false, error: "Forbidden: Not an admin" });
    }

    const { type, carData } = req.body;
    if (!carData || !type) {
      return res.status(400).json({ success: false, error: "Missing type or carData" });
    }

    // Sanitize input helper
    const sanitize = (str: any) => {
      if (typeof str !== 'string') return String(str || '').substring(0, 100);
      return str.replace(/<[^>]*>?/gm, '').substring(0, 200); // Strip HTML and limit length
    };

    const cleanCarData = {
      brand: sanitize(carData.brand),
      model: sanitize(carData.model),
      year: sanitize(carData.year),
      category: sanitize(carData.category),
      engine: sanitize(carData.engine),
      acceleration: sanitize(carData.acceleration),
      topSpeed: sanitize(carData.topSpeed)
    };

    // Fetch settings from Firestore
    const settingsRes = await fetch(`https://firestore.googleapis.com/v1/projects/${projectId}/databases/${dbId}/documents/site_settings/ai`, {
        headers: { "Authorization": `Bearer ${token}` }
    });
    
    if (settingsRes.status === 404) {
        return res.status(400).json({ success: false, error: "AI not configured. Please save your API key in Admin Settings." });
    }
    
    if (!settingsRes.ok) {
        const errText = await settingsRes.text();
        console.error(`[Firestore REST Error] Status: ${settingsRes.status}, Body: ${errText}`);
        return res.status(500).json({ success: false, error: "Error reading config from database." });
    }
    const settingsData = await settingsRes.json();
    const fields = settingsData.fields || {};
    
    const encryptedKey = fields.aiApiKeyEncrypted?.stringValue;
    const aiProvider = fields.aiProvider?.stringValue || "openrouter";
    const aiModel = fields.aiModel?.stringValue || "google/gemini-2.0-flash-001";

    if (!encryptedKey) {
       return res.status(400).json({ success: false, error: "AI API key missing in settings. Please save your API key in Admin Settings." });
    }

    const apiKey = decryptStr(encryptedKey);
    if (!apiKey) {
       return res.status(500).json({ success: false, error: "Failed to decrypt API key" });
    }

    // Call AI Provider (OpenRouter Only)
    const resilientJsonParse = (text: string) => {
      try {
        // Clean markdown code blocks if present
        const cleaned = text.replace(/```json\s?|```/g, "").trim();
        return JSON.parse(cleaned);
      } catch (e) {
        console.error("[AI] JSON Parse failed, attempting fallback extraction", e);
        // Fallback: search for first { and last }
        const start = text.indexOf('{');
        const end = text.lastIndexOf('}');
        if (start !== -1 && end !== -1 && end > start) {
          try {
            const potentialJson = text.substring(start, end + 1);
            return JSON.parse(potentialJson);
          } catch (innerE) {
            console.error("[AI] Fallback JSON Parse failed", innerE);
          }
        }
        throw new Error("Failed to parse AI response as JSON. Received: " + text.substring(0, 50) + "...");
      }
    };

    let prompt = "";
    
    // Fallback logic for high demand or retryable limits
    const generateWithFallback = async (promptText: string, isJson: boolean) => {
      let lastError;
      
      for (let attempt = 1; attempt <= 3; attempt++) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 25000); // 25s timeout for AI response

        try {
          console.log(`[AI] Calling OpenRouter with model ${aiModel}, attempt ${attempt}, jsonMode=${isJson && attempt === 1}`);
          
          // On OpenRouter, response_format: "json_object" can sometimes cause "Provider returned error"
          // depending on the specific model route. We only try it on the first attempt.
          const useJsonFormat = isJson && attempt === 1;

          const fetchBody: any = {
            model: aiModel.trim(),
            messages: [{ role: "user", content: promptText }],
            temperature: 0.7,
            max_tokens: isJson ? 800 : 1200
          };

          if (useJsonFormat) {
            fetchBody.response_format = { type: "json_object" };
          }

          const orRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${apiKey}`,
              "Content-Type": "application/json",
              "HTTP-Referer": "https://revv8motors.com", 
              "X-Title": "Revv8Motors"
            },
            body: JSON.stringify(fetchBody),
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);
          const orData = await orRes.json();
          
          if (!orRes.ok) {
            const errorMsg = orData?.error?.message || orData?.message || `Status ${orRes.status}`;
            console.error(`[AI] OpenRouter Error (Attempt ${attempt}):`, errorMsg, "Full payload:", JSON.stringify(orData));
            
            // If the provider returned a generic error, retry at least once more without JSON format
            if (attempt < 3) {
              lastError = new Error(errorMsg);
              const delay = attempt * 1500;
              await new Promise(resolve => setTimeout(resolve, delay));
              continue; 
            }
            
            throw new Error(errorMsg);
          }
          
          const content = orData.choices?.[0]?.message?.content;
          if (content === undefined || content === null || (typeof content === 'string' && content.trim() === '')) {
            console.error(`[AI] OpenRouter empty content (Attempt ${attempt}). Body keys:`, Object.keys(orData));
            
            if (orData.choices?.[0]?.text) {
              return { text: orData.choices[0].text };
            }
            
            throw new Error("Empty response from AI provider");
          }
          return { text: content };
        } catch (e: any) {
          clearTimeout(timeoutId);
          lastError = e;
          const errStr = String(e?.message || e);
          
          if (e.name === 'AbortError') {
            console.error(`[AI] Attempt ${attempt} timed out after 25s`);
          } else {
            console.error(`[AI] Attempt ${attempt} failed:`, errStr);
          }
          
          if (e.name === 'AbortError' || errStr.includes("503") || errStr.includes("429") || errStr.includes("RESOURCE_EXHAUSTED") || errStr.includes("UNAVAILABLE") || errStr.includes("Empty response") || errStr.includes("JSON") || errStr.includes("Bad Request") || errStr.includes("400")) {
            if (attempt < 3) {
              const delay = attempt * 2000;
              console.log(`[AI] Retrying in ${delay/1000} seconds...`);
              await new Promise(resolve => setTimeout(resolve, delay));
              continue; 
            }
          }
          throw e; 
        }
      }
      throw lastError; 
    };
    
    if (type === "description") {
      prompt = `Write a premium, luxury marketing description for this car. Length: 80-120 words. No emojis. Tone: Clean and persuasive.
      Car Info:
      Brand: ${cleanCarData.brand}
      Model: ${cleanCarData.model}
      Year: ${cleanCarData.year}
      Category: ${cleanCarData.category}
      Engine: ${cleanCarData.engine}
      Output the description as plain text only. Do not include any headers or meta-talk.`;
      
      const response = await generateWithFallback(prompt, false);

      console.log(`[AI] Admin ${user.localId} generated description`);
      res.json({ success: true, data: { description: response.text.trim() } });
      
    } else if (type === "seo") {
      prompt = `Generate SEO metadata for this luxury car. 
      Car Info: ${cleanCarData.brand} ${cleanCarData.model} (${cleanCarData.year}) - ${cleanCarData.category}.
      
      Requirements:
      1. slug: lowercase, hyphen-separated, based on brand, model, and year.
      2. metaTitle: Max 60 chars.
      3. metaDescription: Max 155 chars, engaging description.
      
      Output ONLY a raw JSON object string with these keys: "slug", "metaTitle", "metaDescription". 
      Do NOT include any markdown formatting, preamble, or code blocks. Just the JSON.`;

      const response = await generateWithFallback(prompt, true);

      console.log(`[AI] Admin ${user.localId} generated SEO content`);
      let parsed;
      try {
        parsed = resilientJsonParse(response.text || "{}");
      } catch (parseErr) {
        console.error("[AI] Final JSON Parse fail. Raw text:", response.text);
        throw parseErr;
      }
      res.json({ success: true, data: parsed });

    } else if (type === "all") {
      prompt = `Generate luxury car content for this vehicle.
      Car Info: ${cleanCarData.brand} ${cleanCarData.model} (${cleanCarData.year}) - ${cleanCarData.category}.
      
      Requirements:
      1. description: Premium, luxury marketing description. Tone: PERSUASIVE. Length: 80-120 words. No emojis.
      2. slug: lowercase, hyphen-separated, based on brand, model, and year.
      3. metaTitle: Max 60 chars.
      4. metaDescription: Max 155 chars.
      
      Output ONLY a raw JSON object string with these keys: "description", "slug", "metaTitle", "metaDescription".
      Do NOT include any markdown formatting or code blocks. Just the JSON.`;

      const response = await generateWithFallback(prompt, true);

      console.log(`[AI] Admin ${user.localId} generated full content`);
      let parsed;
      try {
        parsed = resilientJsonParse(response.text || "{}");
      } catch (parseErr) {
        console.error("[AI] Final JSON Parse fail (Combined). Raw text:", response.text);
        throw parseErr;
      }
      res.json({ success: true, data: parsed });

    } else {
      res.status(400).json({ success: false, error: "Invalid type" });
    }
  } catch (err: any) {
    let errStr = "";
    try {
      errStr = typeof err === 'object' ? JSON.stringify(err) : String(err);
    } catch (e) {
      errStr = String(err);
    }
    if (err?.message) errStr += " " + err.message;
    
    if (errStr.includes("429") || errStr.includes("RESOURCE_EXHAUSTED") || err.status === 429 || err?.error?.code === 429) {
      return res.status(429).json({
        success: false,
        error: "AI Quota Exceeded. Please check your Gemini API plan and billing details.",
      });
    } else if (errStr.includes("503") || errStr.includes("UNAVAILABLE") || err.status === 503 || err?.error?.code === 503) {
      return res.status(503).json({
        success: false,
        error: "This model is currently experiencing high demand. Please try again later.",
      });
    } else {
      console.error("AI Generation Error", errStr, err);
      return res.status(500).json({ 
        success: false, 
        error: "AI generation failed. " + (err?.message || "Unknown error") 
      });
    }
  }
});

// Global API error handler
app.use("/api", (err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("Unhandled API Error:", err);
  res.status(500).json({
    success: false,
    error: err.message || "Internal Server Error"
  });
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Note: process.cwd() works here because dist is usually sibling to server.ts or we run from root
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
