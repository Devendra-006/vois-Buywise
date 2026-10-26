import { SearchPipelineResult, SearchWeights, ScoredProduct, PriceVerdict, PriceSnapshot } from "@buywise/shared";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

function getAuthHeader(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem("buywise_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function searchProducts(
  query: string,
  weights?: SearchWeights,
  targetLang = "en",
  forceRefresh = false
): Promise<SearchPipelineResult> {
  const res = await fetch(`${API_BASE}/v1/search`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader()
    },
    body: JSON.stringify({ query, weights, targetLang, forceRefresh })
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Search failed with status ${res.status}`);
  }

  return res.json();
}

export function searchProductsStream(
  query: string,
  targetLang: string,
  onProgress: (stage: string, message: string, payload?: any) => void,
  onComplete: (result: SearchPipelineResult) => void,
  onError: (err: string) => void
): () => void {
  const url = `${API_BASE}/v1/search/stream?q=${encodeURIComponent(query)}&lang=${encodeURIComponent(targetLang)}`;
  const eventSource = new EventSource(url);

  eventSource.addEventListener("progress", (event: MessageEvent) => {
    try {
      const data = JSON.parse(event.data);
      onProgress(data.stage, data.message, data.payload);
    } catch {
      // ignore parse err
    }
  });

  eventSource.addEventListener("complete", (event: MessageEvent) => {
    try {
      const result = JSON.parse(event.data);
      onComplete(result);
    } catch (e: any) {
      onError("Failed to parse completion data");
    } finally {
      eventSource.close();
    }
  });

  eventSource.addEventListener("error", (event: any) => {
    let msg = "Realtime connection interrupted";
    try {
      if (event.data) {
        const d = JSON.parse(event.data);
        msg = d.message || msg;
      }
    } catch {
      // ignore
    }
    onError(msg);
    eventSource.close();
  });

  return () => {
    eventSource.close();
  };
}

export async function getProductDetails(id: string): Promise<{
  product: ScoredProduct;
  priceVerdict: PriceVerdict;
  snapshots: PriceSnapshot[];
}> {
  const res = await fetch(`${API_BASE}/v1/products/${id}`);
  if (!res.ok) throw new Error("Failed to load product details");
  return res.json();
}

export async function compareProducts(ids: string[]): Promise<{ products: ScoredProduct[] }> {
  const res = await fetch(`${API_BASE}/v1/products?ids=${ids.join(",")}`);
  if (!res.ok) throw new Error("Failed to load comparison data");
  return res.json();
}
