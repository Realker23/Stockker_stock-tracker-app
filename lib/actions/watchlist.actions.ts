'use server';

import { connectToDatabase } from '@/database/mongoose';
import Watchlist from '@/database/models/watchlist.model';

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
