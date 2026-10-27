import { EnquiryForm } from "@/components/enquiry-form";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function SubmitPage() {
  return (
    <div className="space-y-6">
      <div className="max-w-2xl mx-auto flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Dashboard
        </Link>
        <span className="text-xs text-slate-400">Customer Support Portal</span>
      </div>

      <EnquiryForm />
    </div>
  );
}
