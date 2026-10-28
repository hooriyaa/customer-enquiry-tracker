// modified- preserved copy
"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  type Enquiry,
  type DashboardMetrics,
  type BusinessStatus,
  type EnquiryCategory,
  type CategorizationState,
  BUSINESS_STATUSES,
  CATEGORIES,
  CATEGORIZATION_STATES,
} from "@/lib/types";
import { KpiCards } from "./kpi-cards";
import { BusinessStatusBadge, CategoryBadge, CategorizationStateBadge } from "./badge";
import { MessageModal } from "./message-modal";
import {
  Search,
  Filter,
  RefreshCw,
  RotateCw,
  Eye,
  PlusCircle,
  Inbox,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Mail,
  User,
  SlidersHorizontal,
} from "lucide-react";

export function Dashboard() {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    total: 0,
    newCount: 0,
    inProgressCount: 0,
    resolvedCount: 0,
    failedCategorizationCount: 0,
  });

  // Filters & Search
  const [statusFilter, setStatusFilter] = useState<BusinessStatus | "ALL">("ALL");
  const [categoryFilter, setCategoryFilter] = useState<EnquiryCategory | "ALL">("ALL");
  const [stateFilter, setStateFilter] = useState<CategorizationState | "ALL">("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  // Modal & Retry
  const [selectedEnquiry, setSelectedEnquiry] = useState<Enquiry | null>(null);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<string>("");

  const fetchEnquiries = useCallback(
    async (isManualRefresh = false) => {
      if (isManualRefresh) setIsRefreshing(true);
      setErrorMessage(null);

      try {
        const params = new URLSearchParams();
        if (statusFilter !== "ALL") params.append("status", statusFilter);
        if (categoryFilter !== "ALL") params.append("category", categoryFilter);
        if (stateFilter !== "ALL") params.append("categorizationState", stateFilter);
        if (searchQuery.trim()) params.append("search", searchQuery.trim());

        const res = await fetch(`/api/enquiries?${params.toString()}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to load enquiries");
        }

        setEnquiries(data.enquiries || []);
        if (data.metrics) {
          setMetrics(data.metrics);
        }
        setLastRefreshedAt(new Date().toLocaleTimeString());
      } catch (err: unknown) {
        setErrorMessage(err instanceof Error ? err.message : "Error connecting to server");
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [statusFilter, categoryFilter, stateFilter, searchQuery]
  );

  useEffect(() => {
    fetchEnquiries();
  }, [fetchEnquiries]);

  // Handle business status update
  async function handleStatusChange(id: string, newStatus: BusinessStatus) {
    setUpdatingStatusId(id);
    setActionSuccessMessage(null);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/enquiries/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update status");
      }

      setEnquiries((prev) =>
        prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item))
      );
      if (selectedEnquiry && selectedEnquiry.id === id) {
        setSelectedEnquiry((prev) => (prev ? { ...prev, status: newStatus } : null));
      }

      setActionSuccessMessage(`Updated status to "${newStatus}"`);
      setTimeout(() => setActionSuccessMessage(null), 3500);

      fetchEnquiries();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to update status");
    } finally {
      setUpdatingStatusId(null);
    }
  }

  // Handle AI Categorization Retry
  async function handleRetryCategorization(id: string) {
    setRetryingId(id);
    setActionSuccessMessage(null);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/enquiries/${id}/retry`, {
        method: "POST",
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Retry request failed");
      }

      if (data.enquiry) {
        setEnquiries((prev) =>
          prev.map((item) => (item.id === id ? data.enquiry : item))
        );
        if (selectedEnquiry && selectedEnquiry.id === id) {
          setSelectedEnquiry(data.enquiry);
        }
      }

      if (data.success) {
        setActionSuccessMessage(`AI triage succeeded: Classified as "${data.enquiry.category}"`);
      } else {
        setErrorMessage("AI categorization retry failed again. Record remains safely stored in database.");
      }
      setTimeout(() => setActionSuccessMessage(null), 4000);

      fetchEnquiries();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to execute retry");
    } finally {
      setRetryingId(null);
    }
  }

  function handleResetFilters() {
    setStatusFilter("ALL");
    setCategoryFilter("ALL");
    setStateFilter("ALL");
    setSearchQuery("");
  }

  return (
    <div className="space-y-5 sm:space-y-6 w-full min-w-0 max-w-full">
      {/* Top Header & Executive Actions */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 sm:gap-4 pb-2 border-b border-slate-200/90 w-full min-w-0">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1.5">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-amber-800 bg-amber-500/10 px-2 sm:px-2.5 py-0.5 rounded-full border border-amber-500/20 shrink-0">
              Executive Triage Control
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-[10px] sm:text-xs text-slate-500 font-medium font-mono shrink-0">SQLite WAL Feed</span>
          </div>
          <h1 className="font-serif-title text-xl sm:text-2xl lg:text-3xl font-bold text-slate-950 tracking-tight">
            Customer Enquiry Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Review incoming customer inquiries, inspect automated AI classifications, update handling statuses, and resolve retries.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 sm:gap-2.5 w-full sm:w-auto shrink-0">
          <button
            type="button"
            onClick={() => fetchEnquiries(true)}
            disabled={isRefreshing}
            className="inline-flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-2 sm:py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl text-xs font-semibold shadow-2xs hover:shadow-xs transition-all duration-150 cursor-pointer disabled:opacity-50 min-h-[38px] sm:min-h-[40px]"
            title="Refresh database records"
          >
            <RefreshCw className={`w-3.5 h-3.5 shrink-0 ${isRefreshing ? "animate-spin text-amber-600" : "text-slate-500"}`} />
            <span>{isRefreshing ? "Refreshing..." : "Refresh"}</span>
          </button>

          <Link
            href="/submit"
            className="inline-flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-sm hover:shadow transition-all duration-150 cursor-pointer min-h-[38px] sm:min-h-[40px]"
          >
            <PlusCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>New Enquiry</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <KpiCards
        metrics={metrics}
        activeStatusFilter={statusFilter}
        activeStateFilter={stateFilter}
        onSelectStatusFilter={(s) => setStatusFilter(s)}
        onSelectStateFilter={(st) => setStateFilter(st)}
      />

      {/* Action Notification Toasts */}
      {actionSuccessMessage && (
        <div
          role="status"
          className="p-3.5 sm:p-4 bg-emerald-50/90 border border-emerald-300 rounded-2xl text-emerald-900 text-xs sm:text-sm font-medium flex items-center gap-2.5 shadow-sm animate-in fade-in duration-150"
        >
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{actionSuccessMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div
          role="alert"
          className="p-3.5 sm:p-4 bg-rose-50/90 border border-rose-300 rounded-2xl text-rose-900 text-xs sm:text-sm font-medium flex items-center gap-2.5 shadow-sm animate-in fade-in duration-150"
        >
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Filter and Search Controls Bar */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between w-full min-w-0">
        {/* Search Input */}
        <div className="relative flex-1 w-full lg:max-w-md min-w-0">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search name, email, or message..."
            className="w-full pl-9 pr-10 py-2 sm:py-2.5 rounded-xl border border-slate-300/80 bg-slate-50/50 hover:bg-white text-xs sm:text-sm text-slate-900 placeholder-slate-400 transition-colors focus:bg-white focus:border-slate-900 focus:ring-slate-900 min-h-[40px]"
          />
          <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] text-slate-400 font-mono bg-white border border-slate-200 rounded absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            /
          </kbd>
        </div>

        {/* Filter Dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:flex lg:flex-wrap lg:items-center gap-2 w-full lg:w-auto min-w-0">
          {/* Status Filter */}
          <div className="w-full lg:w-auto min-w-0">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as BusinessStatus | "ALL")}
              className="w-full lg:w-auto px-3 py-2 sm:py-2.5 rounded-xl border border-slate-300/80 bg-white text-xs font-semibold text-slate-700 cursor-pointer shadow-2xs hover:border-slate-400 transition-colors focus:border-slate-900 focus:ring-slate-900 min-h-[40px]"
              aria-label="Filter by business status"
            >
              <option value="ALL">All Statuses</option>
              {BUSINESS_STATUSES.map((s) => (
                <option key={s} value={s}>
                  Status: {s}
                </option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div className="w-full lg:w-auto min-w-0">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as EnquiryCategory | "ALL")}
              className="w-full lg:w-auto px-3 py-2 sm:py-2.5 rounded-xl border border-slate-300/80 bg-white text-xs font-semibold text-slate-700 cursor-pointer shadow-2xs hover:border-slate-400 transition-colors focus:border-slate-900 focus:ring-slate-900 min-h-[40px]"
              aria-label="Filter by category"
            >
              <option value="ALL">All Categories</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  Category: {c}
                </option>
              ))}
            </select>
          </div>

          {/* State Filter */}
          <div className="w-full lg:w-auto min-w-0">
            <select
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value as CategorizationState | "ALL")}
              className="w-full lg:w-auto px-3 py-2 sm:py-2.5 rounded-xl border border-slate-300/80 bg-white text-xs font-semibold text-slate-700 cursor-pointer shadow-2xs hover:border-slate-400 transition-colors focus:border-slate-900 focus:ring-slate-900 min-h-[40px]"
              aria-label="Filter by AI categorization state"
            >
              <option value="ALL">All AI States</option>
              {CATEGORIZATION_STATES.map((st) => (
                <option key={st} value={st}>
                  AI State: {st}
                </option>
              ))}
            </select>
          </div>

          {/* Reset Filters */}
          {(statusFilter !== "ALL" || categoryFilter !== "ALL" || stateFilter !== "ALL" || searchQuery) && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="w-full sm:col-span-3 lg:w-auto text-xs text-amber-700 hover:text-amber-900 font-bold px-3 py-2 rounded-lg hover:bg-amber-50 transition-colors cursor-pointer text-center min-h-[38px] flex items-center justify-center"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Enquiries Listing Container */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden w-full min-w-0 max-w-full">
        {/* Header Bar */}
        <div className="px-3.5 sm:px-5 py-3 sm:py-3.5 border-b border-slate-200/90 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 bg-slate-50/70 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800">
              {enquiries.length} {enquiries.length === 1 ? "Customer Record" : "Customer Records"}
            </span>
            <span className="text-slate-300">|</span>
            <span className="text-slate-500 text-[11px]">Sorted Newest First</span>
          </div>
          {lastRefreshedAt && <span className="font-mono text-[11px] text-slate-400">Last sync: {lastRefreshedAt}</span>}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="p-16 text-center text-slate-500 space-y-3">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-amber-600" />
            <p className="text-sm font-medium">Querying SQLite enquiries database...</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && enquiries.length === 0 && (
          <div className="p-16 text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto border border-slate-200">
              <Inbox className="w-7 h-7 text-slate-400" />
            </div>
            <h3 className="font-serif-title text-lg font-bold text-slate-900">No enquiries found</h3>
            <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
              {searchQuery || statusFilter !== "ALL" || categoryFilter !== "ALL" || stateFilter !== "ALL"
                ? "No customer enquiries match your current search and filter combination. Try adjusting your parameters."
                : "No customer enquiries have been submitted yet. Log a test enquiry from the portal to see it appear here."}
            </p>
            {(searchQuery || statusFilter !== "ALL" || categoryFilter !== "ALL" || stateFilter !== "ALL") && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                Clear all filters
              </button>
            )}
          </div>
        )}

        {/* Desktop Table View */}
        {!isLoading && enquiries.length > 0 && (
          <>
            <div className="hidden lg:block w-full max-w-full overflow-x-auto min-w-0">
              <table className="w-full min-w-[880px] text-left border-collapse">
                {/* Executive Classic Table Header */}
                <thead className="bg-[#0F172A] text-slate-200">
                  <tr className="text-[11px] font-bold uppercase tracking-wider">
                    <th scope="col" className="px-5 py-3.5 text-slate-300">Customer</th>
                    <th scope="col" className="px-5 py-3.5 text-slate-300">Message Preview</th>
                    <th scope="col" className="px-5 py-3.5 text-slate-300">AI Category</th>
                    <th scope="col" className="px-5 py-3.5 text-slate-300">AI State</th>
                    <th scope="col" className="px-5 py-3.5 text-slate-300">Handling Status</th>
                    <th scope="col" className="px-5 py-3.5 text-slate-300">Submitted</th>
                    <th scope="col" className="px-5 py-3.5 text-right text-slate-300">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {enquiries.map((enquiry, idx) => (
                    <tr
                      key={enquiry.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        idx % 2 === 1 ? "bg-slate-50/30" : "bg-white"
                      }`}
                    >
                      {/* Customer Info */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200/90 text-slate-700 flex items-center justify-center font-bold text-xs uppercase shrink-0">
                            {enquiry.name.slice(0, 2)}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 leading-tight">{enquiry.name}</div>
                            <div className="text-xs text-slate-500 font-mono mt-0.5">{enquiry.email}</div>
                          </div>
                        </div>
                      </td>

                      {/* Message Preview */}
                      <td className="px-5 py-4 max-w-xs">
                        <div className="text-slate-700 line-clamp-2 text-xs leading-relaxed font-normal">
                          {enquiry.message}
                        </div>
                      </td>

                      {/* Category Badge */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <CategoryBadge category={enquiry.category} size="sm" />
                      </td>

                      {/* Categorization State */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <CategorizationStateBadge state={enquiry.categorizationState} size="sm" />
                          {enquiry.categorizationState === "Failed" && (
                            <button
                              type="button"
                              onClick={() => handleRetryCategorization(enquiry.id)}
                              disabled={retryingId === enquiry.id}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-300/80 rounded-lg text-xs font-bold transition-all shadow-2xs hover:shadow-xs cursor-pointer disabled:opacity-50"
                              title="Retry AI Categorization for this record"
                            >
                              <RotateCw className={`w-3 h-3 text-rose-600 ${retryingId === enquiry.id ? "animate-spin" : ""}`} />
                              <span>Retry</span>
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Status Selector Dropdown */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <select
                          value={enquiry.status}
                          disabled={updatingStatusId === enquiry.id}
                          onChange={(e) => handleStatusChange(enquiry.id, e.target.value as BusinessStatus)}
                          className={`text-xs font-bold rounded-lg px-2.5 py-1.5 border transition-all cursor-pointer shadow-2xs ${
                            enquiry.status === "New"
                              ? "bg-blue-50/90 text-blue-900 border-blue-200"
                              : enquiry.status === "In Progress"
                              ? "bg-amber-50/90 text-amber-900 border-amber-300"
                              : "bg-emerald-50/90 text-emerald-900 border-emerald-300"
                          }`}
                          aria-label={`Change status for enquiry from ${enquiry.name}`}
                        >
                          {BUSINESS_STATUSES.map((st) => (
                            <option key={st} value={st}>
                              {st}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Submitted Date */}
                      <td className="px-5 py-4 whitespace-nowrap text-xs text-slate-500 font-medium">
                        {new Date(enquiry.createdAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                        })}{" "}
                        <span className="text-slate-400">
                          {new Date(enquiry.createdAt).toLocaleTimeString(undefined, {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 whitespace-nowrap text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedEnquiry(enquiry)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-lg text-xs font-semibold shadow-2xs hover:shadow-xs transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-500" />
                          <span>View</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile & Tablet Card View */}
            <div className="lg:hidden divide-y divide-slate-100 min-w-0 w-full">
              {enquiries.map((enquiry) => (
                <div key={enquiry.id} className="p-3.5 sm:p-5 space-y-3 hover:bg-slate-50/60 transition-colors min-w-0 w-full">
                  {/* Customer Header */}
                  <div className="flex items-start justify-between gap-2 min-w-0">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200/90 text-slate-700 flex items-center justify-center font-bold text-xs uppercase shrink-0">
                        {enquiry.name.slice(0, 2)}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-900 text-sm truncate leading-tight">
                          {enquiry.name}
                        </div>
                        <div className="text-xs text-slate-500 font-mono truncate mt-0.5">
                          {enquiry.email}
                        </div>
                      </div>
                    </div>

                    <div className="text-right text-[11px] sm:text-xs text-slate-500 flex items-center gap-1 shrink-0 pt-0.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>
                        {new Date(enquiry.createdAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Message Preview */}
                  <p className="text-xs text-slate-700 line-clamp-2 bg-slate-50/80 p-2.5 sm:p-3 rounded-xl border border-slate-200/80 leading-relaxed break-words">
                    {enquiry.message}
                  </p>

                  {/* Badges & Operational Actions */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 pt-1 min-w-0">
                    {/* Triage Badges */}
                    <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                      <CategoryBadge category={enquiry.category} size="sm" />
                      <CategorizationStateBadge state={enquiry.categorizationState} size="sm" />
                    </div>

                    {/* Operational Controls */}
                    <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full sm:w-auto justify-end min-w-0">
                      {enquiry.categorizationState === "Failed" && (
                        <button
                          type="button"
                          onClick={() => handleRetryCategorization(enquiry.id)}
                          disabled={retryingId === enquiry.id}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-300 rounded-lg text-xs font-bold transition-colors cursor-pointer disabled:opacity-50 min-h-[36px] shrink-0"
                          title="Retry AI Categorization for this record"
                        >
                          <RotateCw className={`w-3 h-3 text-rose-600 shrink-0 ${retryingId === enquiry.id ? "animate-spin" : ""}`} />
                          <span>Retry</span>
                        </button>
                      )}

                      <select
                        value={enquiry.status}
                        disabled={updatingStatusId === enquiry.id}
                        onChange={(e) => handleStatusChange(enquiry.id, e.target.value as BusinessStatus)}
                        className={`flex-1 sm:flex-initial text-xs font-bold rounded-lg px-2.5 py-1.5 border transition-colors cursor-pointer min-h-[36px] min-w-[100px] max-w-full ${
                          enquiry.status === "New"
                            ? "bg-blue-50 text-blue-900 border-blue-200"
                            : enquiry.status === "In Progress"
                            ? "bg-amber-50 text-amber-900 border-amber-300"
                            : "bg-emerald-50 text-emerald-900 border-emerald-300"
                        }`}
                        aria-label={`Status for ${enquiry.name}`}
                      >
                        {BUSINESS_STATUSES.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>

                      <button
                        type="button"
                        onClick={() => setSelectedEnquiry(enquiry)}
                        className="inline-flex items-center justify-center gap-1 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer min-h-[36px] shrink-0"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span>View</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Message Modal */}
      <MessageModal
        isOpen={!!selectedEnquiry}
        enquiry={selectedEnquiry}
        onClose={() => setSelectedEnquiry(null)}
        onRetry={(id) => handleRetryCategorization(id)}
        isRetrying={retryingId === selectedEnquiry?.id}
      />
    </div>
  );
}
