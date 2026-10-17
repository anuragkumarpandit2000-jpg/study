// Concept Master AI - Official CBSE PYQ Paper Bank Service
// Scans, organizes, and loads official CBSE Board Papers from D:\anurag\study\QUESTIONS\PYQS

import fs from 'fs';
import path from 'path';
import { db } from './db';
import { documentService } from './gemini/document-service';
import { questionDetectionService } from './gemini/question-detection-service';
import { Document, ExamAttempt } from './types';

const PYQS_ROOT_DIR = 'D:/anurag/study/QUESTIONS/PYQS';

export interface PyqPaperItem {
  id: string;
  subject: string;
  year: string;
  filename: string;
  filePath: string;
  fileSizeBytes: number;
  displayName: string;
  setCode?: string;
}

export interface PyqCatalog {
  subjects: Array<{
    name: string;
    label: string;
    icon: string;
    years: Array<{
      year: string;
      papers: PyqPaperItem[];
    }>;
  }>;
  totalPapers: number;
}

const SUBJECT_METADATA: Record<string, { label: string; icon: string }> = {
  SCIENCE: { label: 'Science (Class 10)', icon: '🧪' },
  MATHS: { label: 'Mathematics (Class 10)', icon: '📐' },
  SST: { label: 'Social Science (Class 10)', icon: '🌍' },
  ENGLISH: { label: 'English Language & Lit.', icon: '📖' },
  HINDI: { label: 'Hindi (Course A/B)', icon: '🇮🇳' },
  AI: { label: 'Artificial Intelligence', icon: '🤖' }
};

export class PyqService {
  private catalogCache: PyqCatalog | null = null;
  private lastCacheTime = 0;

  /**
   * Scans and returns the complete CBSE PYQ Catalog
   */
  public getCatalog(): PyqCatalog {
    const now = Date.now();
    // Cache catalog for 5 minutes
    if (this.catalogCache && now - this.lastCacheTime < 300000) {
      return this.catalogCache;
    }

    if (!fs.existsSync(PYQS_ROOT_DIR)) {
      console.warn(`PYQS root directory not found at: ${PYQS_ROOT_DIR}`);
      return { subjects: [], totalPapers: 0 };
    }

    let totalPapers = 0;
    const subjectsList: PyqCatalog['subjects'] = [];

    const subjectDirs = fs.readdirSync(PYQS_ROOT_DIR, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => d.name);

    for (const subDir of subjectDirs) {
      const subUpper = subDir.toUpperCase();
      const meta = SUBJECT_METADATA[subUpper] || { label: subDir, icon: '📄' };
      const subPath = path.join(PYQS_ROOT_DIR, subDir);

      const yearDirs = fs.readdirSync(subPath, { withFileTypes: true })
        .filter(d => d.isDirectory())
        .map(d => d.name);

      const yearsList: Array<{ year: string; papers: PyqPaperItem[] }> = [];

      for (const yDir of yearDirs) {
        // Extract 4-digit year like '2024' from 'SCIENCE 2024' or 'MATH 2023'
        const match = yDir.match(/20\d{2}/);
        const year = match ? match[0] : yDir;
        const yearPath = path.join(subPath, yDir);

        const pdfFiles = fs.readdirSync(yearPath, { withFileTypes: true })
          .filter(f => f.isFile() && f.name.toLowerCase().endsWith('.pdf'))
          .map(f => {
            const fullPath = path.join(yearPath, f.name).replace(/\\/g, '/');
            const stat = fs.statSync(fullPath);
            totalPapers++;

            // Clean display name (e.g. 31_1_1_Science.pdf -> Set 31/1/1)
            let setCode = '';
            const codeMatch = f.name.match(/(\d+[-_]\d+[-_]\d+|\d+[-_][A-Z0-9]+[-_]\d+)/i);
            if (codeMatch) {
              setCode = codeMatch[1].replace(/_/g, '/').replace(/-/g, '/');
            }

            const cleanSubjectName = meta.label.split(' ')[0];
            const displayName = setCode
              ? `${cleanSubjectName} ${year} (Set ${setCode})`
              : `${cleanSubjectName} ${year} - ${f.name.replace('.pdf', '')}`;

            const id = `pyq_${subUpper.toLowerCase()}_${year}_${f.name.replace(/[^a-zA-Z0-9]/g, '_')}`;

            return {
              id,
              subject: subUpper,
              year,
              filename: f.name,
              filePath: fullPath,
              fileSizeBytes: stat.size,
              displayName,
              setCode: setCode || undefined
            };
          });

        if (pdfFiles.length > 0) {
          yearsList.push({
            year,
            papers: pdfFiles
          });
        }
      }

      // Sort years descending (2026, 2025, 2024...)
      yearsList.sort((a, b) => b.year.localeCompare(a.year));

      subjectsList.push({
        name: subUpper,
        label: meta.label,
        icon: meta.icon,
        years: yearsList
      });
    }

    const catalog: PyqCatalog = {
      subjects: subjectsList,
      totalPapers
    };

    this.catalogCache = catalog;
    this.lastCacheTime = now;
    return catalog;
  }

  /**
   * Loads a specific PYQ paper into the Document database, extracts questions,
   * and optionally starts an Exam Attempt.
   */
  public async loadPaper(filePath: string, mode: 'exam' | 'practice' = 'exam'): Promise<{
    document: Document;
    examAttempt?: ExamAttempt;
    questionsCount: number;
  }> {
    const normalizedPath = filePath.replace(/\\/g, '/');
    if (!fs.existsSync(normalizedPath)) {
      throw new Error(`Paper file not found at: ${normalizedPath}`);
    }

    const filename = path.basename(normalizedPath);

    // Derive subject and year
    let subject = 'Science';
    if (normalizedPath.toLowerCase().includes('math')) subject = 'Mathematics';
    else if (normalizedPath.toLowerCase().includes('sst') || normalizedPath.toLowerCase().includes('social')) subject = 'Social Science';
    else if (normalizedPath.toLowerCase().includes('english')) subject = 'English';
    else if (normalizedPath.toLowerCase().includes('hindi')) subject = 'Hindi';
    else if (normalizedPath.toLowerCase().includes('ai')) subject = 'Artificial Intelligence';

    const yearMatch = normalizedPath.match(/20\d{2}/);
    const year = yearMatch ? yearMatch[0] : '2024';

    // 1. Check if document was already imported previously with extracted questions
    const existingDocs = db.getDocuments();
    const existing = existingDocs.find(d => d.filename === filename);

    let doc: Document;
    let questions = existing ? db.getQuestionsByDocument(existing.id) : [];

    if (existing && questions.length > 0) {
      doc = existing;
    } else {
      // 2. Read PDF buffer & extract text
      const buffer = fs.readFileSync(normalizedPath);
      const extracted = await documentService.extractFromPdf(buffer, filename);

      doc = db.createDocument({
        userId: 'user_default_cbse10',
        filename,
        fileType: 'pdf',
        processingStatus: 'DETECTING_QUESTIONS',
        pageCount: extracted.pageCount,
        rawText: extracted.text,
        subject,
        classLevel: 'Class 10',
        board: 'CBSE',
        examType: `Board Examination ${year}`,
        preferredLanguage: 'Hinglish',
        variationsCount: 10,
        difficultyDistribution: 'board_level'
      });

      // 3. Detect all questions from extracted text
      const detectedResult = await questionDetectionService.detectInventory(
        extracted.text,
        extracted.pages || [{ pageNumber: 1, text: extracted.text }],
        subject,
        'Class 10'
      );

      db.addQuestions(
        detectedResult.questions.map(q => ({
          documentId: doc.id,
          originalNumber: q.originalNumber,
          subpartIdentifier: q.subpartIdentifier,
          extractedText: q.extractedText,
          sourcePage: q.sourcePage || 1,
          marks: q.marks,
          diagramReference: q.diagramReference,
          extractionConfidence: q.extractionConfidence ?? 0.95,
          reviewStatus: 'confirmed'
        }))
      );

      db.updateDocument(doc.id, {
        processingStatus: 'READY_FOR_PRACTICE'
      });

      questions = db.getQuestionsByDocument(doc.id);
    }

    // 4. If mode is exam, initialize a brand new Exam Attempt
    let examAttempt: ExamAttempt | undefined;
    if (mode === 'exam') {
      const initialResponses: ExamAttempt['responses'] = {};
      for (const q of questions) {
        initialResponses[q.id] = {
          questionId: q.id,
          status: 'unattempted',
          updatedAt: new Date().toISOString()
        };
      }

      examAttempt = db.createExamAttempt({
        userId: 'user_default_cbse10',
        documentId: doc.id,
        paperTitle: `CBSE Class 10 ${subject} Board Exam ${year} (${filename.replace('.pdf', '')})`,
        subject,
        year,
        durationMinutes: 180, // Standard 3-hour CBSE exam
        startedAt: new Date().toISOString(),
        timeSpentSeconds: 0,
        status: 'in_progress',
        responses: initialResponses
      });
    }

    return {
      document: doc,
      examAttempt,
      questionsCount: questions.length
    };
  }
}

export const pyqService = new PyqService();
