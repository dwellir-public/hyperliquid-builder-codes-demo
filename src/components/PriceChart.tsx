"use client";

import { useRef, useEffect, useState } from "react";
import {
  createChart,
  type IChartApi,
  type ISeriesApi,
  type CandlestickData,
  ColorType,
  CandlestickSeries,
} from "lightweight-charts";
import { useCandleData } from "@/hooks/useCandleData";

const INTERVALS = ["1h", "4h", "1d"] as const;

interface PriceChartProps {
  coin: string;
}

export default function PriceChart({ coin }: PriceChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const chartCoinRef = useRef<string>("");
  const chartIntervalRef = useRef<string>("");
  const [interval, setInterval] = useState<string>("1h");
  const { data: candles, isLoading } = useCandleData(coin, interval);

  // Single effect: create chart when data arrives, update on live ticks
  useEffect(() => {
    if (!chartContainerRef.current || !candles || candles.length === 0) return;

    // If coin/interval changed (or first load), destroy old chart and create new one
    if (
      !chartRef.current ||
      chartCoinRef.current !== coin ||
      chartIntervalRef.current !== interval
    ) {
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
        seriesRef.current = null;
      }

      const chart = createChart(chartContainerRef.current, {
        layout: {
          background: { type: ColorType.Solid, color: "#0d1117" },
          textColor: "#8b949e",
        },
        grid: {
          vertLines: { color: "#21262d" },
          horzLines: { color: "#21262d" },
        },
        width: chartContainerRef.current.clientWidth,
        height: 300,
        timeScale: {
          borderColor: "#30363d",
          timeVisible: true,
        },
        rightPriceScale: {
          borderColor: "#30363d",
        },
        crosshair: {
          horzLine: { color: "#50fa7b33" },
          vertLine: { color: "#50fa7b33" },
        },
      });

      const candleSeries = chart.addSeries(CandlestickSeries, {
        upColor: "#50fa7b",
        downColor: "#ff5555",
        borderDownColor: "#ff5555",
        borderUpColor: "#50fa7b",
        wickDownColor: "#ff5555",
        wickUpColor: "#50fa7b",
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      candleSeries.setData(candles as any);
      chart.timeScale().fitContent();

      chartRef.current = chart;
      seriesRef.current = candleSeries;
      chartCoinRef.current = coin;
      chartIntervalRef.current = interval;
      return;
    }

    // Live update: just update the last candle
    const lastCandle = candles[candles.length - 1];
    seriesRef.current!.update(lastCandle as unknown as CandlestickData);
  }, [candles, coin, interval]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      chartRef.current?.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, []);

  // Resize handler
  useEffect(() => {
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1">
        {INTERVALS.map((iv) => (
          <button
            key={iv}
            onClick={() => setInterval(iv)}
            className={`px-2 py-0.5 text-xs rounded ${
              interval === iv
                ? "bg-hl-green/20 text-hl-green"
                : "text-hl-muted hover:text-white"
            }`}
          >
            {iv}
          </button>
        ))}
        <span className="ml-auto text-xs text-hl-muted">
          {coin}/USD
        </span>
      </div>
      <div
        ref={chartContainerRef}
        className="rounded-lg overflow-hidden border border-hl-border"
      >
        {isLoading && !chartRef.current && (
          <div className="h-[300px] flex items-center justify-center text-hl-muted text-sm">
            Loading chart...
          </div>
        )}
      </div>
    </div>
  );
}
