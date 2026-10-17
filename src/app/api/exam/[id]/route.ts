// API: Get Exam Attempt data
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const attempt = db.getExamAttempt(id);
    if (!attempt) {
      return NextResponse.json({ success: false, error: 'Exam attempt not found' }, { status: 404 });
    }

    const document = db.getDocument(attempt.documentId);
    const questions = document ? db.getQuestionsByDocument(document.id) : [];

    return NextResponse.json({
      success: true,
      attempt,
      document,
      questions
    });
  } catch (error: any) {
    console.error('Error fetching exam attempt:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch exam attempt' },
      { status: 500 }
    );
  }
}
