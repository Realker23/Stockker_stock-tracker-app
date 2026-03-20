'use server';

import {
    getDateRange,
    validateArticle,
    formatArticle,
    calculateNewsDistribution,
} from '@/lib/utils';
import { cache } from 'react';
import { POPULAR_STOCK_SYMBOLS } from '../constants';

const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';
const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;

if (!FINNHUB_API_KEY) {
    throw new Error('FINNHUB_API_KEY is not configured');
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Thin fetch wrapper that supports optional ISR revalidation.
 * Throws on non-2xx responses so callers always receive typed data.
 */
async function fetchJSON<T>(url: string, revalidateSeconds?: number): Promise<T> {
    const options: RequestInit =
        revalidateSeconds !== undefined
            ? { cache: 'force-cache', next: { revalidate: revalidateSeconds } }
            : { cache: 'no-store' };

    const res = await fetch(url, options);

    if (!res.ok) {
        throw new Error(
            `Finnhub request failed [${res.status} ${res.statusText}]: ${url}`,
        );
    }

    return res.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Fetches up to 6 news articles.
 *
 * - **With symbols**: uses `calculateNewsDistribution` to decide how many
 *   articles to pull per symbol, iterating round-robin up to `targetNewsCount`.
 * - **Without symbols**: fetches general market news, deduplicates by
 *   id / url / headline, then returns the top 6.
 *
 * Validation and formatting delegate to `validateArticle` / `formatArticle`
 * from `@/lib/utils`. Throws `'Failed to fetch news'` on unrecoverable errors.
 */
export const getNews = async (symbols?: string[]): Promise<MarketNewsArticle[]> => {
    try {
        // Five-day date window via shared utility
        const { from, to } = getDateRange(5);

        // ------------------------------------------------------------------
        // Symbol-based news (personalised watchlist)
        // ------------------------------------------------------------------
        if (symbols && symbols.length > 0) {
            const cleanSymbols = symbols
                .map((s) => s.trim().toUpperCase())
                .filter(Boolean);

            // How many articles per symbol and the overall cap (max 6)
            const { itemsPerSymbol, targetNewsCount } =
                calculateNewsDistribution(cleanSymbols.length);

            const articles: MarketNewsArticle[] = [];

            for (let round = 0; round < targetNewsCount; round++) {
                if (articles.length >= targetNewsCount) break;

                // Round-robin symbol selection
                const symbol = cleanSymbols[round % cleanSymbols.length];
                const url = `${FINNHUB_BASE_URL}/company-news?symbol=${symbol}&from=${from}&to=${to}&token=${NEXT_PUBLIC_FINNHUB_API_KEY}`;

                const data  = await fetchJSON<RawNewsArticle[]>(url);
                const valid = data.filter(validateArticle);

                // Take up to itemsPerSymbol valid articles from this round
                const toTake = Math.min(itemsPerSymbol, targetNewsCount - articles.length);
                valid.slice(0, toTake).forEach((article, idx) => {
                    articles.push(formatArticle(article, true, symbol, idx) as MarketNewsArticle);
                });
            }

            // Most-recent first
            return articles.sort((a, b) => b.datetime - a.datetime);
        }

        // ------------------------------------------------------------------
        // General market news (no watchlist / fallback)
        // ------------------------------------------------------------------
        const url  = `${FINNHUB_BASE_URL}/news?category=general&token=${NEXT_PUBLIC_FINNHUB_API_KEY}`;
        const data = await fetchJSON<RawNewsArticle[]>(url);

        // Deduplicate by the combination of id, url, and headline
        const seen   = new Set<string>();
        const unique: RawNewsArticle[] = [];

        for (const article of data) {
            const key = `${article.id ?? ''}-${article.url ?? ''}-${article.headline ?? ''}`;
            if (!seen.has(key) && validateArticle(article)) {
                seen.add(key);
                unique.push(article);
            }
        }

        return unique
            .slice(0, 6)
            .map((article, idx) => formatArticle(article, false, undefined, idx) as MarketNewsArticle);
    } catch (error) {
        console.error('Error fetching news:', error);
        throw new Error('Failed to fetch news');
    }
};

export const searchStocks = cache(async (query?: string): Promise<StockWithWatchlistStatus[]> => {
  try {
    const token = process.env.FINNHUB_API_KEY ?? NEXT_PUBLIC_FINNHUB_API_KEY;
    if (!token) {
      // If no token, log and return empty to avoid throwing per requirements
      console.error('Error in stock search:', new Error('FINNHUB API key is not configured'));
      return [];
    }

    const trimmed = typeof query === 'string' ? query.trim() : '';
    console.log(`Searching stocks with query: "${trimmed}"`, !trimmed);
    let results: FinnhubSearchResult[] = [];

    if (!trimmed) {
      // Fetch top 10 popular symbols' profiles
      const top = POPULAR_STOCK_SYMBOLS.slice(0, 10);
      const profiles = await Promise.all(
        top.map(async (sym) => {
          try {
            const url = `${FINNHUB_BASE_URL}/stock/profile2?symbol=${encodeURIComponent(sym)}&token=${token}`;
            // Revalidate every hour
            const profile = await fetchJSON<any>(url, 3600);
            return { sym, profile } as { sym: string; profile: any };
          } catch (e) {
            console.error('Error fetching profile2 for', sym, e);
            return { sym, profile: null } as { sym: string; profile: any };
          }
        })
      );

      results = profiles
        .map(({ sym, profile }) => {
          const symbol = sym.toUpperCase();
          const name: string | undefined = profile?.name || profile?.ticker || undefined;
          const exchange: string | undefined = profile?.exchange || undefined;
          if (!name) return undefined;
          const r: FinnhubSearchResult = {
            symbol,
            description: name,
            displaySymbol: symbol,
            type: 'Common Stock',
          };
          // We don't include exchange in FinnhubSearchResult type, so carry via mapping later using profile
          // To keep pipeline simple, attach exchange via closure map stage
          // We'll reconstruct exchange when mapping to final type
          (r as any).__exchange = exchange; // internal only
          return r;
        })
        .filter((x): x is FinnhubSearchResult => Boolean(x));
    } else {
      const url = `${FINNHUB_BASE_URL}/search?q=${encodeURIComponent(trimmed)}&token=${token}`;
      const data = await fetchJSON<FinnhubSearchResponse>(url, 1800);
      results = Array.isArray(data?.result) ? data.result : [];
    }

    const mapped: StockWithWatchlistStatus[] = results
      .map((r) => {
        const upper = (r.symbol || '').toUpperCase();
        const name = r.description || upper;
        const exchangeFromDisplay = (r.displaySymbol as string | undefined) || undefined;
        const exchangeFromProfile = (r as any).__exchange as string | undefined;
        const exchange = exchangeFromDisplay || exchangeFromProfile || 'US';
        const type = r.type || 'Stock';
        const item: StockWithWatchlistStatus = {
          symbol: upper,
          name,
          exchange,
          type,
          isInWatchlist: false,
        };
        return item;
      })
      .slice(0, 15);

    return mapped;
  } catch (err) {
    console.error('Error in stock search:', err);
    return [];
  }
});
