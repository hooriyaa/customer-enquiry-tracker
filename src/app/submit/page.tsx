// modified- preserved copy
import { EnquiryForm } from "@/components/enquiry-form";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function SubmitPage() {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="max-w-2xl mx-auto flex items-center justify-between gap-2 px-1">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors py-1 min-h-[36px]"
        >
          <ArrowLeft className="w-3.5 h-3.5 shrink-0" />
          <span>Back to Dashboard</span>
        </Link>
        <span className="text-[11px] sm:text-xs text-slate-400 font-medium">Customer Support Portal</span>
      </div>

      <EnquiryForm />
    </div>
  );
}
