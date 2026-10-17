// API: Practice Answer Submission & Board Marking Evaluation
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { answerEvaluationService } from '@/lib/gemini/answer-evaluation-service';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      questionId,
      questionOrigin,
      questionText,
      submittedAnswer,
      maxMarks,
      hintsUsed,
      timeSpentSeconds,
      subject,
      imageAttachment
    } = body;

    const hasText = Boolean(submittedAnswer && submittedAnswer.trim());
    const hasImage = Boolean(imageAttachment && imageAttachment.data);

    if (!questionId || (!hasText && !hasImage)) {
      return NextResponse.json({ error: 'Please enter an answer or upload a photo of your copy.' }, { status: 400 });
    }

    // Retrieve model answer
    let modelAnswer = 'Detailed model solution';
    let questionSubject = subject || 'General';

    if (questionOrigin === 'original') {
      const analysis = db.getAnalysis(questionId);
      if (analysis) {
        questionSubject = analysis.subject;
        modelAnswer = analysis.boardExamAnswer.conclusion || analysis.stepByStepSolution.map(s => s.explanation).join('\n');
      }
    } else {
      const allGen = db.getDb().generatedQuestions;
      const genQ = allGen.find(g => g.id === questionId);
      if (genQ) {
        modelAnswer = genQ.examAnswer || genQ.expectedAnswer;
      }
    }

    // Evaluate using Gemini Board Evaluator (Multimodal Vision OCR or Text)
    const evaluation = await answerEvaluationService.evaluateStudentAnswer(
      questionText || 'Question',
      modelAnswer,
      submittedAnswer || '',
      questionSubject,
      maxMarks || 3,
      hasImage ? imageAttachment : undefined
    );

    const effectiveAnswer = hasImage
      ? (evaluation.extractedHandwrittenText || '[Handwritten copy photo evaluated via Vision OCR]')
      : (submittedAnswer || '');

    // Record in database and update Concept Mastery
    const attempt = db.recordAttempt({
      userId: 'user_default_cbse10',
      questionId,
      questionOrigin: questionOrigin || 'original',
      questionText: questionText || '',
      submittedAnswer: effectiveAnswer,
      evaluation,
      isCorrect: evaluation.isCorrect,
      mistakeCategory: evaluation.mistakeCategory,
      hintsUsed: hintsUsed || 0,
      timeSpentSeconds: timeSpentSeconds || 0
    });

    return NextResponse.json({
      success: true,
      attempt,
      evaluation
    });
  } catch (error: any) {
    console.error('Error in practice submit:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
