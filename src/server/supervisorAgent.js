// Supervisor Agent (Orchestrator)
// 🎯 Role: Task planner and workflow coordinator.
// Does NOT analyze products or generate recommendations.

// System Instruction:
// You are the Supervisor Agent.
// Your job is to:
// 1. Analyze the user query.
// 2. Break it into structured subtasks.
// 3. Call the appropriate agents in sequence.
// 4. Aggregate structured outputs from agents.
// 5. Send structured data to the Decision Agent.
//
// Rules:
// - Do NOT generate product analysis yourself.
// - Do NOT modify agent outputs.
// - Do NOT add opinions.
// - Only coordinate and pass structured data.
// - If required data is missing, request it from the relevant agent.

import { productRetrievalAgent } from "./productRetrievalAgent.js";
import { reviewIntelligenceAgent } from "./reviewIntelligenceAgent.js";
import { priceIntelligenceAgent } from "./priceIntelligenceAgent.js";
import { scoringAgent } from "./scoringAgent.js";
import { decisionSimplificationAgent } from "./decisionSimplificationAgent.js";
import { explanationAgent } from "./explanationAgent.js";

export async function runSupervisorAgent({ query, weights, userProfile, originalQuery, detectedLanguage, targetLang }) {
  console.log(`\n${"═".repeat(60)}`);
  console.log(`🎯 SUPERVISOR AGENT: Processing query "${query}"`);
  if (originalQuery && originalQuery !== query) {
    console.log(`🌍 Original query (${detectedLanguage?.name}): "${originalQuery}"`);
  }
  console.log(`${"═".repeat(60)}`);

  // Task plan: Break query into structured subtasks
  const taskPlan = [
    "Retrieve product data from multiple websites",
    "Analyze customer reviews for insights",
    "Evaluate price intelligence and discount authenticity",
    "Apply weighted scoring based on user preferences",
    "Simplify to top 3 choices",
    "Provide transparent reasoning"
  ];

  console.log(`📋 Task plan: ${taskPlan.length} steps`);

  // 1. Retrieve products
  console.log(`\n🌐 [1/6] Product Retrieval Agent → Searching across websites...`);
  const products = await productRetrievalAgent({ query });
  console.log(`   ✅ Found ${products.length} products`);

  // 2. Summarize reviews
  console.log(`💬 [2/6] Review Intelligence Agent → Analyzing sentiments...`);
  const reviewInsights = await reviewIntelligenceAgent({ products });
  console.log(`   ✅ Analyzed reviews for ${reviewInsights.length} products`);

  // 3. Analyze prices
  console.log(`💰 [3/6] Price Intelligence Agent → Evaluating deals...`);
  const priceInsights = await priceIntelligenceAgent({ products });
  console.log(`   ✅ Price analysis complete for ${priceInsights.length} products`);

  // 4. Score & personalize
  console.log(`⚖️  [4/6] Scoring Agent → Applying weighted preferences...`);
  const scoredProducts = await scoringAgent({
    products,
    reviewInsights,
    priceInsights,
    weights,
    userProfile
  });
  console.log(`   ✅ Scored & ranked ${scoredProducts.length} products`);

  // 5. Simplify decisions
  console.log(`🎯 [5/6] Decision Simplification Agent → Selecting top 3...`);
  const topPicks = await decisionSimplificationAgent({ scoredProducts });
  console.log(`   ✅ Top picks selected`);

  // 6. Generate explanation
  console.log(`🧾 [6/6] Explanation Agent → Generating reasoning...`);
  const explanation = await explanationAgent({ topPicks, scoredProducts });
  console.log(`   ✅ Explanation generated`);

  console.log(`\n${"═".repeat(60)}`);
  console.log(`✅ PIPELINE COMPLETE — Returning results for "${query}"`);
  console.log(`${"═".repeat(60)}\n`);

  // Final structured response (no agent metadata exposed)
  return {
    query,
    weights,
    userProfile: userProfile || {},
    products: scoredProducts,
    topPicks,
    explanation
  };
}


