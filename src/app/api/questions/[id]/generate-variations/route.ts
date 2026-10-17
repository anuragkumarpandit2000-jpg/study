// API: Generate or Re-generate 10 Practice Variations for a Specific Question
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { questionAnalysisService } from '@/lib/gemini/question-analysis-service';
import { questionMultiplierService } from '@/lib/gemini/question-multiplier-service';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const question = db.getQuestion(id);
    if (!question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    const doc = db.getDocument(question.documentId);
    const subject = doc?.subject || 'Science';
    const classLevel = doc?.classLevel || 'Class 10';
    const preferredLanguage = doc?.preferredLanguage || 'Hinglish';
    const difficultyDistribution = doc?.difficultyDistribution || 'balanced';
    const count = doc?.variationsCount || 10;

    // 1. Ensure Question has an Analysis first
    let analysis = db.getAnalysis(id);
    if (!analysis) {
      const newAnalysis = await questionAnalysisService.analyzeQuestion(
        question,
        subject,
        classLevel,
        preferredLanguage
      );
      analysis = db.saveAnalysis(newAnalysis);
    }

    // 2. Generate exactly `count` variations
    const variations = await questionMultiplierService.generateVariations(
      question,
      analysis,
      count,
      difficultyDistribution
    );

    // 3. Save to database (idempotently replacing any old ones)
    const saved = db.saveGeneratedQuestions(variations);

    return NextResponse.json({
      success: true,
      questionId: id,
      count: saved.length,
      variations: saved
    });
  } catch (error: any) {
    console.error('Error generating variations for question:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate variations' }, { status: 500 });
  }
}
