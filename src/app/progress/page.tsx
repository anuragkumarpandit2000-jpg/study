'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  BarChart2, 
  Target, 
  Award, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  Sparkles,
  BookOpen,
  Loader2
} from 'lucide-react';
import { ConceptProgress, MistakeCategory, PracticeAttempt } from '@/lib/types';

interface ProgressData {
  stats: {
    totalPapersUploaded: number;
    totalQuestionsAttempted: number;
    correctAttempts: number;
    overallAccuracy: number;
    totalConceptsTracked: number;
  };
  mistakeBreakdown: Record<MistakeCategory, number>;
  conceptProgress: ConceptProgress[];
  weakConcepts: ConceptProgress[];
  masteredConcepts: ConceptProgress[];
  recommendations: string[];
  recentAttempts: PracticeAttempt[];
}

export default function ProgressPage() {
  const [data, setData] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProgress = async (showSpinner = false) => {
    try {
      if (showSpinner) setLoading(true);
      const res = await fetch('/api/progress');
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to fetch progress');

      setData(json);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProgress(true);
  }, []);

  if (loading) {
    return (
      <div className="py-24 text-center space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
        <p className="text-sm font-semibold text-gray-700">Loading educational analytics...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-red-700 max-w-xl mx-auto my-12 text-center">
        <p className="font-semibold mb-2">Error loading progress</p>
        <p className="text-sm mb-4">{error}</p>
        <button
          onClick={() => fetchProgress(true)}
          className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold"
        >
          Try Again
        </button>
      </div>
    );
  }

  const { stats, mistakeBreakdown, conceptProgress, weakConcepts, masteredConcepts, recommendations, recentAttempts } = data;

  const mistakeLabels: Record<MistakeCategory, string> = {
    none: 'Completely Correct',
    calculation_error: 'Calculation / Arithmetic Error',
    conceptual_misunderstanding: 'Conceptual Misunderstanding',
    incorrect_formula: 'Incorrect Formula Chosen',
    misreading_question: 'Misread the Question',
    incomplete_written_answer: 'Incomplete Written Answer'
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Concept Mastery & Educational Analytics</h1>
        <p className="text-xs text-gray-500 mt-1">
          Grounded exclusively in your actual practice submissions. No fabricated scores or fake activity.
        </p>
      </div>

      {/* Top Real Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-1">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">Papers Uploaded</span>
          <p className="text-2xl font-black text-gray-900">{stats.totalPapersUploaded}</p>
          <span className="text-[11px] text-gray-400">Total document inventories</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-1">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">Questions Attempted</span>
          <p className="text-2xl font-black text-gray-900">{stats.totalQuestionsAttempted}</p>
          <span className="text-[11px] text-gray-400">Original & generated Qs</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-1">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">Overall Accuracy</span>
          <p className="text-2xl font-black text-blue-600">{stats.overallAccuracy}%</p>
          <span className="text-[11px] text-gray-400">CBSE step-weighted accuracy</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-1">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">Concepts Profiled</span>
          <p className="text-2xl font-black text-emerald-600">{stats.totalConceptsTracked}</p>
          <span className="text-[11px] text-gray-400">Individual syllabus topics</span>
        </div>
      </div>

      {/* AI Pedagogical Recommendations */}
      <div className="bg-blue-50/80 border border-blue-200 rounded-2xl p-6 space-y-3">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-5 h-5 text-blue-600" />
          <h2 className="text-sm font-bold text-blue-950 uppercase tracking-wider">
            Targeted Revision Recommendations
          </h2>
        </div>
        <ul className="space-y-2 text-xs text-blue-900">
          {recommendations.map((rec, i) => (
            <li key={i} className="flex items-start space-x-2">
              <span className="font-bold text-blue-600">&bull;</span>
              <span className="leading-relaxed">{rec}</span>
            </li>
          ))}
        </ul>

        {weakConcepts.length > 0 && (
          <div className="pt-2">
            <Link
              href="/practice?mode=weakness"
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition shadow-xs"
            >
              <span>Practice Weak Concepts Now</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>

      {/* Mistake Categories Breakdown */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          <span>Error & Misconception Breakdown</span>
        </h2>
        <p className="text-xs text-gray-500">
          Distinguishing between slips, calculation errors, formula mistakes, and conceptual gaps:
        </p>

        <div className="space-y-3 pt-2">
          {Object.entries(mistakeBreakdown).map(([category, count]) => {
            const label = mistakeLabels[category as MistakeCategory];
            const maxVal = Math.max(1, ...Object.values(mistakeBreakdown));
            const percentage = (count / maxVal) * 100;

            return (
              <div key={category} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-gray-700">{label}</span>
                  <span className="font-bold text-gray-900">{count} occurrences</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      category === 'none'
                        ? 'bg-emerald-500'
                        : category === 'conceptual_misunderstanding'
                        ? 'bg-red-500'
                        : 'bg-amber-500'
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Concept Mastery Inventory */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center space-x-2">
          <Award className="w-4 h-4 text-emerald-600" />
          <span>Tracked Concepts & Mastery Scores (0–100%)</span>
        </h2>

        {conceptProgress.length === 0 ? (
          <div className="py-8 text-center text-xs text-gray-400">
            No concept attempts recorded yet. Attempt questions in Practice Mode to populate your mastery index.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {conceptProgress.map(cp => (
              <div key={cp.id} className="py-3.5 flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-xs text-gray-900">{cp.conceptName}</span>
                    <span className="text-[11px] px-2 py-0.5 rounded bg-gray-100 text-gray-600 font-medium">
                      {cp.subject}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    {cp.totalAttempts} attempts &bull; {cp.correctAttempts} correct &bull; Last practiced: {new Date(cp.lastPracticedAt).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <span className="font-bold text-sm text-gray-900">{cp.masteryScore}%</span>
                    <span className="block text-[10px] text-gray-400">Mastery</span>
                  </div>
                  <div className="w-16 bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-2 rounded-full ${
                        cp.masteryScore >= 80
                          ? 'bg-emerald-500'
                          : cp.masteryScore >= 60
                          ? 'bg-amber-500'
                          : 'bg-red-500'
                      }`}
                      style={{ width: `${cp.masteryScore}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Submissions Log */}
      {recentAttempts.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center space-x-2">
            <Clock className="w-4 h-4 text-blue-600" />
            <span>Recent Practice Attempts</span>
          </h2>

          <div className="space-y-3">
            {recentAttempts.map(att => (
              <div key={att.id} className="p-3.5 rounded-xl border border-gray-200 bg-gray-50/50 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-700 line-clamp-1">
                    {att.questionText}
                  </span>
                  <span className={`px-2 py-0.5 rounded font-bold uppercase text-[10px] ${
                    att.isCorrect === 'correct'
                      ? 'bg-emerald-100 text-emerald-800'
                      : att.isCorrect === 'partially_correct'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {att.evaluation.scorePercentage}%
                  </span>
                </div>
                <p className="text-gray-500 line-clamp-1">
                  <strong className="text-gray-700">Feedback:</strong> {att.evaluation.detailedFeedback}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
