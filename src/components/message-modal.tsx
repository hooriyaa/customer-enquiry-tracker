// modified- preserved copy
import React, { useEffect } from "react";
import { type Enquiry } from "@/lib/types";
import { BusinessStatusBadge, CategoryBadge, CategorizationStateBadge } from "./badge";
import { X, Calendar, Mail, User, RotateCw, FileText } from "lucide-react";

interface MessageModalProps {
  enquiry: Enquiry | null;
  isOpen: boolean;
  onClose: () => void;
  onRetry?: (id: string) => void;
  isRetrying?: boolean;
}

export function MessageModal({
  enquiry,
  isOpen,
  onClose,
  onRetry,
  isRetrying = false,
}: MessageModalProps) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    }
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "auto";
    };
  }, [isOpen, onClose]);

  if (!isOpen || !enquiry) return null;

  const formattedDate = new Date(enquiry.createdAt).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm transition-opacity duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 flex flex-col animate-in fade-in zoom-in-95 duration-150 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Executive Dark Header */}
        <div className="flex items-center justify-between p-5 bg-[#0F172A] text-white border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-amber-400 border border-slate-700">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 id="modal-title" className="font-serif-title text-base sm:text-lg font-bold text-white tracking-tight">
                Customer Enquiry Dossier
              </h2>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5">Ref: {enquiry.id}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Metadata Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 p-4 bg-slate-50/90 rounded-xl border border-slate-200/90">
            <div className="flex items-center gap-2.5 text-sm text-slate-700">
              <User className="w-4 h-4 text-slate-400 shrink-0" />
              <div>
                <div className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Customer Name</div>
                <div className="font-semibold text-slate-950 mt-0.5">{enquiry.name}</div>
              </div>
            </div>

            <div className="flex items-center gap-2.5 text-sm text-slate-700">
              <Mail className="w-4 h-4 text-slate-400 shrink-0" />
              <div>
                <div className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Contact Email</div>
                <a
                  href={`mailto:${enquiry.email}`}
                  className="font-medium text-amber-700 hover:underline font-mono text-xs mt-0.5 block"
                >
                  {enquiry.email}
                </a>
              </div>
            </div>

            <div className="flex items-center gap-2.5 text-sm text-slate-700">
              <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
              <div>
                <div className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Submitted Timestamp</div>
                <div className="text-slate-800 font-medium text-xs mt-0.5">{formattedDate}</div>
              </div>
            </div>

            <div>
              <div className="text-[11px] text-slate-500 font-bold uppercase tracking-wider mb-1">Status &amp; Triage</div>
              <div className="flex flex-wrap items-center gap-1.5">
                <BusinessStatusBadge status={enquiry.status} size="sm" />
                <CategoryBadge category={enquiry.category} size="sm" />
                <CategorizationStateBadge state={enquiry.categorizationState} size="sm" />
              </div>
            </div>
          </div>

          {/* Full Message */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">Original Message Payload</h3>
            <div className="p-4 bg-slate-50/60 rounded-xl border border-slate-200 text-slate-900 text-sm leading-relaxed whitespace-pre-wrap select-text font-normal">
              {enquiry.message}
            </div>
          </div>

          {/* AI Categorization State Note */}
          {enquiry.categorizationState === "Failed" && (
            <div className="p-4 bg-rose-50/80 border border-rose-300 rounded-xl flex items-start justify-between gap-3 shadow-2xs">
              <div>
                <div className="text-sm font-bold text-rose-950">
                  AI Categorization Interrupted
                </div>
                <p className="text-xs text-rose-800 mt-0.5 leading-relaxed">
                  The mock AI triage service was unable to complete classification on this attempt. You can re-trigger categorization at any time without duplicating this enquiry.
                </p>
              </div>
              {onRetry && (
                <button
                  type="button"
                  onClick={() => onRetry(enquiry.id)}
                  disabled={isRetrying}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer shrink-0"
                >
                  <RotateCw className={`w-3.5 h-3.5 ${isRetrying ? "animate-spin" : ""}`} />
                  {isRetrying ? "Retrying..." : "Retry AI"}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/80 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs sm:text-sm font-semibold transition-colors cursor-pointer shadow-xs"
          >
            Close Dossier
          </button>
        </div>
      </div>
    </div>
  );
}
