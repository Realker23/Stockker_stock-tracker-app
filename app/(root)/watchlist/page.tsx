import Link from 'next/link';
import { TrendingDown, TrendingUp, Minus, BookmarkX } from 'lucide-react';
import { getFullWatchlist } from '@/lib/actions/watchlist.actions';
import WatchlistButton from '@/components/WatchlistButton';
import { WATCHLIST_TABLE_HEADER } from '@/lib/constants';

/**
 * WatchlistPage — `/watchlist`
 *
 * Server component that fetches the signed-in user's watchlist from MongoDB,
 * enriches each entry with live Finnhub market data (price, change %, market
 * cap, P/E ratio), then renders a responsive table.
 */
const WatchlistPage = async () => {
    const watchlist = await getFullWatchlist();

    // ── Empty state ─────────────────────────────────────────────────────────
    if (watchlist.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
                <BookmarkX className="size-12 text-gray-600" />
                <h2 className="text-xl font-semibold text-gray-300">Your watchlist is empty</h2>
                <p className="text-sm text-gray-500">
                    Search for a stock and add it to your watchlist to track it here.
                </p>
                <Link
                    href="/"
                    className="mt-2 rounded-md bg-yellow-400 px-5 py-2 text-sm font-medium text-black transition hover:bg-yellow-300"
                >
                    Go to Dashboard
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* ── Page header ──────────────────────────────────────────────── */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-100">My Watchlist</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        {watchlist.length} stock{watchlist.length !== 1 ? 's' : ''} tracked
                    </p>
                </div>
            </div>

            {/* ── Table ────────────────────────────────────────────────────── */}
            <div className="overflow-x-auto rounded-lg border border-gray-700/60">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-gray-700/60 bg-gray-800/40 text-xs uppercase tracking-wide text-gray-500">
                            {WATCHLIST_TABLE_HEADER.map((col) => (
                                <th
                                    key={col}
                                    className="px-4 py-3 text-left font-medium last:text-right"
                                >
                                    {col}
                                </th>
                            ))}
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-700/40">
                        {watchlist.map((stock) => {
                            const isPositive = (stock.changePercent ?? 0) > 0;
                            const isNeutral  = (stock.changePercent ?? 0) === 0;

                            return (
                                <tr
                                    key={stock.symbol}
                                    className="group transition-colors hover:bg-gray-800/30"
                                >
                                    {/* Company */}
                                    <td className="px-4 py-4">
                                        <Link
                                            href={`/stocks/${stock.symbol}`}
                                            className="font-medium text-gray-200 hover:text-yellow-400 transition-colors"
                                        >
                                            {stock.company}
                                        </Link>
                                    </td>

                                    {/* Symbol */}
                                    <td className="px-4 py-4">
                                        <Link href={`/stocks/${stock.symbol}`}>
                                            <span className="rounded bg-gray-700/60 px-2 py-0.5 font-mono text-xs text-yellow-400 hover:bg-gray-700 transition-colors">
                                                {stock.symbol}
                                            </span>
                                        </Link>
                                    </td>

                                    {/* Price */}
                                    <td className="px-4 py-4 font-medium text-gray-200">
                                        {stock.priceFormatted ?? (
                                            <span className="text-gray-600">—</span>
                                        )}
                                    </td>

                                    {/* Change % */}
                                    <td className="px-4 py-4">
                                        {stock.changeFormatted ? (
                                            <span
                                                className={`flex items-center gap-1 font-medium ${
                                                    isNeutral
                                                        ? 'text-gray-400'
                                                        : isPositive
                                                        ? 'text-green-400'
                                                        : 'text-red-400'
                                                }`}
                                            >
                                                {isNeutral ? (
                                                    <Minus className="size-3" />
                                                ) : isPositive ? (
                                                    <TrendingUp className="size-3" />
                                                ) : (
                                                    <TrendingDown className="size-3" />
                                                )}
                                                {stock.changeFormatted}
                                            </span>
                                        ) : (
                                            <span className="text-gray-600">—</span>
                                        )}
                                    </td>

                                    {/* Market Cap */}
                                    <td className="px-4 py-4 text-gray-400">
                                        {stock.marketCap ?? <span className="text-gray-600">—</span>}
                                    </td>

                                    {/* P/E Ratio */}
                                    <td className="px-4 py-4 text-gray-400">
                                        {stock.peRatio ?? <span className="text-gray-600">—</span>}
                                    </td>

                                    {/* Alert — placeholder */}
                                    <td className="px-4 py-4 text-gray-600">—</td>

                                    {/* Remove action */}
                                    <td className="px-4 py-4 text-right">
                                        <WatchlistButton
                                            symbol={stock.symbol}
                                            company={stock.company}
                                            isInWatchlist={true}
                                            showTrashIcon={true}
                                            type="icon"
                                        />
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default WatchlistPage;
