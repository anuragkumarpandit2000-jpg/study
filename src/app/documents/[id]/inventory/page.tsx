'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  CheckCircle, 
  AlertTriangle, 
  Edit2, 
  Plus, 
  Trash2, 
  ArrowRight, 
  FileCheck, 
  HelpCircle,
  Loader2,
  Sparkles
} from 'lucide-react';
import { OriginalQuestion, Document, AnalysisJob } from '@/lib/types';
import { MathRenderer } from '@/components/MathRenderer';

export default function QuestionInventoryPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();

  const [document, setDocument] = useState<Document | null>(null);
  const [job, setJob] = useState<AnalysisJob | null>(null);
  const [questions, setQuestions] = useState<OriginalQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Editing state
  const [editingQuestion, setEditingQuestion] = useState<OriginalQuestion | null>(null);
  const [editText, setEditText] = useState('');
  const [editMarks, setEditMarks] = useState<number | ''>('');
  const [editNumber, setEditNumber] = useState('');
  const [editSubpart, setEditSubpart] = useState('');

  // New question modal state
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);
  const [newNumber, setNewNumber] = useState('');
  const [newSubpart, setNewSubpart] = useState('');
  const [newText, setNewText] = useState('');
  const [newMarks, setNewMarks] = useState<number | ''>(3);

  // Processing trigger state
  const [isStartingProcess, setIsStartingProcess] = useState(false);

  const fetchInventory = async (showSpinner = false) => {
    try {
      if (showSpinner) setLoading(true);
      const res = await fetch(`/api/documents/${id}/inventory`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load inventory');

      setDocument(data.document);
      setJob(data.job);
      setQuestions(data.questions || []);
    } catch (err: any) {
      setError(err.message || 'Error loading question inventory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchInventory(true);
  }, [id]);

  const handleEditOpen = (q: OriginalQuestion) => {
    setEditingQuestion(q);
    setEditText(q.extractedText);
    setEditMarks(q.marks || '');
    setEditNumber(q.originalNumber);
    setEditSubpart(q.subpartIdentifier || '');
  };

  const handleSaveEdit = async () => {
    if (!editingQuestion) return;

    try {
      const res = await fetch(`/api/documents/${id}/inventory`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_question',
          questionId: editingQuestion.id,
          extractedText: editText,
          marks: editMarks ? Number(editMarks) : null,
          originalNumber: editNumber,
          subpartIdentifier: editSubpart || null,
          reviewStatus: 'confirmed'
        })
      });

      if (!res.ok) throw new Error('Failed to update question');

      setEditingQuestion(null);
      await fetchInventory();
    } catch (err: any) {
      alert(err.message || 'Error updating question');
    }
  };

  const handleFlagAmbiguous = async (q: OriginalQuestion) => {
    try {
      const newStatus = q.reviewStatus === 'ambiguous' ? 'confirmed' : 'ambiguous';
      const res = await fetch(`/api/documents/${id}/inventory`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_question',
          questionId: q.id,
          extractedText: q.extractedText,
          marks: q.marks,
          originalNumber: q.originalNumber,
          subpartIdentifier: q.subpartIdentifier,
          reviewStatus: newStatus
        })
      });

      if (!res.ok) throw new Error('Failed to flag question');
      await fetchInventory();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteQuestion = async (qId: string) => {
    if (!confirm('Are you sure you want to delete this question from the inventory?')) return;

    try {
      const res = await fetch(`/api/documents/${id}/inventory`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete_question',
          questionId: qId
        })
      });

      if (!res.ok) throw new Error('Failed to delete question');
      await fetchInventory();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newText.trim()) return;

    try {
      const res = await fetch(`/api/documents/${id}/inventory`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add_question',
          originalNumber: newNumber || `Q${questions.length + 1}`,
          subpartIdentifier: newSubpart || null,
          extractedText: newText,
          marks: newMarks ? Number(newMarks) : null
        })
      });

      if (!res.ok) throw new Error('Failed to add question');

      setIsAddingQuestion(false);
      setNewText('');
      setNewNumber('');
      setNewSubpart('');
      await fetchInventory();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleStartAnalysis = async () => {
    setIsStartingProcess(true);
    try {
      // Confirm all questions
      await fetch(`/api/documents/${id}/inventory`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'confirm_all' })
      });

      // Redirect to the Paper Analysis page which drives the live execution
      router.push(`/documents/${id}`);
    } catch (err: any) {
      alert(err.message || 'Error starting analysis');
      setIsStartingProcess(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
        <p className="text-sm font-semibold text-gray-700">Loading complete question inventory...</p>
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-red-700 max-w-xl mx-auto my-12 text-center">
        <p className="font-semibold mb-2">Error loading inventory</p>
        <p className="text-sm mb-4">{error || 'Document not found'}</p>
        <button
          onClick={() => router.push('/')}
          className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700"
        >
          Return Home
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header & Coverage Tracker */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-blue-600 mb-1 uppercase tracking-wider">
            <span>Stage 3 of Pipeline</span>
            <span>&bull;</span>
            <span>Question Inventory Audit</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{document.filename}</h1>
          <p className="text-xs text-gray-500 mt-1">
            {document.subject} &bull; {document.classLevel} &bull; {document.board} &bull; {questions.length} detected questions
          </p>
        </div>

        <div className="flex items-center space-x-3 w-full md:w-auto">
          <button
            type="button"
            onClick={() => setIsAddingQuestion(true)}
            className="flex-1 md:flex-none inline-flex items-center justify-center space-x-1.5 px-3.5 py-2 rounded-xl bg-gray-50 border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-100 transition"
          >
            <Plus className="w-4 h-4 text-gray-500" />
            <span>Add Question</span>
          </button>
          <button
            type="button"
            onClick={handleStartAnalysis}
            disabled={isStartingProcess || questions.length === 0}
            className="flex-1 md:flex-none inline-flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-sm transition disabled:opacity-50"
          >
            {isStartingProcess ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Confirming...</span>
              </>
            ) : (
              <>
                <FileCheck className="w-4 h-4" />
                <span>Confirm & Start Full Analysis</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Coverage Guarantee Banner */}
      <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-4 text-xs text-blue-900 flex items-start space-x-3">
        <Sparkles className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-sm">Full Document Coverage Guarantee (13-Point + 10 Practice Variations)</p>
          <p className="text-blue-800 mt-0.5 leading-relaxed">
            Every question listed below will receive an individual 13-point pedagogical analysis, step-by-step CBSE solution, and exactly 10 targeted practice variations. AI reasoning thoroughly hone ki wajah se isme 30-60 seconds lagna bilkul normal hai. Agle page par aapko real-time live loading bar aur timer countdown dikhega.
          </p>
        </div>
      </div>

      {/* Question Inventory Table / List */}
      <div className="space-y-4">
        {questions.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center text-gray-500">
            <p className="text-sm font-semibold mb-2">No questions detected in document text.</p>
            <p className="text-xs mb-4">You can manually add questions or re-upload the document.</p>
            <button
              onClick={() => setIsAddingQuestion(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold"
            >
              Add First Question
            </button>
          </div>
        ) : (
          questions.map((q, idx) => (
            <div
              key={q.id}
              className={`bg-white rounded-2xl border p-5 shadow-xs transition ${
                q.reviewStatus === 'ambiguous'
                  ? 'border-amber-300 bg-amber-50/20'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex items-center space-x-2">
                  <span className="px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 font-bold text-xs border border-blue-100">
                    {q.originalNumber} {q.subpartIdentifier || ''}
                  </span>
                  {q.marks && (
                    <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 text-xs font-medium">
                      {q.marks} {q.marks === 1 ? 'mark' : 'marks'}
                    </span>
                  )}
                  {q.reviewStatus === 'ambiguous' ? (
                    <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[11px] font-semibold flex items-center space-x-1">
                      <AlertTriangle className="w-3 h-3 text-amber-600" />
                      <span>Flagged for Review</span>
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-semibold flex items-center space-x-1">
                      <CheckCircle className="w-3 h-3 text-emerald-600" />
                      <span>Verified Inventory</span>
                    </span>
                  )}
                  <span className="text-[11px] text-gray-400">Page {q.sourcePage}</span>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-1">
                  <button
                    type="button"
                    onClick={() => handleFlagAmbiguous(q)}
                    title={q.reviewStatus === 'ambiguous' ? 'Unflag' : 'Flag as Ambiguous'}
                    className={`p-1.5 rounded-lg text-xs font-medium transition ${
                      q.reviewStatus === 'ambiguous'
                        ? 'bg-amber-100 text-amber-800'
                        : 'text-gray-400 hover:text-amber-600 hover:bg-gray-100'
                    }`}
                  >
                    <AlertTriangle className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleEditOpen(q)}
                    title="Edit Wording / Marks"
                    className="p-1.5 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-gray-100 transition"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteQuestion(q.id)}
                    title="Delete Question"
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Question Text */}
              <div className="text-sm text-gray-900 font-normal leading-relaxed pl-1">
                <MathRenderer content={q.extractedText} />
              </div>

              {q.diagramReference && (
                <div className="mt-2 text-xs text-blue-700 bg-blue-50/50 p-2 rounded-lg border border-blue-100">
                  <span className="font-semibold">Associated Figure/Diagram:</span> {q.diagramReference}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Edit Question Modal */}
      {editingQuestion && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-xl">
            <h2 className="text-lg font-bold text-gray-900">Edit Question Wording & Marks</h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Question Number</label>
                <input
                  type="text"
                  value={editNumber}
                  onChange={e => setEditNumber(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Subpart (e.g. (a), (i))</label>
                <input
                  type="text"
                  value={editSubpart}
                  onChange={e => setEditSubpart(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Extracted Text</label>
              <textarea
                value={editText}
                onChange={e => setEditText(e.target.value)}
                rows={5}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Marks</label>
              <input
                type="number"
                value={editMarks}
                onChange={e => setEditMarks(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-32 px-3 py-2 text-sm rounded-lg border border-gray-300"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingQuestion(null)}
                className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                className="px-4 py-2 text-sm font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add New Question Modal */}
      {isAddingQuestion && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <form onSubmit={handleAddQuestion} className="bg-white rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-xl">
            <h2 className="text-lg font-bold text-gray-900">Add Missed Question to Inventory</h2>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Number</label>
                <input
                  type="text"
                  placeholder="e.g. Q4"
                  value={newNumber}
                  onChange={e => setNewNumber(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Subpart</label>
                <input
                  type="text"
                  placeholder="e.g. (a)"
                  value={newSubpart}
                  onChange={e => setNewSubpart(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Marks</label>
                <input
                  type="number"
                  value={newMarks}
                  onChange={e => setNewMarks(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Question Wording</label>
              <textarea
                value={newText}
                onChange={e => setNewText(e.target.value)}
                placeholder="Enter complete question statement..."
                rows={5}
                required
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAddingQuestion(false)}
                className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700"
              >
                Add Question
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
