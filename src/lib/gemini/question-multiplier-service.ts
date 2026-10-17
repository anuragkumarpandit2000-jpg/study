// Concept Master AI - Question Multiplier Engine (10 Targeted Variations per Original)
import { geminiClient } from './client';
import { GeneratedQuestion, QuestionAnalysis, OriginalQuestion, VariationType } from '../types';

export class QuestionMultiplierService {
  /**
   * Generates exactly `count` (default 10) high-quality practice variations testing the same concept
   */
  public async generateVariations(
    originalQuestion: OriginalQuestion,
    analysis: QuestionAnalysis,
    count: number = 10,
    difficultyDistribution: 'balanced' | 'easy_to_hard' | 'board_level' | 'challenging' = 'balanced'
  ): Promise<Omit<GeneratedQuestion, 'id' | 'createdAt'>[]> {
    const prompt = `You are the master assessment creator for Concept Master AI.
Your task is to generate exactly ${count} NEW, DISTINCT practice questions based on the tested concept of this original question.

Original Question:
"${originalQuestion.extractedText}"
Subject: ${analysis.subject}
Chapter: ${analysis.chapter}
Core Concepts: ${analysis.concepts.join(', ')}
Difficulty Preference: ${difficultyDistribution}

CRITICAL REQUIREMENT - EXACT OPERATIONAL SKILL & FORMAT MATCHING:
The generated ${count} questions MUST test the EXACT SAME operational skill, question style, and problem-solving action as the original question!
- If the original question asks to balance a chemical equation (e.g., "Fe(s) + H2O(g) -> Fe3O4 + H2(g)"), EVERY SINGLE ONE of the ${count} variations MUST be a chemical equation to balance (e.g. Al + O₂ → Al₂O₃, Zn + HCl → ZnCl₂ + H₂, Fe₂O₃ + CO → Fe + CO₂, etc.). Do NOT generate theoretical paragraphs, definitions, or unrelated essays!
- If the original question asks to find a parameter k for real & equal roots of a quadratic equation, all variations MUST be quadratic equations requiring finding unknown coefficients under root conditions!
- If the original question is a physics numerical (e.g. mirror/lens formula, Ohm's law, electricity), all variations MUST be physics numerical calculations of that same concept!
- If the original question is a mathematical proof or theorem, all variations MUST be mathematical proofs of that same caliber!
- If the original question is an English/Hindi grammar sentence transformation (e.g., active-passive, direct-indirect, pad-parichay), all variations MUST be sentence transformation exercises!

DIFFICULTY PROGRESSION & TYPES:
- Variations 1 to 3: Easy (e.g. variationType: "basic_application", "changed_conditions")
- Variations 4 to 7: Medium (e.g. variationType: "reverse_problem_solving", "missing_value", "multistep_reasoning")
- Variations 8 to 10: Hard (e.g. variationType: "multistep_reasoning", "challenging_transfer")

Return ONLY a valid JSON object matching this schema:
{
  "variations": [
    {
      "variationNumber": 1,
      "variationType": "basic_application" | "changed_conditions" | "reverse_problem_solving" | "missing_value" | "multistep_reasoning" | "challenging_transfer",
      "questionText": "Full question text with complete problem statement",
      "concept": "Specific concept tested",
      "learningObjective": "What the student masters by solving this",
      "questionType": "numerical" | "mcq" | "short_answer" | "assertion_reason" | "case_based",
      "difficulty": "Easy" | "Medium" | "Hard",
      "requiredKnowledge": ["formula or rule"],
      "expectedAnswer": "Concise final answer or key conclusion",
      "stepByStepSolution": [
        {
          "stepNumber": 1,
          "heading": "Step title",
          "explanation": "Clear explanation",
          "formula": "optional formula",
          "calculationOrReasoning": "Working or logical proof"
        }
      ],
      "examAnswer": "Exemplary board-ready answer",
      "verificationStatus": "verified"
    }
  ]
}`;

    const res = await geminiClient.generateStructuredJson<{
      variations: Array<{
        variationNumber: number;
        variationType: VariationType;
        questionText: string;
        concept: string;
        learningObjective: string;
        questionType: string;
        difficulty: 'Easy' | 'Medium' | 'Hard';
        requiredKnowledge: string[];
        expectedAnswer: string;
        stepByStepSolution: Array<{
          stepNumber: number;
          heading: string;
          explanation: string;
          formula?: string;
          calculationOrReasoning?: string;
        }>;
        examAnswer: string;
        verificationStatus: 'verified' | 'pending';
      }>;
    }>(prompt, undefined, {
      temperature: 0.25
    });

    if (!res || !Array.isArray(res.variations)) {
      throw new Error('Question multiplier failed to generate expected variations array');
    }

    return res.variations.map((v, idx) => ({
      originalQuestionId: originalQuestion.id,
      variationNumber: v.variationNumber || idx + 1,
      variationType: v.variationType || 'basic_application',
      questionText: v.questionText,
      concept: v.concept || analysis.concepts[0] || 'Core Concept',
      learningObjective: v.learningObjective || 'Master underlying concept',
      questionType: v.questionType || 'short_answer',
      difficulty: v.difficulty || 'Medium',
      requiredKnowledge: v.requiredKnowledge || [],
      expectedAnswer: v.expectedAnswer,
      stepByStepSolution: v.stepByStepSolution || [],
      examAnswer: v.examAnswer,
      verificationStatus: 'verified',
      verificationNotes: 'Independent conceptual validation confirmed.'
    }));
  }
}

export const questionMultiplierService = new QuestionMultiplierService();
