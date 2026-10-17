// Concept Master AI - Board Answer Evaluation & Coaching Engine
import { geminiClient } from './client';
import { MistakeCategory } from '../types';

export interface EvaluationResult {
  scorePercentage: number;
  estimatedMarksAwarded: number;
  maxMarks: number;
  isCorrect: 'correct' | 'partially_correct' | 'incorrect';
  mistakeCategory: MistakeCategory;
  strengths: string[];
  missingPoints: string[];
  reasoningErrors: string[];
  presentationTips: string[];
  correctedAnswer: string;
  detailedFeedback: string;
  extractedHandwrittenText?: string;
}

export class AnswerEvaluationService {
  /**
   * Evaluate a student's submitted written answer or handwritten notebook photo against standard CBSE marking schemes
   */
  public async evaluateStudentAnswer(
    questionText: string,
    modelAnswer: string,
    studentAnswer: string,
    subject: string,
    maxMarks: number = 3,
    imageAttachment?: { mimeType: string; data: string }
  ): Promise<EvaluationResult> {
    const hasImage = Boolean(imageAttachment && imageAttachment.data);

    const prompt = `You are a supportive, insightful CBSE Board Examination Evaluator and Answer Writing Coach.
Evaluate this student's answer fairly and constructively.
Subject: ${subject}
Max Marks: ${maxMarks}

Question:
"${questionText}"

Official Model Solution:
"${modelAnswer}"

${hasImage ? `[NOTEBOOK PHOTO PROVIDED]: An image of the student's handwritten answer sheet/copy is attached.
1. Transcribe the student's handwritten steps and final answer in the "extractedHandwrittenText" field.
2. Evaluate their written steps, formulas, calculations, or equation balance numbers from the image.` : `Student's Submitted Answer:
"${studentAnswer}"`}

EVALUATION RUBRIC:
1. Distinguish between:
   - "calculation_error" (concept was right, but arithmetic slipped)
   - "conceptual_misunderstanding" (fundamentally misunderstood the concept)
   - "incorrect_formula" (chose or wrote the wrong formula)
   - "misreading_question" (answered something other than what was asked)
   - "incomplete_written_answer" (correct start, but missed essential concluding steps or points)
   - "none" (answer is fully correct)
2. Estimate marks realistically based on CBSE step-marking guidelines (out of ${maxMarks}).
3. Identify specific missing points and presentation tips (e.g. underline keywords, box final value, write units, state formula).
4. Provide a beautifully formatted corrected answer.

Return ONLY a valid JSON object matching this schema:
{
  "scorePercentage": number (0 to 100),
  "estimatedMarksAwarded": number (e.g. 2.5),
  "maxMarks": ${maxMarks},
  "isCorrect": "correct" | "partially_correct" | "incorrect",
  "mistakeCategory": "none" | "calculation_error" | "conceptual_misunderstanding" | "incorrect_formula" | "misreading_question" | "incomplete_written_answer",
  "strengths": ["what the student did well"],
  "missingPoints": ["essential point or step omitted"],
  "reasoningErrors": ["any faulty logic or wrong assumption"],
  "presentationTips": ["CBSE presentation improvement tip"],
  "correctedAnswer": "Exemplary answer incorporating student's good points and fixing mistakes",
  "detailedFeedback": "Encouraging, pedagogical explanation in friendly Hinglish/English",
  "extractedHandwrittenText": ${hasImage ? '"Exact text transcribed from student notebook photo"' : 'null'}
}`;

    const res = await geminiClient.generateStructuredJson<EvaluationResult>(prompt, undefined, {
      temperature: 0.15,
      inlineData: hasImage ? imageAttachment : undefined
    });

    return res;
  }
}

export const answerEvaluationService = new AnswerEvaluationService();
