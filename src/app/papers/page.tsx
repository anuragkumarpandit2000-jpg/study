'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  FileText, 
  Trash2, 
  ArrowRight, 
  Play, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Plus,
  Loader2,
  GraduationCap
} from 'lucide-react';
import { Document } from '@/lib/types';
import { PyqCatalogModal } from '@/components/PyqCatalogModal';

export default function MyPapersPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPyqModalOpen, setIsPyqModalOpen] = useState(false);

  const fetchDocuments = async (showSpinner = false) => {
    try {
      if (showSpinner) setLoading(true);
      const res = await fetch('/api/documents');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setDocuments(data.documents || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments(true);
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this paper and all its analysed questions?')) return;

    try {
      const res = await fetch(`/api/documents/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete document');
      await fetchDocuments(false);
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
        <p className="text-sm font-semibold text-gray-700">Loading your question papers...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between pb-3 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Question Papers</h1>
          <p className="text-xs text-gray-500 mt-1">
            Manage your uploaded papers, inspect question inventories, and resume deep analysis.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setIsPyqModalOpen(true)}
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold shadow-xs transition cursor-pointer"
          >
            <GraduationCap className="w-4 h-4 text-amber-300" />
            <span>Official CBSE PYQ Bank (410+)</span>
          </button>

          <Link
            href="/"
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>Upload Custom</span>
          </Link>
        </div>
      </div>

      {documents.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center space-y-3">
          <FileText className="w-10 h-10 text-gray-300 mx-auto" />
          <h2 className="text-base font-bold text-gray-900">No Question Papers Yet</h2>
          <p className="text-xs text-gray-500 max-w-md mx-auto">
            Upload a CBSE question paper in PDF or image format, or enter questions manually to begin.
          </p>
          <Link
            href="/"
            className="inline-block px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-semibold shadow-xs hover:bg-blue-700 transition"
          >
            Add Your First Paper
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {documents.map(doc => {
            const isReady = doc.processingStatus === 'READY_FOR_PRACTICE';
            const isReview = doc.processingStatus === 'REVIEWING_QUESTION_INVENTORY';

            return (
              <div
                key={doc.id}
                className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs hover:border-gray-300 transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-sm text-gray-900">{doc.filename}</span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                      {doc.subject}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-gray-100 text-gray-600">
                      {doc.classLevel}
                    </span>
                  </div>

                  <div className="flex items-center space-x-3 text-xs text-gray-500">
                    <span>{doc.fileType.toUpperCase()} file</span>
                    <span>&bull;</span>
                    <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
                    <span>&bull;</span>
                    <span className="capitalize">{doc.examType}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
                  {/* Status Indicator */}
                  <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold flex items-center space-x-1 ${
                    isReady
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : isReview
                      ? 'bg-amber-50 text-amber-800 border border-amber-200'
                      : 'bg-blue-50 text-blue-700 border border-blue-200'
                  }`}>
                    {isReady ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Ready</span>
                      </>
                    ) : (
                      <>
                        <Clock className="w-3.5 h-3.5 text-blue-600" />
                        <span>{doc.processingStatus.replace(/_/g, ' ')}</span>
                      </>
                    )}
                  </span>

                  {/* Actions */}
                  {isReview ? (
                    <Link
                      href={`/documents/${doc.id}/inventory`}
                      className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold shadow-xs transition"
                    >
                      Audit Inventory &rarr;
                    </Link>
                  ) : (
                    <Link
                      href={`/documents/${doc.id}`}
                      className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition flex items-center space-x-1"
                    >
                      <span>View Analysis</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  )}

                  <button
                    type="button"
                    onClick={() => handleDelete(doc.id)}
                    className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition"
                    title="Delete Paper"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <PyqCatalogModal
        isOpen={isPyqModalOpen}
        onClose={() => setIsPyqModalOpen(false)}
        defaultMode="exam"
      />
    </div>
  );
}
