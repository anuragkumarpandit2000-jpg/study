'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  HelpCircle, 
  Target, 
  BookOpen, 
  Award, 
  ChevronDown, 
  ChevronUp, 
  ArrowLeft,
  Play,
  RotateCw,
  Loader2,
  ListFilter,
  Check,
  AlertTriangle
} from 'lucide-react';
import { CompleteDocumentData, CompleteQuestionData, GeneratedQuestion, QuestionAnalysis } from '@/lib/types';
import { MathRenderer } from '@/components/MathRenderer';
import { AudioExplanationPlayer } from '@/components/AudioExplanationPlayer';

export default function DocumentAnalysisPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();

  const [data, setData] = useState<CompleteDocumentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Live processing control & status polling
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);

  // Real-time status & dynamic ETA countdown
  interface LiveStatus {
    progressPercentage: number;
    estimatedSecondsRemaining: number;
    etaFormatted: string;
    currentStage: string;
    totalQuestions: number;
    analysedCount: number;
    variationsCount: number;
    targetVariations: number;
    status: string;
  }
  const [liveStatus, setLiveStatus] = useState<LiveStatus | null>(null);
  const [countdownSeconds, setCountdownSeconds] = useState<number | null>(null);

  // Expandable sections per question
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    meaning: true,
    strategy: true,
    solution: true,
    examAnswer: true,
    mistakes: true,
    variations: true
  });

  // Filter for generated questions
  const [variationDifficultyFilter, setVariationDifficultyFilter] = useState<string>('all');

  const fetchDocumentData = async (showLoadingSpinner = false) => {
    try {
      if (showLoadingSpinner) setLoading(true);
      const res = await fetch(`/api/documents/${id}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to load document');

      setData(json.data);
      return json.data as CompleteDocumentData;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchDocumentData(true);
    }
  }, [id]);

  // Live status polling and ETA countdown ticker
  useEffect(() => {
    if (!id) return;
    let isMounted = true;

    const pollStatus = async () => {
      try {
        const res = await fetch(`/api/documents/${id}/status`);
        if (!res.ok) return;
        const statusData: LiveStatus = await res.json();
        if (!isMounted) return;

        setLiveStatus(statusData);
        setCountdownSeconds(statusData.estimatedSecondsRemaining);

        // If newly analysed questions exist, refresh data silently
        if (statusData.analysedCount > 0) {
          setData(prev => {
            if (prev) {
              const currentAnalysed = prev.questions.filter(q => q.analysis !== null).length;
              if (currentAnalysed !== statusData.analysedCount || prev.document.processingStatus !== statusData.status) {
                fetchDocumentData(false);
              }
            }
            return prev;
          });
        }
      } catch {
        // Silent poll error
      }
    };

    pollStatus();

    // Poll server every 1.5s while processing or until document is fully ready
    const statusInterval = setInterval(() => {
      if (isProcessing || data?.document.processingStatus !== 'READY_FOR_PRACTICE') {
        pollStatus();
      }
    }, 1500);

    // Smooth second-by-second countdown decrementer
    const tickerInterval = setInterval(() => {
      setCountdownSeconds(prev => (prev !== null && prev > 0 ? prev - 1 : prev));
    }, 1000);

    return () => {
      isMounted = false;
      clearInterval(statusInterval);
      clearInterval(tickerInterval);
    };
  }, [id, isProcessing, data?.document.processingStatus]);

  const [generatingForQId, setGeneratingForQId] = useState<string | null>(null);

  const handleGenerateVariations = async (questionId: string) => {
    setGeneratingForQId(questionId);
    try {
      const res = await fetch(`/api/questions/${questionId}/generate-variations`, {
        method: 'POST'
      });
      const resJson = await res.json();
      if (!res.ok) {
        throw new Error(resJson.error || 'Failed to generate 10 variations');
      }
      await fetchDocumentData(false);
    } catch (err: any) {
      alert(err.message || 'Error generating variations');
    } finally {
      setGeneratingForQId(null);
    }
  };

  // Smart multi-batch processing with live progress updates
  const triggerProcess = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      let keepGoing = true;
      while (keepGoing) {
        const res = await fetch(`/api/documents/${id}/process`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ batchLimit: 2 }) // Process 2 questions per chunk to prevent browser timeouts
        });

        const resJson = await res.json();
        if (!res.ok) {
          throw new Error(resJson.error || 'Processing encountered an error');
        }

        const freshData = await fetchDocumentData(false);
        if (!freshData || freshData.document.processingStatus === 'READY_FOR_PRACTICE') {
          keepGoing = false;
          break;
        }

        // Check if any unanalysed questions remain
        const unanalysed = freshData.questions.some(q => q.analysis === null || q.generatedQuestions.length === 0);
        if (!unanalysed) {
          keepGoing = false;
          break;
        }
      }
    } catch (err: any) {
      console.warn('Process interrupted or partial:', err);
      await fetchDocumentData(false);
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleSection = (sectionKey: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey]
    }));
  };

  if (loading) {
    return (
      <div className="py-24 text-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
        <h2 className="text-lg font-bold text-gray-900">Loading Deep Question Analysis...</h2>
        <p className="text-xs text-gray-500">Checking question inventory and pedagogical solutions...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-red-700 max-w-xl mx-auto my-12 text-center">
        <p className="font-semibold mb-2">Failed to load paper analysis</p>
        <p className="text-sm mb-4">{error || 'Document not found'}</p>
        <button
          onClick={() => router.push('/')}
          className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold"
        >
          Return Home
        </button>
      </div>
    );
  }

  const { document: doc, questions, job } = data;
  const currentQData: CompleteQuestionData | undefined = questions[activeQuestionIndex];
  const currentAnalysis = currentQData?.analysis;
  const currentVariations = currentQData?.generatedQuestions || [];

  // Filter variations if needed
  const filteredVariations = currentVariations.filter(v => {
    if (variationDifficultyFilter === 'all') return true;
    return v.difficulty.toLowerCase() === variationDifficultyFilter.toLowerCase();
  });

  const totalOriginals = questions.length;
  const analysedCount = questions.filter(q => q.analysis !== null).length;
  const totalVariationsGenerated = questions.reduce((acc, q) => acc + q.generatedQuestions.length, 0);

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Top Breadcrumb & Paper Summary */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-gray-200">
        <div>
          <Link href="/papers" className="inline-flex items-center space-x-1.5 text-xs text-blue-600 hover:text-blue-800 font-semibold mb-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to My Papers</span>
          </Link>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-extrabold text-gray-900">{doc.filename}</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
              {doc.subject}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {doc.classLevel} &bull; {doc.board} &bull; {doc.examType} &bull; Explanations in {doc.preferredLanguage}
          </p>
        </div>

        {/* Status / Resume Control */}
        <div className="flex items-center space-x-3">
          {doc.processingStatus !== 'READY_FOR_PRACTICE' && (
            <button
              onClick={triggerProcess}
              disabled={isProcessing}
              className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition disabled:opacity-50 cursor-pointer"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Analysing ({liveStatus?.progressPercentage ?? Math.round((analysedCount / (totalOriginals || 1)) * 100)}%)...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  <span>Start / Resume Analysis ({analysedCount}/{totalOriginals})</span>
                </>
              )}
            </button>
          )}

          <Link
            href={`/practice?documentId=${doc.id}`}
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition"
          >
            <Target className="w-4 h-4" />
            <span>Practice Paper ({totalVariationsGenerated + totalOriginals} Qs)</span>
          </Link>

          <Link
            href={`/exam/${doc.id}`}
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition"
          >
            <Award className="w-4 h-4 text-amber-300" />
            <span>Take 3-Hour Board Exam</span>
          </Link>
        </div>
      </div>

      {/* Live Pipeline Status Banner with Loading Bar & Dynamic ETA */}
      {doc.processingStatus !== 'READY_FOR_PRACTICE' ? (
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-50/90 via-indigo-50/60 to-purple-50/40 border border-blue-200 rounded-2xl p-6 shadow-sm space-y-4">
          {/* Top Header: Title, State & Dynamic Countdown ETA Pill */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-blue-600 text-white shadow-xs">
                {isProcessing ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Sparkles className="w-5 h-5 text-amber-300" />
                )}
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-sm font-bold text-gray-900">
                    AI Deep Pedagogical Analysis in Progress
                  </h2>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide border ${
                    isProcessing 
                      ? 'bg-blue-100 text-blue-800 border-blue-200 animate-pulse' 
                      : 'bg-amber-100 text-amber-800 border-amber-200'
                  }`}>
                    {isProcessing ? 'Active Processing' : 'Paused - Click Start to Resume'}
                  </span>
                </div>
                <p className="text-xs text-gray-600 mt-0.5">
                  13-Point CBSE Breakdown + 10 Targeted Practice Variations per Question
                </p>
              </div>
            </div>

            {/* Live Dynamic Countdown ETA Pill */}
            <div className="flex items-center space-x-2.5 bg-white border border-blue-200 px-3.5 py-2 rounded-xl shadow-xs">
              <Clock className="w-4 h-4 text-blue-600 animate-pulse flex-shrink-0" />
              <div className="text-left">
                <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  Estimated Time Left
                </span>
                <span className="text-xs font-black text-blue-900 font-mono">
                  {countdownSeconds !== null && countdownSeconds > 0
                    ? countdownSeconds >= 60
                      ? `~${Math.floor(countdownSeconds / 60)}m ${countdownSeconds % 60}s remaining`
                      : `~${countdownSeconds} seconds remaining`
                    : liveStatus?.etaFormatted || '~30 seconds remaining'}
                </span>
              </div>
            </div>
          </div>

          {/* Dynamic Loading Progress Bar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-blue-950 flex items-center space-x-1.5 truncate max-w-[80%]">
                <Sparkles className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                <span className="truncate">
                  {liveStatus?.currentStage || job?.currentStage || 'Analysing concepts, strategies and model answers...'}
                </span>
              </span>
              <span className="text-blue-700 bg-blue-100/90 px-2.5 py-0.5 rounded-md font-mono text-xs font-extrabold shadow-2xs">
                {liveStatus?.progressPercentage ?? Math.round((analysedCount / (totalOriginals || 1)) * 100)}%
              </span>
            </div>

            <div className="w-full bg-blue-200/50 rounded-full h-3.5 overflow-hidden p-0.5 shadow-inner">
              <div
                className="bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-500 h-full rounded-full transition-all duration-700 ease-out shadow-sm"
                style={{
                  width: `${Math.max(6, liveStatus?.progressPercentage ?? (totalOriginals > 0 ? (analysedCount / totalOriginals) * 100 : 0))}%`
                }}
              />
            </div>
          </div>

          {/* 3-Column Metrics Snapshot */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div className="bg-white/90 rounded-xl p-2.5 border border-blue-100/90 flex items-center space-x-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <div className="text-xs">
                <span className="font-bold text-gray-900">{analysedCount} of {totalOriginals}</span>
                <span className="text-gray-500 block text-[11px]">Questions Fully Analysed</span>
              </div>
            </div>

            <div className="bg-white/90 rounded-xl p-2.5 border border-blue-100/90 flex items-center space-x-2.5">
              <Sparkles className="w-4 h-4 text-indigo-600 flex-shrink-0" />
              <div className="text-xs">
                <span className="font-bold text-gray-900">{totalVariationsGenerated}</span>
                <span className="text-gray-500 block text-[11px]">CBSE Practice Variations Ready</span>
              </div>
            </div>

            <div className="bg-white/90 rounded-xl p-2.5 border border-blue-100/90 flex items-center space-x-2.5">
              <Target className="w-4 h-4 text-blue-600 flex-shrink-0" />
              <div className="text-xs">
                <span className="font-bold text-gray-900">Target: {totalOriginals * 10}</span>
                <span className="text-gray-500 block text-[11px]">Total Multiplier Questions</span>
              </div>
            </div>
          </div>

          {/* Calming Indian Student Friendly Reassurance Notice */}
          <div className="flex items-start space-x-2.5 bg-blue-100/60 rounded-xl p-3 text-xs text-blue-900 border border-blue-200/50">
            <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="space-y-0.5 text-[11px]">
              <p className="font-bold text-blue-950">
                Isme time lagna bilkul normal hai!
              </p>
              <p className="text-blue-800 leading-relaxed">
                Gemini AI har question ka detailed 13-point breakdown (formulas, marking scheme, board model answer) aur 10 naye practice questions bana raha hai. Aap tab tak completed questions ko neeche padh sakte hain ya unki audio sun sakte hain. Progress real-time save ho rahi hai.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-blue-500/10 border border-emerald-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center space-x-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <div>
              <h3 className="text-xs font-bold text-emerald-950">
                Deep Analysis & Multiplier 100% Complete!
              </h3>
              <p className="text-[11px] text-emerald-800">
                All {totalOriginals} questions are fully analysed with {totalVariationsGenerated} practice variations and board model solutions.
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Link
              href={`/practice?documentId=${doc.id}`}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition"
            >
              <Target className="w-3.5 h-3.5" />
              <span>Practice All ({totalOriginals + totalVariationsGenerated})</span>
            </Link>
          </div>
        </div>
      )}

      {/* Main Layout: Left Question Palette, Right Complete 13-Point Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Question Navigator */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Question Navigator</h3>
              <span className="text-xs font-semibold text-blue-600">{questions.length} Questions</span>
            </div>

            <div className="space-y-1.5 max-h-[550px] overflow-y-auto pr-1">
              {questions.map((qData, index) => {
                const isSelected = index === activeQuestionIndex;
                const hasAnalysis = qData.analysis !== null;
                const variationsCount = qData.generatedQuestions.length;

                return (
                  <button
                    key={qData.question.id}
                    onClick={() => setActiveQuestionIndex(index)}
                    className={`w-full text-left p-3 rounded-xl border text-xs transition flex items-center justify-between ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/70 text-blue-900 font-bold'
                        : 'border-gray-200 hover:border-gray-300 text-gray-700 bg-white'
                    }`}
                  >
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <span className="font-bold">
                          {qData.question.originalNumber} {qData.question.subpartIdentifier || ''}
                        </span>
                        {qData.question.marks && (
                          <span className="text-[10px] text-gray-400">({qData.question.marks}M)</span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-500 line-clamp-1 font-normal mt-0.5">
                        {qData.question.extractedText}
                      </p>
                    </div>

                    <div className="flex items-center space-x-1">
                      {hasAnalysis ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      ) : (
                        <Clock className="w-4 h-4 text-amber-500 flex-shrink-0" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Deep 13-Point Analysis & Variations */}
        <div className="lg:col-span-3 space-y-6">
          {currentQData ? (
            <>
              {/* Question Header Card */}
              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <div className="flex items-center space-x-2.5">
                    <span className="px-3 py-1 rounded-lg bg-blue-600 text-white font-bold text-sm">
                      {currentQData.question.originalNumber} {currentQData.question.subpartIdentifier || ''}
                    </span>
                    {currentQData.question.marks && (
                      <span className="px-2.5 py-1 rounded-lg bg-gray-100 text-gray-700 font-medium text-xs">
                        {currentQData.question.marks} Marks
                      </span>
                    )}
                    {currentAnalysis && (
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                        currentAnalysis.difficulty === 'Easy'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : currentAnalysis.difficulty === 'Medium'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-red-50 text-red-700 border border-red-200'
                      }`}>
                        {currentAnalysis.difficulty} Difficulty
                      </span>
                    )}
                  </div>

                  {/* Tutor Link */}
                  <Link
                    href={`/tutor/${currentQData.question.id}`}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-semibold transition"
                  >
                    <HelpCircle className="w-4 h-4 text-blue-600" />
                    <span>Open Question Tutor & Chat</span>
                  </Link>
                </div>

                {/* Original Question Wording */}
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Original Question Wording
                  </span>
                  <div className="text-base text-gray-900 font-medium leading-relaxed bg-gray-50/50 p-4 rounded-xl border border-gray-200">
                    <MathRenderer content={currentQData.question.extractedText} />
                  </div>
                </div>

                {/* Concept & Chapter Tagging */}
                {currentAnalysis && (
                  <div className="flex flex-wrap items-center gap-2 pt-2 text-xs">
                    <span className="font-semibold text-gray-500">Chapter:</span>
                    <span className="px-2.5 py-1 rounded-md bg-blue-50 text-blue-800 font-medium border border-blue-100">
                      {currentAnalysis.chapter}
                    </span>
                    <span className="font-semibold text-gray-500 ml-2">Tested Concepts:</span>
                    {currentAnalysis.concepts.map((c, i) => (
                      <span key={i} className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-800 font-medium">
                        {c}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Staged 13-Point Analysis Sections */}
              {currentAnalysis ? (
                <div className="space-y-4">
                  {/* 1. Meaning in Hinglish */}
                  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    <button
                      onClick={() => toggleSection('meaning')}
                      className="w-full px-6 py-4 flex items-center justify-between text-left font-bold text-gray-900 hover:bg-gray-50 transition"
                    >
                      <div className="flex items-center space-x-2">
                        <Sparkles className="w-4 h-4 text-blue-600" />
                        <span>Question Meaning in Natural Hinglish ("Ye question aapse kya keh raha hai?")</span>
                      </div>
                      {expandedSections.meaning ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                    </button>
                    {expandedSections.meaning && (
                      <div className="px-6 pb-6 text-sm text-gray-800 space-y-4 border-t border-gray-100 pt-4">
                        <div className="flex items-center justify-between pb-1">
                          <span className="text-xs font-semibold text-gray-500">Student-Friendly Explanation</span>
                          <AudioExplanationPlayer
                            textToSpeak={currentAnalysis.meaningHinglish}
                            label="🔊 Suno (Audio)"
                            preferredLanguage={doc.preferredLanguage}
                          />
                        </div>
                        <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-100 leading-relaxed font-normal">
                          <MathRenderer content={currentAnalysis.meaningHinglish} />
                        </div>

                        {/* Given vs What to Find Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                            <span className="text-xs font-bold text-gray-600 uppercase tracking-wider block mb-2">
                              What is Given:
                            </span>
                            <ul className="list-disc list-inside space-y-1 text-xs text-gray-700">
                              {currentAnalysis.givenInformation.map((item, idx) => (
                                <li key={idx}><MathRenderer content={item} className="inline" /></li>
                              ))}
                            </ul>
                          </div>

                          <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                            <span className="text-xs font-bold text-gray-600 uppercase tracking-wider block mb-2">
                              What Must Be Found / Proved:
                            </span>
                            <ul className="list-disc list-inside space-y-1 text-xs text-gray-700">
                              {currentAnalysis.whatToFind.map((item, idx) => (
                                <li key={idx}><MathRenderer content={item} className="inline" /></li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 2. Solving Strategy & Required Knowledge */}
                  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    <button
                      onClick={() => toggleSection('strategy')}
                      className="w-full px-6 py-4 flex items-center justify-between text-left font-bold text-gray-900 hover:bg-gray-50 transition"
                    >
                      <div className="flex items-center space-x-2">
                        <BookOpen className="w-4 h-4 text-blue-600" />
                        <span>Solving Strategy & Required Formulas</span>
                      </div>
                      {expandedSections.strategy ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                    </button>
                    {expandedSections.strategy && (
                      <div className="px-6 pb-6 text-sm text-gray-800 space-y-4 border-t border-gray-100 pt-4">
                        <div className="space-y-2">
                          <p className="text-xs font-bold text-gray-700">What to Notice First:</p>
                          <p className="text-xs text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-200">
                            {currentAnalysis.solvingStrategy.noticeFirst}
                          </p>
                        </div>

                        {/* Formulas & Theorems */}
                        {currentAnalysis.requiredKnowledge.formulas && currentAnalysis.requiredKnowledge.formulas.length > 0 && (
                          <div className="space-y-1.5">
                            <p className="text-xs font-bold text-blue-900">Required Formulas & Rules:</p>
                            <div className="flex flex-wrap gap-2">
                              {currentAnalysis.requiredKnowledge.formulas.map((f, i) => (
                                <div key={i} className="px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200 text-xs font-mono text-blue-900">
                                  <MathRenderer content={f} />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="space-y-1">
                          <p className="text-xs font-bold text-gray-700">Recommended Method & Approach:</p>
                          <p className="text-xs text-gray-600 leading-relaxed">
                            {currentAnalysis.solvingStrategy.whyApproach}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 3. Step-by-Step Rigorous Solution */}
                  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    <button
                      onClick={() => toggleSection('solution')}
                      className="w-full px-6 py-4 flex items-center justify-between text-left font-bold text-gray-900 hover:bg-gray-50 transition"
                    >
                      <div className="flex items-center space-x-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Step-by-Step Pedagogical Solution</span>
                      </div>
                      {expandedSections.solution ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                    </button>
                    {expandedSections.solution && (
                      <div className="px-6 pb-6 text-sm text-gray-800 space-y-4 border-t border-gray-100 pt-4">
                        {currentAnalysis.stepByStepSolution.map(step => (
                          <div key={step.stepNumber} className="border-l-2 border-blue-500 pl-4 py-1 space-y-1.5">
                            <span className="text-xs font-bold text-blue-700">
                              Step {step.stepNumber}: {step.heading}
                            </span>
                            <div className="text-xs text-gray-700 leading-relaxed">
                              <MathRenderer content={step.explanation} />
                            </div>
                            {step.calculationOrReasoning && (
                              <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-200 text-xs font-mono text-gray-900 overflow-x-auto">
                                <MathRenderer content={step.calculationOrReasoning} />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 4. CBSE Board Exam Ready Model Answer */}
                  <div className="bg-white rounded-2xl border border-blue-200 shadow-sm overflow-hidden bg-gradient-to-b from-blue-50/30 to-white">
                    <button
                      onClick={() => toggleSection('examAnswer')}
                      className="w-full px-6 py-4 flex items-center justify-between text-left font-bold text-gray-900 hover:bg-blue-50/50 transition"
                    >
                      <div className="flex items-center space-x-2">
                        <Award className="w-4 h-4 text-blue-600" />
                        <span>CBSE Board-Examination Answer Presentation (Full-Marks Format)</span>
                      </div>
                      {expandedSections.examAnswer ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                    </button>
                    {expandedSections.examAnswer && (
                      <div className="px-6 pb-6 text-sm text-gray-900 space-y-4 border-t border-blue-100 pt-4">
                        <div className="p-5 rounded-xl bg-white border border-blue-200 shadow-xs space-y-3 font-serif">
                          {currentAnalysis.boardExamAnswer.headingsAndContent.map((hc, idx) => (
                            <div key={idx} className="space-y-1">
                              {hc.heading && (
                                <span className="font-bold font-sans text-xs text-blue-900 uppercase tracking-wider block">
                                  {hc.heading}:
                                </span>
                              )}
                              <div className="text-xs text-gray-800 leading-relaxed pl-2 border-l border-gray-200">
                                <MathRenderer content={hc.content} />
                              </div>
                            </div>
                          ))}

                          {currentAnalysis.boardExamAnswer.conclusion && (
                            <div className="pt-2 border-t border-gray-200 font-sans text-xs font-semibold text-gray-900">
                              <span className="text-emerald-700">Conclusion / Final Statement:</span> {currentAnalysis.boardExamAnswer.conclusion}
                            </div>
                          )}
                        </div>

                        {/* Essential Points Examiner Checklist */}
                        <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-100">
                          <span className="text-xs font-bold text-emerald-900 block mb-1">
                            Essential Points Evaluator Checklist:
                          </span>
                          <ul className="list-disc list-inside space-y-0.5 text-xs text-emerald-800">
                            {currentAnalysis.boardExamAnswer.essentialPoints.map((pt, i) => (
                              <li key={i}>{pt}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 5. Common Mistakes & Prevention */}
                  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    <button
                      onClick={() => toggleSection('mistakes')}
                      className="w-full px-6 py-4 flex items-center justify-between text-left font-bold text-gray-900 hover:bg-gray-50 transition"
                    >
                      <div className="flex items-center space-x-2">
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                        <span>Common Student Mistakes & How to Prevent Them</span>
                      </div>
                      {expandedSections.mistakes ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                    </button>
                    {expandedSections.mistakes && (
                      <div className="px-6 pb-6 text-sm text-gray-800 space-y-3 border-t border-gray-100 pt-4">
                        {currentAnalysis.commonMistakes.map((m, idx) => (
                          <div key={idx} className="p-3.5 rounded-xl bg-amber-50/40 border border-amber-200 space-y-1 text-xs">
                            <p className="font-bold text-amber-900 flex items-center space-x-1.5">
                              <span>&bull; Mistake:</span>
                              <span>{m.mistake}</span>
                            </p>
                            <p className="text-gray-700">
                              <span className="font-semibold text-gray-900">Why it occurs:</span> {m.whyItOccurs}
                            </p>
                            <p className="text-emerald-800 font-medium">
                              <span className="font-semibold text-emerald-900">&rarr; Prevention:</span> {m.prevention}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 6. Independent Verification Badge */}
                  <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <div>
                        <span className="font-bold text-gray-900">Independent Academic Verification: </span>
                        <span className="text-gray-600">{currentAnalysis.verificationNotes || 'Verified against CBSE standards'}</span>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-800 font-bold uppercase text-[10px]">
                      {currentAnalysis.verificationStatus}
                    </span>
                  </div>

                  {/* Step 3 Banner: Practice Arena */}
                  <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 rounded-2xl border border-blue-200 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
                    <div className="space-y-1">
                      <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[11px] font-bold">
                        <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                        <span>Ready for Step 3: Practice Arena</span>
                      </div>
                      <h3 className="text-base font-bold text-gray-900">
                        Practice 10 Similar Questions of this Exact Type
                      </h3>
                      <p className="text-xs text-gray-600">
                        Solve on paper or type on screen. Upload copy photos for instant CBSE step-by-step marking!
                      </p>
                    </div>

                    <Link
                      href={`/practice?documentId=${doc.id}&questionId=${currentQData.question.id}`}
                      className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition flex-shrink-0"
                    >
                      <Target className="w-4 h-4" />
                      <span>Start Practice Arena (10 Questions) &rarr;</span>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center space-y-3">
                  <Clock className="w-8 h-8 text-amber-500 mx-auto" />
                  <p className="font-bold text-gray-900">Analysis Pending for this Question</p>
                  <p className="text-xs text-gray-500">
                    Click "Resume Analysis" at the top to complete this question and generate its 10 practice variations.
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center text-gray-500 text-sm">
              Select a question from the navigator to view its analysis.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
