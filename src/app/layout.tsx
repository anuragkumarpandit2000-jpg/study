import React from 'react';
import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '@/components/Navbar';
import { TextSelectionToolbar } from '@/components/TextSelectionToolbar';

export const metadata: Metadata = {
  title: 'Concept Master AI — Understand Every Question. Master Every Concept.',
  description: 'AI-Powered CBSE Board Exam Learning & Assessment Platform for Class 10 (Mathematics, Science, Social Science, English, Hindi)',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full bg-white antialiased">
      <body className="min-h-full flex flex-col bg-white text-gray-900">
        <Navbar />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
        <TextSelectionToolbar />
        <footer className="border-t border-gray-200 bg-white py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-gray-500">
            Concept Master AI &copy; 2026 &bull; Designed for CBSE Class 10 Board Excellence &bull; Powered by Google Gemini
          </div>
        </footer>
      </body>
    </html>
  );
}
