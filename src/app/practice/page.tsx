'use client';

import React, { useEffect, useState, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Target, 
  Clock, 
  HelpCircle, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  ArrowLeft, 
  RotateCw, 
  Award, 
  Send, 
  Sparkles,
  AlertTriangle,
  Lightbulb,
  Camera,
  Upload,
  X,
  FileText,
  BarChart2,
  Loader2,
  Check
} from 'lucide-react';
import { MathRenderer } from '@/components/MathRenderer';
import { CompleteDocumentData, CompleteQuestionData, GeneratedQuestion, MistakeCategory } from '@/lib/types';

interface EvaluationData {
  scorePercentage: number;
  estimatedMarksAwarded: number;
  maxMarks: number;
  isCorrect: 'correct' | 'partially_correct' | 'incorrect';
  mistakeCategory: MistakeCategory;
  strengths: string[];
  missingPoints: string[];
  reasoningErrors: string[];
  presentationTips: string[];
  correctedAnswer: string;
  detailedFeedback: string;
  extractedHandwrittenText?: string;
}

function PracticeArenaContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const docIdParam = searchParams.get('documentId');
  const initialQId = searchParams.get('questionId');

  // Document & questions state
  const [availableDocs, setAvailableDocs] = useState<{ id: string; filename: string; subject: string }[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string>(docIdParam || '');
  const [docData, setDocData] = useState<CompleteDocumentData | null>(null);
  const [loading, setLoading] = useState(true);

  // Active question & variation index
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState(0);
  const [selectedVariationIndex, setSelectedVariationIndex] = useState(0);

  // Dynamic variation generator state
  const [isGeneratingVariations, setIsGeneratingVariations] = useState(false);

  // Answer Submission Mode: 'text' or 'photo'
  const [submissionTab, setSubmissionTab] = useState<'text' | 'photo'>('text');
  const [studentTextAnswer, setStudentTextAnswer] = useState('');
  const [imageAttachment, setImageAttachment] = useState<{
    data: string; // base64
    mimeType: string;
    previewUrl: string;
    filename: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Evaluation state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [evaluation, setEvaluation] = useState<EvaluationData | null>(null);

  // Progressive hints
  const [hintLevel, setHintLevel] = useState<number>(0);
  const [hintContent, setHintContent] = useState<string | null>(null);
  const [loadingHint, setLoadingHint] = useState(false);

  // Session summary scorecard
  const [sessionScore, setSessionScore] = useState<{ attempted: number; totalMarksScored: number; maxPossibleMarks: number }>({
    attempted: 0,
    totalMarksScored: 0,
    maxPossibleMarks: 0
  });

  // 1. Load documents list
  useEffect(() => {
    const loadDocs = async () => {
      try {
        const res = await fetch('/api/documents');
        const json = await res.json();
        if (json.documents && json.documents.length > 0) {
          setAvailableDocs(json.documents.map((d: any) => ({
            id: d.id,
            filename: d.filename,
            subject: d.subject
          })));

          if (!selectedDocId) {
            setSelectedDocId(json.documents[0].id);
          }
        }
      } catch (e) {
        console.error('Error loading documents:', e);
      }
    };
    loadDocs();
  }, []);

  // 2. Load document data when selectedDocId changes
  useEffect(() => {
    if (!selectedDocId) return;

    const fetchDoc = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/documents/${selectedDocId}`);
        const json = await res.json();
        if (res.ok && json.data) {
          setDocData(json.data);

          // If questionId param exists, find its index
          if (initialQId && json.data.questions) {
            const idx = json.data.questions.findIndex((q: CompleteQuestionData) => q.question.id === initialQId);
            if (idx >= 0) {
              setSelectedQuestionIndex(idx);
            }
          }
        }
      } catch (e) {
        console.error('Error fetching doc data:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchDoc();
  }, [selectedDocId, initialQId]);

  // Reset inputs when switching question or variation
  useEffect(() => {
    setStudentTextAnswer('');
    setImageAttachment(null);
    setEvaluation(null);
    setHintLevel(0);
    setHintContent(null);
  }, [selectedQuestionIndex, selectedVariationIndex]);

  const activeQuestionData = docData?.questions[selectedQuestionIndex];
  const variations = activeQuestionData?.generatedQuestions || [];
  const activeVariation = variations[selectedVariationIndex];

  // Handler to generate 10 variations on demand if missing
  const handleGenerateVariationsForActiveQ = async () => {
    if (!activeQuestionData) return;
    setIsGeneratingVariations(true);
    try {
      const res = await fetch(`/api/questions/${activeQuestionData.question.id}/generate-variations`, {
        method: 'POST'
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to generate 10 variations');

      // Refresh doc data
      const refreshRes = await fetch(`/api/documents/${selectedDocId}`);
      const refreshJson = await refreshRes.json();
      if (refreshJson.data) {
        setDocData(refreshJson.data);
      }
    } catch (err: any) {
      alert(err.message || 'Error generating variations');
    } finally {
      setIsGeneratingVariations(false);
    }
  };

  // Image Upload handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (JPG, PNG) of your notebook page.');
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

  // Progressive hint handler
  const handleGetHint = async (level: 1 | 2) => {
    if (!activeQuestionData) return;
    setLoadingHint(true);
    setHintLevel(level);
    try {
      const res = await fetch(`/api/questions/${activeQuestionData.question.id}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'progressive_help', level })
      });
      const data = await res.json();
      if (res.ok && data.content) {
        setHintContent(data.content);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingHint(false);
    }
  };

  // Answer Submission handler
  const handleSubmitAnswer = async () => {
    if (!activeQuestionData) return;

    if (submissionTab === 'text' && !studentTextAnswer.trim()) {
      alert('Please write your answer in the box before submitting.');
      return;
    }

    if (submissionTab === 'photo' && !imageAttachment) {
      alert('Please upload a photo of your notebook or switch to Type Answer.');
      return;
    }

    setIsSubmitting(true);
    try {
      const currentTargetQ = activeVariation
        ? { id: activeVariation.id, text: activeVariation.questionText, origin: 'generated' as const, marks: 3 }
        : { id: activeQuestionData.question.id, text: activeQuestionData.question.extractedText, origin: 'original' as const, marks: activeQuestionData.question.marks || 3 };

      const res = await fetch('/api/practice/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: currentTargetQ.id,
          questionOrigin: currentTargetQ.origin,
          questionText: currentTargetQ.text,
          submittedAnswer: studentTextAnswer,
          maxMarks: currentTargetQ.marks,
          subject: docData?.document.subject || 'General',
          hintsUsed: hintLevel,
          imageAttachment: submissionTab === 'photo' && imageAttachment ? {
            data: imageAttachment.data,
            mimeType: imageAttachment.mimeType
          } : undefined
        })
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Evaluation failed');

      setEvaluation(json.evaluation);

      // Update session scorecard
      setSessionScore(prev => ({
        attempted: prev.attempted + 1,
        totalMarksScored: prev.totalMarksScored + (json.evaluation.estimatedMarksAwarded || 0),
        maxPossibleMarks: prev.maxPossibleMarks + (json.evaluation.maxMarks || 3)
      }));
    } catch (err: any) {
      alert(err.message || 'Error evaluating answer');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Move to next variation
  const handleNextVariation = () => {
    if (selectedVariationIndex < variations.length - 1) {
      setSelectedVariationIndex(prev => prev + 1);
    } else if (docData && selectedQuestionIndex < docData.questions.length - 1) {
      setSelectedQuestionIndex(prev => prev + 1);
      setSelectedVariationIndex(0);
    }
  };

  if (loading && !docData) {
    return (
      <div className="py-24 text-center space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
        <h2 className="text-base font-bold text-gray-900">Loading Step 3 &bull; Practice Arena...</h2>
        <p className="text-xs text-gray-500">Preparing side question boxes and identical concept variations...</p>
      </div>
    );
  }

  if (!docData || docData.questions.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center space-y-4 max-w-xl mx-auto my-12">
        <Target className="w-10 h-10 text-gray-400 mx-auto" />
        <h2 className="text-lg font-bold text-gray-900">No Question Papers Found</h2>
        <p className="text-xs text-gray-500">
          Upload or enter a question paper in Step 1 to generate question boxes and practice variations.
        </p>
        <Link
          href="/"
          className="inline-block px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition"
        >
          Upload Paper in Step 1 &rarr;
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header: Step 3 & 4 Navigation + Scorecard */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-gray-200">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-blue-600 mb-1">
            <Link href={`/documents/${docData.document.id}`} className="hover:underline flex items-center space-x-1">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Step 2: Breakdown</span>
            </Link>
            <span>&bull;</span>
            <span className="uppercase tracking-wider">Step 3 &bull; Practice Arena</span>
          </div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-extrabold text-gray-900">{docData.document.filename}</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
              {docData.document.subject}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Select a question box on the left &bull; Solve 10 identical concept practice questions &bull; Type or upload copy photos
          </p>
        </div>

        {/* Live Session Scorecard & Progress Report Button */}
        <div className="flex items-center space-x-3">
          {sessionScore.attempted > 0 && (
            <div className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center space-x-2">
              <Award className="w-4 h-4 text-emerald-600" />
              <div>
                <span className="font-bold">{sessionScore.totalMarksScored.toFixed(1)} / {sessionScore.maxPossibleMarks} Marks</span>
                <span className="text-[10px] text-emerald-700 block">({sessionScore.attempted} solved)</span>
              </div>
            </div>
          )}

          <Link
            href="/progress"
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-gray-900 hover:bg-black text-white text-xs font-semibold shadow-xs transition"
          >
            <BarChart2 className="w-4 h-4 text-blue-400" />
            <span>Full Progress Report &rarr;</span>
          </Link>
        </div>
      </div>

      {/* Main Grid: Left Side Question Boxes + Right Side Practice & Evaluation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Question Boxes (Sidebar) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between pb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Paper Question Boxes ({docData.questions.length})
            </span>
            <span className="text-[11px] text-blue-600 font-semibold">Click to Practice</span>
          </div>

          <div className="space-y-2.5 max-h-[750px] overflow-y-auto pr-1">
            {docData.questions.map((qData, qIdx) => {
              const isSelected = qIdx === selectedQuestionIndex;
              const qVariationsCount = qData.generatedQuestions.length;

              return (
                <button
                  key={qData.question.id}
                  type="button"
                  onClick={() => {
                    setSelectedQuestionIndex(qIdx);
                    setSelectedVariationIndex(0);
                  }}
                  className={`w-full text-left p-4 rounded-2xl border transition relative ${
                    isSelected
                      ? 'bg-blue-50/70 border-blue-500 shadow-sm ring-1 ring-blue-500'
                      : 'bg-white border-gray-200 hover:border-blue-300 hover:bg-gray-50/50'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className={`font-bold px-2.5 py-0.5 rounded-md ${
                      isSelected ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {qData.question.originalNumber}
                      {qData.question.subpartIdentifier ? ` (${qData.question.subpartIdentifier})` : ''}
                    </span>

                    <span className="text-[11px] font-semibold text-blue-700 bg-blue-100/60 px-2 py-0.5 rounded-full">
                      {qVariationsCount > 0 ? `${qVariationsCount} Variations Ready` : 'Ready to generate'}
                    </span>
                  </div>

                  <p className="text-xs text-gray-800 font-medium line-clamp-2 leading-relaxed">
                    {qData.question.extractedText}
                  </p>

                  {qData.analysis && (
                    <div className="mt-2 pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
                      <span className="truncate max-w-[180px]">{qData.analysis.chapter}</span>
                      <span className="text-blue-600 font-semibold">&rarr; Open 10 Questions</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* RIGHT COLUMN: 10 Practice Variations & Dual Submission Area */}
        <div className="lg:col-span-8 space-y-5">
          {activeQuestionData && (
            <>
              {/* Question Context & Variations Carousel Bar */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-gray-100">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-600 text-white">
                        Box {activeQuestionData.question.originalNumber}
                      </span>
                      <span className="text-xs font-bold text-gray-900">
                        Concept: {activeQuestionData.analysis?.concepts[0] || 'Core Subject Skill'}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500 mt-1">
                      Original: "{activeQuestionData.question.extractedText.slice(0, 80)}..."
                    </p>
                  </div>

                  <Link
                    href={`/documents/${docData.document.id}`}
                    className="text-xs text-blue-600 hover:underline font-semibold"
                  >
                    View Step 2 Breakdown &rarr;
                  </Link>
                </div>

                {/* 10 Variations Tab Strip */}
                {variations.length > 0 ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-gray-700">10 Same-Concept Practice Variations:</span>
                      <span className="text-gray-500 text-[11px]">Click variation to practice</span>
                    </div>

                    <div className="flex items-center space-x-2 overflow-x-auto pb-1">
                      {variations.map((v, vIdx) => {
                        const isVarActive = vIdx === selectedVariationIndex;
                        return (
                          <button
                            key={v.id}
                            type="button"
                            onClick={() => setSelectedVariationIndex(vIdx)}
                            className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
                              isVarActive
                                ? 'bg-blue-600 text-white shadow-xs'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            <span>#{v.variationNumber}</span>
                            <span className={`text-[9px] px-1 py-0.2 rounded font-normal ${
                              isVarActive ? 'bg-blue-700 text-white' : 'bg-white text-gray-600'
                            }`}>
                              {v.difficulty}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="p-6 bg-blue-50/50 rounded-xl border border-blue-100 text-center space-y-3">
                    <Sparkles className="w-8 h-8 text-blue-600 mx-auto" />
                    <h3 className="text-sm font-bold text-gray-900">
                      Generate 10 Same-Type Practice Questions for {activeQuestionData.question.originalNumber}
                    </h3>
                    <p className="text-xs text-gray-500 max-w-md mx-auto">
                      AI will create 10 distinct, targeted practice questions testing the exact same operational skill (ranging from easy to board-level).
                    </p>
                    <button
                      type="button"
                      disabled={isGeneratingVariations}
                      onClick={handleGenerateVariationsForActiveQ}
                      className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition disabled:opacity-50"
                    >
                      {isGeneratingVariations ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Generating 10 Practice Questions...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          <span>Generate 10 Practice Questions Now</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* Active Practice Question Box */}
              {activeVariation && (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-6 space-y-5">
                  <div className="flex items-center justify-between text-xs pb-3 border-b border-gray-100">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        Practice Question #{activeVariation.variationNumber}
                      </span>
                      <span className="text-gray-500 capitalize">
                        {activeVariation.variationType.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <span className={`px-2.5 py-0.5 rounded text-[11px] font-bold ${
                      activeVariation.difficulty === 'Easy'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : activeVariation.difficulty === 'Medium'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-red-50 text-red-700 border border-red-200'
                    }`}>
                      {activeVariation.difficulty}
                    </span>
                  </div>

                  {/* Question Text */}
                  <div className="text-base font-semibold text-gray-900 leading-relaxed bg-gray-50/40 p-4 rounded-xl border border-gray-100">
                    <MathRenderer content={activeVariation.questionText} />
                  </div>

                  {/* Objective & Progressive Hint Toggle */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
                    <span className="text-gray-500">
                      <strong className="text-gray-700">Objective:</strong> {activeVariation.learningObjective}
                    </span>

                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => handleGetHint(1)}
                        className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 font-semibold transition"
                      >
                        <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
                        <span>Need a Hint?</span>
                      </button>
                    </div>
                  </div>

                  {/* Hint Display */}
                  {hintContent && (
                    <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200 text-xs text-amber-900 space-y-1">
                      <div className="flex items-center justify-between font-bold">
                        <span>💡 Tutor Hint (Level {hintLevel}):</span>
                        {hintLevel === 1 && (
                          <button
                            type="button"
                            onClick={() => handleGetHint(2)}
                            className="text-blue-600 underline font-semibold hover:text-blue-800"
                          >
                            Need deeper step hint &rarr;
                          </button>
                        )}
                      </div>
                      <p className="leading-relaxed">{hintContent}</p>
                    </div>
                  )}

                  {/* STEP 4: DUAL SUBMISSION (Type OR Upload Copy Photo) */}
                  <div className="space-y-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-gray-700">
                        Step 4: Submit Your Solution
                      </span>

                      {/* Dual Submission Tabs */}
                      <div className="inline-flex rounded-xl bg-gray-100 p-0.5 text-xs font-semibold">
                        <button
                          type="button"
                          onClick={() => setSubmissionTab('text')}
                          className={`px-3 py-1 rounded-lg transition ${
                            submissionTab === 'text'
                              ? 'bg-white text-blue-600 shadow-xs'
                              : 'text-gray-600 hover:text-gray-900'
                          }`}
                        >
                          ✍️ Type Answer
                        </button>
                        <button
                          type="button"
                          onClick={() => setSubmissionTab('photo')}
                          className={`px-3 py-1 rounded-lg transition ${
                            submissionTab === 'photo'
                              ? 'bg-white text-blue-600 shadow-xs'
                              : 'text-gray-600 hover:text-gray-900'
                          }`}
                        >
                          📸 Upload Copy Photo (OCR)
                        </button>
                      </div>
                    </div>

                    {/* METHOD A: Text Area */}
                    {submissionTab === 'text' && (
                      <div className="space-y-2">
                        <textarea
                          rows={4}
                          value={studentTextAnswer}
                          onChange={e => setStudentTextAnswer(e.target.value)}
                          placeholder="Type your complete solution or final balanced equation here..."
                          className="w-full px-4 py-3 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                        />
                        <p className="text-[11px] text-gray-400">
                          Tip: Write step-by-step to get realistic CBSE step-marking feedback!
                        </p>
                      </div>
                    )}

                    {/* METHOD B: Upload Copy / Notebook Photo */}
                    {submissionTab === 'photo' && (
                      <div className="space-y-3">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          capture="environment"
                          onChange={handleFileChange}
                          className="hidden"
                        />

                        {imageAttachment ? (
                          <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/30 flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <img
                                src={imageAttachment.previewUrl}
                                alt="Notebook preview"
                                className="w-16 h-16 object-cover rounded-lg border border-blue-200"
                              />
                              <div>
                                <span className="text-xs font-bold text-gray-900 block truncate max-w-[200px]">
                                  {imageAttachment.filename}
                                </span>
                                <span className="text-[11px] text-emerald-700 font-semibold flex items-center space-x-1">
                                  <Check className="w-3 h-3" />
                                  <span>Notebook Photo Ready for Vision OCR</span>
                                </span>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => setImageAttachment(null)}
                              className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg transition"
                              title="Remove photo"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div
                            onClick={() => fileInputRef.current?.click()}
                            className="p-8 rounded-2xl border-2 border-dashed border-blue-300 hover:border-blue-500 bg-blue-50/20 hover:bg-blue-50/50 cursor-pointer text-center space-y-2 transition"
                          >
                            <Camera className="w-8 h-8 text-blue-600 mx-auto" />
                            <p className="text-xs font-bold text-gray-900">
                              Take a photo or upload your notebook/copy page
                            </p>
                            <p className="text-[11px] text-gray-500 max-w-sm mx-auto">
                              Solve on paper with pen, click a photo. Gemini Vision OCR will scan your handwriting and grade each step!
                            </p>
                            <span className="inline-block px-3 py-1 rounded-lg bg-blue-600 text-white text-[11px] font-semibold">
                              Choose Notebook Photo
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Submit Button */}
                    <div className="flex justify-end pt-2">
                      <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={handleSubmitAnswer}
                        className="inline-flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition disabled:opacity-50"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Grading with CBSE Rubrics & OCR...</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4" />
                            <span>Submit for Board Marking & Evaluation</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* STEP 5: INSTANT EVALUATION & SCORECARD */}
                  {evaluation && (
                    <div className="pt-6 border-t border-gray-200 space-y-4">
                      {/* Evaluation Header */}
                      <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white text-sm ${
                            evaluation.scorePercentage >= 80 ? 'bg-emerald-600' : evaluation.scorePercentage >= 50 ? 'bg-amber-600' : 'bg-red-600'
                          }`}>
                            {evaluation.estimatedMarksAwarded}/{evaluation.maxMarks}
                          </div>
                          <div>
                            <span className="text-sm font-bold text-gray-900 block">
                              Awarded: {evaluation.estimatedMarksAwarded} / {evaluation.maxMarks} Marks ({evaluation.scorePercentage}%)
                            </span>
                            <span className="text-xs text-gray-500">
                              Diagnosis: <strong className="capitalize text-gray-700">{evaluation.mistakeCategory.replace(/_/g, ' ')}</strong>
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={handleNextVariation}
                          className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition flex-shrink-0"
                        >
                          <span>Next Variation</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Transcribed text if OCR was used */}
                      {evaluation.extractedHandwrittenText && (
                        <div className="p-3.5 rounded-xl bg-blue-50/50 border border-blue-200 text-xs">
                          <span className="font-bold text-blue-900 block mb-1">
                            📝 Transcribed from your Notebook Photo (OCR):
                          </span>
                          <p className="text-gray-800 italic">{evaluation.extractedHandwrittenText}</p>
                        </div>
                      )}

                      {/* Strengths & Missing Points */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-3.5 rounded-xl bg-emerald-50/40 border border-emerald-200 text-xs space-y-1">
                          <span className="font-bold text-emerald-900 block mb-1">
                            ✅ Strengths & Good Steps:
                          </span>
                          <ul className="list-disc list-inside space-y-0.5 text-emerald-800">
                            {evaluation.strengths.map((s, i) => <li key={i}>{s}</li>)}
                          </ul>
                        </div>

                        <div className="p-3.5 rounded-xl bg-amber-50/40 border border-amber-200 text-xs space-y-1">
                          <span className="font-bold text-amber-900 block mb-1">
                            ⚠️ What Was Missing / Next Steps:
                          </span>
                          <ul className="list-disc list-inside space-y-0.5 text-amber-800">
                            {evaluation.missingPoints.map((m, i) => <li key={i}>{m}</li>)}
                          </ul>
                        </div>
                      </div>

                      {/* Model Corrected Answer */}
                      <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 text-xs space-y-2">
                        <span className="font-bold text-gray-900 block">
                          🎯 Exemplary Board Answer:
                        </span>
                        <div className="text-gray-800 leading-relaxed bg-white p-3 rounded-lg border border-gray-200">
                          <MathRenderer content={evaluation.correctedAnswer} />
                        </div>
                        <p className="text-[11px] text-gray-600">
                          <strong>Examiner Tip:</strong> {evaluation.presentationTips[0] || 'Keep steps clear and underline the final answer.'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PracticeArenaPage() {
  return (
    <Suspense fallback={
      <div className="py-24 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
      </div>
    }>
      <PracticeArenaContent />
    </Suspense>
  );
}
