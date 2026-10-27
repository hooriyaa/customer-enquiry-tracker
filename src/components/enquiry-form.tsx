// modified- preserved copy
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { createEnquirySchema, STRICT_EMAIL_REGEX, type Enquiry } from "@/lib/types";
import { Send, CheckCircle2, AlertCircle, Sparkles, ArrowRight, RefreshCw } from "lucide-react";
import { CategoryBadge, CategorizationStateBadge } from "./badge";

export function EnquiryForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const [fieldErrors, setFieldErrors] = useState<{
    name?: string[];
    email?: string[];
    message?: string[];
  }>({});
  const [generalError, setGeneralError] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedEnquiry, setSubmittedEnquiry] = useState<Enquiry | null>(null);

  // Helper to validate email format in real-time
  function validateEmailFormat(val: string): string | null {
    const trimmed = val.trim();
    if (!trimmed) {
      return "Email is required";
    }
    if (trimmed.length > 255) {
      return "Email is too long";
    }
    if (!STRICT_EMAIL_REGEX.test(trimmed)) {
      return "Please provide a valid email address (e.g. name@domain.com)";
    }
    return null;
  }

  // Quick fill presets for testing
  function handleQuickFill(preset: "sales" | "billing" | "support" | "fail_once" | "invalid_once") {
    setGeneralError(null);
    setFieldErrors({});
    switch (preset) {
      case "sales":
        setName("Sarah Jenkins");
        setEmail("sarah.jenkins@acme-corp.com");
        setMessage("Please send pricing for your automation service.");
        break;
      case "billing":
        setName("David Chen");
        setEmail("david@fintech-ventures.io");
        setMessage("We noticed an unexpected charge on our credit card invoice #INV-4921. Could you check and issue a refund?");
        break;
      case "support":
        setName("Elena Rostova");
        setEmail("elena@techstart.de");
        setMessage("Our dashboard is throwing a 500 error when exporting CSV files. The application crashed during report generation.");
        break;
      case "fail_once":
        setName("Alex Rivera");
        setEmail("alex.rivera@enterprise.org");
        setMessage("[FAIL_ONCE] I have an invoice question.");
        break;
      case "invalid_once":
        setName("Marcus Vance");
        setEmail("marcus@startup.co");
        setMessage("[INVALID_ONCE] My login is broken.");
        break;
    }
  }

  function handleEmailBlur() {
    if (!email) return;
    const error = validateEmailFormat(email);
    if (error) {
      setFieldErrors((prev) => ({ ...prev, email: [error] }));
    } else {
      setFieldErrors((prev) => ({ ...prev, email: undefined }));
    }
  }

  function handleEmailChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setEmail(val);
    if (fieldErrors.email) {
      const error = validateEmailFormat(val);
      if (!error) {
        setFieldErrors((prev) => ({ ...prev, email: undefined }));
      }
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isSubmitting) return;

    setGeneralError(null);
    setFieldErrors({});

    // Client-side strict validation using Zod
    const validation = createEnquirySchema.safeParse({ name, email, message });
    if (!validation.success) {
      const errors = validation.error.flatten().fieldErrors;
      setFieldErrors(errors);
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: validation.data.name,
          email: validation.data.email,
          message: validation.data.message,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.fieldErrors) {
          setFieldErrors(data.fieldErrors);
        } else {
          setGeneralError(data.error || "Failed to submit enquiry. Please check your inputs.");
        }
        setIsSubmitting(false);
        return;
      }

      setSubmittedEnquiry(data.enquiry);
      setName("");
      setEmail("");
      setMessage("");
    } catch (err: unknown) {
      setGeneralError(
        err instanceof Error
          ? `Network error: ${err.message}`
          : "Unable to reach server. Please ensure the application is running."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleReset() {
    setSubmittedEnquiry(null);
    setName("");
    setEmail("");
    setMessage("");
    setFieldErrors({});
    setGeneralError(null);
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Success Notification Banner */}
      {submittedEnquiry && (
        <div className="mb-8 p-6 bg-emerald-50/90 border border-emerald-300 rounded-2xl shadow-sm animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="flex items-start gap-4">
            <div className="p-2.5 bg-emerald-100 text-emerald-800 rounded-xl shrink-0 mt-0.5 border border-emerald-200">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="font-serif-title text-xl font-bold text-emerald-950">
                Enquiry Successfully Logged &amp; Triaged
              </h3>
              <p className="text-sm text-emerald-800 mt-1 leading-relaxed">
                Thank you, <strong>{submittedEnquiry.name}</strong>. Your enquiry has been safely committed to persistent SQLite storage.
              </p>

              <div className="mt-4 p-4 bg-white/90 rounded-xl border border-emerald-200/90 space-y-2.5 text-xs shadow-2xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Tracking Reference:</span>
                  <span className="font-mono text-slate-900 font-semibold">{submittedEnquiry.id}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">AI Categorization:</span>
                  <div className="flex items-center gap-1.5">
                    <CategoryBadge category={submittedEnquiry.category} size="sm" />
                    <CategorizationStateBadge state={submittedEnquiry.categorizationState} size="sm" />
                  </div>
                </div>
                {submittedEnquiry.categorizationState === "Failed" && (
                  <p className="text-amber-800 text-xs mt-1 bg-amber-50 p-2.5 rounded-lg border border-amber-200 leading-relaxed">
                    <strong>Note:</strong> AI auto-categorization was queued for retry due to simulated mock condition. Your enquiry is completely safe and visible in the staff dashboard.
                  </p>
                )}
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs sm:text-sm font-semibold transition-colors cursor-pointer shadow-xs"
                >
                  Submit Another Enquiry
                </button>
                <Link
                  href="/"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold transition-colors shadow-2xs"
                >
                  Go to Business Dashboard
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Form Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-9">
        <div className="mb-6 pb-4 border-b border-slate-100">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-800 border border-amber-500/20 text-[10px] font-bold uppercase tracking-wider mb-2">
            Executive Customer Portal
          </div>
          <h2 className="font-serif-title text-2xl font-bold text-slate-950 tracking-tight">
            Submit Customer Enquiry
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">
            Fill in your details below. All enquiries are categorized automatically by Intevoris AI Categorization and routed to the appropriate department.
          </p>
        </div>

        {/* Quick Fill Testing Presets */}
        <div className="mb-6 p-3.5 bg-slate-50/80 border border-slate-200/80 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              Demo Presets:
            </span>
            <button
              type="button"
              onClick={() => {
                setName("");
                setEmail("");
                setMessage("");
                setFieldErrors({});
                setGeneralError(null);
              }}
              className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer font-medium"
            >
              <RefreshCw className="w-3 h-3" /> Clear
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => handleQuickFill("sales")}
              className="px-2.5 py-1 text-xs font-semibold bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg transition-colors cursor-pointer shadow-2xs"
            >
              Sales Enquiry
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill("billing")}
              className="px-2.5 py-1 text-xs font-semibold bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg transition-colors cursor-pointer shadow-2xs"
            >
              Billing Enquiry
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill("support")}
              className="px-2.5 py-1 text-xs font-semibold bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg transition-colors cursor-pointer shadow-2xs"
            >
              Support Bug
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill("fail_once")}
              className="px-2.5 py-1 text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded-lg transition-colors cursor-pointer"
            >
              [FAIL_ONCE]
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill("invalid_once")}
              className="px-2.5 py-1 text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg transition-colors cursor-pointer"
            >
              [INVALID_ONCE]
            </button>
          </div>
        </div>

        {/* General Error Banner */}
        {generalError && (
          <div
            role="alert"
            className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-sm flex items-start gap-3"
          >
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold">Submission Error</div>
              <div>{generalError}</div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          {/* Full Name */}
          <div>
            <label htmlFor="customer-name" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Full Name <span className="text-rose-500">*</span>
            </label>
            <input
              id="customer-name"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (fieldErrors.name) setFieldErrors((prev) => ({ ...prev, name: undefined }));
              }}
              placeholder="e.g. Jane Doe"
              maxLength={100}
              disabled={isSubmitting}
              aria-invalid={!!fieldErrors.name}
              aria-describedby={fieldErrors.name ? "name-error" : undefined}
              className={`w-full px-4 py-2.5 rounded-xl border text-slate-900 bg-white placeholder-slate-400 text-sm transition-colors ${
                fieldErrors.name
                  ? "border-rose-400 focus:border-rose-500 focus:ring-rose-500 ring-1 ring-rose-400"
                  : "border-slate-300 focus:border-slate-900 focus:ring-slate-900"
              }`}
            />
            {fieldErrors.name && (
              <p id="name-error" className="mt-1.5 text-xs text-rose-600 font-medium flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {fieldErrors.name[0]}
              </p>
            )}
          </div>

          {/* Email Address */}
          <div>
            <label htmlFor="customer-email" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Email Address <span className="text-rose-500">*</span>
            </label>
            <input
              id="customer-email"
              type="text"
              value={email}
              onChange={handleEmailChange}
              onBlur={handleEmailBlur}
              placeholder="e.g. jane@company.com"
              maxLength={255}
              disabled={isSubmitting}
              aria-invalid={!!fieldErrors.email}
              aria-describedby={fieldErrors.email ? "email-error" : undefined}
              className={`w-full px-4 py-2.5 rounded-xl border text-slate-900 bg-white placeholder-slate-400 text-sm transition-colors ${
                fieldErrors.email
                  ? "border-rose-400 focus:border-rose-500 focus:ring-rose-500 ring-1 ring-rose-400"
                  : "border-slate-300 focus:border-slate-900 focus:ring-slate-900"
              }`}
            />
            {fieldErrors.email && (
              <p id="email-error" className="mt-1.5 text-xs text-rose-600 font-medium flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {fieldErrors.email[0]}
              </p>
            )}
          </div>

          {/* Message */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label htmlFor="customer-message" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Message <span className="text-rose-500">*</span>
              </label>
              <span className="text-xs text-slate-400 font-mono">
                {message.length} / 5,000 characters
              </span>
            </div>
            <textarea
              id="customer-message"
              rows={5}
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                if (fieldErrors.message) setFieldErrors((prev) => ({ ...prev, message: undefined }));
              }}
              placeholder="Describe your inquiry, request, or issue with sufficient detail (min 5 characters)..."
              maxLength={5000}
              disabled={isSubmitting}
              aria-invalid={!!fieldErrors.message}
              aria-describedby={fieldErrors.message ? "message-error" : undefined}
              className={`w-full px-4 py-2.5 rounded-xl border text-slate-900 bg-white placeholder-slate-400 text-sm transition-colors resize-y min-h-[120px] ${
                fieldErrors.message
                  ? "border-rose-400 focus:border-rose-500 focus:ring-rose-500 ring-1 ring-rose-400"
                  : "border-slate-300 focus:border-slate-900 focus:ring-slate-900"
              }`}
            />
            {fieldErrors.message && (
              <p id="message-error" className="mt-1.5 text-xs text-rose-600 font-medium flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {fieldErrors.message[0]}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white rounded-xl text-sm font-semibold shadow-sm hover:shadow-md transition-all duration-150 cursor-pointer disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
                  <span>Submitting &amp; Processing AI...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 text-amber-400" />
                  <span>Submit Customer Enquiry</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
