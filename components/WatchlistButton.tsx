"use client";

import { useState, useTransition } from "react";
import { Bookmark, BookmarkCheck, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { addToWatchlist, removeFromWatchlist } from "@/lib/actions/watchlist.actions";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

/**
 * WatchlistButton
 *
 * A client component that lets the user add or remove a stock from their
 * watchlist with a single click.
 *
 * Props:
 *  - `symbol`          — Ticker symbol (e.g. "AAPL")
 *  - `company`         — Company display name (e.g. "Apple Inc.")
 *  - `isInWatchlist`   — Server-resolved initial state
 *  - `showTrashIcon`   — When true, shows a trash icon instead of bookmark for removal
 *  - `type`            — "button" (default) renders a full button; "icon" renders icon-only
 *  - `onWatchlistChange` — Optional callback fired after a successful toggle
 */
const WatchlistButton = ({
    symbol,
    company,
    isInWatchlist: initialIsInWatchlist,
    showTrashIcon = false,
    type = "button",
    onWatchlistChange,
}: WatchlistButtonProps) => {
    const [isInWatchlist, setIsInWatchlist] = useState(initialIsInWatchlist);
    const [isPending, startTransition]       = useTransition();

    const handleToggle = () => {
        startTransition(async () => {
            if (isInWatchlist) {
                const { success, message } = await removeFromWatchlist(symbol);
                if (success) {
                    setIsInWatchlist(false);
                    toast.success(message);
                    onWatchlistChange?.(symbol, false);
                } else {
                    toast.error(message);
                }
            } else {
                const { success, message } = await addToWatchlist(symbol, company);
                if (success) {
                    setIsInWatchlist(true);
                    toast.success(message);
                    onWatchlistChange?.(symbol, true);
                } else {
                    toast.error(message);
                }
            }
        });
    };

    // ── Icon-only variant ────────────────────────────────────────────────
    if (type === "icon") {
        return (
            <button
                onClick={handleToggle}
                disabled={isPending}
                aria-label={isInWatchlist ? "Remove from watchlist" : "Add to watchlist"}
                className={cn(
                    "p-2 rounded-md transition-colors disabled:opacity-50",
                    isInWatchlist
                        ? "text-yellow-400 hover:text-red-400"
                        : "text-gray-400 hover:text-yellow-400",
                )}
            >
                {isPending ? (
                    <Loader2 className="size-5 animate-spin" />
                ) : isInWatchlist && showTrashIcon ? (
                    <Trash2 className="size-5" />
                ) : isInWatchlist ? (
                    <BookmarkCheck className="size-5" />
                ) : (
                    <Bookmark className="size-5" />
                )}
            </button>
        );
    }

    // ── Full button variant (default) ────────────────────────────────────
    return (
        <Button
            onClick={handleToggle}
            disabled={isPending}
            variant="outline"
            className={cn(
                "w-full gap-2 font-medium transition-colors",
                isInWatchlist
                    ? "border-yellow-400/40 text-yellow-400 hover:bg-red-500/10 hover:border-red-400 hover:text-red-400"
                    : "border-gray-600 text-gray-300 hover:bg-yellow-400/10 hover:border-yellow-400 hover:text-yellow-400",
            )}
        >
            {isPending ? (
                <Loader2 className="size-4 animate-spin" />
            ) : isInWatchlist ? (
                <BookmarkCheck className="size-4" />
            ) : (
                <Bookmark className="size-4" />
            )}
            {isPending
                ? "Updating…"
                : isInWatchlist
                ? "Remove from Watchlist"
                : "Add to Watchlist"}
        </Button>
    );
};

export default WatchlistButton;
