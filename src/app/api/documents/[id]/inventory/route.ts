// API: Question Inventory Management (Inspect, Edit, Add, Delete, Confirm)
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const questions = db.getQuestionsByDocument(id);
    const doc = db.getDocument(id);
    const job = db.getJob(id);

    return NextResponse.json({
      success: true,
      document: doc,
      job,
      questions
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();

    // Action can be: 'update_question', 'add_question', 'delete_question', 'confirm_all'
    const { action } = body;

    if (action === 'update_question') {
      const { questionId, extractedText, marks, reviewStatus, originalNumber, subpartIdentifier } = body;
      const updated = db.updateQuestion(questionId, {
        extractedText,
        marks,
        reviewStatus: reviewStatus || 'edited',
        originalNumber,
        subpartIdentifier
      });
      return NextResponse.json({ success: true, question: updated });
    }

    if (action === 'add_question') {
      const { originalNumber, subpartIdentifier, extractedText, marks } = body;
      const [newQ] = db.addQuestions([
        {
          documentId: id,
          originalNumber: originalNumber || `Q${db.getQuestionsByDocument(id).length + 1}`,
          subpartIdentifier: subpartIdentifier || null,
          extractedText: extractedText || '',
          sourcePage: 1,
          marks: marks ? Number(marks) : null,
          extractionConfidence: 1.0,
          reviewStatus: 'confirmed'
        }
      ]);
      return NextResponse.json({ success: true, question: newQ });
    }

    if (action === 'delete_question') {
      const { questionId } = body;
      db.deleteQuestion(questionId);
      return NextResponse.json({ success: true, message: 'Question deleted' });
    }

    if (action === 'confirm_all') {
      const questions = db.getQuestionsByDocument(id);
      for (const q of questions) {
        if (q.reviewStatus === 'pending') {
          db.updateQuestion(q.id, { reviewStatus: 'confirmed' });
        }
      }
      return NextResponse.json({ success: true, message: 'All questions confirmed' });
    }

    return NextResponse.json({ error: 'Invalid inventory action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
