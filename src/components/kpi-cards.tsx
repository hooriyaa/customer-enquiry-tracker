// modified- preserved copy
import React from "react";
import { type DashboardMetrics, type BusinessStatus, type CategorizationState } from "@/lib/types";
import { Inbox, Sparkles, Clock, CheckCircle2, AlertOctagon } from "lucide-react";

interface KpiCardsProps {
  metrics: DashboardMetrics;
  activeStatusFilter?: BusinessStatus | "ALL";
  activeStateFilter?: CategorizationState | "ALL";
  onSelectStatusFilter: (status: BusinessStatus | "ALL") => void;
  onSelectStateFilter: (state: CategorizationState | "ALL") => void;
}

export function KpiCards({
  metrics,
  activeStatusFilter = "ALL",
  activeStateFilter = "ALL",
  onSelectStatusFilter,
  onSelectStateFilter,
}: KpiCardsProps) {
  const isTotalActive = activeStatusFilter === "ALL" && activeStateFilter === "ALL";
  const isNewActive = activeStatusFilter === "New";
  const isInProgressActive = activeStatusFilter === "In Progress";
  const isResolvedActive = activeStatusFilter === "Resolved";
  const isRetryActive = activeStateFilter === "Failed";

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5 sm:gap-4">
      {/* 1. Total Enquiries Card */}
      <button
        type="button"
        onClick={() => {
          onSelectStatusFilter("ALL");
          onSelectStateFilter("ALL");
        }}
        className={`relative text-left p-4 sm:p-5 rounded-2xl border transition-all duration-200 cursor-pointer overflow-hidden ${
          isTotalActive
            ? "bg-gradient-to-b from-white to-slate-50/80 border-slate-900 ring-2 ring-slate-900/10 shadow-md"
            : "bg-white border-slate-200/90 hover:border-slate-300 shadow-xs hover:shadow-md hover:-translate-y-0.5"
        }`}
      >
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-slate-700 via-slate-900 to-slate-800" />
        <div className="flex items-center justify-between text-slate-500 mb-2.5">
          <span className="text-[11px] font-bold tracking-wider uppercase text-slate-600">Total Enquiries</span>
          <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700">
            <Inbox className="w-4 h-4" />
          </div>
        </div>
        <div className="text-3xl font-extrabold text-slate-950 font-serif-title tracking-tight">{metrics.total}</div>
        <div className="flex items-center gap-1.5 mt-2">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
          <p className="text-[11px] text-slate-500 font-medium">All logged requests</p>
        </div>
      </button>

      {/* 2. New Card */}
      <button
        type="button"
        onClick={() => {
          onSelectStatusFilter("New");
          onSelectStateFilter("ALL");
        }}
        className={`relative text-left p-4 sm:p-5 rounded-2xl border transition-all duration-200 cursor-pointer overflow-hidden ${
          isNewActive
            ? "bg-gradient-to-b from-sky-50/40 to-white border-blue-600 ring-2 ring-blue-600/15 shadow-md"
            : "bg-white border-slate-200/90 hover:border-slate-300 shadow-xs hover:shadow-md hover:-translate-y-0.5"
        }`}
      >
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-500 to-sky-400" />
        <div className="flex items-center justify-between text-slate-500 mb-2.5">
          <span className="text-[11px] font-bold tracking-wider uppercase text-blue-900">New Intake</span>
          <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center text-blue-700">
            <Sparkles className="w-4 h-4" />
          </div>
        </div>
        <div className="text-3xl font-extrabold text-slate-950 font-serif-title tracking-tight">{metrics.newCount}</div>
        <div className="flex items-center gap-1.5 mt-2">
          <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />
          <p className="text-[11px] text-blue-700 font-medium">Awaiting review</p>
        </div>
      </button>

      {/* 3. In Progress Card */}
      <button
        type="button"
        onClick={() => {
          onSelectStatusFilter("In Progress");
          onSelectStateFilter("ALL");
        }}
        className={`relative text-left p-4 sm:p-5 rounded-2xl border transition-all duration-200 cursor-pointer overflow-hidden ${
          isInProgressActive
            ? "bg-gradient-to-b from-amber-50/40 to-white border-amber-500 ring-2 ring-amber-500/15 shadow-md"
            : "bg-white border-slate-200/90 hover:border-slate-300 shadow-xs hover:shadow-md hover:-translate-y-0.5"
        }`}
      >
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-500 to-yellow-400" />
        <div className="flex items-center justify-between text-slate-500 mb-2.5">
          <span className="text-[11px] font-bold tracking-wider uppercase text-amber-900">In Progress</span>
          <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center text-amber-700">
            <Clock className="w-4 h-4" />
          </div>
        </div>
        <div className="text-3xl font-extrabold text-slate-950 font-serif-title tracking-tight">{metrics.inProgressCount}</div>
        <div className="flex items-center gap-1.5 mt-2">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          <p className="text-[11px] text-amber-800 font-medium">Active handling</p>
        </div>
      </button>

      {/* 4. Resolved Card */}
      <button
        type="button"
        onClick={() => {
          onSelectStatusFilter("Resolved");
          onSelectStateFilter("ALL");
        }}
        className={`relative text-left p-4 sm:p-5 rounded-2xl border transition-all duration-200 cursor-pointer overflow-hidden ${
          isResolvedActive
            ? "bg-gradient-to-b from-emerald-50/40 to-white border-emerald-600 ring-2 ring-emerald-600/15 shadow-md"
            : "bg-white border-slate-200/90 hover:border-slate-300 shadow-xs hover:shadow-md hover:-translate-y-0.5"
        }`}
      >
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-400" />
        <div className="flex items-center justify-between text-slate-500 mb-2.5">
          <span className="text-[11px] font-bold tracking-wider uppercase text-emerald-900">Resolved</span>
          <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-700">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
        <div className="text-3xl font-extrabold text-slate-950 font-serif-title tracking-tight">{metrics.resolvedCount}</div>
        <div className="flex items-center gap-1.5 mt-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <p className="text-[11px] text-emerald-800 font-medium">Successfully closed</p>
        </div>
      </button>

      {/* 5. AI Needs Retry Card */}
      <button
        type="button"
        onClick={() => {
          onSelectStatusFilter("ALL");
          onSelectStateFilter("Failed");
        }}
        className={`col-span-2 md:col-span-1 relative text-left p-4 sm:p-5 rounded-2xl border transition-all duration-200 cursor-pointer overflow-hidden ${
          isRetryActive
            ? "bg-gradient-to-b from-rose-50/60 to-white border-rose-600 ring-2 ring-rose-600/15 shadow-md"
            : "bg-white border-slate-200/90 hover:border-slate-300 shadow-xs hover:shadow-md hover:-translate-y-0.5"
        }`}
      >
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-rose-500 to-red-600" />
        <div className="flex items-center justify-between text-slate-500 mb-2.5">
          <span className="text-[11px] font-bold tracking-wider uppercase text-rose-900">AI Needs Retry</span>
          <div className="w-7 h-7 rounded-lg bg-rose-50 flex items-center justify-center text-rose-700">
            <AlertOctagon className="w-4 h-4" />
          </div>
        </div>
        <div className="text-3xl font-extrabold text-rose-950 font-serif-title tracking-tight">{metrics.failedCategorizationCount}</div>
        <div className="flex items-center gap-1.5 mt-2">
          <span className={`w-1.5 h-1.5 rounded-full ${metrics.failedCategorizationCount > 0 ? "bg-rose-500 animate-ping" : "bg-slate-300"}`} />
          <p className="text-[11px] text-rose-700 font-medium">
            {metrics.failedCategorizationCount > 0 ? "Action required" : "All categorized"}
          </p>
        </div>
      </button>
    </div>
  );
}
