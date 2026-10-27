// modified- preserved copy
import React from "react";
import { type BusinessStatus, type EnquiryCategory, type CategorizationState } from "@/lib/types";
import { CheckCircle2, Clock, AlertTriangle, HelpCircle, Tag, ShieldAlert } from "lucide-react";

interface StatusBadgeProps {
  status: BusinessStatus;
  size?: "sm" | "md";
}

export function BusinessStatusBadge({ status, size = "md" }: StatusBadgeProps) {
  const sizeClasses = size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs font-semibold";

  switch (status) {
    case "New":
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full bg-blue-50/90 text-blue-900 border border-blue-200/80 shadow-2xs ${sizeClasses}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-blue-600 ring-2 ring-blue-400/20" />
          New
        </span>
      );
    case "In Progress":
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full bg-amber-50/90 text-amber-900 border border-amber-300/70 shadow-2xs ${sizeClasses}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 ring-2 ring-amber-400/30 animate-pulse" />
          In Progress
        </span>
      );
    case "Resolved":
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full bg-emerald-50/90 text-emerald-900 border border-emerald-300/70 shadow-2xs ${sizeClasses}`}
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
          Resolved
        </span>
      );
    default:
      return (
        <span className={`inline-flex items-center rounded-full bg-slate-100 text-slate-800 border border-slate-200 ${sizeClasses}`}>
          {status}
        </span>
      );
  }
}

interface CategoryBadgeProps {
  category: EnquiryCategory | null | undefined;
  size?: "sm" | "md";
}

export function CategoryBadge({ category, size = "md" }: CategoryBadgeProps) {
  const sizeClasses = size === "sm" ? "px-2.5 py-0.5 text-[11px]" : "px-3 py-1 text-xs font-semibold";

  if (!category) {
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full bg-slate-100/80 text-slate-500 border border-dashed border-slate-300 ${sizeClasses}`}>
        <HelpCircle className="w-3 h-3 text-slate-400" />
        Unassigned
      </span>
    );
  }

  switch (category) {
    case "Sales":
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full bg-indigo-50/90 text-indigo-950 border border-indigo-200/90 shadow-2xs ${sizeClasses}`}>
          <Tag className="w-3 h-3 text-indigo-600" />
          <span className="font-semibold tracking-wide">Sales</span>
        </span>
      );
    case "Billing":
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full bg-teal-50/90 text-teal-950 border border-teal-200/90 shadow-2xs ${sizeClasses}`}>
          <Tag className="w-3 h-3 text-teal-600" />
          <span className="font-semibold tracking-wide">Billing</span>
        </span>
      );
    case "Support":
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full bg-purple-50/90 text-purple-950 border border-purple-200/90 shadow-2xs ${sizeClasses}`}>
          <Tag className="w-3 h-3 text-purple-600" />
          <span className="font-semibold tracking-wide">Support</span>
        </span>
      );
    case "Other":
    default:
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full bg-slate-100 text-slate-800 border border-slate-300/80 shadow-2xs ${sizeClasses}`}>
          <Tag className="w-3 h-3 text-slate-600" />
          <span className="font-semibold tracking-wide">{category}</span>
        </span>
      );
  }
}

interface StateBadgeProps {
  state: CategorizationState;
  size?: "sm" | "md";
}

export function CategorizationStateBadge({ state, size = "md" }: StateBadgeProps) {
  const sizeClasses = size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs font-semibold";

  switch (state) {
    case "Completed":
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full bg-emerald-50 text-emerald-900 border border-emerald-200 ${sizeClasses}`}>
          <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
          <span>Completed</span>
        </span>
      );
    case "Failed":
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full bg-rose-50 text-rose-900 border border-rose-200 shadow-2xs ${sizeClasses}`}>
          <ShieldAlert className="w-3.5 h-3.5 text-rose-600 shrink-0" />
          <span>Needs Retry</span>
        </span>
      );
    case "Pending":
    default:
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full bg-amber-50 text-amber-900 border border-amber-200 ${sizeClasses}`}>
          <Clock className="w-3 h-3 text-amber-600 animate-spin shrink-0" />
          <span>Pending</span>
        </span>
      );
  }
}
