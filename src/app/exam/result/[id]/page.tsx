'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Award,
  CheckCircle2,
  AlertCircle,
  FileText,
  Printer,
  RotateCcw,
  BookOpen,
  ArrowRight,
  TrendingUp,
  Loader2,
  Sparkles,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { ExamAttempt, Document } from '@/lib/types';

export default function ExamResultPage() {
  const params = useParams();
  const router = useRouter();
  const attemptId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState<ExamAttempt | null>(null);
  const [document, setDocument] = useState<Document | null>(null);
  const [expandedQId, setExpandedQId] = useState<string | null>(null);

  useEffect(() => {
    const fetchResult = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/exam/${attemptId}`);
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Failed to fetch exam result');
        }

        setAttempt(data.attempt);
        setDocument(data.document);
      } catch (err: any) {
        setError(err.message || 'Error loading result');
      } finally {
        setLoading(false);
      }
    };

    if (attemptId) {
      fetchResult();
    }
  }, [attemptId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
        <div className="text-center space-y-3">
          <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto" />
          <h2 className="text-lg font-bold text-gray-900">Loading Official CBSE Board Marksheet...</h2>
        </div>
      </div>
    );
  }

  if (error || !attempt || !attempt.evaluation) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
        <div className="max-w-md w-full bg-white p-8 rounded-3xl border border-red-200 text-center space-y-4 shadow-sm">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
          <h2 className="text-lg font-bold text-gray-900">Evaluation Not Found</h2>
          <p className="text-xs text-gray-600">{error || 'This exam attempt has not been evaluated yet.'}</p>
          <Link
            href="/papers"
            className="inline-block px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-semibold shadow-xs hover:bg-blue-700 transition"
          >
            Back to Papers
          </Link>
        </div>
      </div>
    );
  }

  const { evaluation } = attempt;
  const isPass = evaluation.percentage >= 33;

  return (
    <div className="min-h-screen bg-slate-100 py-8 px-4 sm:px-6 font-sans">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Top Action Bar */}
        <div className="flex items-center justify-between">
          <Link
            href="/papers"
            className="inline-flex items-center space-x-1.5 text-xs font-bold text-gray-600 hover:text-gray-900 transition"
          >
            &larr; Back to Question Papers
          </Link>

          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-bold shadow-xs transition"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Marksheet</span>
          </button>
        </div>

        {/* CBSE Official Marksheet Certificate Banner */}
        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 text-white p-6 sm:p-8 relative">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="space-y-2 text-center sm:text-left">
                <span className="px-3 py-1 rounded-full text-[11px] font-black bg-amber-400 text-amber-950 uppercase tracking-widest inline-block">
                  CBSE Class 10 Board Examination Report Card
                </span>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                  {attempt.paperTitle}
                </h1>
                <p className="text-xs text-blue-100/90 max-w-xl">
                  Evaluated using standard Central Board of Secondary Education step-marking criteria by Senior AI Examiner.
                </p>
              </div>

              {/* Main Score Badge */}
              <div className="flex flex-col items-center justify-center p-6 bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 text-center min-w-[170px] shadow-lg">
                <span className="text-4xl sm:text-5xl font-black text-white tracking-tight">
                  {evaluation.totalScore}
                  <span className="text-xl sm:text-2xl text-blue-200 font-medium">/{evaluation.maxScore}</span>
                </span>
                <span className="text-xs font-bold text-amber-300 mt-1 uppercase tracking-wider">
                  {evaluation.percentage}% &bull; Grade {evaluation.grade}
                </span>
              </div>
            </div>
          </div>

          {/* Diagnostic Examiner Feedback */}
          <div className="p-6 bg-blue-50/50 border-t border-blue-100 flex items-start space-x-3 text-xs text-blue-950">
            <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold text-blue-900 block">Senior Board Examiner Diagnostic Feedback:</span>
              <p className="leading-relaxed text-blue-800">{evaluation.summaryFeedback}</p>
            </div>
          </div>
        </div>

        {/* Section-wise Performance Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(evaluation.sectionScores || {}).map(([secName, sec]) => {
            const secPct = sec.max > 0 ? Math.round((sec.scored / sec.max) * 100) : 0;
            return (
              <div key={secName} className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs space-y-2">
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block truncate">
                  {secName}
                </span>
                <div className="flex items-baseline justify-between">
                  <span className="text-xl font-black text-gray-900">
                    {sec.scored} <span className="text-xs text-gray-400 font-medium">/ {sec.max}</span>
                  </span>
                  <span className={`text-xs font-bold ${secPct >= 75 ? 'text-emerald-600' : secPct >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                    {secPct}%
                  </span>
                </div>
                {/* Progress bar */}
                <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${secPct >= 75 ? 'bg-emerald-500' : secPct >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                    style={{ width: `${secPct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Detailed Question-by-Question Evaluation Audit */}
        <div className="bg-white rounded-3xl border border-gray-200 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div>
              <h2 className="text-base font-black text-gray-900">Question-by-Question CBSE Step Marking Audit</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Inspect every step where marks were awarded or deducted with official CBSE model answers.
              </p>
            </div>
            <span className="text-xs font-bold text-blue-600">
              {evaluation.questionResults.length} Questions Evaluated
            </span>
          </div>

          <div className="space-y-3">
            {evaluation.questionResults.map((qr) => {
              const isExpanded = expandedQId === qr.questionId;
              const isFullMarks = qr.scored === qr.marks;
              const isZero = qr.scored === 0;

              return (
                <div
                  key={qr.questionId}
                  className={`border rounded-2xl transition overflow-hidden ${
                    isFullMarks
                      ? 'border-emerald-200 bg-emerald-50/20'
                      : isZero
                      ? 'border-red-200 bg-red-50/20'
                      : 'border-amber-200 bg-amber-50/20'
                  }`}
                >
                  {/* Collapsed Header */}
                  <div
                    onClick={() => setExpandedQId(isExpanded ? null : qr.questionId)}
                    className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50/50 transition gap-4"
                  >
                    <div className="flex items-center space-x-3">
                      <span className={`px-2.5 py-1 rounded-xl text-xs font-black ${
                        isFullMarks
                          ? 'bg-emerald-100 text-emerald-900'
                          : isZero
                          ? 'bg-red-100 text-red-900'
                          : 'bg-amber-100 text-amber-900'
                      }`}>
                        Q. {qr.questionNumber}
                      </span>
                      <span className="text-xs text-gray-500 truncate max-w-md hidden sm:inline">
                        {qr.section}
                      </span>
                    </div>

                    <div className="flex items-center space-x-3">
                      <div className="text-right">
                        <span className="font-black text-sm text-gray-900">
                          {qr.scored} <span className="text-xs text-gray-400 font-medium">/ {qr.marks} Marks</span>
                        </span>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                  </div>

                  {/* Expanded Audit Details */}
                  {isExpanded && (
                    <div className="p-5 border-t border-gray-100 bg-white space-y-4 text-xs">
                      {/* Student's Answer */}
                      <div className="space-y-1">
                        <span className="font-bold text-gray-500 uppercase tracking-wider text-[10px]">
                          Your Answer:
                        </span>
                        <div className="p-3 bg-gray-50 rounded-xl font-mono text-gray-800 leading-relaxed whitespace-pre-wrap">
                          {qr.studentAnswerPreview}
                        </div>
                      </div>

                      {/* Examiner Step Breakdown */}
                      <div className="space-y-2">
                        <span className="font-bold text-gray-500 uppercase tracking-wider text-[10px]">
                          CBSE Step Marking Breakdown:
                        </span>
                        <div className="space-y-1.5">
                          {qr.stepBreakdown.map((sb, sIdx) => (
                            <div
                              key={sIdx}
                              className="p-2.5 rounded-xl border border-gray-200 bg-slate-50/50 flex items-start justify-between gap-3"
                            >
                              <div>
                                <span className="font-bold text-gray-800">Step {sb.stepNumber}: </span>
                                <span className="text-gray-700">{sb.description}</span>
                                <p className="text-[11px] text-gray-500 mt-0.5">{sb.feedback}</p>
                              </div>
                              <span className="font-black text-xs text-blue-700 whitespace-nowrap">
                                +{sb.marksAwarded} / {sb.maxMarks}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Official Board Model Answer */}
                      <div className="space-y-1">
                        <span className="font-bold text-emerald-700 uppercase tracking-wider text-[10px]">
                          Official CBSE Model Solution:
                        </span>
                        <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl text-emerald-950 font-mono leading-relaxed whitespace-pre-wrap">
                          {qr.modelAnswer}
                        </div>
                      </div>

                      {/* Feedback Note */}
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 leading-relaxed">
                        <span className="font-bold">Examiner Note: </span>
                        {qr.evaluationFeedback}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Action CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 bg-white rounded-3xl border border-gray-200 shadow-xs">
          <Link
            href={`/practice?documentId=${attempt.documentId}`}
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition"
          >
            <BookOpen className="w-4 h-4" />
            <span>Practice 10 Clone Variations per Question</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            href="/papers"
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-6 py-3 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs transition"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Take Another CBSE Board Exam</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
