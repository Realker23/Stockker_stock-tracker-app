"use client";

import { useEffect, useRef, useState } from "react";
import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { Button } from "./ui/button";
import { Loader2, Star, TrendingUp } from "lucide-react";
import Link from "next/link";
import { searchStocks } from "@/lib/actions/finnhub.actions";
import { useDebounce } from "@/hooks/useDebounce";

/**
 * SearchCommand
 *
 * A command-palette component built on top of ShadCN's Command UI.
 *
 * Features:
 *  - Cmd/Ctrl + K keyboard shortcut toggles the dialog open/closed.
 *  - Seed stock list is fetched lazily on the first time the dialog opens
 *    (never during layout render) so the authenticated layout is not blocked
 *    by external Finnhub network calls.
 *  - `searchTerm` drives debounced live search via `searchStocks`.
 *  - `handleSelectStock` closes the palette and resets state.
 */
const SearchCommand = ({ renderAs = "button", label = "Add stock", initialStocks }: SearchCommandProps) => {
    const [open, setOpen]         = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading]   = useState(false);
    const [stocks, setStocks]     = useState<StockWithWatchlistStatus[]>(initialStocks ?? []);

    // Tracks whether the seed list has already been fetched so we only call
    // searchStocks("") once — on the first time the dialog opens.
    const hasFetchedSeed = useRef(false);

    const isSearchMode  = !!searchTerm.trim();
    const displayStocks = isSearchMode ? stocks : stocks?.slice(0, 10);

    // ── Cmd/Ctrl + K shortcut ──────────────────────────────────────────────
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((prev) => !prev);
            }
        };
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, []);

    // ── Lazy seed fetch — fires only on the first open ────────────────────
    useEffect(() => {
        if (!open || hasFetchedSeed.current) return;
        hasFetchedSeed.current = true;

        setLoading(true);
        searchStocks("")
            .then((results) => setStocks(results))
            .catch(() => setStocks([]))
            .finally(() => setLoading(false));
    }, [open]);

    // ── Debounced live search ─────────────────────────────────────────────
    const handleSearch = async () => {
        if (!isSearchMode) {
            // Restore the already-fetched seed list
            return searchStocks("")
                .then((results) => setStocks(results))
                .catch(() => setStocks([]));
        }
        setLoading(true);
        try {
            const results = await searchStocks(searchTerm);
            setStocks(results);
        } catch (error) {
            setStocks([]);
            console.error("Error searching stocks:", error);
        } finally {
            setLoading(false);
        }
    };

    const debouncedSearch = useDebounce(handleSearch, 300);

    useEffect(() => {
        if (!open) return; // don't search while dialog is closed
        debouncedSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchTerm]);

    // ── Select handler ────────────────────────────────────────────────────
    const handleSelectStock = () => {
        setOpen(false);
        setSearchTerm("");
    };

    return (
        <>
        {
            renderAs === 'text' ? (
                <span onClick={() => setOpen(true)} className="search-text">
                    {label}
                </span>
            ) : (
                <Button onClick={() => setOpen(true)} className="search-btn">{label}</Button>
            )
        }
        <CommandDialog open={open} onOpenChange={setOpen} className="search-dialog" title="Search Stocks" description="Search for a stock by name or ticker symbol.">
            <div className="search-field">
                <CommandInput
                    placeholder="Search stocks…"
                    value={searchTerm}
                    onValueChange={setSearchTerm}
                    className="search-input"
                />
                {loading && <Loader2 className="search-loader" />}
            </div>
            <CommandList className="search-list">
                {loading ? (
                    <CommandEmpty className="search-list-empty">Loading stocks...</CommandEmpty>
                ) : displayStocks?.length === 0 ? (
                    <div className="search-list-indicator">
                        {isSearchMode ? "No stocks found." : "Type to search for stocks."}
                    </div>
                ) : (
                    <ul>
                        <div className="search-count">
                            {isSearchMode
                                ? `Showing ${displayStocks?.length} of ${stocks?.length} results`
                                : "Showing top 10 stocks"}
                        </div>
                        {displayStocks?.map((stock) => (
                            <li key={stock.symbol} className="search-item">
                                <Link href={`/stocks/${stock.symbol}`} onClick={handleSelectStock} className="search-item-link">
                                    <TrendingUp className="h-4 w-4 text-gray-500" />
                                    <div className="flex-1">
                                        <div className="search-item-name">{stock.name}</div>
                                        <div className="text-sm text-gray-500">
                                            {stock.symbol} | {stock.exchange} | {stock.type}
                                        </div>
                                    </div>
                                    {stock.isInWatchlist && (
                                        <Star className="size-4 shrink-0 fill-yellow-400 text-yellow-400" />
                                    )}
                                </Link>
                            </li>
                        ))}
                    </ul>
                )}
            </CommandList>
        </CommandDialog>
        </>
    );
};

export default SearchCommand;