'use server';

import { headers } from 'next/headers';
import { connectToDatabase } from '@/database/mongoose';
import Watchlist, { WatchlistItem } from '@/database/models/watchlist.model';
import { auth } from '@/lib/better-auth/auth';
import { formatPrice, formatChangePercent, formatMarketCapValue } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Internal helper — resolves the current session user's id from Better-Auth
// ---------------------------------------------------------------------------
const getSessionUserId = async (): Promise<string | null> => {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        return session?.user?.id ?? null;
    } catch {
        return null;
    }
};

/**
 * Returns the list of stock symbols on a given user's watchlist.
 *
 * Looks up the user by email in the Better-Auth `user` collection,
 * then queries the Watchlist collection for all entries belonging to
 * that user. Returns an empty array when the user is not found or if
 * any error occurs so callers can degrade gracefully.
 */
export const getWatchlistSymbolsByEmail = async (email: string): Promise<string[]> => {
    try {
        const mongoose = await connectToDatabase();
        const db = mongoose.connection.db;

        if (!db) return [];

        // Resolve the user record stored by Better-Auth
        const user = await db.collection('user').findOne(
            { email },
        );

        if (!user) return [];

        const userId: string = user.id ?? user._id?.toString();

        const items = await Watchlist.find(
            { userId },
            { symbol: 1},
        ).lean<{ symbol: string }[]>();

        return items.map((item) => item.symbol);
    } catch (error) {
        console.error('Error fetching watchlist symbols by email:', error);
        return [];
    }
};

/**
 * Returns whether a given symbol is already on the current user's watchlist.
 * Returns `false` when the user is not signed in.
 */
export const getWatchlistStatus = async (symbol: string): Promise<boolean> => {
    try {
        const userId = await getSessionUserId();
        if (!userId) return false;

        await connectToDatabase();
        const exists = await Watchlist.exists({
            userId,
            symbol: symbol.toUpperCase(),
        });

        return !!exists;
    } catch (error) {
        console.error('Error checking watchlist status:', error);
        return false;
    }
};

/**
 * Adds a stock to the current user's watchlist.
 * Returns `{ success, message }`.
 */
export const addToWatchlist = async (
    symbol: string,
    company: string,
): Promise<{ success: boolean; message: string }> => {
    try {
        const userId = await getSessionUserId();
        if (!userId) return { success: false, message: 'Not authenticated' };

        await connectToDatabase();

        await Watchlist.create({
            userId,
            symbol: symbol.toUpperCase(),
            company,
        });

        return { success: true, message: `${symbol.toUpperCase()} added to watchlist` };
    } catch (error: unknown) {
        // Mongoose duplicate-key error — already on watchlist
        if ((error as { code?: number })?.code === 11000) {
            return { success: false, message: 'Already in watchlist' };
        }
        console.error('Error adding to watchlist:', error);
        return { success: false, message: 'Failed to add to watchlist' };
    }
};

/**
 * Removes a stock from the current user's watchlist.
 * Returns `{ success, message }`.
 */
export const removeFromWatchlist = async (
    symbol: string,
): Promise<{ success: boolean; message: string }> => {
    try {
        const userId = await getSessionUserId();
        if (!userId) return { success: false, message: 'Not authenticated' };

        await connectToDatabase();

        await Watchlist.deleteOne({ userId, symbol: symbol.toUpperCase() });

        return { success: true, message: `${symbol.toUpperCase()} removed from watchlist` };
    } catch (error) {
        console.error('Error removing from watchlist:', error);
        return { success: false, message: 'Failed to remove from watchlist' };
    }
};

/**
 * Returns the full watchlist entry for the current user matching the given symbol.
 * Returns `null` when the user is not signed in, the symbol is not on their
 * watchlist, or an error occurs.
 */
export const getWatchlistBySymbol = async (symbol: string): Promise<WatchlistItem | null> => {
    try {
        const userId = await getSessionUserId();
        if (!userId) return null;

        await connectToDatabase();

        const item = await Watchlist.findOne({
            userId,
            symbol: symbol.toUpperCase(),
        }).lean<WatchlistItem>();

        return item ?? null;
    } catch (error) {
        console.error('Error fetching watchlist item by symbol:', error);
        return null;
    }
};

// ---------------------------------------------------------------------------
// Finnhub enrichment helpers (server-only, not exported)
// ---------------------------------------------------------------------------

const FINNHUB_BASE = 'https://finnhub.io/api/v1';
const FINNHUB_KEY  = process.env.NEXT_PUBLIC_FINNHUB_API_KEY ?? '';

/** Fetches a single Finnhub endpoint; returns null on failure. */
async function finnhubFetch<T>(path: string): Promise<T | null> {
    try {
        const res = await fetch(`${FINNHUB_BASE}${path}&token=${FINNHUB_KEY}`, {
            cache: 'no-store',
        });
        if (!res.ok) return null;
        return res.json() as Promise<T>;
    } catch {
        return null;
    }
}

/**
 * Returns every item on the current user's watchlist enriched with live
 * Finnhub market data (price, change %, market cap, P/E ratio).
 *
 * Quote + profile requests are fired in parallel per symbol so latency
 * scales with the slowest single request, not the total count.
 *
 * Returns an empty array when the user is not signed in or has no watchlist.
 */
export const getFullWatchlist = async (): Promise<StockWithData[]> => {
    try {
        const userId = await getSessionUserId();
        if (!userId) return [];

        await connectToDatabase();

        const items = await Watchlist.find({ userId })
            .sort({ addedAt: -1 })
            .lean<WatchlistItem[]>();

        if (items.length === 0) return [];

        const enriched = await Promise.all(
            items.map(async (item): Promise<StockWithData> => {
                const sym = item.symbol.toUpperCase();

                const [quote, profile, financials] = await Promise.all([
                    finnhubFetch<QuoteData>(`/quote?symbol=${sym}`),
                    finnhubFetch<ProfileData>(`/stock/profile2?symbol=${sym}`),
                    finnhubFetch<FinancialsData>(`/stock/metric?symbol=${sym}&metric=all`),
                ]);

                const currentPrice   = quote?.c   ?? undefined;
                const changePercent  = quote?.dp  ?? undefined;
                const marketCapRaw   = profile?.marketCapitalization
                    ? profile.marketCapitalization * 1_000_000   // Finnhub returns value in millions
                    : undefined;
                const peRatioRaw     = financials?.metric?.['peNormalizedAnnual'] ?? undefined;

                return {
                    userId:         item.userId,
                    symbol:         sym,
                    company:        item.company,
                    addedAt:        item.addedAt,
                    currentPrice,
                    changePercent,
                    priceFormatted:  currentPrice  !== undefined ? formatPrice(currentPrice)             : undefined,
                    changeFormatted: changePercent !== undefined ? formatChangePercent(changePercent)    : undefined,
                    marketCap:       marketCapRaw  !== undefined ? formatMarketCapValue(marketCapRaw)    : undefined,
                    peRatio:         peRatioRaw    !== undefined ? peRatioRaw.toFixed(2)                 : undefined,
                };
            }),
        );

        return enriched;
    } catch (error) {
        console.error('Error fetching full watchlist:', error);
        return [];
    }
};
