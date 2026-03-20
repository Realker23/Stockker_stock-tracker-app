"use client";

import { useEffect, useState } from "react";
import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { Button } from "./ui/button";
import { Loader2, TrendingUp } from "lucide-react";
import Link from "next/link";
import { set } from "mongoose";
import { searchStocks } from "@/lib/actions/finnhub.actions";
import { useDebounce } from "@/hooks/useDebounce";

/**
 * SearchCommand
 *
 * A minimal command-palette component built on top of ShadCN's Command UI.
 *
 * Features:
 *  - Cmd/Ctrl + K keyboard shortcut toggles the dialog open/closed.
 *  - `searchTerm` tracks the current value typed into the input.
 *  - `loading` is reserved for async stock-search integration.
 *  - `handleSelectStock` is called when the user picks a result; it
 *    currently logs the chosen symbol and closes the palette.
 */
const SearchCommand = ({ renderAs="button", label="Add stock", initialStocks}: SearchCommandProps) => {
    const [open, setOpen] = useState(false);
    const [searchTerm, setSearchTerm]     = useState("");
    const [loading, setLoading]           = useState(false);  // reserved for async search
    const [stocks, setStocks]             = useState<StockWithWatchlistStatus[]>(initialStocks);
    const isSearchMode = !!searchTerm.trim();
    const displayStocks = isSearchMode ? stocks : stocks.slice(0, 5); // Show top 5 stocks when not searching
    
    /** Toggle the palette with Cmd + K (Mac) or Ctrl + K (Windows/Linux). */
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen(!open);
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [open, setOpen]);

    const handleSearch = async ()=>{
        if(!isSearchMode) return setStocks(initialStocks); // Reset to initial stocks when search term is cleared
        setLoading(true);
        try{
            const results = await searchStocks(searchTerm);
            console.log(results)
            setStocks(results);
        }catch(error){
            setStocks([]); // Clear results on error to show "No stocks found."
            console.error("Error searching stocks:", error);
        }finally{
            setLoading(false);
        }

    }

    const debouncedSearch = useDebounce(handleSearch, 300); // Debounce search function to limit API calls

    useEffect(()=>{
        debouncedSearch();
    }, [searchTerm])

    /**
     * Called when the user selects a stock from the results list.
     * @param symbol - The ticker symbol of the selected stock.
     */
    const handleSelectStock = (symbol: string) => {
        setOpen(false);
        setSearchTerm("");
        setStocks(initialStocks); // Reset to initial stocks after selection; adjust as needed if you want to keep search results
    };

    return (
        <>
        {
            renderAs === 'text' ? (
                <span onClick={()=> setOpen(true)} className="search-text">
                    {label}
                </span>
                    
            ):
            (
                <Button onClick={()=> setOpen(true)} className="search-btn">{label}</Button>
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
                    <CommandEmpty className="search-list-empty">Loading stock...</CommandEmpty>
                ): displayStocks.length === 0 ? (
                    <div className="search-list-indicator">
                        {isSearchMode ? "No stocks found." : "Type to search for stocks."}
                    </div>
                ):(<ul>
                    <div className="search-count">
                        {isSearchMode ? `Showing ${displayStocks.length} of ${stocks.length} results` : "Showing top 5 stocks"}
                    </div>
                    {displayStocks.map((stock) => (
                        <li key={stock.symbol} className="search-item">
                            <Link href={`/stocks/${stock.symbol}`} onClick={() => handleSelectStock(stock.symbol)} className="search-item-link">
                                <TrendingUp className="h-4 w-4 text-gray-500" />
                                <div className="flex-1">
                                    <div className="search-item-name">{stock.name}</div>
                                    <div className=" text-sm text-gray-500">
                                        {stock.symbol} | {stock.exchange} | {stock.type}
                                    </div>
                                    {stock.isInWatchlist && <span className="watchlist-indicator">In Watchlist</span>}
                                </div>
                            </Link>
                        </li>
                    ))}
                </ul>)}
            </CommandList>
        </CommandDialog>
        </>
    );
};

export default SearchCommand;
