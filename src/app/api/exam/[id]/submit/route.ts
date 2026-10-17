// API: Submit and Grade Full Board Exam Attempt
import { NextRequest, NextResponse } from 'next/server';
import { examEvaluationService } from '@/lib/gemini/exam-evaluation-service';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const evaluatedAttempt = await examEvaluationService.evaluateExamAttempt(id);

    return NextResponse.json({
      success: true,
      attempt: evaluatedAttempt
    });
  } catch (error: any) {
    console.error('Error submitting exam attempt:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to evaluate exam attempt' },
      { status: 500 }
    );
  }
}
