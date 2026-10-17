// Concept Master AI - Staged Deep Question Analysis Engine (All CBSE Subjects)
import { geminiClient } from './client';
import { QuestionAnalysis, OriginalQuestion } from '../types';

export class QuestionAnalysisService {
  /**
   * Analyse an individual question according to the comprehensive 13-point pedagogy
   */
  public async analyzeQuestion(
    question: OriginalQuestion,
    subject: string,
    classLevel: string = 'Class 10',
    preferredLanguage: string = 'Hinglish'
  ): Promise<Omit<QuestionAnalysis, 'id' | 'createdAt'>> {
    const prompt = `You are the master pedagogical educator and CBSE board examination specialist for Concept Master AI.
Target Audience: ${classLevel} CBSE Students preparing for board examinations.
Subject: ${subject}
Preferred Explanation Language: ${preferredLanguage} (natural, friendly Hinglish for explanations; formal clear English for CBSE exam answers).

Original Question ${question.originalNumber}${question.subpartIdentifier ? ` ${question.subpartIdentifier}` : ''}:
"${question.extractedText}"
${question.marks ? `Marks: ${question.marks}` : ''}
${question.diagramReference ? `Reference: ${question.diagramReference}` : ''}

CRITICAL PEDAGOGY GUIDELINES:
1. Explain the question's core meaning in natural, encouraging Hinglish ("Ye question aapse pooch kya raha hai...").
2. Clearly separate "What is Given" vs "What Must Be Found".
3. Identify the EXACT CBSE Chapter and Concepts. Do NOT invent syllabus topics.
   - For Mathematics: Formulas, variables, step calculations, proofs, theorems.
   - For Science: Scientific concepts, balanced chemical equations, ray diagrams/circuits, bio pathways, experiments, SI units.
   - For Social Science: Historical events, dates, causes & effects, geographical factors, civic principles, economic concepts.
   - For English: Grammar rules, literary themes, character analysis, comprehension tone, formal letter/writing format.
   - For Hindi: Vyakaran rules, sandhi/samasa, padyansh/gadyansh bhavarth, lekhak uddeshya.
4. Solving Strategy: What to notice first, which key formula or concept unlocks the question, and why this method is chosen.
5. Step-by-step solution: Rigorous, logical, and complete with calculations or detailed reasoning.
6. Board-Examination Answer: Produce a separate model answer written in pristine, formal CBSE examination style that scores maximum marks (clean headings, point-wise presentation, formulas boxed, final answer stated clearly).
7. Common Mistakes: 2-3 hyper-specific mistakes students often make on this EXACT question (e.g. sign errors, unit conversion, missing steps, vague points), why they happen, and how to avoid them.
8. Answer Verification: Verify correctness (re-check arithmetic, substitute back, verify scientific law, verify factual history/grammar).

Return ONLY a valid JSON object matching this schema:
{
  "schemaVersion": "1.0",
  "meaningHinglish": "string - natural, student-friendly explanation of what the question actually means",
  "givenInformation": ["array of given values, conditions, statements, or diagram details"],
  "whatToFind": ["array of exact outcomes to calculate, prove, explain, or identify"],
  "subject": "${subject}",
  "chapter": "exact chapter name",
  "concepts": ["main concept 1", "main concept 2"],
  "subtopics": ["specific subtopic"],
  "prerequisites": ["prerequisite knowledge"],
  "difficulty": "Easy" | "Medium" | "Hard",
  "difficultyReason": "reasoning based on conceptual depth and steps",
  "questionType": "numerical" | "proof" | "mcq" | "short_answer" | "long_answer" | "case_based" | "assertion_reason",
  "requiredKnowledge": {
    "formulas": ["formula 1 with LaTeX"],
    "definitions": ["key definition"],
    "theorems": ["theorem name/statement"],
    "rules": ["grammar or scientific rule"],
    "units": ["SI or expected units"]
  },
  "solvingStrategy": {
    "noticeFirst": "first critical observation",
    "keyConcept": "core concept that makes it solvable",
    "whyApproach": "why this method works best",
    "stepPlan": ["Step 1 plan", "Step 2 plan"],
    "alternativeMethods": "brief mention of any alternate valid method if applicable"
  },
  "stepByStepSolution": [
    {
      "stepNumber": 1,
      "heading": "Step title",
      "explanation": "Clear explanation",
      "formula": "optional formula in LaTeX",
      "calculationOrReasoning": "Detailed calculation or reasoning"
    }
  ],
  "boardExamAnswer": {
    "format": "Point-wise / Step-wise CBSE Presentation",
    "essentialPoints": ["key point that examiner checks"],
    "headingsAndContent": [
      { "heading": "Given & Formula", "content": "..." },
      { "heading": "Working", "content": "..." },
      { "heading": "Final Answer", "content": "..." }
    ],
    "conclusion": "Final concluding sentence or statement",
    "suggestedMarks": ${question.marks || 3}
  },
  "commonMistakes": [
    {
      "mistake": "exact common error",
      "whyItOccurs": "why students commit this error",
      "prevention": "how to double-check and avoid it"
    }
  ],
  "verificationStatus": "verified",
  "verificationNotes": "Arithmetic and conceptual checks passed successfully."
}`;

    const analysis = await geminiClient.generateStructuredJson<Omit<QuestionAnalysis, 'id' | 'createdAt'>>(
      prompt,
      undefined,
      {
        temperature: 0.15
      }
    );

    return {
      ...analysis,
      originalQuestionId: question.id,
      schemaVersion: '1.0'
    };
  }
}

export const questionAnalysisService = new QuestionAnalysisService();
