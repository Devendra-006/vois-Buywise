"use client";

import React from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  CartesianGrid
} from "recharts";
import { PriceVerdict, PriceSnapshot } from "@buywise/shared";
import { TrendingDown, TrendingUp, Minus, Calendar, Database } from "lucide-react";

interface PriceHistoryChartProps {
  productTitle: string;
  verdict: PriceVerdict;
  snapshots: PriceSnapshot[];
}

export const PriceHistoryChart: React.FC<PriceHistoryChartProps> = ({
  productTitle,
  verdict,
  snapshots
}) => {
  // Format snapshot dates for chart axis
  const chartData = (snapshots || []).map(s => {
    const d = new Date(s.fetchedAt);
    const dateFormatted = d.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
    return {
      date: dateFormatted,
      price: s.price,
      store: s.store
    };
  });

  const hasEnoughHistory = verdict.verdict !== "insufficient_history" && chartData.length >= 5;

  return (
    <div className="w-full bg-surface border border-border rounded-lg p-5 sm:p-6 shadow-sm">
      {/* Chart Top Header & Verdict Badge */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-border">
        <div>
          <h3 className="font-serif font-bold text-lg text-ink">
            Price History & Fair Value Verdict
          </h3>
          <p className="text-xs text-ink-secondary mt-0.5 line-clamp-1">
            Tracking pricing trajectory for {productTitle}
          </p>
        </div>

        {/* Verdict Badge */}
        <div className="flex items-center gap-2">
          <div
            className={`px-3 py-1.5 rounded flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider ${
              verdict.verdict === "good_price"
                ? "bg-brand-green-light text-brand-green border border-brand-green/30"
                : verdict.verdict === "wait"
                ? "bg-brand-amber-light text-brand-amber border border-brand-amber/30"
                : "bg-background text-ink-secondary border border-border"
            }`}
          >
            {verdict.verdict === "good_price" && <TrendingDown className="w-4 h-4 text-brand-green" />}
            {verdict.verdict === "wait" && <TrendingUp className="w-4 h-4 text-brand-amber" />}
            {verdict.verdict === "fair_price" && <Minus className="w-4 h-4 text-ink-secondary" />}
            <span>{verdict.label}</span>
          </div>
        </div>
      </div>

      {/* Honest Explanatory Banner */}
      <div className="bg-background rounded p-3 mb-5 border border-border flex items-start gap-3 text-xs">
        <div className="p-1 rounded bg-surface border border-border text-ink-muted">
          <Database className="w-4 h-4" />
        </div>
        <div className="flex-1">
          <p className="font-medium text-ink">
            {verdict.explanation}
          </p>
          <div className="flex items-center gap-3 text-[11px] text-ink-muted mt-1 font-mono">
            <span>Points: {verdict.snapshotsCount} snapshots</span>
            <span>&bull;</span>
            <span>Recorded over: {verdict.historyDays} days</span>
            {verdict.medianPrice90d && (
              <>
                <span>&bull;</span>
                <span>90-Day Median: ₹{verdict.medianPrice90d.toLocaleString("en-IN")}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Chart Canvas */}
      {hasEnoughHistory ? (
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 15, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E7E2DA" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: "#5C574F" }}
                stroke="#E7E2DA"
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#5C574F" }}
                stroke="#E7E2DA"
                tickFormatter={(val) => `₹${val.toLocaleString("en-IN")}`}
                domain={["dataMin - 200", "dataMax + 200"]}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-surface border border-border p-2.5 rounded shadow-sm text-xs font-sans">
                        <span className="font-semibold text-ink block">{data.date}</span>
                        <span className="text-brand-green font-mono font-bold block mt-0.5">
                          ₹{data.price.toLocaleString("en-IN")}
                        </span>
                        <span className="text-[10px] text-ink-muted block mt-0.5">
                          Store: {data.store}
                        </span>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              {verdict.medianPrice90d && (
                <ReferenceLine
                  y={verdict.medianPrice90d}
                  stroke="#B7791F"
                  strokeDasharray="4 4"
                  label={{
                    value: `Median: ₹${verdict.medianPrice90d.toLocaleString("en-IN")}`,
                    fill: "#B7791F",
                    fontSize: 10,
                    position: "insideTopRight"
                  }}
                />
              )}
              <Line
                type="monotone"
                dataKey="price"
                stroke="#1F6F54"
                strokeWidth={2.5}
                dot={{ r: 3, fill: "#1F6F54" }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="h-44 flex flex-col items-center justify-center border border-dashed border-border rounded bg-background/50 text-center p-4">
          <Calendar className="w-8 h-8 text-ink-muted mb-2 stroke-1" />
          <h4 className="font-medium text-sm text-ink mb-1">
            Historical Snapshots Still Accumulating
          </h4>
          <p className="text-xs text-ink-muted max-w-sm">
            We require at least 5 price observations across 14+ days before publishing a historical trend chart and confidence verdict.
          </p>
        </div>
      )}
    </div>
  );
};
