import TradingViewWidget from '@/components/TradingViewWidget';
import WatchlistButton from '@/components/WatchlistButton';
import { getWatchlistStatus } from '@/lib/actions/watchlist.actions';
import {
    BASELINE_WIDGET_CONFIG,
    CANDLE_CHART_WIDGET_CONFIG,
    COMPANY_FINANCIALS_WIDGET_CONFIG,
    COMPANY_PROFILE_WIDGET_CONFIG,
    SYMBOL_INFO_WIDGET_CONFIG,
    TECHNICAL_ANALYSIS_WIDGET_CONFIG,
} from '@/lib/constants';

/** Base URL shared by every TradingView embedded widget script. */
const WIDGET_SCRIPT_BASE = 'https://s3.tradingview.com/external-embedding/embed-widget-';

/**
 * StockDetails page — `/stocks/[symbol]`
 *
 * Renders a responsive two-column layout for a single stock:
 *
 * Left column (charts)
 *   1. Symbol Info  — key quote data bar
 *   2. Candle Chart — OHLCV candlestick chart
 *   3. Baseline     — price vs baseline chart
 *
 * Right column (analysis)
 *   1. WatchlistButton   — add / remove from watchlist
 *   2. Technical Analysis — oscillators & moving-average summary
 *   3. Company Profile   — fundamentals overview
 *   4. Financials        — income / balance-sheet summary
 */
const StockDetails = async ({ params }: StockDetailsPageProps) => {
    const { symbol } = await params;
    const upperSymbol = symbol.toUpperCase();
    const isInWatchlist = await getWatchlistStatus(upperSymbol);

    return (
        <div className="min-h-screen p-4 md:p-8 ">
            {/* ── Two-column responsive grid ─────────────────────────────── */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

                {/* ── LEFT: charts (2/3 width) ───────────────────────────── */}
                <div className="flex flex-col gap-6 xl:col-span-2">
                    {/* 1. Symbol info bar */}
                    <TradingViewWidget
                        scriptUrl={`${WIDGET_SCRIPT_BASE}symbol-info.js`}
                        config={SYMBOL_INFO_WIDGET_CONFIG(upperSymbol)}
                        height={SYMBOL_INFO_WIDGET_CONFIG(upperSymbol).height as number}
                    />

                    {/* 2. Candlestick chart */}
                    <TradingViewWidget
                        title="Price Chart"
                        scriptUrl={`${WIDGET_SCRIPT_BASE}advanced-chart.js`}
                        config={CANDLE_CHART_WIDGET_CONFIG(upperSymbol)}
                        height={CANDLE_CHART_WIDGET_CONFIG(upperSymbol).height as number}
                    />

                    {/* 3. Baseline chart */}
                    <TradingViewWidget
                        title="Baseline Chart"
                        scriptUrl={`${WIDGET_SCRIPT_BASE}advanced-chart.js`}
                        config={BASELINE_WIDGET_CONFIG(upperSymbol)}
                        height={BASELINE_WIDGET_CONFIG(upperSymbol).height as number}
                    />
                </div>

                {/* ── RIGHT: analysis & fundamentals (1/3 width) ─────────── */}
                <div className="flex flex-col gap-6 xl:col-span-1">

                    {/* Watchlist toggle */}
                    <WatchlistButton
                        symbol={upperSymbol}
                        company={upperSymbol}
                        isInWatchlist={isInWatchlist}
                    />

                    {/* 4. Technical analysis gauge */}
                    <TradingViewWidget
                        title="Technical Analysis"
                        scriptUrl={`${WIDGET_SCRIPT_BASE}technical-analysis.js`}
                        config={TECHNICAL_ANALYSIS_WIDGET_CONFIG(upperSymbol)}
                        height={TECHNICAL_ANALYSIS_WIDGET_CONFIG(upperSymbol).height as number}
                    />

                    {/* 5. Company profile */}
                    <TradingViewWidget
                        title="Company Profile"
                        scriptUrl={`${WIDGET_SCRIPT_BASE}symbol-profile.js`}
                        config={COMPANY_PROFILE_WIDGET_CONFIG(upperSymbol)}
                        height={COMPANY_PROFILE_WIDGET_CONFIG(upperSymbol).height as number}
                    />

                    {/* 6. Financials */}
                    <TradingViewWidget
                        title="Financials"
                        scriptUrl={`${WIDGET_SCRIPT_BASE}financials.js`}
                        config={COMPANY_FINANCIALS_WIDGET_CONFIG(upperSymbol)}
                        height={COMPANY_FINANCIALS_WIDGET_CONFIG(upperSymbol).height as number}
                    />
                </div>

            </div>
        </div>
    );
};

export default StockDetails;
