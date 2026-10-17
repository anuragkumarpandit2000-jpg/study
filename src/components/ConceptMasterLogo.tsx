'use client';

import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
}

export const ConceptMasterLogo: React.FC<LogoProps> = ({
  size = 'md',
  showText = true,
  className = ''
}) => {
  const sizeMap = {
    sm: { icon: 34, title: 'text-base', badge: 'text-[9px] px-1.5 py-0.5', subtitle: 'text-[10px]' },
    md: { icon: 42, title: 'text-lg', badge: 'text-[10px] px-2 py-0.5', subtitle: 'text-xs' },
    lg: { icon: 56, title: 'text-2xl', badge: 'text-xs px-2.5 py-1', subtitle: 'text-sm' },
    xl: { icon: 80, title: 'text-4xl', badge: 'text-sm px-3 py-1', subtitle: 'text-base' },
  };

  const config = sizeMap[size];

  return (
    <div className={`flex items-center space-x-3 group ${className}`}>
      {/* Radiant Emblem Icon */}
      <div 
        className="relative flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-105"
        style={{ width: `${config.icon}px`, height: `${config.icon}px` }}
      >
        <svg 
          viewBox="0 0 100 100" 
          width="100%" 
          height="100%" 
          className="drop-shadow-md"
        >
          <defs>
            {/* Primary Gradient */}
            <linearGradient id="cmlBg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1e3a8a" />
              <stop offset="50%" stopColor="#2563eb" />
              <stop offset="100%" stopColor="#6366f1" />
            </linearGradient>

            {/* Gold Accent Gradient */}
            <linearGradient id="cmlGold" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fde047" />
              <stop offset="100%" stopColor="#f59e0b" />
            </linearGradient>

            {/* Cyan Ribbon Gradient */}
            <linearGradient id="cmlCyan" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#0ea5e9" />
            </linearGradient>
          </defs>

          {/* Squircle Base with Glow */}
          <rect x="4" y="4" width="92" height="92" rx="24" fill="url(#cmlBg)" />
          <rect x="5" y="5" width="90" height="90" rx="23" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" />

          {/* Background Neural Web (Subtle) */}
          <g opacity="0.22" stroke="#ffffff" strokeWidth="0.8" fill="none">
            <circle cx="50" cy="50" r="30" strokeDasharray="3 3" />
            <circle cx="50" cy="50" r="16" />
            <line x1="50" y1="20" x2="50" y2="80" strokeDasharray="2 2" />
            <line x1="20" y1="50" x2="80" y2="50" strokeDasharray="2 2" />
          </g>

          {/* Diamond Graduation Cap Crest */}
          <polygon points="50,22 76,34 50,46 24,34" fill="url(#cmlCyan)" />
          <polygon points="50,24 74,34 50,44 26,34" fill="none" stroke="#ffffff" strokeWidth="0.8" opacity="0.6" />

          {/* Cap Base Arch */}
          <path d="M33,39 L33,52 C33,62 50,67 50,67 C50,67 67,62 67,52 L67,39 L50,47 Z" fill="#1e40af" />
          <path d="M35,40 L35,51 C35,59 50,64 50,64 C50,64 65,59 65,51 L65,40" fill="none" stroke="#60a5fa" strokeWidth="1.2" />

          {/* Golden Tassel & Jewel */}
          <path d="M76,34 Q80,44 78,54" fill="none" stroke="url(#cmlGold)" strokeWidth="2" strokeLinecap="round" />
          <circle cx="78" cy="55" r="2.5" fill="url(#cmlGold)" />

          {/* Mastery Crown Sparkle Star */}
          <g transform="translate(50, 22)">
            <polygon points="0,-8 2.2,-2.5 8,-2.5 3.3,1.2 5,7 0,3.5 -5,7 -3.3,1.2 -8,-2.5 -2.2,-2.5" fill="url(#cmlGold)" />
            <circle cx="0" cy="0" r="1" fill="#ffffff" />
          </g>

          {/* Connected Synapse Nodes of Deep Concept Analysis */}
          <circle cx="30" cy="74" r="3" fill="#38bdf8" />
          <circle cx="50" cy="80" r="3.5" fill="url(#cmlGold)" />
          <circle cx="70" cy="74" r="3" fill="#38bdf8" />
          <line x1="33" y1="74" x2="47" y2="80" stroke="#ffffff" strokeWidth="1" opacity="0.7" />
          <line x1="53" y1="80" x2="67" y2="74" stroke="#ffffff" strokeWidth="1" opacity="0.7" />
        </svg>
      </div>

      {/* Typography & Brand Tagline */}
      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center space-x-2">
            <span className={`font-black tracking-tight text-gray-900 ${config.title}`}>
              CONCEPT <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">MASTER</span>
            </span>
            <span className={`rounded-full font-black uppercase tracking-wider bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-2xs ${config.badge}`}>
              AI
            </span>
            <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-200/80">
              CBSE 10
            </span>
          </div>
          {size !== 'sm' && (
            <p className={`text-gray-500 font-medium tracking-tight ${config.subtitle}`}>
              Understand Every Question. Master Every Concept.
            </p>
          )}
        </div>
      )}
    </div>
  );
};
