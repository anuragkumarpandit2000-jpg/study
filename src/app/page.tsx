'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  UploadCloud, 
  FileText, 
  Image as ImageIcon, 
  Edit3, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle,
  BookOpen,
  HelpCircle,
  Loader2,
  GraduationCap,
  Play
} from 'lucide-react';
import { PyqCatalogModal } from '@/components/PyqCatalogModal';

export default function HomePage() {
  const router = useRouter();

  const [isPyqModalOpen, setIsPyqModalOpen] = useState(false);
  const [inputTab, setInputTab] = useState<'manual' | 'pdf' | 'image'>('manual');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [manualText, setManualText] = useState('');
  
  // Selectors
  const [subject, setSubject] = useState('Mathematics');
  const [classLevel, setClassLevel] = useState('Class 10');
  const [chapter, setChapter] = useState('');
  const [board, setBoard] = useState('CBSE');
  const [examType, setExamType] = useState('CBSE Board Examination');
  const [preferredLanguage, setPreferredLanguage] = useState('Hinglish');
  const [variationsCount, setVariationsCount] = useState(10);
  const [difficultyDistribution, setDifficultyDistribution] = useState<'balanced' | 'easy_to_hard' | 'board_level' | 'challenging'>('balanced');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sample papers for 1-click testing across CBSE Class 10 subjects
  const samplePresets: Record<string, { subject: string; chapter: string; text: string }> = {
    'Maths: Quadratic & Real Numbers': {
      subject: 'Mathematics',
      chapter: 'Quadratic Equations & Real Numbers',
      text: `Q1. Find the value(s) of k for which the quadratic equation 2x^2 + kx + 3 = 0 has two real and equal roots. [2 marks]

Q2. Prove that sqrt(5) is an irrational number. [3 marks]

Q3(a). If alpha and beta are the zeroes of the polynomial p(x) = x^2 - 5x + 6, find the value of (alpha^2 + beta^2). [2 marks]
Q3(b). In an AP, if the 17th term exceeds its 10th term by 7, find the common difference. [2 marks]`
    },
    'Science: Light & Chemical Reactions': {
      subject: 'Science',
      chapter: 'Light Reflection & Chemical Reactions',
      text: `Q1. A convex mirror used for rear-view on an automobile has a radius of curvature of 3.00 m. If a bus is located at 5.00 m from this mirror, find the position, nature and size of the image. [3 marks]

Q2. What is meant by precipitation reaction? Explain with the help of a balanced chemical equation between aqueous sodium sulphate and barium chloride. [2 marks]

Q3. Name the enzyme present in human saliva and explain its role in digestion of food. [2 marks]`
    },
    'Social Science: History & Civics': {
      subject: 'Social Science',
      chapter: 'Nationalism in India & Federalism',
      text: `Q1. Why did Mahatma Gandhi decide to withdraw the Non-Cooperation Movement in February 1922? Explain three key reasons with reference to the Chauri Chaura incident. [3 marks]

Q2. Differentiate between "Coming Together" and "Holding Together" federations with one example of each. [3 marks]

Q3. Explain any three reasons why tertiary sector is becoming so popular in India. [3 marks]`
    },
    'English: Grammar & Analytical': {
      subject: 'English',
      chapter: 'Grammar & Writing Skills',
      text: `Q1. Report the dialogue between a doctor and patient by completing the sentence:
Doctor: "Do you exercise regularly?"
Patient: "I go for a 30-minute walk every morning."
The doctor asked the patient whether he exercised regularly, to which the patient replied that __________. [1 mark]

Q2. Identify the error in the following newspaper headline and write the correction:
"The team of scientists have discovered a new species of freshwater fish in the Western Ghats." [1 mark]`
    },
    'Hindi: Vyakaran & Pad-Parichay': {
      subject: 'Hindi',
      chapter: 'व्याकरण: पद-परिचय एवं वाक्य भेद',
      text: `Q1. निम्नलिखित रेखांकित पद का पद-परिचय दीजिए:
"रोहन प्रतिदिन सुबह बगीचे में टहलता है।" (प्रतिदिन का पद-परिचय दीजिए) [2 अंक]

Q2. रचना के आधार पर वाक्य का भेद पहचानिए तथा निर्देशानुसार बदलिए:
"सूर्योदय हुआ और पक्षी चहचहाने लगे।" (सरल वाक्य में बदलिए) [2 अंक]`
    }
  };

  const handlePresetSelect = (key: string) => {
    const preset = samplePresets[key];
    if (preset) {
      setSubject(preset.subject);
      setChapter(preset.chapter);
      setManualText(preset.text);
      setInputTab('manual');
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (inputTab === 'manual' && !manualText.trim()) {
      setError('Please enter at least one question in the editor.');
      return;
    }

    if ((inputTab === 'pdf' || inputTab === 'image') && !selectedFile) {
      setError(`Please select a ${inputTab.toUpperCase()} file to upload.`);
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      if (selectedFile && (inputTab === 'pdf' || inputTab === 'image')) {
        formData.append('file', selectedFile);
      }
      formData.append('textInput', manualText);
      formData.append('subject', subject);
      formData.append('classLevel', classLevel);
      formData.append('chapter', chapter);
      formData.append('board', board);
      formData.append('examType', examType);
      formData.append('preferredLanguage', preferredLanguage);
      formData.append('variationsCount', variationsCount.toString());
      formData.append('difficultyDistribution', difficultyDistribution);

      const res = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to upload document');
      }

      // Automatically trigger question detection and redirect to Inventory Review
      const docId = data.document.id;
      const detectRes = await fetch(`/api/documents/${docId}/detect-questions`, {
        method: 'POST'
      });
      const detectData = await detectRes.json();

      if (!detectRes.ok) {
        throw new Error(detectData.error || 'Failed to detect questions');
      }

      // Redirect to Inventory Review screen
      router.push(`/documents/${docId}/inventory`);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Something went wrong during submission');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-10">
      {/* Hero Section */}
      <div className="text-center max-w-3xl mx-auto pt-4 pb-2 space-y-3">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          <span>CBSE Class 10 Board Assessment Mastery</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
          Turn Every Question Into Deeper Understanding.
        </h1>
        <p className="text-base sm:text-lg text-gray-600 font-normal">
          Upload a paper, understand every question, and generate personalised practice.
        </p>
      </div>

      {/* 410+ Official CBSE PYQ Paper Bank & 3-Hour Exam Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-7 text-white shadow-md relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 border border-blue-800/50">
        <div className="space-y-1.5 text-center md:text-left z-10">
          <div className="inline-flex items-center space-x-2 px-3 py-0.5 rounded-full bg-amber-400 text-amber-950 font-black text-[11px] uppercase tracking-wider">
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Official CBSE Board Papers</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
            410+ Authentic CBSE Board Question Papers (2022–2026)
          </h2>
          <p className="text-xs sm:text-sm text-blue-200/90 max-w-xl">
            Take a real 3-hour timed board exam in Science, Maths, SST, English, or Hindi with CBSE step marking, live countdown, and handwritten copy OCR checking!
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsPyqModalOpen(true)}
          className="z-10 shrink-0 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs shadow-md transition flex items-center space-x-2 cursor-pointer transform hover:scale-105"
        >
          <Play className="w-4 h-4 fill-current" />
          <span>Launch 3-Hour Board Exam</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Main Input Card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Method Tabs */}
        <div className="flex border-b border-gray-200 bg-gray-50/50">
          <button
            type="button"
            onClick={() => setInputTab('manual')}
            className={`flex-1 py-3.5 px-4 text-sm font-semibold flex items-center justify-center space-x-2 border-b-2 transition ${
              inputTab === 'manual'
                ? 'border-blue-600 text-blue-600 bg-white'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Edit3 className="w-4 h-4" />
            <span>Enter Questions Manually</span>
          </button>
          <button
            type="button"
            onClick={() => setInputTab('pdf')}
            className={`flex-1 py-3.5 px-4 text-sm font-semibold flex items-center justify-center space-x-2 border-b-2 transition ${
              inputTab === 'pdf'
                ? 'border-blue-600 text-blue-600 bg-white'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Upload PDF Paper</span>
          </button>
          <button
            type="button"
            onClick={() => setInputTab('image')}
            className={`flex-1 py-3.5 px-4 text-sm font-semibold flex items-center justify-center space-x-2 border-b-2 transition ${
              inputTab === 'image'
                ? 'border-blue-600 text-blue-600 bg-white'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>Upload Photo / Scan</span>
          </button>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
          {error && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-start space-x-3 text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500 mt-0.5" />
              <div>
                <p className="font-semibold">Unable to process</p>
                <p>{error}</p>
              </div>
            </div>
          )}

          {/* Tab 1: Manual Input */}
          {inputTab === 'manual' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-semibold text-gray-900">
                  Type or Paste Questions (Single or Multiple)
                </label>
                <span className="text-xs text-gray-500">Supports Q1, Q2, subparts 3(a), math notations</span>
              </div>
              <textarea
                value={manualText}
                onChange={e => setManualText(e.target.value)}
                placeholder="Example:
Q1. Find the roots of quadratic equation 2x^2 - 7x + 3 = 0. [2 marks]

Q2(a). State Ohm's law. Draw the circuit diagram to verify it. [3 marks]
Q2(b). Why is copper used in electrical transmission lines? [2 marks]"
                rows={8}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm text-gray-900 font-mono placeholder:text-gray-400 placeholder:font-sans transition"
              />
            </div>
          )}

          {/* Tab 2: PDF Upload */}
          {inputTab === 'pdf' && (
            <div className="border-2 border-dashed border-gray-300 hover:border-blue-500 rounded-xl p-8 text-center bg-gray-50/50 hover:bg-blue-50/30 transition">
              <UploadCloud className="w-12 h-12 text-blue-600 mx-auto mb-3" />
              <p className="text-sm font-semibold text-gray-900 mb-1">
                {selectedFile ? selectedFile.name : 'Choose a PDF Question Paper'}
              </p>
              <p className="text-xs text-gray-500 mb-4">
                {selectedFile
                  ? `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB • Digital or Scanned PDF`
                  : 'Supports multipage CBSE sample papers, school pre-boards, or chapter tests'}
              </p>
              <label className="inline-flex items-center px-4 py-2 rounded-lg bg-white border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer shadow-sm">
                <span>Browse PDF file</span>
                <input
                  type="file"
                  accept=".pdf,application/pdf"
                  className="hidden"
                  onChange={e => e.target.files?.[0] && setSelectedFile(e.target.files[0])}
                />
              </label>
            </div>
          )}

          {/* Tab 3: Image Upload */}
          {inputTab === 'image' && (
            <div className="border-2 border-dashed border-gray-300 hover:border-blue-500 rounded-xl p-8 text-center bg-gray-50/50 hover:bg-blue-50/30 transition">
              <ImageIcon className="w-12 h-12 text-blue-600 mx-auto mb-3" />
              <p className="text-sm font-semibold text-gray-900 mb-1">
                {selectedFile ? selectedFile.name : 'Upload Question Sheet Photo or Screenshot'}
              </p>
              <p className="text-xs text-gray-500 mb-4">
                {selectedFile
                  ? `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB • JPG/PNG Image`
                  : 'Textbook pages, worksheet screenshots, handwritten notes, or diagrams'}
              </p>
              <label className="inline-flex items-center px-4 py-2 rounded-lg bg-white border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer shadow-sm">
                <span>Browse Image file</span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  className="hidden"
                  onChange={e => e.target.files?.[0] && setSelectedFile(e.target.files[0])}
                />
              </label>
            </div>
          )}

          {/* Selectors Grid */}
          <div className="pt-2 border-t border-gray-100">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
              Assessment Configuration
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Subject */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Subject</label>
                <select
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="Mathematics">Mathematics</option>
                  <option value="Science">Science (Physics/Chem/Bio)</option>
                  <option value="Social Science">Social Science (Hist/Civ/Geo/Eco)</option>
                  <option value="English">English (Language & Literature)</option>
                  <option value="Hindi">Hindi (Course A / B)</option>
                </select>
              </div>

              {/* Class */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Class & Board</label>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={classLevel}
                    onChange={e => setClassLevel(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 bg-white text-gray-900"
                  >
                    <option value="Class 10">Class 10</option>
                    <option value="Class 9">Class 9</option>
                    <option value="Class 11">Class 11</option>
                    <option value="Class 12">Class 12</option>
                  </select>
                  <select
                    value={board}
                    onChange={e => setBoard(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 bg-white text-gray-900"
                  >
                    <option value="CBSE">CBSE</option>
                    <option value="ICSE">ICSE</option>
                    <option value="State Board">State Board</option>
                  </select>
                </div>
              </div>

              {/* Explanation Language */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Explanation Language</label>
                <select
                  value={preferredLanguage}
                  onChange={e => setPreferredLanguage(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 bg-white text-gray-900"
                >
                  <option value="Hinglish">Hinglish (Natural & Friendly)</option>
                  <option value="English">English</option>
                  <option value="Hindi">Hindi</option>
                </select>
              </div>

              {/* Variations Count */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Variations per Question
                </label>
                <select
                  value={variationsCount}
                  onChange={e => setVariationsCount(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 bg-white text-gray-900 font-semibold"
                >
                  <option value={10}>10 Variations (Recommended)</option>
                  <option value={5}>5 Variations</option>
                  <option value={3}>3 Variations (Quick)</option>
                  <option value={15}>15 Variations (Exhaustive)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Primary Action Button */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-gray-500 flex items-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>Full inventory detection &bull; Staged 13-point analysis &bull; Zero omitted questions</span>
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-sm transition disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Detecting Complete Inventory...</span>
                </>
              ) : (
                <>
                  <span>Start Complete Paper Analysis</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* 1-Click CBSE Class 10 Sample Papers */}
      <div className="bg-blue-50/60 rounded-2xl border border-blue-100 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center space-x-2">
              <BookOpen className="w-4 h-4 text-blue-600" />
              <span>One-Click CBSE Class 10 Authentic Sample Questions</span>
            </h2>
            <p className="text-xs text-gray-600 mt-0.5">
              Select any CBSE subject to load representative board questions instantly:
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Object.entries(samplePresets).map(([title, preset]) => (
            <button
              key={title}
              type="button"
              onClick={() => handlePresetSelect(title)}
              className="p-3.5 bg-white rounded-xl border border-blue-100 hover:border-blue-300 hover:shadow-xs text-left transition group"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-blue-600">{preset.subject}</span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">Load &rarr;</span>
              </div>
              <p className="text-xs font-semibold text-gray-900 group-hover:text-blue-600 line-clamp-1">
                {title}
              </p>
              <p className="text-[11px] text-gray-500 mt-1 line-clamp-2 font-mono">
                {preset.text.slice(0, 90)}...
              </p>
            </button>
          ))}
        </div>
      </div>

      <PyqCatalogModal
        isOpen={isPyqModalOpen}
        onClose={() => setIsPyqModalOpen(false)}
        defaultMode="exam"
      />
    </div>
  );
}
