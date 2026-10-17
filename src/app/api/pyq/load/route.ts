import { NextRequest, NextResponse } from 'next/server';
import { pyqService } from '@/lib/pyq-service';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { filePath, mode = 'exam' } = body;

    if (!filePath) {
      return NextResponse.json({ success: false, error: 'filePath is required' }, { status: 400 });
    }

    const result = await pyqService.loadPaper(filePath, mode);

    return NextResponse.json({
      success: true,
      documentId: result.document.id,
      examAttemptId: result.examAttempt?.id,
      questionsCount: result.questionsCount,
      subject: result.document.subject,
      filename: result.document.filename
    });
  } catch (error: any) {
    console.error('Error loading PYQ paper:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to load PYQ paper' },
      { status: 500 }
    );
  }
}
