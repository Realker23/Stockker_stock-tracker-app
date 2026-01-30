
"use client";

import useTradingViewWidget from '@/hooks/useTradingViewWidget';
import { cn } from '@/lib/utils';
import React, { useRef, memo } from 'react';

interface TradingViewWidgetProps {
    title?: string;
    scriptUrl: string;
    config: Record<string, unknown>;
    height?: number;
    className?: string;
}

function TradingViewWidget({title,scriptUrl,config, height=600,className}: TradingViewWidgetProps) {
  const containerRef = useTradingViewWidget(scriptUrl, config, height);

  

  return (
    <div className="w-full">
      {title && <h2 className="text-gray-300 text-lg font-semibold mb-4">{title}</h2>}
      <div className={cn('tradingview-widget-container', className)} ref={containerRef}>
        <div className="tradingview-widget-container__widget" style={{ height, width: "100%" }}></div>
        <div className="tradingview-widget-copyright"><a href="https://www.tradingview.com/symbols/NASDAQ-AAPL/" rel="noopener nofollow" target="_blank"><span className="blue-text">AAPL stock chart</span></a><span className="trademark"> by TradingView</span></div>
      </div>

    </div>
    
  );
}

export default memo(TradingViewWidget);
