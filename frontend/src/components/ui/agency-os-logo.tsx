import React from "react";

type AgencyOsLogoProps = {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "full" | "icon" | "horizontal";
  showSubtitle?: boolean;
};

export function AgencyOsLogoIcon({ className = "size-8" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="aRibbonGrad1" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#00C2FF" />
          <stop offset="40%" stopColor="#0052FF" />
          <stop offset="75%" stopColor="#6366F1" />
          <stop offset="100%" stopColor="#A855F7" />
        </linearGradient>

        <linearGradient id="aRibbonGrad2" x1="20%" y1="0%" x2="80%" y2="100%">
          <stop offset="0%" stopColor="#0038FF" />
          <stop offset="50%" stopColor="#4F46E5" />
          <stop offset="100%" stopColor="#9333EA" />
        </linearGradient>

        <linearGradient id="aRibbonGrad3" x1="100%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#38BDF8" />
          <stop offset="60%" stopColor="#2563EB" />
          <stop offset="100%" stopColor="#7C3AED" />
        </linearGradient>

        <filter id="logoGlow" x="-20%" y="-20%" width="140%" height="140%" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#4F46E5" floodOpacity="0.35" />
        </filter>
      </defs>

      <g filter="url(#logoGlow)">
        {/* Outer Ribbon Back Loop */}
        <path
          d="M 18 78 C 12 78 10 70 15 62 L 44 18 C 48 12 56 12 60 18 L 86 60 C 92 70 86 82 74 82 C 64 82 58 74 54 66 L 44 46 Z"
          fill="url(#aRibbonGrad1)"
        />

        {/* Dynamic Curved Ribbon Overlap (3D Mobius A Loop) */}
        <path
          d="M 18 78 C 22 84 34 85 46 75 C 56 67 66 52 74 42 C 80 34 86 28 88 38 C 90 48 84 65 74 82 Z"
          fill="url(#aRibbonGrad2)"
          opacity="0.9"
        />

        {/* Smooth Front Sweeping Arch */}
        <path
          d="M 18 78 C 26 82 38 78 50 68 C 64 56 76 44 82 52 C 86 58 84 72 74 82 C 60 92 38 90 22 83 Z"
          fill="url(#aRibbonGrad3)"
        />

        {/* Core Highlight Ribbon */}
        <path
          d="M 28 66 C 36 50 46 34 52 24 C 55 19 60 22 57 28 C 51 38 42 54 36 68 C 32 76 24 74 28 66 Z"
          fill="#38BDF8"
          opacity="0.8"
        />
      </g>
    </svg>
  );
}

export function AgencyOsLogo({
  className = "",
  size = "md",
  variant = "horizontal",
  showSubtitle = true,
}: AgencyOsLogoProps) {
  const sizeClasses = {
    sm: "h-7",
    md: "h-10",
    lg: "h-14",
    xl: "h-20",
  };

  const iconSizes = {
    sm: "size-7",
    md: "size-10",
    lg: "size-14",
    xl: "size-20",
  };

  if (variant === "icon") {
    return <AgencyOsLogoIcon className={`${iconSizes[size]} ${className}`} />;
  }

  return (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      <AgencyOsLogoIcon className={`${iconSizes[size]} shrink-0`} />
      
      <div className="flex flex-col justify-center">
        <div className="flex items-baseline font-bold tracking-tight leading-none text-slate-900">
          <span className="text-xl font-extrabold tracking-tight text-slate-950 font-sans">
            Agency
          </span>
          <span className="text-xl font-extrabold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent ml-0.5">
            OS
          </span>
        </div>
        {showSubtitle && (
          <span className="text-[9px] font-bold uppercase tracking-[0.22em] text-slate-400 mt-1">
            AGENCY OPERATING SYSTEM
          </span>
        )}
      </div>
    </div>
  );
}
