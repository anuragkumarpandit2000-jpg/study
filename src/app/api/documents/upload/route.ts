// API: Upload / Input Question Paper (PDF, Image, or Manual Text)
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { documentService } from '@/lib/gemini/document-service';

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';

    let filename = 'Manual_Input.txt';
    let fileType: 'pdf' | 'image' | 'text' = 'text';
    let rawText = '';
    let pageCount = 1;
    let subject = 'Mathematics';
    let classLevel = 'Class 10';
    let chapter = '';
    let board = 'CBSE';
    let examType = 'Board Examination';
    let preferredLanguage = 'Hinglish';
    let variationsCount = 10;
    let difficultyDistribution: 'balanced' | 'easy_to_hard' | 'board_level' | 'challenging' = 'balanced';

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File | null;
      const textInput = (formData.get('textInput') as string) || '';

      subject = (formData.get('subject') as string) || subject;
      classLevel = (formData.get('classLevel') as string) || classLevel;
      chapter = (formData.get('chapter') as string) || chapter;
      board = (formData.get('board') as string) || board;
      examType = (formData.get('examType') as string) || examType;
      preferredLanguage = (formData.get('preferredLanguage') as string) || preferredLanguage;
      variationsCount = parseInt((formData.get('variationsCount') as string) || '10', 10);
      difficultyDistribution = (formData.get('difficultyDistribution') as any) || difficultyDistribution;

      if (file && file.size > 0) {
        filename = file.name;
        const buffer = Buffer.from(await file.arrayBuffer());

        if (file.type.includes('pdf') || filename.toLowerCase().endsWith('.pdf')) {
          fileType = 'pdf';
          const extracted = await documentService.extractFromPdf(buffer, filename);
          rawText = extracted.text;
          pageCount = extracted.pageCount;
        } else if (file.type.startsWith('image/')) {
          fileType = 'image';
          const extracted = await documentService.extractFromImage(buffer, file.type, filename);
          rawText = extracted.text;
          pageCount = extracted.pageCount;
        } else {
          // Plain text file
          rawText = buffer.toString('utf-8');
          fileType = 'text';
        }
      } else if (textInput.trim()) {
        const cleaned = documentService.cleanManualInput(textInput);
        rawText = cleaned.text;
        fileType = 'text';
        filename = `Manual_Entry_${new Date().toISOString().slice(0, 10)}.txt`;
      } else {
        return NextResponse.json({ error: 'Please provide a PDF, image, or enter question text.' }, { status: 400 });
      }
    } else {
      // JSON body for manual text
      const body = await req.json();
      subject = body.subject || subject;
      classLevel = body.classLevel || classLevel;
      chapter = body.chapter || chapter;
      board = body.board || board;
      examType = body.examType || examType;
      preferredLanguage = body.preferredLanguage || preferredLanguage;
      variationsCount = body.variationsCount ? parseInt(body.variationsCount, 10) : variationsCount;
      difficultyDistribution = body.difficultyDistribution || difficultyDistribution;

      if (!body.text || !body.text.trim()) {
        return NextResponse.json({ error: 'Question text cannot be empty.' }, { status: 400 });
      }

      const cleaned = documentService.cleanManualInput(body.text);
      rawText = cleaned.text;
      fileType = 'text';
      filename = `Manual_Questions_${new Date().toISOString().slice(0, 10)}.txt`;
    }

    // Create document in DB with UPLOADED status
    const doc = db.createDocument({
      userId: 'user_default_cbse10',
      filename,
      fileType,
      processingStatus: 'UPLOADED',
      pageCount,
      rawText,
      subject,
      classLevel,
      chapter: chapter || undefined,
      board,
      examType,
      preferredLanguage,
      variationsCount,
      difficultyDistribution
    });

    return NextResponse.json({
      success: true,
      document: doc
    });
  } catch (error: any) {
    console.error('Error in /api/documents/upload:', error);
    return NextResponse.json({ error: error.message || 'Failed to process document upload' }, { status: 500 });
  }
}
