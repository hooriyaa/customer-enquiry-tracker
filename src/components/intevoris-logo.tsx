// modified- preserved copy
import React from "react";

interface LogoProps {
  className?: string;
  variant?: "light" | "dark";
  size?: "sm" | "md" | "lg";
}

export function IntevorisLogo({ variant = "light", size = "md" }: LogoProps) {
  const isDark = variant === "dark";

  const iconSizes = {
    sm: "w-7 h-7 sm:w-8 sm:h-8",
    md: "w-8 h-8 sm:w-10 sm:h-10",
    lg: "w-10 h-10 sm:w-12 sm:h-12",
  };

  const titleSizes = {
    sm: "text-xs sm:text-sm",
    md: "text-sm sm:text-base md:text-lg",
    lg: "text-lg sm:text-xl md:text-2xl",
  };

  return (
    <div className="flex items-center gap-2.5 sm:gap-3.5 group cursor-pointer min-w-0">
      {/* Bespoke Classic Insignia */}
      <div className={`relative ${iconSizes[size]} shrink-0 flex items-center justify-center rounded-xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 p-2 shadow-md shadow-slate-950/15 border border-slate-700/50 group-hover:border-amber-500/40 transition-all duration-300`}>
        {/* Subtle gold inner accent glow */}
        <div className="absolute inset-0 rounded-xl bg-gradient-to-tr from-transparent via-amber-500/10 to-transparent opacity-80 pointer-events-none" />
        
        {/* SVG Insignia */}
        <svg
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full transform group-hover:scale-105 transition-transform duration-300"
        >
          {/* Hexagonal Shield Facet */}
          <polygon
            points="16,2 29,8.5 29,23.5 16,30 3,23.5 3,8.5"
            stroke="url(#goldGradient)"
            strokeWidth="1.5"
            strokeLinejoin="round"
            fill="rgba(15, 23, 42, 0.6)"
          />
          {/* Neural AI Interlock Lines */}
          <line x1="16" y1="2" x2="16" y2="30" stroke="url(#goldGradient)" strokeWidth="0.75" strokeOpacity="0.4" />
          <line x1="3" y1="8.5" x2="29" y2="23.5" stroke="url(#goldGradient)" strokeWidth="0.75" strokeOpacity="0.3" />
          <line x1="3" y1="23.5" x2="29" y2="8.5" stroke="url(#goldGradient)" strokeWidth="0.75" strokeOpacity="0.3" />
          
          {/* Classic Serif "I" Monogram */}
          <path
            d="M12 9.5H20M16 9.5V22.5M12 22.5H20"
            stroke="#FFFFFF"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          
          {/* AI Golden Node Accents */}
          <circle cx="16" cy="2" r="1.5" fill="#F59E0B" />
          <circle cx="29" cy="8.5" r="1.5" fill="#F59E0B" />
          <circle cx="29" cy="23.5" r="1.5" fill="#F59E0B" />
          <circle cx="16" cy="30" r="1.5" fill="#F59E0B" />
          <circle cx="3" cy="23.5" r="1.5" fill="#F59E0B" />
          <circle cx="3" cy="8.5" r="1.5" fill="#F59E0B" />
          <circle cx="16" cy="16" r="1.8" fill="#F59E0B" />

          {/* Linear Gradient Definitions */}
          <defs>
            <linearGradient id="goldGradient" x1="3" y1="2" x2="29" y2="30" gradientUnits="userSpaceOnUse">
              <stop stopColor="#FDE68A" />
              <stop offset="0.5" stopColor="#D97706" />
              <stop offset="1" stopColor="#B45309" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Classic Wordmark Typography */}
      <div className="flex flex-col min-w-0">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <span
            className={`font-display-brand ${titleSizes[size]} font-bold tracking-[0.12em] sm:tracking-[0.18em] uppercase ${
              isDark ? "text-white" : "text-slate-900"
            }`}
          >
            Intevoris
          </span>
          <span className="hidden min-[360px]:inline-block text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider px-1.5 sm:px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 border border-amber-500/30 shrink-0">
            AI Solutions
          </span>
        </div>
        <span
          className={`text-[11px] tracking-wide font-medium hidden sm:block ${
            isDark ? "text-slate-400" : "text-slate-500"
          }`}
        >
          Customer Enquiry Management &amp; Triage
        </span>
      </div>
    </div>
  );
}
