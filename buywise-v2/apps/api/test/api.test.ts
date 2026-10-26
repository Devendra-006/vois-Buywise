import { describe, it } from "node:test";
import assert from "node:assert";
import { parseSearchQuery } from "../src/pipeline/parseQuery.js";
import { retrieveProducts } from "../src/pipeline/retrieve.js";

describe("API Pipeline Agents", () => {
  it("should parse query and extract category and budget", async () => {
    const parsed = await parseSearchQuery("best wireless earbuds under 3000 with good bass");
    assert.strictEqual(parsed.category, "earbuds");
    assert.strictEqual(parsed.maxPrice, 3000);
  });

  it("should retrieve valid candidate products for earbuds query", async () => {
    const parsed = {
      category: "earbuds" as const,
      cleanedQuery: "earbuds",
      maxPrice: null,
      minPrice: null,
      mustHave: [],
      niceToHave: [],
      targetLanguage: "en"
    };

    const { products, isDemo } = await retrieveProducts(parsed);
    assert.ok(products.length > 0, "Products list should not be empty");
    assert.ok(isDemo, "In test environment should return verified fixtures");
    assert.ok(products[0].price > 0, "Product price must be a positive number");
    assert.ok(products[0].rating > 0, "Product rating must be positive");
  });
});
