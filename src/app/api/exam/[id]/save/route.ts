// API: Save Exam Question Response (Auto-save & Status update)
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { questionId, responseText, imageAttachment, status, timeSpentSeconds } = body;

    if (!questionId) {
      return NextResponse.json({ success: false, error: 'questionId is required' }, { status: 400 });
    }

    const attempt = db.getExamAttempt(id);
    if (!attempt) {
      return NextResponse.json({ success: false, error: 'Exam attempt not found' }, { status: 404 });
    }

    const responses = { ...attempt.responses };
    responses[questionId] = {
      questionId,
      responseText: responseText !== undefined ? responseText : responses[questionId]?.responseText,
      imageAttachment: imageAttachment !== undefined ? imageAttachment : responses[questionId]?.imageAttachment,
      status: status || responses[questionId]?.status || 'answered',
      updatedAt: new Date().toISOString()
    };

    const updated = db.updateExamAttempt(id, {
      responses,
      timeSpentSeconds: timeSpentSeconds !== undefined ? timeSpentSeconds : attempt.timeSpentSeconds
    });

    return NextResponse.json({
      success: true,
      updatedAt: updated?.updatedAt
    });
  } catch (error: any) {
    console.error('Error saving exam question response:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to save question response' },
      { status: 500 }
    );
  }
}
