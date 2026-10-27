// modified- preserved copy
import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { IntevorisLogo } from "@/components/intevoris-logo";
import { LayoutDashboard, PlusCircle, ShieldCheck, Cpu } from "lucide-react";

export const metadata: Metadata = {
  title: "Intevoris AI Solutions — Customer Enquiry Tracker",
  description: "Executive Customer Enquiry Management and Intelligent AI Triage System",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col font-sans antialiased text-slate-900 selection:bg-amber-100 selection:text-amber-900">
        {/* Executive Classic Navigation Bar */}
        <header className="sticky top-0 z-40 bg-[#0B1120] text-white border-b border-slate-800/90 shadow-md backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
            {/* Logo & Brand Emblem */}
            <Link href="/" className="focus:outline-none">
              <IntevorisLogo variant="dark" size="md" />
            </Link>

            {/* Navigation Actions */}
            <nav className="flex items-center gap-3">
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/80 border border-transparent hover:border-slate-700/80 transition-all duration-150"
              >
                <LayoutDashboard className="w-4 h-4 text-slate-400" />
                <span>Dashboard</span>
              </Link>

              <Link
                href="/submit"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-sm shadow-amber-500/10 hover:shadow-md hover:shadow-amber-500/20 transition-all duration-150 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>New Enquiry</span>
              </Link>
            </nav>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          {children}
        </main>

        {/* Executive Classic Footer */}
        <footer className="mt-auto border-t border-slate-200/90 bg-white/80 backdrop-blur-xs py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-amber-600" />
              <span className="font-medium text-slate-700">Intevoris AI Solutions</span>
              <span>— Enterprise Customer Intake &amp; Triage Platform</span>
            </div>
            <div className="flex items-center gap-2 text-slate-400 font-mono text-[11px]">
              <Cpu className="w-3.5 h-3.5 text-slate-400" />
              <span>SQLite Persistent Storage • Port 8787 Microservice</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
