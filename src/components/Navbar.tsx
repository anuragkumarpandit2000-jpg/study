'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, FileText, Target, BarChart2, Settings, Sparkles, GraduationCap } from 'lucide-react';
import { PyqCatalogModal } from './PyqCatalogModal';

import { ConceptMasterLogo } from './ConceptMasterLogo';

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const [isPyqModalOpen, setIsPyqModalOpen] = useState(false);

  const navLinks = [
    { href: '/', label: 'Home', icon: BookOpen },
    { href: '/papers', label: 'My Papers', icon: FileText },
    { href: '/practice', label: 'Practice', icon: Target },
    { href: '/progress', label: 'Progress', icon: BarChart2 },
    { href: '/settings', label: 'Settings', icon: Settings }
  ];

  return (
    <>
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo & Brand */}
            <Link href="/" className="cursor-pointer">
              <ConceptMasterLogo size="md" />
            </Link>

            {/* Right navigation & PYQ Quick Action */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* Quick Launch Official PYQ Exam Button */}
              <button
                type="button"
                onClick={() => setIsPyqModalOpen(true)}
                className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold shadow-xs transition cursor-pointer"
                title="Open Official CBSE Board Question Paper Bank (2022-2026)"
              >
                <GraduationCap className="w-4 h-4 text-amber-300" />
                <span className="hidden md:inline">CBSE Board Exam Mode</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-amber-400 text-amber-950">410+ PYQs</span>
              </button>

              {/* Navigation Links */}
              <nav className="flex items-center space-x-1 sm:space-x-2">
                {navLinks.map(link => {
                  const Icon = link.icon;
                  const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium transition ${
                        isActive
                          ? 'bg-blue-50 text-blue-600 border border-blue-100'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                      <span className="hidden sm:inline">{link.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>
        </div>
      </header>

      {/* Official CBSE PYQ Modal */}
      <PyqCatalogModal
        isOpen={isPyqModalOpen}
        onClose={() => setIsPyqModalOpen(false)}
        defaultMode="exam"
      />
    </>
  );
};
