// Concept Master AI - Question Inventory Detection Engine
import { geminiClient } from './client';
import { OriginalQuestion } from '../types';

export interface DetectedQuestionItem {
  originalNumber: string;
  subpartIdentifier?: string | null;
  parentQuestionNumber?: string | null;
  extractedText: string;
  sourcePage: number;
  marks?: number | null;
  diagramReference?: string | null;
  extractionConfidence: number; // 0.0 to 1.0
  isAmbiguous?: boolean;
}

export interface QuestionInventoryResult {
  totalQuestionsDetected: number;
  questions: DetectedQuestionItem[];
  detectedSubject?: string;
  detectedClass?: string;
}

export class QuestionDetectionService {
  /**
   * Detect complete question inventory across all pages of the document
   */
  public async detectInventory(
    fullText: string,
    pages: Array<{ pageNumber: number; text: string }>,
    subjectHint?: string,
    classHint?: string
  ): Promise<QuestionInventoryResult> {
    const prompt = `You are a CBSE Assessment Analysis System.
Your mission is to establish a 100% COMPLETE QUESTION INVENTORY from this question paper text.

Document pages text:
${pages.map(p => `[PAGE ${p.pageNumber}]\n${p.text}`).join('\n\n')}

INSTRUCTIONS:
1. Detect EVERY question and subquestion.
   - Example parent/subparts: "3(a)", "3(b)", "Q4(i)", "Q4(ii)"
   - Set originalNumber to "Q1", "Q2", "Q3", etc.
   - If it is a subpart, set subpartIdentifier to "(a)", "(b)", "(i)", etc., and set parentQuestionNumber to "Q3".
2. Preserve reading passages, case studies, or reference diagrams that questions depend on (include the shared passage in the question text or reference it in diagramReference).
3. Extract marks indicated for the question if present (e.g. 1, 2, 3, 5 marks).
4. Do NOT omit or hallucinate questions. Inspect all pages.
5. Provide confidence score (0.0 to 1.0) and flag if text is ambiguous.
6. Identify the subject (Mathematics, Science, Social Science, English, Hindi, etc.) and class (e.g. Class 10) if mentioned in header or question contents.

Return ONLY a valid JSON object matching this schema:
{
  "totalQuestionsDetected": number,
  "detectedSubject": string,
  "detectedClass": string,
  "questions": [
    {
      "originalNumber": "Q1",
      "subpartIdentifier": null,
      "parentQuestionNumber": null,
      "extractedText": "exact question wording",
      "sourcePage": 1,
      "marks": 2,
      "diagramReference": null,
      "extractionConfidence": 0.95,
      "isAmbiguous": false
    }
  ]
}`;

    const inventory = await geminiClient.generateStructuredJson<QuestionInventoryResult>(prompt, undefined, {
      temperature: 0.1
    });

    if (!inventory || !Array.isArray(inventory.questions)) {
      throw new Error('Question detection engine returned invalid inventory structure');
    }

    return inventory;
  }

  /**
   * Convert detected items into database-ready OriginalQuestion entities with linked parentQuestionIds
   */
  public linkQuestions(
    documentId: string,
    items: DetectedQuestionItem[]
  ): Omit<OriginalQuestion, 'id' | 'createdAt'>[] {
    // Map from question number (e.g. "Q3") to placeholder
    const result: Omit<OriginalQuestion, 'id' | 'createdAt'>[] = [];

    for (const item of items) {
      result.push({
        documentId,
        parentQuestionId: null, // Will resolve after IDs generated if needed
        originalNumber: item.originalNumber,
        subpartIdentifier: item.subpartIdentifier || null,
        extractedText: item.extractedText,
        sourcePage: item.sourcePage || 1,
        marks: item.marks || null,
        diagramReference: item.diagramReference || null,
        extractionConfidence: item.extractionConfidence ?? 0.9,
        reviewStatus: item.isAmbiguous ? 'ambiguous' : 'confirmed'
      });
    }

    return result;
  }
}

export const questionDetectionService = new QuestionDetectionService();
