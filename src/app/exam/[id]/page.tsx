'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Clock,
  CheckCircle2,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Upload,
  Camera,
  Trash2,
  AlertTriangle,
  Send,
  Loader2,
  Sparkles,
  HelpCircle,
  FileText,
  RotateCcw
} from 'lucide-react';
import { ExamAttempt, Document, OriginalQuestion } from '@/lib/types';

export default function BoardExamRoomPage() {
  const params = useParams();
  const router = useRouter();
  const attemptId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState<ExamAttempt | null>(null);
  const [document, setDocument] = useState<Document | null>(null);
  const [questions, setQuestions] = useState<OriginalQuestion[]>([]);

  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'type' | 'upload'>('type');
  const [typedAnswer, setTypedAnswer] = useState('');
  const [imageAttachment, setImageAttachment] = useState<{
    data: string;
    mimeType: string;
    previewUrl?: string;
    filename?: string;
  } | null>(null);

  // Timer states (in seconds)
  const [timeLeft, setTimeLeft] = useState<number>(180 * 60); // 3 hours
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(true);
  const [isSubmittingExam, setIsSubmittingExam] = useState<boolean>(false);
  const [showSubmitModal, setShowSubmitModal] = useState<boolean>(false);

  // Fetch attempt data on mount
  useEffect(() => {
    const fetchExam = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/exam/${attemptId}`);
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Failed to load exam attempt');
        }

        setAttempt(data.attempt);
        setDocument(data.document);
        setQuestions(data.questions || []);

        // If exam is already submitted/evaluated, redirect to result
        if (data.attempt.status === 'evaluated' || data.attempt.status === 'submitted') {
          router.replace(`/exam/result/${attemptId}`);
          return;
        }

        // Initialize timer from duration or previous spent time
        const totalDurationSec = (data.attempt.durationMinutes || 180) * 60;
        const remaining = Math.max(0, totalDurationSec - (data.attempt.timeSpentSeconds || 0));
        setTimeLeft(remaining);
      } catch (err: any) {
        setError(err.message || 'Error loading exam');
      } finally {
        setLoading(false);
      }
    };

    if (attemptId) {
      fetchExam();
    }
  }, [attemptId, router]);

  // Sync current question input when question changes
  useEffect(() => {
    if (!questions.length || !attempt) return;
    const currentQ = questions[currentQIndex];
    if (!currentQ) return;

    const saved = attempt.responses[currentQ.id];
    if (saved) {
      setTypedAnswer(saved.responseText || '');
      if (saved.imageAttachment) {
        setImageAttachment({
          data: saved.imageAttachment.data,
          mimeType: saved.imageAttachment.mimeType,
          previewUrl: `data:${saved.imageAttachment.mimeType};base64,${saved.imageAttachment.data}`,
          filename: saved.imageAttachment.filename || 'notebook_photo.jpg'
        });
        setActiveTab('upload');
      } else {
        setImageAttachment(null);
        setActiveTab('type');
      }
    } else {
      setTypedAnswer('');
      setImageAttachment(null);
      setActiveTab('type');
    }
  }, [currentQIndex, questions, attempt]);

  // Countdown timer effect
  useEffect(() => {
    if (!isTimerRunning || timeLeft <= 0 || isSubmittingExam) return;

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          handleFinalSubmit(); // Auto-submit when time expires
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isTimerRunning, timeLeft, isSubmittingExam]);

  const formatTimer = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (JPG, PNG) of your notebook answer.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const resultStr = reader.result as string;
      const base64Data = resultStr.includes(',') ? resultStr.split(',')[1] : resultStr;
      setImageAttachment({
        data: base64Data,
        mimeType: file.type,
        previewUrl: URL.createObjectURL(file),
        filename: file.name
      });
    };
    reader.readAsDataURL(file);
  };

  const saveCurrentQuestion = async (markReview = false) => {
    if (!attempt || !questions.length) return;
    const currentQ = questions[currentQIndex];
    if (!currentQ) return;

    const hasAnswer = (typedAnswer.trim().length > 0) || !!imageAttachment;
    let newStatus: 'answered' | 'marked_for_review' | 'unattempted' = 'unattempted';
    if (markReview) {
      newStatus = 'marked_for_review';
    } else if (hasAnswer) {
      newStatus = 'answered';
    }

    // Optimistic state update
    const updatedResponses = { ...attempt.responses };
    updatedResponses[currentQ.id] = {
      questionId: currentQ.id,
      responseText: typedAnswer.trim() || undefined,
      imageAttachment: imageAttachment ? { data: imageAttachment.data, mimeType: imageAttachment.mimeType, filename: imageAttachment.filename } : undefined,
      status: newStatus,
      updatedAt: new Date().toISOString()
    };

    setAttempt({
      ...attempt,
      responses: updatedResponses
    });

    // Background sync to server
    try {
      await fetch(`/api/exam/${attemptId}/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: currentQ.id,
          responseText: typedAnswer.trim() || null,
          imageAttachment: imageAttachment ? { data: imageAttachment.data, mimeType: imageAttachment.mimeType, filename: imageAttachment.filename } : null,
          status: newStatus,
          timeSpentSeconds: ((attempt.durationMinutes || 180) * 60) - timeLeft
        })
      });
    } catch (e) {
      console.warn('Auto-save error:', e);
    }
  };

  const handleSaveAndNext = async () => {
    await saveCurrentQuestion(false);
    if (currentQIndex < questions.length - 1) {
      setCurrentQIndex(currentQIndex + 1);
    }
  };

  const handleMarkForReviewAndNext = async () => {
    await saveCurrentQuestion(true);
    if (currentQIndex < questions.length - 1) {
      setCurrentQIndex(currentQIndex + 1);
    }
  };

  const handleClearResponse = () => {
    setTypedAnswer('');
    setImageAttachment(null);
  };

  const handleFinalSubmit = async () => {
    setShowSubmitModal(false);
    setIsSubmittingExam(true);

    try {
      // First save active question response
      await saveCurrentQuestion(false);

      const res = await fetch(`/api/exam/${attemptId}/submit`, {
        method: 'POST'
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Evaluation failed');
      }

      router.push(`/exam/result/${attemptId}`);
    } catch (err: any) {
      alert(err.message || 'Error evaluating exam');
      setIsSubmittingExam(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
        <div className="text-center space-y-3">
          <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto" />
          <h2 className="text-lg font-bold text-gray-900">Preparing CBSE Board Examination Room...</h2>
          <p className="text-xs text-gray-500">Loading authentic question paper, timer, and answer sheets.</p>
        </div>
      </div>
    );
  }

  if (error || !attempt || !document) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
        <div className="max-w-md w-full bg-white p-8 rounded-3xl border border-red-200 text-center space-y-4 shadow-sm">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto" />
          <h2 className="text-lg font-bold text-gray-900">Unable to Load Exam</h2>
          <p className="text-xs text-gray-600">{error || 'Exam session could not be retrieved.'}</p>
          <Link
            href="/papers"
            className="inline-block px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-semibold shadow-xs hover:bg-blue-700 transition"
          >
            Back to Question Papers
          </Link>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentQIndex];
  const maxMarks = currentQ?.marks || 3;

  // Stats
  const answeredCount = Object.values(attempt.responses).filter(r => r.status === 'answered').length;
  const reviewCount = Object.values(attempt.responses).filter(r => r.status === 'marked_for_review').length;
  const unattemptedCount = Math.max(0, questions.length - answeredCount - reviewCount);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {/* Top Exam Hall Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4">
          {/* Paper Information */}
          <div className="flex items-center space-x-3 truncate">
            <span className="p-2 bg-blue-600 text-white rounded-xl shadow-xs font-black text-xs">
              CBSE
            </span>
            <div className="truncate">
              <h1 className="text-sm font-black text-gray-900 truncate">
                {attempt.paperTitle}
              </h1>
              <p className="text-[11px] text-gray-500">
                {document.subject} &bull; Total Questions: {questions.length} &bull; Max Marks: 80
              </p>
            </div>
          </div>

          {/* Center Timer */}
          <div className="flex items-center space-x-4">
            <div className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-2xl border font-mono font-bold text-sm shadow-xs ${
              timeLeft < 600
                ? 'bg-red-50 border-red-300 text-red-700 animate-pulse'
                : timeLeft < 1800
                ? 'bg-amber-50 border-amber-300 text-amber-800'
                : 'bg-blue-50 border-blue-200 text-blue-900'
            }`}>
              <Clock className="w-4 h-4" />
              <span>{formatTimer(timeLeft)}</span>
            </div>
          </div>

          {/* Finish & Submit Button */}
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setShowSubmitModal(true)}
              disabled={isSubmittingExam}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-xs transition disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Submit Paper</span>
            </button>
          </div>
        </div>

        {/* Status Tracker Sub-bar */}
        <div className="bg-slate-50 border-t border-gray-100 px-4 sm:px-6 py-1.5 flex items-center justify-between text-[11px]">
          <div className="flex items-center space-x-4">
            <span className="flex items-center space-x-1 font-semibold text-emerald-700">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
              <span>Answered: {answeredCount}</span>
            </span>
            <span className="flex items-center space-x-1 font-semibold text-purple-700">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block" />
              <span>Marked for Review: {reviewCount}</span>
            </span>
            <span className="flex items-center space-x-1 font-semibold text-gray-500">
              <span className="w-2.5 h-2.5 rounded-full bg-gray-300 inline-block" />
              <span>Unattempted: {unattemptedCount}</span>
            </span>
          </div>

          <span className="font-semibold text-gray-600">
            Question {currentQIndex + 1} of {questions.length}
          </span>
        </div>
      </header>

      {/* Main Examination Hall Workspace */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Left Column: Question & Answer Workspace (Span 3) */}
        <div className="lg:col-span-3 space-y-4">
          {/* Question Card */}
          <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center space-x-2.5">
                <span className="px-3 py-1 rounded-xl bg-blue-100 text-blue-900 font-black text-xs">
                  Q. {currentQ?.originalNumber}
                  {currentQ?.subpartIdentifier && ` (${currentQ.subpartIdentifier})`}
                </span>
                <span className="px-2.5 py-0.5 rounded-lg bg-gray-100 text-gray-700 font-bold text-[11px]">
                  {maxMarks} {maxMarks === 1 ? 'Mark' : 'Marks'}
                </span>
              </div>

              {attempt.responses[currentQ?.id]?.status === 'marked_for_review' && (
                <span className="px-2.5 py-1 rounded-full bg-purple-100 text-purple-800 text-[11px] font-bold flex items-center space-x-1">
                  <Bookmark className="w-3 h-3 fill-current" />
                  <span>Marked for Review</span>
                </span>
              )}
            </div>

            {/* Question Text */}
            <div className="text-gray-900 text-base leading-relaxed font-medium whitespace-pre-wrap">
              {currentQ?.extractedText}
            </div>
          </div>

          {/* Answer Workspace Card (Dual Mode: Type vs Copy Photo) */}
          <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-xs space-y-4">
            {/* Dual Input Tabs */}
            <div className="flex items-center justify-between border-b border-gray-200 pb-3">
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('type')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
                    activeTab === 'type'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>✍️ Type Answer</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('upload')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
                    activeTab === 'upload'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>📸 Upload Notebook Copy Photo</span>
                </button>
              </div>

              <button
                type="button"
                onClick={handleClearResponse}
                className="text-xs font-semibold text-gray-400 hover:text-red-600 transition flex items-center space-x-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Clear Answer</span>
              </button>
            </div>

            {/* Tab 1: Type Answer Input */}
            {activeTab === 'type' && (
              <div className="space-y-2">
                <textarea
                  value={typedAnswer}
                  onChange={e => setTypedAnswer(e.target.value)}
                  placeholder="Apna board exam step-by-step solution yahan likhein (Given, Formula, Calculation, Final Answer with Unit)..."
                  rows={8}
                  className="w-full p-4 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm text-gray-900 leading-relaxed resize-y"
                />
                <p className="text-[11px] text-gray-400">
                  Tip: Step marking ke liye formula, intermediate working, aur unit (e.g. cm, m/s, J) zaroor mention karein.
                </p>
              </div>
            )}

            {/* Tab 2: Upload Copy Photo Input */}
            {activeTab === 'upload' && (
              <div className="space-y-4">
                {!imageAttachment ? (
                  <label className="border-2 border-dashed border-blue-200 hover:border-blue-400 bg-blue-50/40 rounded-3xl p-8 flex flex-col items-center justify-center cursor-pointer transition text-center space-y-3">
                    <div className="p-3 bg-blue-100 text-blue-600 rounded-2xl">
                      <Camera className="w-8 h-8" />
                    </div>
                    <div>
                      <span className="text-sm font-bold text-gray-900 block">
                        Notebook ke page ki photo khinch kar upload karein
                      </span>
                      <span className="text-xs text-gray-500 mt-0.5 block">
                        Gemini Multimodal OCR aapki handwriting ko scan karke step marks dega
                      </span>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                ) : (
                  <div className="relative rounded-2xl overflow-hidden border border-gray-200 max-w-md bg-gray-50">
                    <img
                      src={imageAttachment.previewUrl}
                      alt="Uploaded copy preview"
                      className="w-full max-h-80 object-contain bg-slate-900/5"
                    />
                    <div className="p-3 bg-white flex items-center justify-between border-t border-gray-200">
                      <span className="text-xs font-semibold text-gray-700 truncate">
                        {imageAttachment.filename || 'Handwritten Answer Sheet'}
                      </span>
                      <button
                        type="button"
                        onClick={() => setImageAttachment(null)}
                        className="text-red-600 hover:text-red-700 p-1 text-xs font-bold flex items-center space-x-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => {
                  if (currentQIndex > 0) {
                    saveCurrentQuestion(false);
                    setCurrentQIndex(currentQIndex - 1);
                  }
                }}
                disabled={currentQIndex === 0}
                className="px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-bold transition disabled:opacity-40 flex items-center space-x-1"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handleMarkForReviewAndNext}
                  className="px-4 py-2 rounded-xl border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-900 text-xs font-bold transition flex items-center space-x-1.5"
                >
                  <Bookmark className="w-3.5 h-3.5" />
                  <span>Mark for Review & Next</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveAndNext}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition flex items-center space-x-1.5"
                >
                  <span>Save & Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Question Palette Navigation (Span 1) */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-3xl border border-gray-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <h3 className="text-xs font-black uppercase tracking-wider text-gray-800">
                Question Palette
              </h3>
              <span className="text-[11px] font-bold text-gray-500">
                {questions.length} Questions
              </span>
            </div>

            {/* Palette Grid */}
            <div className="grid grid-cols-5 gap-2 max-h-[380px] overflow-y-auto pr-1">
              {questions.map((q, idx) => {
                const response = attempt.responses[q.id];
                const isCurrent = idx === currentQIndex;
                let bgClass = 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200';

                if (response?.status === 'answered') {
                  bgClass = 'bg-emerald-500 text-white border-emerald-600';
                } else if (response?.status === 'marked_for_review') {
                  bgClass = 'bg-purple-600 text-white border-purple-700';
                }

                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => {
                      saveCurrentQuestion(false);
                      setCurrentQIndex(idx);
                    }}
                    className={`h-9 w-full rounded-xl border text-xs font-black flex items-center justify-center transition ${bgClass} ${
                      isCurrent ? 'ring-2 ring-offset-2 ring-blue-600 shadow-xs' : ''
                    }`}
                  >
                    {q.originalNumber}
                  </button>
                );
              })}
            </div>

            {/* Color Legend */}
            <div className="pt-3 border-t border-gray-100 space-y-2 text-[11px] text-gray-600">
              <div className="flex items-center space-x-2">
                <span className="w-3.5 h-3.5 rounded-md bg-emerald-500 border border-emerald-600" />
                <span>Answered</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-3.5 h-3.5 rounded-md bg-purple-600 border border-purple-700" />
                <span>Marked for Review</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-3.5 h-3.5 rounded-md bg-gray-100 border border-gray-300" />
                <span>Not Answered</span>
              </div>
            </div>

            {/* Final Submit CTA */}
            <button
              type="button"
              onClick={() => setShowSubmitModal(true)}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-black shadow-xs transition"
            >
              Submit Full Exam 🏁
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 space-y-5">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto">
                <Send className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-gray-900">Are you ready to submit your paper?</h3>
              <p className="text-xs text-gray-500">
                Submitting will conclude your exam session. Gemini Board Examiner will grade your answers according to CBSE Step Marking.
              </p>
            </div>

            {/* Summary statistics */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-gray-200 grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2 bg-white rounded-xl border border-gray-100">
                <span className="text-gray-400 block text-[10px]">Answered</span>
                <span className="text-base font-black text-emerald-600">{answeredCount}</span>
              </div>
              <div className="p-2 bg-white rounded-xl border border-gray-100">
                <span className="text-gray-400 block text-[10px]">Review</span>
                <span className="text-base font-black text-purple-600">{reviewCount}</span>
              </div>
              <div className="p-2 bg-white rounded-xl border border-gray-100">
                <span className="text-gray-400 block text-[10px]">Left</span>
                <span className="text-base font-black text-gray-500">{unattemptedCount}</span>
              </div>
            </div>

            <div className="flex items-center space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setShowSubmitModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-xs font-bold hover:bg-gray-100 transition"
              >
                Continue Exam
              </button>
              <button
                type="button"
                onClick={handleFinalSubmit}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-xs transition"
              >
                Yes, Submit & Grade
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Evaluating Loading Overlay */}
      {isSubmittingExam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-white rounded-3xl max-w-md w-full p-8 text-center space-y-4 shadow-2xl border border-gray-100">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto" />
            <div className="space-y-1">
              <h3 className="text-base font-black text-gray-900">
                CBSE Board Evaluation in Progress...
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Gemini Senior Examiner is evaluating your step-by-step calculations, handwritten notebook copy, and formatting your CBSE Marksheet.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
