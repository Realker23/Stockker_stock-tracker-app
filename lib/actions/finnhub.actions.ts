'use server';

import {
    getDateRange,
    validateArticle,
    formatArticle,
    calculateNewsDistribution,
} from '@/lib/utils';

const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';
const NEXT_PUBLIC_FINNHUB_API_KEY = process.env.NEXT_PUBLIC_FINNHUB_API_KEY ?? '';

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
