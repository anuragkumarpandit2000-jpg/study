// Concept Master AI - Document Extraction & OCR Service
import { geminiClient } from './client';

export interface ExtractedDocumentResult {
  text: string;
  pageCount: number;
  pages: Array<{ pageNumber: number; text: string }>;
  detectedSubject?: string;
}

export class DocumentUnderstandingService {
  /**
   * Extract text from PDF buffer.
   * If digital text is found, uses pdf-parse.
   * If scanned / empty / image-heavy, falls back to Gemini multimodal vision.
   */
  public async extractFromPdf(pdfBuffer: Buffer, filename: string): Promise<ExtractedDocumentResult> {
    try {
      // Dynamic import of pdf-parse to avoid node bundling issues in browser contexts
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pdfModule = require('pdf-parse');
      const PDFClass = pdfModule.PDFParse || (typeof pdfModule === 'function' ? pdfModule : null);
      if (PDFClass && typeof PDFClass === 'function') {
        const parser = new PDFClass({ data: pdfBuffer });
        if (typeof parser.load === 'function') {
          await parser.load();
          const data = await parser.getText();
          // Verify extracted text is meaningful content, not just page numbers like "-- 1 of 24 --"
          const cleanContent = (data?.text || '').replace(/--\s*\d+\s*of\s*\d+\s*--/gi, '').trim();
          const hasExamKeywords = /\b(Question|Section|Marks|CBSE|Roll|Solve|Find|Explain|State|Prove|Calculate|Write)\b/i.test(cleanContent);

          if (cleanContent.length > 250 && hasExamKeywords) {
            return {
              text: data.text,
              pageCount: data.total || 1,
              pages: [{ pageNumber: 1, text: data.text }]
            };
          }
        }
      }
    } catch {
      // Silently proceed to Gemini Vision OCR for scanned CBSE papers
    }

    // Fallback: Gemini multimodal vision processing for PDF
    return this.extractViaGeminiMultimodal(pdfBuffer, 'application/pdf', filename);
  }

  /**
   * Extract text and questions from images (JPG, PNG, WebP) using Gemini vision
   */
  public async extractFromImage(imageBuffer: Buffer, mimeType: string, filename: string): Promise<ExtractedDocumentResult> {
    return this.extractViaGeminiMultimodal(imageBuffer, mimeType, filename);
  }

  private async extractViaGeminiMultimodal(
    buffer: Buffer,
    mimeType: string,
    filename: string
  ): Promise<ExtractedDocumentResult> {
    const base64Data = buffer.toString('base64');

    const prompt = `You are an expert document OCR and education assessment extractor for CBSE board exam question papers.
Analyze this uploaded document (${filename}).
1. Extract ALL text faithfully, preserving exact question numbers (e.g. Q1, Q2, 3(a), 3(b)), mathematical formulas (using LaTeX notation like $x^2 + 5x + 6 = 0$ or fractions $\\frac{a}{b}$), units, tables, and marks indicated in brackets [like (2 marks) or [3]].
2. Preserve reading passages, case studies, or reference diagrams with [Diagram: description].
3. Maintain sequential page order. If multiple pages are present, delimit each page with --- PAGE [n] ---.
4. Output the complete extracted text without omitting any question.`;

    const ocrText = await geminiClient.generateText(prompt, {
      inlineData: {
        mimeType,
        data: base64Data
      },
      temperature: 0.1
    });

    const pageBlocks = ocrText.split(/--- PAGE \d+ ---/i).filter(b => b.trim().length > 0);
    const pages = pageBlocks.map((block, idx) => ({
      pageNumber: idx + 1,
      text: block.trim()
    }));

    return {
      text: ocrText,
      pageCount: pages.length > 0 ? pages.length : 1,
      pages: pages.length > 0 ? pages : [{ pageNumber: 1, text: ocrText }]
    };
  }

  /**
   * Clean and normalize manual question input
   */
  public cleanManualInput(rawInput: string): ExtractedDocumentResult {
    const text = rawInput.trim();
    return {
      text,
      pageCount: 1,
      pages: [{ pageNumber: 1, text }]
    };
  }
}

export const documentService = new DocumentUnderstandingService();
