// API: Question Understanding Tutor Chat & Progressive Help
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { tutorChatService } from '@/lib/gemini/tutor-chat-service';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { mode, message, level } = body;

    const question = db.getQuestion(id);
    if (!question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    const analysis = db.getAnalysis(id);
    if (!analysis) {
      return NextResponse.json({ error: 'Question analysis not completed yet' }, { status: 400 });
    }

    if (mode === 'progressive_help') {
      const hintLevel = Number(level || 1) as 1 | 2 | 3;
      const hintText = await tutorChatService.getProgressiveHelp(question, analysis, hintLevel);

      return NextResponse.json({
        success: true,
        level: hintLevel,
        content: hintText
      });
    }

    if (mode === 'follow_up') {
      if (!message || !message.trim()) {
        return NextResponse.json({ error: 'Message cannot be empty' }, { status: 400 });
      }

      // Record student message in DB
      db.addChatMessage({
        questionId: id,
        role: 'user',
        content: message
      });

      const history = db.getChatMessages(id);
      const reply = await tutorChatService.answerFollowUp(question, analysis, history, message);

      // Record assistant reply in DB
      const tutorMsg = db.addChatMessage({
        questionId: id,
        role: 'assistant',
        content: reply
      });

      return NextResponse.json({
        success: true,
        reply: tutorMsg
      });
    }

    return NextResponse.json({ error: 'Invalid chat mode' }, { status: 400 });
  } catch (error: any) {
    console.error('Error in question chat:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
