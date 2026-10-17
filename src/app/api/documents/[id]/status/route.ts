// API: Live Progress & Status Endpoint
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const doc = db.getDocument(id);
    if (!doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    const job = db.getJob(id);
    const questions = db.getQuestionsByDocument(id);
    const totalQuestions = questions.length;
    const analysedCount = questions.filter(q => db.getAnalysis(q.id) !== undefined).length;
    const variationsCount = questions.reduce((acc, q) => acc + db.getGeneratedQuestions(q.id).length, 0);
    const targetVariations = totalQuestions * (doc.variationsCount || 10);

    // Compute live progress percentage
    let progressPercentage = 0;
    if (totalQuestions > 0) {
      if (doc.processingStatus === 'READY_FOR_PRACTICE') {
        progressPercentage = 100;
      } else {
        // 50% for 13-point analyses, 50% for variations multiplier
        const analysisWeight = (analysedCount / totalQuestions) * 50;
        const variationsWeight = targetVariations > 0 
          ? (Math.min(variationsCount, targetVariations) / targetVariations) * 50 
          : 0;
        progressPercentage = Math.round(analysisWeight + variationsWeight);
        // Keep between 5% and 98% while actively processing
        progressPercentage = Math.min(98, Math.max(analysedCount > 0 ? 10 : 5, progressPercentage));
      }
    }

    // Dynamic ETA calculation (average ~10s for analysis + ~8s for variations per question)
    const remainingAnalyses = Math.max(0, totalQuestions - analysedCount);
    const remainingVariations = Math.max(0, totalQuestions - Math.floor(variationsCount / 10));
    const estimatedSecondsRemaining = doc.processingStatus === 'READY_FOR_PRACTICE'
      ? 0
      : Math.max(5, (remainingAnalyses * 10) + (remainingVariations * 8));

    let etaFormatted = 'Taiyaar (Done)';
    if (doc.processingStatus !== 'READY_FOR_PRACTICE') {
      if (estimatedSecondsRemaining >= 60) {
        const mins = Math.floor(estimatedSecondsRemaining / 60);
        const secs = estimatedSecondsRemaining % 60;
        etaFormatted = `~${mins} min ${secs > 0 ? `${secs} sec` : ''}`;
      } else {
        etaFormatted = `~${estimatedSecondsRemaining} seconds`;
      }
    }

    return NextResponse.json({
      success: true,
      documentId: id,
      status: doc.processingStatus,
      currentStage: job?.currentStage || (doc.processingStatus === 'READY_FOR_PRACTICE' ? 'Analysis Complete' : 'Analysing questions...'),
      totalQuestions,
      analysedCount,
      variationsCount,
      targetVariations,
      progressPercentage,
      estimatedSecondsRemaining,
      etaFormatted,
      lastError: job?.lastError
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
