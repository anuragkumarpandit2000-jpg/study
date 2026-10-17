// API: Real Educational Analytics & Adaptive Concept Mastery
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { MistakeCategory } from '@/lib/types';

export async function GET(req: NextRequest) {
  try {
    const conceptProgress = db.getConceptProgress();
    const attempts = db.getAttempts();
    const documents = db.getAllDocuments();

    // Calculate aggregated real metrics
    const totalQuestionsAttempted = attempts.length;
    const correctAttempts = attempts.filter(a => a.isCorrect === 'correct').length;
    const partiallyCorrect = attempts.filter(a => a.isCorrect === 'partially_correct').length;

    const overallAccuracy = totalQuestionsAttempted > 0
      ? Math.round(((correctAttempts + 0.5 * partiallyCorrect) / totalQuestionsAttempted) * 100)
      : 0;

    // Aggregate mistake breakdown
    const mistakeBreakdown: Record<MistakeCategory, number> = {
      none: 0,
      calculation_error: 0,
      conceptual_misunderstanding: 0,
      incorrect_formula: 0,
      misreading_question: 0,
      incomplete_written_answer: 0
    };

    for (const a of attempts) {
      if (a.mistakeCategory && mistakeBreakdown[a.mistakeCategory] !== undefined) {
        mistakeBreakdown[a.mistakeCategory]++;
      }
    }

    // Identify weak concepts needing targeted revision (mastery < 70 or attempts > 0 with low score)
    const weakConcepts = conceptProgress
      .filter(c => c.totalAttempts > 0 && c.masteryScore < 70)
      .sort((a, b) => a.masteryScore - b.masteryScore);

    const masteredConcepts = conceptProgress
      .filter(c => c.totalAttempts >= 2 && c.masteryScore >= 80)
      .sort((a, b) => b.masteryScore - a.masteryScore);

    // Targeted recommendations
    const recommendations: string[] = [];
    if (mistakeBreakdown.calculation_error > 2) {
      recommendations.push('Noticeable calculation mistakes: Practice writing each algebraic step explicitly and double-checking arithmetic signs.');
    }
    if (mistakeBreakdown.conceptual_misunderstanding > 1) {
      recommendations.push('Core concepts need review: Re-read the Hinglish concept breakdowns before tackling numericals.');
    }
    if (mistakeBreakdown.incomplete_written_answer > 1) {
      recommendations.push('Board presentation point: Examiners penalize missing concluding statements. Use the Board Writing Coach checklist.');
    }
    if (weakConcepts.length > 0) {
      recommendations.push(`Priority revision: Focus on "${weakConcepts[0].conceptName}" (${weakConcepts[0].subject}) where mastery is currently ${weakConcepts[0].masteryScore}%.`);
    } else if (totalQuestionsAttempted > 0) {
      recommendations.push('Consistent performance! Continue attempting diverse Board-level question variations.');
    } else {
      recommendations.push('Welcome! Upload a question paper or practice sample questions to build your real-time concept mastery profile.');
    }

    return NextResponse.json({
      success: true,
      stats: {
        totalPapersUploaded: documents.length,
        totalQuestionsAttempted,
        correctAttempts,
        overallAccuracy,
        totalConceptsTracked: conceptProgress.length
      },
      mistakeBreakdown,
      conceptProgress,
      weakConcepts,
      masteredConcepts,
      recommendations,
      recentAttempts: attempts.slice(-10).reverse()
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
