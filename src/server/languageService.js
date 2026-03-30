import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

const INDIAN_LANGUAGES = {
  hi: "Hindi",
  ta: "Tamil",
  te: "Telugu",
  kn: "Kannada",
  ml: "Malayalam",
  mr: "Marathi",
  gu: "Gujarati",
  bn: "Bengali",
  pa: "Punjabi",
  or: "Odia",
  as: "Assamese",
  ur: "Urdu"
};

const LANGUAGE_PATTERNS = {
  hi: /[\u0900-\u097F]/,
  ta: /[\u0B80-\u0BFF]/,
  te: /[\u0C00-\u0C7F]/,
  kn: /[\u0C80-\u0CFF]/,
  ml: /[\u0D00-\u0D7F]/,
  mr: /[\u0900-\u097F]/,
  gu: /[\u0A80-\u0AFF]/,
  bn: /[\u0980-\u09FF]/,
  pa: /[\u0A00-\u0A7F]/,
  or: /[\u0B00-\u0B7F]/,
  as: /[\u0980-\u09FF]/,
  ur: /[\u0600-\u06FF]/
};

export function detectLanguage(text) {
  if (!text || typeof text !== "string") {
    return { code: "en", name: "English", confidence: 0 };
  }

  const trimmed = text.trim();
  if (!trimmed) {
    return { code: "en", name: "English", confidence: 0 };
  }

  for (const [code, pattern] of Object.entries(LANGUAGE_PATTERNS)) {
    if (pattern.test(trimmed)) {
      return {
        code,
        name: INDIAN_LANGUAGES[code] || code,
        confidence: 0.9
      };
    }
  }

  return { code: "en", name: "English", confidence: 0.8 };
}

export async function translateToEnglish(text, sourceLang) {
  if (!text || sourceLang === "en") {
    return { translated: text, originalLang: "en" };
  }

  if (!OPENROUTER_API_KEY) {
    console.warn("⚠️ No OpenRouter API key - skipping translation");
    return { translated: text, originalLang: sourceLang, error: "No translation API" };
  }

  try {
    const response = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENROUTER_API_KEY}`
      },
      body: JSON.stringify({
        model: "stepfun/step-3.5-flash:free",
        messages: [
          {
            role: "system",
            content: `You are a translator. Translate the following text from ${INDIAN_LANGUAGES[sourceLang] || sourceLang} to English. Only respond with the translation, nothing else.`
          },
          {
            role: "user",
            content: text
          }
        ],
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      throw new Error(`Translation API error: ${response.status}`);
    }

    const data = await response.json();
    const translated = data.choices?.[0]?.message?.content?.trim();

    if (translated) {
      console.log(`🌍 Translated from ${INDIAN_LANGUAGES[sourceLang] || sourceLang}: "${text.substring(0, 50)}..." → "${translated.substring(0, 50)}..."`);
      return { translated, originalLang: sourceLang };
    }

    return { translated: text, originalLang: sourceLang };
  } catch (error) {
    console.error("Translation error:", error.message);
    return { translated: text, originalLang: sourceLang, error: error.message };
  }
}

export async function translateFromEnglish(text, targetLang) {
  if (!text || targetLang === "en") {
    return { translated: text };
  }

  if (!OPENROUTER_API_KEY) {
    return { translated: text, error: "No translation API" };
  }

  try {
    const response = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENROUTER_API_KEY}`
      },
      body: JSON.stringify({
        model: "stepfun/step-3.5-flash:free",
        messages: [
          {
            role: "system",
            content: `You are a translator. Translate the following English text to ${INDIAN_LANGUAGES[targetLang] || targetLang}. Only respond with the translation, nothing else.`
          },
          {
            role: "user",
            content: text
          }
        ],
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      throw new Error(`Translation API error: ${response.status}`);
    }

    const data = await response.json();
    const translated = data.choices?.[0]?.message?.content?.trim();

    return { translated: translated || text };
  } catch (error) {
    console.error("Translation error:", error.message);
    return { translated: text, error: error.message };
  }
}

export function isIndianLanguage(text) {
  const lang = detectLanguage(text);
  return lang.code !== "en";
}
