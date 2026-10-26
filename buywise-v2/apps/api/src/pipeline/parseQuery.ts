import { ParsedQuery, ParsedQuerySchema, detectCategory } from "@buywise/shared";
import { callStructuredLLM } from "../lib/llm.js";

export async function parseSearchQuery(query: string, targetLang = "en"): Promise<ParsedQuery> {
  const fallbackCategory = detectCategory(query);

  // Quick regex extraction for price intent (e.g., "under 3000", "below 25k", "under 15000")
  let fallbackMaxPrice: number | null = null;
  const underMatch = query.match(/under\s*(?:rs\.?|inr|₹)?\s*(\d+(?:,\d+)*(?:k)?)/i) ||
                     query.match(/below\s*(?:rs\.?|inr|₹)?\s*(\d+(?:,\d+)*(?:k)?)/i);

  if (underMatch && underMatch[1]) {
    const rawVal = underMatch[1].toLowerCase().replace(/,/g, "");
    if (rawVal.endsWith("k")) {
      fallbackMaxPrice = parseFloat(rawVal.replace("k", "")) * 1000;
    } else {
      fallbackMaxPrice = parseFloat(rawVal);
    }
  }

  const fallback: ParsedQuery = {
    category: fallbackCategory,
    cleanedQuery: query,
    maxPrice: fallbackMaxPrice,
    minPrice: null,
    mustHave: [],
    niceToHave: [],
    targetLanguage: targetLang
  };

  const systemPrompt = `You are the Query Understanding Agent for BuyWise.
Analyze the user's shopping search query and extract structured shopping constraints.

Categories supported: "earbuds", "smartphones", "laptops", "general".
Detect user constraints such as budget ("under 3000" -> maxPrice: 3000), features ("with ANC", "good battery"), and clean query string.`;

  const userPrompt = `Query: "${query}"`;

  const parsed = await callStructuredLLM<ParsedQuery>({
    systemPrompt,
    userPrompt,
    schema: ParsedQuerySchema,
    temperature: 0.1,
    maxTokens: 400
  });

  return parsed || fallback;
}
