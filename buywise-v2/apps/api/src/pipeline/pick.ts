import { ScoredProduct, TopPicks, selectTopPicks } from "@buywise/shared";

export function pickTopThree(scoredProducts: ScoredProduct[]): TopPicks {
  return selectTopPicks(scoredProducts);
}
