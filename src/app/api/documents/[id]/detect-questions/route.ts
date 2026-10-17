// API: Detect complete question inventory for a document
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { questionDetectionService } from '@/lib/gemini/question-detection-service';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const doc = db.getDocument(id);
    if (!doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    if (!doc.rawText || !doc.rawText.trim()) {
      return NextResponse.json({ error: 'Document contains no readable text' }, { status: 400 });
    }

    // Update status to DETECTING_QUESTIONS
    db.updateDocumentStatus(id, 'DETECTING_QUESTIONS');
    db.updateJob(id, { currentStage: 'Detecting all questions and subparts' });

    // Detect inventory
    const pages = [{ pageNumber: 1, text: doc.rawText }];
    const inventory = await questionDetectionService.detectInventory(
      doc.rawText,
      pages,
      doc.subject,
      doc.classLevel
    );

    // If subject was detected and wasn't manually set, update document
    if (inventory.detectedSubject && doc.subject === 'General') {
      doc.subject = inventory.detectedSubject;
    }

    // Clear any previous detected questions for this document to avoid duplicates on re-run
    const existingQuestions = db.getQuestionsByDocument(id);
    for (const eq of existingQuestions) {
      db.deleteQuestion(eq.id);
    }

    // Format and insert into DB
    const questionsToInsert = questionDetectionService.linkQuestions(id, inventory.questions);
    const inserted = db.addQuestions(questionsToInsert);

    // Update document status to REVIEWING_QUESTION_INVENTORY
    db.updateDocumentStatus(id, 'REVIEWING_QUESTION_INVENTORY');
    db.updateJob(id, {
      status: 'REVIEWING_QUESTION_INVENTORY',
      totalQuestions: inserted.length,
      currentStage: 'Inventory detected. Ready for user confirmation.'
    });

    return NextResponse.json({
      success: true,
      totalQuestions: inserted.length,
      questions: inserted
    });
  } catch (error: any) {
    console.error('Error in detect-questions:', error);
    const { id } = await params;
    db.updateDocumentStatus(id, 'FAILED');
    db.updateJob(id, {
      status: 'FAILED',
      lastError: error.message || 'Question detection failed'
    });
    return NextResponse.json({ error: error.message || 'Detection failed' }, { status: 500 });
  }
}
