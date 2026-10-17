'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  BookOpen, 
  Search, 
  Clock, 
  FileText, 
  Play, 
  Sparkles, 
  X, 
  Loader2, 
  ArrowRight,
  GraduationCap,
  Layers
} from 'lucide-react';

interface PyqPaperItem {
  id: string;
  subject: string;
  year: string;
  filename: string;
  filePath: string;
  fileSizeBytes: number;
  displayName: string;
  setCode?: string;
}

interface PyqCatalog {
  subjects: Array<{
    name: string;
    label: string;
    icon: string;
    years: Array<{
      year: string;
      papers: PyqPaperItem[];
    }>;
  }>;
  totalPapers: number;
}

interface PyqCatalogModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'exam' | 'practice';
}

export const PyqCatalogModal: React.FC<PyqCatalogModalProps> = ({
  isOpen,
  onClose,
  defaultMode = 'exam'
}) => {
  const router = useRouter();
  const [catalog, setCatalog] = useState<PyqCatalog | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedSubject, setSelectedSubject] = useState<string>('SCIENCE');
  const [selectedYear, setSelectedYear] = useState<string>('2024');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loadingPaperPath, setLoadingPaperPath] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const fetchCatalog = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/pyq');
        const data = await res.json();
        if (data.success && data.catalog) {
          setCatalog(data.catalog);
          if (data.catalog.subjects.length > 0) {
            setSelectedSubject(data.catalog.subjects[0].name);
            if (data.catalog.subjects[0].years.length > 0) {
              setSelectedYear(data.catalog.subjects[0].years[0].year);
            }
          }
        }
      } catch (err) {
        console.error('Failed to load PYQ catalog:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCatalog();
  }, [isOpen]);

  if (!isOpen) return null;

  const currentSubjectData = catalog?.subjects.find(s => s.name === selectedSubject);
  const currentYearData = currentSubjectData?.years.find(y => y.year === selectedYear);

  let displayedPapers = currentYearData?.papers || [];
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    displayedPapers = displayedPapers.filter(
      p => p.displayName.toLowerCase().includes(q) || p.filename.toLowerCase().includes(q)
    );
  }

  const handleLaunchPaper = async (paper: PyqPaperItem, mode: 'exam' | 'practice') => {
    setLoadingPaperPath(paper.filePath);
    try {
      const res = await fetch('/api/pyq/load', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filePath: paper.filePath,
          mode
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to initialize paper');
      }

      onClose();
      if (mode === 'exam' && data.examAttemptId) {
        router.push(`/exam/${data.examAttemptId}`);
      } else {
        router.push(`/documents/${data.documentId}`);
      }
    } catch (err: any) {
      alert(err.message || 'Error loading paper');
      setLoadingPaperPath(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-white/10 rounded-2xl backdrop-blur-xs border border-white/20">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-black tracking-tight">Official CBSE Board PYQ Paper Bank</h2>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-400 text-amber-950">
                  {catalog ? `${catalog.totalPapers} Papers Available` : 'Loading...'}
                </span>
              </div>
              <p className="text-xs text-blue-100/80 mt-0.5">
                Authentic Class 10 Previous Year Question Papers (2022–2026). Select any paper to start a 3-Hour Board Exam or Deep Practice!
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        {loading ? (
          <div className="py-28 text-center space-y-3">
            <Loader2 className="w-9 h-9 animate-spin text-blue-600 mx-auto" />
            <p className="text-sm font-bold text-gray-700">Scanning 410+ Official CBSE Question Papers...</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Subject Selector Tabs */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-500">1. Select Subject</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                {catalog?.subjects.map(sub => {
                  const isSelected = selectedSubject === sub.name;
                  return (
                    <button
                      key={sub.name}
                      type="button"
                      onClick={() => {
                        setSelectedSubject(sub.name);
                        if (sub.years.length > 0) {
                          setSelectedYear(sub.years[0].year);
                        }
                      }}
                      className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/70 text-blue-900 shadow-xs ring-2 ring-blue-500/20'
                          : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      <span className="text-2xl mb-1">{sub.icon}</span>
                      <span className="text-xs font-bold truncate w-full">{sub.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Year Selector Pills & Search */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-gray-100">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-500">2. Select Year</label>
                <div className="flex items-center space-x-1.5 flex-wrap">
                  {currentSubjectData?.years.map(y => {
                    const isSelected = selectedYear === y.year;
                    return (
                      <button
                        key={y.year}
                        type="button"
                        onClick={() => setSelectedYear(y.year)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                          isSelected
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        CBSE {y.year}
                        <span className="ml-1 text-[10px] opacity-75">({y.papers.length})</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Search input */}
              <div className="relative w-full sm:w-64 self-end">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search set code (e.g. 31/1/1)..."
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Paper Sets Grid */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-500">
                  3. Select Paper Set ({displayedPapers.length} Available)
                </label>
                <span className="text-xs text-gray-400">Click to start exam or practice</span>
              </div>

              {displayedPapers.length === 0 ? (
                <div className="p-8 text-center text-gray-500 text-xs bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                  No question papers matched your search query.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[340px] overflow-y-auto pr-1">
                  {displayedPapers.map(paper => {
                    const isLaunching = loadingPaperPath === paper.filePath;
                    return (
                      <div
                        key={paper.id}
                        className="p-4 rounded-2xl border border-gray-200 bg-white hover:border-blue-300 hover:shadow-xs transition flex flex-col justify-between space-y-3"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-black text-sm text-gray-900">{paper.displayName}</span>
                            </div>
                            <p className="text-[11px] text-gray-500 mt-0.5 truncate max-w-[260px]">
                              {paper.filename} &bull; {(paper.fileSizeBytes / (1024 * 1024)).toFixed(1)} MB
                            </p>
                          </div>
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            CBSE {paper.year}
                          </span>
                        </div>

                        {/* Dual Action Buttons */}
                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100">
                          <button
                            type="button"
                            disabled={isLaunching}
                            onClick={() => handleLaunchPaper(paper, 'exam')}
                            className="flex items-center justify-center space-x-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold shadow-xs transition disabled:opacity-50"
                          >
                            {isLaunching ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <>
                                <Play className="w-3 h-3 fill-current" />
                                <span>3-Hr Exam</span>
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            disabled={isLaunching}
                            onClick={() => handleLaunchPaper(paper, 'practice')}
                            className="flex items-center justify-center space-x-1 px-3 py-2 rounded-xl bg-gray-100 hover:bg-blue-50 text-gray-700 hover:text-blue-800 text-xs font-semibold transition disabled:opacity-50"
                          >
                            <BookOpen className="w-3 h-3" />
                            <span>Breakdown</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
          <span className="flex items-center space-x-1.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Real CBSE Marking Scheme & Step Marking Evaluation enabled.</span>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-100 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
