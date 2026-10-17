'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Sparkles, 
  Send, 
  HelpCircle, 
  Lightbulb, 
  BookOpen, 
  CheckCircle2, 
  ChevronDown, 
  ChevronUp, 
  MessageSquare,
  AlertTriangle,
  FileCheck,
  Target,
  Loader2
} from 'lucide-react';
import { OriginalQuestion, QuestionAnalysis, TutorChatMessage } from '@/lib/types';
import { MathRenderer } from '@/components/MathRenderer';

export default function QuestionTutorPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();

  const [question, setQuestion] = useState<OriginalQuestion | null>(null);
  const [analysis, setAnalysis] = useState<QuestionAnalysis | null>(null);
  const [chatHistory, setChatHistory] = useState<TutorChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Progressive help states
  const [currentHelpLevel, setCurrentHelpLevel] = useState<number | null>(null);
  const [helpContent, setHelpContent] = useState<string | null>(null);
  const [loadingHelp, setLoadingHelp] = useState(false);

  // Chat input
  const [userQuery, setUserQuery] = useState('');
  const [isSending, setIsSending] = useState(false);

  // 10 expandable sections state
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    sec1: true,
    sec2: false,
    sec3: false,
    sec4: true,
    sec5: false,
    sec6: false,
    sec7: false,
    sec8: false,
    sec9: false,
    sec10: false
  });

  const toggleSection = (key: string) => {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const fetchQuestionDetails = async (showSpinner = false) => {
    try {
      if (showSpinner) setLoading(true);
      const res = await fetch(`/api/questions/${id}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to load question tutor');

      setQuestion(json.question);
      setAnalysis(json.analysis);
      setChatHistory(json.chatHistory || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchQuestionDetails(true);
  }, [id]);

  const requestProgressiveHelp = async (level: 1 | 2 | 3) => {
    setLoadingHelp(true);
    setCurrentHelpLevel(level);
    try {
      const res = await fetch(`/api/questions/${id}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'progressive_help', level })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setHelpContent(data.content);
    } catch (err: any) {
      alert(err.message || 'Error fetching hint');
    } finally {
      setLoadingHelp(false);
    }
  };

  const handleSendMessage = async (customMessage?: string) => {
    const textToSend = customMessage || userQuery;
    if (!textToSend.trim() || isSending) return;

    setUserQuery('');
    setIsSending(true);

    // Optimistically add user message
    const tempUserMsg: TutorChatMessage = {
      id: `temp_${Date.now()}`,
      questionId: id,
      role: 'user',
      content: textToSend,
      createdAt: new Date().toISOString()
    };
    setChatHistory(prev => [...prev, tempUserMsg]);

    try {
      const res = await fetch(`/api/questions/${id}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'follow_up',
          message: textToSend
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send message');

      setChatHistory(prev => [...prev.filter(m => m.id !== tempUserMsg.id), tempUserMsg, data.reply]);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSending(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
        <p className="text-sm font-semibold text-gray-700">Connecting to Question Understanding Tutor...</p>
      </div>
    );
  }

  if (error || !question) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-red-700 max-w-xl mx-auto my-12 text-center">
        <p className="font-semibold mb-2">Question Tutor Unavailable</p>
        <p className="text-sm mb-4">{error || 'Question not found'}</p>
        <button
          onClick={() => router.push('/')}
          className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold"
        >
          Return Home
        </button>
      </div>
    );
  }

  const quickPrompts = [
    'Why did we use this specific formula?',
    'Can you explain this step again in simpler Hinglish?',
    'Is there another valid method to solve this?',
    'What is the common mistake students make here?'
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-3 border-b border-gray-200">
        <div>
          <Link
            href={`/documents/${question.documentId}`}
            className="inline-flex items-center space-x-1.5 text-xs text-blue-600 hover:text-blue-800 font-semibold mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Paper Overview</span>
          </Link>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-gray-900">
              Question Understanding Tutor &bull; {question.originalNumber} {question.subpartIdentifier || ''}
            </h1>
            {question.marks && (
              <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-xs font-semibold">
                {question.marks} Marks
              </span>
            )}
          </div>
        </div>

        {/* Practice CTA */}
        <Link
          href={`/practice?questionId=${question.id}&origin=original`}
          className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition"
        >
          <Target className="w-4 h-4" />
          <span>Attempt Question in Practice Mode</span>
        </Link>
      </div>

      {/* Question Context Card */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-2">
        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Original Question</span>
        <div className="text-base text-gray-900 font-medium leading-relaxed">
          <MathRenderer content={question.extractedText} />
        </div>
      </div>

      {/* Main 2-Column Grid: 10 Expandable Understanding Sections (Left) & Progressive Help / Live Chat (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: 10 Expandable Understanding Sections (7 Cols) */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between pb-1">
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center space-x-2">
              <BookOpen className="w-4 h-4 text-blue-600" />
              <span>10-Point Concept Understanding Panel</span>
            </h2>
            <span className="text-xs text-gray-500">Click any point to expand</span>
          </div>

          {/* 1. Understand the question */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-xs">
            <button
              onClick={() => toggleSection('sec1')}
              className="w-full p-4 text-left font-semibold text-xs text-gray-900 hover:bg-gray-50 flex items-center justify-between"
            >
              <span>1. Understand the Question (Natural Hinglish)</span>
              {openSections.sec1 ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
            </button>
            {openSections.sec1 && (
              <div className="p-4 pt-0 text-xs text-gray-700 leading-relaxed border-t border-gray-100 bg-blue-50/20">
                <MathRenderer content={analysis?.meaningHinglish || 'Analysis not ready yet.'} />
              </div>
            )}
          </div>

          {/* 2. Identify Given Information */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-xs">
            <button
              onClick={() => toggleSection('sec2')}
              className="w-full p-4 text-left font-semibold text-xs text-gray-900 hover:bg-gray-50 flex items-center justify-between"
            >
              <span>2. Identify Given Information</span>
              {openSections.sec2 ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
            </button>
            {openSections.sec2 && (
              <div className="p-4 pt-0 text-xs text-gray-700 border-t border-gray-100">
                <ul className="list-disc list-inside space-y-1">
                  {analysis?.givenInformation.map((g, i) => (
                    <li key={i}><MathRenderer content={g} className="inline" /></li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* 3. Understand What is Being Asked */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-xs">
            <button
              onClick={() => toggleSection('sec3')}
              className="w-full p-4 text-left font-semibold text-xs text-gray-900 hover:bg-gray-50 flex items-center justify-between"
            >
              <span>3. Understand What is Being Asked / Required Result</span>
              {openSections.sec3 ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
            </button>
            {openSections.sec3 && (
              <div className="p-4 pt-0 text-xs text-gray-700 border-t border-gray-100">
                <ul className="list-disc list-inside space-y-1">
                  {analysis?.whatToFind.map((w, i) => (
                    <li key={i}><MathRenderer content={w} className="inline" /></li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* 4. Learn the Relevant Concept */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-xs">
            <button
              onClick={() => toggleSection('sec4')}
              className="w-full p-4 text-left font-semibold text-xs text-gray-900 hover:bg-gray-50 flex items-center justify-between"
            >
              <span>4. Learn the Core Concept ({analysis?.concepts.join(', ')})</span>
              {openSections.sec4 ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
            </button>
            {openSections.sec4 && (
              <div className="p-4 pt-0 text-xs text-gray-700 leading-relaxed border-t border-gray-100">
                <p className="font-semibold text-blue-900 mb-1">Key Concept:</p>
                <p className="mb-2">{analysis?.solvingStrategy.keyConcept}</p>
                <p className="font-semibold text-gray-900 mb-1">Why this approach is appropriate:</p>
                <p>{analysis?.solvingStrategy.whyApproach}</p>
              </div>
            )}
          </div>

          {/* 5. Understand the Formula or Rule */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-xs">
            <button
              onClick={() => toggleSection('sec5')}
              className="w-full p-4 text-left font-semibold text-xs text-gray-900 hover:bg-gray-50 flex items-center justify-between"
            >
              <span>5. Understand the Formulas & Rules</span>
              {openSections.sec5 ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
            </button>
            {openSections.sec5 && (
              <div className="p-4 pt-0 text-xs text-gray-700 space-y-2 border-t border-gray-100">
                {analysis?.requiredKnowledge.formulas?.map((f, i) => (
                  <div key={i} className="p-2.5 rounded-lg bg-blue-50/50 border border-blue-100 font-mono text-blue-900">
                    <MathRenderer content={f} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 6. Step-by-Step Full Solution */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-xs">
            <button
              onClick={() => toggleSection('sec7')}
              className="w-full p-4 text-left font-semibold text-xs text-gray-900 hover:bg-gray-50 flex items-center justify-between"
            >
              <span>6. View Complete Worked Solution</span>
              {openSections.sec7 ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
            </button>
            {openSections.sec7 && (
              <div className="p-4 pt-0 text-xs text-gray-800 space-y-3 border-t border-gray-100">
                {analysis?.stepByStepSolution.map(s => (
                  <div key={s.stepNumber} className="border-l-2 border-blue-500 pl-3 py-1 space-y-1">
                    <span className="font-bold text-blue-800">Step {s.stepNumber}: {s.heading}</span>
                    <div className="text-gray-700"><MathRenderer content={s.explanation} /></div>
                    {s.calculationOrReasoning && (
                      <div className="bg-gray-50 p-2 rounded text-gray-900 font-mono">
                        <MathRenderer content={s.calculationOrReasoning} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 7. Board Exam Presentation */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-xs">
            <button
              onClick={() => toggleSection('sec8')}
              className="w-full p-4 text-left font-semibold text-xs text-gray-900 hover:bg-gray-50 flex items-center justify-between"
            >
              <span>7. Learn How to Write the Answer in CBSE Exam</span>
              {openSections.sec8 ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
            </button>
            {openSections.sec8 && (
              <div className="p-4 pt-0 text-xs text-gray-800 space-y-2 border-t border-gray-100 font-serif">
                {analysis?.boardExamAnswer.headingsAndContent.map((hc, i) => (
                  <div key={i}>
                    {hc.heading && <span className="font-bold font-sans text-blue-900 block">{hc.heading}:</span>}
                    <div className="pl-2 border-l border-gray-200"><MathRenderer content={hc.content} /></div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 8. Common Mistakes */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-xs">
            <button
              onClick={() => toggleSection('sec9')}
              className="w-full p-4 text-left font-semibold text-xs text-gray-900 hover:bg-gray-50 flex items-center justify-between"
            >
              <span>8. Review Common Mistakes & Traps</span>
              {openSections.sec9 ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
            </button>
            {openSections.sec9 && (
              <div className="p-4 pt-0 text-xs text-gray-800 space-y-2 border-t border-gray-100">
                {analysis?.commonMistakes.map((m, i) => (
                  <div key={i} className="p-2.5 rounded-lg bg-amber-50/50 border border-amber-200">
                    <p className="font-bold text-amber-900">Mistake: {m.mistake}</p>
                    <p className="text-gray-700">Why: {m.whyItOccurs}</p>
                    <p className="text-emerald-800 font-medium">Prevention: {m.prevention}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Progressive Help & Live Contextual Chat (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Progressive Help Tiers */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center space-x-1.5">
              <Lightbulb className="w-4 h-4 text-amber-500" />
              <span>Progressive Hint Tiers</span>
            </h3>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => requestProgressiveHelp(1)}
                className={`p-2 rounded-xl border text-center transition ${
                  currentHelpLevel === 1 ? 'border-blue-600 bg-blue-50 text-blue-900 font-bold' : 'border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-medium'
                }`}
              >
                <span className="block text-[11px] font-bold">Level 1</span>
                <span className="text-[10px] text-gray-500">Gentle Nudge</span>
              </button>

              <button
                type="button"
                onClick={() => requestProgressiveHelp(2)}
                className={`p-2 rounded-xl border text-center transition ${
                  currentHelpLevel === 2 ? 'border-blue-600 bg-blue-50 text-blue-900 font-bold' : 'border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-medium'
                }`}
              >
                <span className="block text-[11px] font-bold">Level 2</span>
                <span className="text-[10px] text-gray-500">Concept Plan</span>
              </button>

              <button
                type="button"
                onClick={() => requestProgressiveHelp(3)}
                className={`p-2 rounded-xl border text-center transition ${
                  currentHelpLevel === 3 ? 'border-blue-600 bg-blue-50 text-blue-900 font-bold' : 'border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-medium'
                }`}
              >
                <span className="block text-[11px] font-bold">Level 3</span>
                <span className="text-[10px] text-gray-500">Full Worked</span>
              </button>
            </div>

            {loadingHelp && (
              <div className="p-4 text-center text-xs text-blue-600 flex items-center justify-center space-x-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Generating tailored pedagogical hint...</span>
              </div>
            )}

            {helpContent && !loadingHelp && (
              <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 text-xs text-blue-950 leading-relaxed font-normal">
                <MathRenderer content={helpContent} />
              </div>
            )}
          </div>

          {/* Contextual Q&A Chat with Gemini Tutor */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col h-[520px]">
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-gray-900">Gemini Educational Tutor</h3>
                  <p className="text-[11px] text-emerald-600 font-medium">Grounding context in this question</p>
                </div>
              </div>
            </div>

            {/* Chat Message List */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3">
              {chatHistory.length === 0 ? (
                <div className="py-8 text-center text-xs text-gray-400 space-y-2">
                  <MessageSquare className="w-8 h-8 text-gray-300 mx-auto" />
                  <p>Ask anything about this question in natural Hinglish or English.</p>
                </div>
              ) : (
                chatHistory.map((msg, i) => (
                  <div
                    key={msg.id || i}
                    className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-blue-600 text-white rounded-br-xs'
                          : 'bg-gray-100 text-gray-900 rounded-bl-xs'
                      }`}
                    >
                      <MathRenderer content={msg.content} />
                    </div>
                  </div>
                ))
              )}

              {isSending && (
                <div className="flex items-center space-x-2 text-xs text-gray-400 italic">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                  <span>Tutor is thinking...</span>
                </div>
              )}
            </div>

            {/* Quick Prompt Chips */}
            <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 overflow-x-auto whitespace-nowrap flex gap-1.5 scrollbar-none">
              {quickPrompts.map((qp, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendMessage(qp)}
                  className="px-2.5 py-1 rounded-full bg-white border border-gray-300 text-[11px] text-gray-700 hover:border-blue-400 hover:text-blue-600 transition flex-shrink-0"
                >
                  {qp}
                </button>
              ))}
            </div>

            {/* Input Bar */}
            <div className="p-3 border-t border-gray-200">
              <form
                onSubmit={e => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center space-x-2"
              >
                <input
                  type="text"
                  value={userQuery}
                  onChange={e => setUserQuery(e.target.value)}
                  placeholder="Ask a question about this step or formula..."
                  className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-600 focus:border-transparent text-gray-900"
                />
                <button
                  type="submit"
                  disabled={!userQuery.trim() || isSending}
                  className="p-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-40 transition"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
