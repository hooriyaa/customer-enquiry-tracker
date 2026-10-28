// modified- preserved copy
import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "./globals.css";
import { IntevorisLogo } from "@/components/intevoris-logo";
import { LayoutDashboard, PlusCircle, ShieldCheck, Cpu } from "lucide-react";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "Intevoris AI Solutions — Customer Enquiry Tracker",
  description: "Executive Customer Enquiry Management and Intelligent AI Triage System",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col font-sans antialiased text-slate-900 selection:bg-amber-100 selection:text-amber-900 overflow-x-hidden w-full max-w-full">
        {/* Executive Classic Navigation Bar */}
        <header className="sticky top-0 z-40 bg-[#0B1120] text-white border-b border-slate-800/90 shadow-md backdrop-blur-md w-full">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-2 min-w-0">
            {/* Logo & Brand Emblem */}
            <Link href="/" className="focus:outline-none shrink min-w-0" aria-label="Intevoris AI Solutions Home">
              <IntevorisLogo variant="dark" size="md" />
            </Link>

            {/* Navigation Actions */}
            <nav className="flex items-center gap-1.5 sm:gap-3 shrink-0">
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2.5 rounded-xl text-xs sm:text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/80 border border-transparent hover:border-slate-700/80 transition-all duration-150"
                title="Go to Dashboard"
              >
                <LayoutDashboard className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="hidden sm:inline">Dashboard</span>
              </Link>

              <Link
                href="/submit"
                className="inline-flex items-center gap-1.5 px-2.5 sm:px-4 py-1.5 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-sm shadow-amber-500/10 hover:shadow-md hover:shadow-amber-500/20 transition-all duration-150 cursor-pointer shrink-0"
              >
                <PlusCircle className="w-4 h-4 shrink-0" />
                <span>
                  <span className="inline">New</span>
                  <span className="hidden sm:inline"> Enquiry</span>
                </span>
              </Link>
            </nav>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8 lg:py-10 min-w-0">
          {children}
        </main>

        {/* Executive Classic Footer */}
        <footer className="mt-auto border-t border-slate-200/90 bg-white/80 backdrop-blur-xs py-5 sm:py-7 w-full">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs text-slate-500 text-center sm:text-left min-w-0">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
              <span className="font-medium text-slate-700">Intevoris AI Solutions</span>
              <span className="hidden sm:inline">— Customer Enquiry Platform</span>
            </div>
            <div className="flex items-center gap-2 text-slate-400 font-mono text-[11px]">
              <Cpu className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>SQLite Persistence • Microservice Port 8787</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
