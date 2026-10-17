// API: Staged Paper Processing Engine with Checkpoints and Resume Support
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { questionAnalysisService } from '@/lib/gemini/question-analysis-service';
import { questionMultiplierService } from '@/lib/gemini/question-multiplier-service';
import { answerVerificationService } from '@/lib/gemini/answer-verification-service';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const doc = db.getDocument(id);
    if (!doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    const allQuestions = db.getQuestionsByDocument(id);
    if (allQuestions.length === 0) {
      return NextResponse.json({ error: 'No questions detected in document' }, { status: 400 });
    }

    // Optional body for specific question IDs or batch limits
    let batchLimit = 50;
    try {
      const body = await req.json();
      if (body.batchLimit) batchLimit = Number(body.batchLimit);
    } catch {
      // No body or empty body
    }

    db.updateDocumentStatus(id, 'ANALYSING');
    db.updateJob(id, {
      status: 'ANALYSING',
      totalQuestions: allQuestions.length,
      currentStage: 'Analysing concepts, strategies, and solutions'
    });

    let processedCount = 0;

    for (let i = 0; i < allQuestions.length; i++) {
      if (processedCount >= batchLimit) break;
      const q = allQuestions[i];
      let didWork = false;

      // 1. Check if question is already analyzed (Preserve progress!)
      let analysis = db.getAnalysis(q.id);

      if (!analysis) {
        db.updateJob(id, {
          currentStage: `Question ${i + 1} of ${allQuestions.length}: Analysing ${q.originalNumber} (${q.extractedText.slice(0, 35)}...)`
        });

        const newAnalysis = await questionAnalysisService.analyzeQuestion(
          q,
          doc.subject,
          doc.classLevel,
          doc.preferredLanguage
        );

        analysis = db.saveAnalysis(newAnalysis);
        didWork = true;
      }

      // 2. Check if variations are already generated
      let variations = db.getGeneratedQuestions(q.id);

      if (variations.length === 0 && analysis) {
        db.updateDocumentStatus(id, 'GENERATING_VARIATIONS');
        db.updateJob(id, {
          status: 'GENERATING_VARIATIONS',
          currentStage: `Question ${i + 1} of ${allQuestions.length}: Generating 10 practice variations for ${q.originalNumber}`
        });

        const count = doc.variationsCount || 10;
        const newVariations = await questionMultiplierService.generateVariations(
          q,
          analysis,
          count,
          doc.difficultyDistribution
        );

        variations = db.saveGeneratedQuestions(newVariations);
        didWork = true;
      }

      // 3. Verification stage
      if (analysis && analysis.verificationStatus === 'pending') {
        db.updateDocumentStatus(id, 'VERIFYING');
        const verResult = await answerVerificationService.verifyAnswer(
          q.extractedText,
          analysis.boardExamAnswer.conclusion || 'Exam Answer',
          doc.subject,
          analysis.stepByStepSolution
        );

        db.saveAnalysis({
          ...analysis,
          verificationStatus: verResult.status,
          verificationNotes: verResult.notes
        });
        didWork = true;
      }

      if (didWork) {
        processedCount++;
      }
    }

    // Check overall completion
    const allCompletedAnalyses = allQuestions.every(q => db.getAnalysis(q.id) !== undefined);
    const allCompletedVariations = allQuestions.every(q => db.getGeneratedQuestions(q.id).length > 0);

    if (allCompletedAnalyses && allCompletedVariations) {
      db.updateDocumentStatus(id, 'READY_FOR_PRACTICE');
      db.updateJob(id, {
        status: 'READY_FOR_PRACTICE',
        completedQuestions: allQuestions.length,
        currentStage: 'All questions analysed, variations generated, and verified.'
      });
    } else {
      db.updateDocumentStatus(id, 'PARTIALLY_COMPLETED');
      db.updateJob(id, {
        status: 'PARTIALLY_COMPLETED',
        currentStage: `Processed ${processedCount} questions. More remain.`
      });
    }

    const fullData = db.getCompleteDocumentData(id);
    return NextResponse.json({
      success: true,
      data: fullData
    });
  } catch (error: any) {
    console.error('Error during paper processing:', error);
    const { id } = await params;
    db.updateDocumentStatus(id, 'PARTIALLY_COMPLETED');
    db.updateJob(id, {
      status: 'PARTIALLY_COMPLETED',
      lastError: error.message || 'Processing encountered an error',
      currentStage: 'Paused due to error. You can resume anytime without losing progress.'
    });

    return NextResponse.json({
      error: error.message || 'Processing failed',
      canResume: true
    }, { status: 500 });
  }
}
