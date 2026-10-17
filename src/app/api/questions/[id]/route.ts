// API: Get Question Details (Analysis, 10 Variations, Tutor Chat History)
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const question = db.getQuestion(id);
    if (!question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    const analysis = db.getAnalysis(id) || null;
    const generatedQuestions = db.getGeneratedQuestions(id);
    const chatHistory = db.getChatMessages(id);
    const document = db.getDocument(question.documentId);

    return NextResponse.json({
      success: true,
      question,
      analysis,
      generatedQuestions,
      chatHistory,
      document
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
