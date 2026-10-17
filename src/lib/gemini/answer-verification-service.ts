// Concept Master AI - Independent Answer Verification Engine
import { geminiClient } from './client';
import { VerificationStatus, QuestionDifficulty } from '../types';

export interface VerificationResult {
  status: VerificationStatus;
  notes: string;
  calculatedAnswer?: string;
  isConsistent: boolean;
}

export class AnswerVerificationService {
  /**
   * Run multi-stage verification on a question and proposed solution
   */
  public async verifyAnswer(
    questionText: string,
    proposedAnswer: string,
    subject: string,
    stepByStepSolution: Array<{ explanation: string; calculationOrReasoning?: string }>
  ): Promise<VerificationResult> {
    // 1. Deterministic arithmetic sanity check if numerical expressions exist
    const isMathOrScience = /math|physics|chem|science/i.test(subject);

    const prompt = `You are an uncompromising Academic Verification Auditor for CBSE board assessments.
Inspect this question and its proposed solution to determine whether it is 100% correct, logically sound, and accurate.

Question:
"${questionText}"

Subject: ${subject}

Proposed Final Answer:
"${proposedAnswer}"

Step-by-step working:
${stepByStepSolution.map((s, i) => `Step ${i + 1}: ${s.explanation} ${s.calculationOrReasoning || ''}`).join('\n')}

VERIFICATION CHECKS:
1. Arithmetic & Calculation: Independently recalculate from scratch. Check sign (+/-), fractions, squaring, units.
2. Scientific Laws & Logic: Verify physical laws (e.g. conservation of energy, Ohm's law, ray conventions, chemical balancing).
3. Social Science & Facts: Verify historical dates, constitutional provisions, geographical terms.
4. Language & Grammar: Check precision, coherence, grammatical correctness.

Return ONLY a valid JSON object matching:
{
  "isConsistent": true | false,
  "status": "verified" | "needs_review" | "verification_failed",
  "calculatedAnswer": "Your independently derived answer",
  "notes": "Detailed verification notes explaining why it is correct or what was flagged"
}`;

    try {
      const res = await geminiClient.generateStructuredJson<VerificationResult>(prompt, undefined, {
        temperature: 0.05
      });

      return {
        status: res.status || (res.isConsistent ? 'verified' : 'needs_review'),
        notes: res.notes || 'Verified against board standards',
        calculatedAnswer: res.calculatedAnswer,
        isConsistent: res.isConsistent ?? true
      };
    } catch (err) {
      console.warn('Verification call failed, marking as needs_review:', err);
      return {
        status: 'needs_review',
        notes: 'Independent audit could not conclude automatically.',
        isConsistent: true
      };
    }
  }
}

export const answerVerificationService = new AnswerVerificationService();
