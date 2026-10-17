// API: Fetch practice questions by mode (Guided, Test, Weakness)
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get('mode') || 'guided'; // 'guided' | 'test' | 'weakness'
    const documentId = searchParams.get('documentId');
    const subject = searchParams.get('subject');

    const data = db.getDb();
    let questionsPool: Array<{
      id: string;
      origin: 'original' | 'generated';
      questionText: string;
      subject: string;
      concept: string;
      difficulty: string;
      marks?: number | null;
      parentOriginalId?: string;
    }> = [];

    // Filter by document if specified
    const targetOriginals = documentId
      ? data.originalQuestions.filter(q => q.documentId === documentId)
      : data.originalQuestions;

    for (const oq of targetOriginals) {
      const analysis = data.questionAnalyses.find(a => a.originalQuestionId === oq.id);
      const sub = analysis?.subject || 'Mathematics';

      if (subject && subject !== 'all' && sub.toLowerCase() !== subject.toLowerCase()) {
        continue;
      }

      // Add original question
      questionsPool.push({
        id: oq.id,
        origin: 'original',
        questionText: oq.extractedText,
        subject: sub,
        concept: analysis?.concepts[0] || 'Core Concept',
        difficulty: analysis?.difficulty || 'Medium',
        marks: oq.marks || 3,
        parentOriginalId: oq.id
      });

      // Add generated variations
      const gens = data.generatedQuestions.filter(g => g.originalQuestionId === oq.id);
      for (const g of gens) {
        questionsPool.push({
          id: g.id,
          origin: 'generated',
          questionText: g.questionText,
          subject: sub,
          concept: g.concept,
          difficulty: g.difficulty,
          marks: 3,
          parentOriginalId: oq.id
        });
      }
    }

    if (mode === 'weakness') {
      // Find weak concepts (masteryScore < 70 or frequent misconceptions)
      const userProgress = db.getConceptProgress();
      const weakConcepts = userProgress
        .filter(p => p.masteryScore < 75 || p.mistakeCategories.conceptual_misunderstanding > 0)
        .map(p => p.conceptKey.toLowerCase());

      if (weakConcepts.length > 0) {
        questionsPool = questionsPool.filter(q =>
          weakConcepts.some(wc => q.concept.toLowerCase().includes(wc) || wc.includes(q.concept.toLowerCase()))
        );
      }
    }

    // Shuffle or limit
    return NextResponse.json({
      success: true,
      mode,
      totalAvailable: questionsPool.length,
      questions: questionsPool.slice(0, 30)
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
