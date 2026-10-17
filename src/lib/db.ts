// Concept Master AI - Persistent Transactional Relational Database Store
import fs from 'fs';
import path from 'path';
import {
  User,
  Document,
  AnalysisJob,
  OriginalQuestion,
  QuestionAnalysis,
  GeneratedQuestion,
  PracticeAttempt,
  ConceptProgress,
  TutorChatMessage,
  CompleteDocumentData,
  CompleteQuestionData,
  ProcessingStatus,
  ExamAttempt
} from './types';

interface DatabaseSchema {
  users: User[];
  documents: Document[];
  analysisJobs: AnalysisJob[];
  originalQuestions: OriginalQuestion[];
  questionAnalyses: QuestionAnalysis[];
  generatedQuestions: GeneratedQuestion[];
  practiceAttempts: PracticeAttempt[];
  conceptProgress: ConceptProgress[];
  tutorChatMessages: TutorChatMessage[];
  examAttempts: ExamAttempt[];
}

const DEFAULT_USER_ID = 'user_default_cbse10';

class DatabaseService {
  private filePath: string;
  private data: DatabaseSchema;
  private isInitialized: boolean = false;

  constructor() {
    const rawPath = process.env.DATABASE_PATH || './.data/concept_master.db.json';
    this.filePath = path.isAbsolute(rawPath) ? rawPath : path.join(process.cwd(), rawPath);
    const dir = path.dirname(this.filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    this.data = this.load();
  }

  public sync(): DatabaseSchema {
    this.data = this.load();
    return this.data;
  }

  private load(): DatabaseSchema {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        const parsed = JSON.parse(raw);
        if (!parsed.examAttempts) parsed.examAttempts = [];
        return parsed;
      }
    } catch (e) {
      console.error('Error loading database file, initializing empty store:', e);
    }

    const initial: DatabaseSchema = {
      users: [
        {
          id: DEFAULT_USER_ID,
          name: 'CBSE Class 10 Scholar',
          email: 'student@conceptmaster.ai',
          createdAt: new Date().toISOString()
        }
      ],
      documents: [],
      analysisJobs: [],
      originalQuestions: [],
      questionAnalyses: [],
      generatedQuestions: [],
      practiceAttempts: [],
      conceptProgress: [],
      tutorChatMessages: [],
      examAttempts: []
    };
    this.save(initial);
    return initial;
  }

  private save(dataToSave?: DatabaseSchema) {
    const target = dataToSave || this.data;
    const tempPath = `${this.filePath}.tmp.${Date.now()}`;
    try {
      fs.writeFileSync(tempPath, JSON.stringify(target, null, 2), 'utf-8');
      fs.renameSync(tempPath, this.filePath);
    } catch (e) {
      console.error('Error saving database atomically:', e);
      // Fallback direct write
      fs.writeFileSync(this.filePath, JSON.stringify(target, null, 2), 'utf-8');
    }
  }

  public getDb(): DatabaseSchema {
    this.sync();
    return this.data;
  }

  // --- Users ---
  public getUser(id: string = DEFAULT_USER_ID): User {
    this.sync();
    let user = this.data.users.find(u => u.id === id);
    if (!user) {
      user = {
        id,
        name: 'CBSE Class 10 Scholar',
        email: 'student@conceptmaster.ai',
        createdAt: new Date().toISOString()
      };
      this.data.users.push(user);
      this.save();
    }
    return user;
  }

  // --- Documents ---
  public createDocument(doc: Omit<Document, 'id' | 'createdAt' | 'updatedAt'>): Document {
    this.sync();
    const newDoc: Document = {
      ...doc,
      id: `doc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.data.documents.unshift(newDoc);

    // Automatically create initial analysis job
    const job: AnalysisJob = {
      id: `job_${newDoc.id}`,
      documentId: newDoc.id,
      status: newDoc.processingStatus,
      totalQuestions: 0,
      completedQuestions: 0,
      errorCount: 0,
      currentStage: 'Initialized',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.data.analysisJobs.push(job);

    this.save();
    return newDoc;
  }

  public getDocument(id: string): Document | undefined {
    this.sync();
    return this.data.documents.find(d => d.id === id);
  }

  public getAllDocuments(userId: string = DEFAULT_USER_ID): Document[] {
    this.sync();
    return this.data.documents.filter(d => d.userId === userId || !d.userId);
  }

  public getDocuments(userId: string = DEFAULT_USER_ID): Document[] {
    return this.getAllDocuments(userId);
  }

  public updateDocument(id: string, updates: Partial<Document>): Document | undefined {
    const doc = this.data.documents.find(d => d.id === id);
    if (doc) {
      Object.assign(doc, updates, { updatedAt: new Date().toISOString() });
      this.save();
    }
    return doc;
  }

  public updateDocumentStatus(id: string, status: ProcessingStatus, rawText?: string): Document | undefined {
    const doc = this.data.documents.find(d => d.id === id);
    if (doc) {
      doc.processingStatus = status;
      if (rawText !== undefined) doc.rawText = rawText;
      doc.updatedAt = new Date().toISOString();

      const job = this.data.analysisJobs.find(j => j.documentId === id);
      if (job) {
        job.status = status;
        job.updatedAt = new Date().toISOString();
      }

      this.save();
    }
    return doc;
  }

  public deleteDocument(id: string): boolean {
    const initialLen = this.data.documents.length;
    this.data.documents = this.data.documents.filter(d => d.id !== id);
    this.data.analysisJobs = this.data.analysisJobs.filter(j => j.documentId !== id);
    
    // Find all question IDs for this doc
    const qIds = this.data.originalQuestions.filter(q => q.documentId === id).map(q => q.id);
    this.data.originalQuestions = this.data.originalQuestions.filter(q => q.documentId !== id);
    this.data.questionAnalyses = this.data.questionAnalyses.filter(a => !qIds.includes(a.originalQuestionId));
    this.data.generatedQuestions = this.data.generatedQuestions.filter(g => !qIds.includes(g.originalQuestionId));
    this.save();
    return this.data.documents.length < initialLen;
  }

  // --- Analysis Jobs ---
  public getJob(documentId: string): AnalysisJob | undefined {
    return this.data.analysisJobs.find(j => j.documentId === documentId);
  }

  public updateJob(documentId: string, updates: Partial<AnalysisJob>): AnalysisJob | undefined {
    const job = this.data.analysisJobs.find(j => j.documentId === documentId);
    if (job) {
      Object.assign(job, updates, { updatedAt: new Date().toISOString() });
      this.save();
    }
    return job;
  }

  // --- Original Questions ---
  public addQuestions(questions: Omit<OriginalQuestion, 'id' | 'createdAt'>[]): OriginalQuestion[] {
    this.sync();
    const created: OriginalQuestion[] = questions.map((q, idx) => ({
      ...q,
      id: `q_${q.documentId}_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString()
    }));
    this.data.originalQuestions.push(...created);

    // Update job total questions
    if (questions.length > 0) {
      const docId = questions[0].documentId;
      const job = this.data.analysisJobs.find(j => j.documentId === docId);
      if (job) {
        const total = this.data.originalQuestions.filter(q => q.documentId === docId).length;
        job.totalQuestions = total;
        job.updatedAt = new Date().toISOString();
      }
    }

    this.save();
    return created;
  }

  public getQuestionsByDocument(documentId: string): OriginalQuestion[] {
    this.sync();
    return this.data.originalQuestions.filter(q => q.documentId === documentId);
  }

  public getQuestion(id: string): OriginalQuestion | undefined {
    this.sync();
    return this.data.originalQuestions.find(q => q.id === id);
  }

  public updateQuestion(id: string, updates: Partial<OriginalQuestion>): OriginalQuestion | undefined {
    this.sync();
    const q = this.data.originalQuestions.find(item => item.id === id);
    if (q) {
      Object.assign(q, updates);
      this.save();
    }
    return q;
  }

  public deleteQuestion(id: string): boolean {
    this.sync();
    const initialLen = this.data.originalQuestions.length;
    this.data.originalQuestions = this.data.originalQuestions.filter(q => q.id !== id);
    this.data.questionAnalyses = this.data.questionAnalyses.filter(a => a.originalQuestionId !== id);
    this.data.generatedQuestions = this.data.generatedQuestions.filter(g => g.originalQuestionId !== id);
    this.save();
    return this.data.originalQuestions.length < initialLen;
  }

  // --- Question Analyses ---
  public saveAnalysis(analysis: Omit<QuestionAnalysis, 'id' | 'createdAt'>): QuestionAnalysis {
    this.sync();
    const existingIdx = this.data.questionAnalyses.findIndex(a => a.originalQuestionId === analysis.originalQuestionId);
    const newAnalysis: QuestionAnalysis = {
      ...analysis,
      id: existingIdx >= 0 ? this.data.questionAnalyses[existingIdx].id : `qa_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString()
    };

    if (existingIdx >= 0) {
      this.data.questionAnalyses[existingIdx] = newAnalysis;
    } else {
      this.data.questionAnalyses.push(newAnalysis);
    }

    // Update Question analysis status
    const question = this.data.originalQuestions.find(q => q.id === analysis.originalQuestionId);
    if (question) {
      const job = this.data.analysisJobs.find(j => j.documentId === question.documentId);
      if (job) {
        const completed = this.data.questionAnalyses.filter(a => {
          const q = this.data.originalQuestions.find(oq => oq.id === a.originalQuestionId);
          return q && q.documentId === question.documentId;
        }).length;
        job.completedQuestions = completed;
        job.updatedAt = new Date().toISOString();
      }
    }

    this.save();
    return newAnalysis;
  }

  public getAnalysis(originalQuestionId: string): QuestionAnalysis | undefined {
    this.sync();
    return this.data.questionAnalyses.find(a => a.originalQuestionId === originalQuestionId);
  }

  // --- Generated Questions ---
  public saveGeneratedQuestions(questions: Omit<GeneratedQuestion, 'id' | 'createdAt'>[]): GeneratedQuestion[] {
    if (questions.length === 0) return [];
    this.sync();
    const origId = questions[0].originalQuestionId;
    // Replace any prior generated questions for this specific original question to prevent duplicates
    this.data.generatedQuestions = this.data.generatedQuestions.filter(g => g.originalQuestionId !== origId);

    const created: GeneratedQuestion[] = questions.map((g, idx) => ({
      ...g,
      id: `gen_${g.originalQuestionId}_${Date.now()}_${idx}`,
      createdAt: new Date().toISOString()
    }));
    this.data.generatedQuestions.push(...created);
    this.save();
    return created;
  }

  public getGeneratedQuestions(originalQuestionId: string): GeneratedQuestion[] {
    this.sync();
    return this.data.generatedQuestions.filter(g => g.originalQuestionId === originalQuestionId);
  }

  // --- Practice Attempts & Adaptive Learning ---
  public recordAttempt(attempt: Omit<PracticeAttempt, 'id' | 'createdAt'>): PracticeAttempt {
    this.sync();
    const newAttempt: PracticeAttempt = {
      ...attempt,
      id: `att_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString()
    };
    this.data.practiceAttempts.push(newAttempt);

    // Update ConceptProgress model if concept is identified
    this.updateConceptMastery(newAttempt);

    this.save();
    return newAttempt;
  }

  private updateConceptMastery(attempt: PracticeAttempt) {
    // Locate the question & concept
    let conceptKey = 'General Concept';
    let conceptName = 'General Concept';
    let subject = 'General';
    let chapter = 'General';

    if (attempt.questionOrigin === 'original') {
      const analysis = this.data.questionAnalyses.find(a => a.originalQuestionId === attempt.questionId);
      if (analysis) {
        subject = analysis.subject;
        chapter = analysis.chapter;
        conceptKey = analysis.concepts[0] || chapter;
        conceptName = conceptKey;
      }
    } else {
      const genQ = this.data.generatedQuestions.find(g => g.id === attempt.questionId);
      if (genQ) {
        conceptKey = genQ.concept;
        conceptName = genQ.concept;
        const parentAnalysis = this.data.questionAnalyses.find(a => a.originalQuestionId === genQ.originalQuestionId);
        if (parentAnalysis) {
          subject = parentAnalysis.subject;
          chapter = parentAnalysis.chapter;
        }
      }
    }

    let progress = this.data.conceptProgress.find(
      p => p.userId === attempt.userId && p.conceptKey.toLowerCase() === conceptKey.toLowerCase()
    );

    if (!progress) {
      progress = {
        id: `cp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        userId: attempt.userId,
        subject,
        chapter,
        conceptKey,
        conceptName,
        totalAttempts: 0,
        correctAttempts: 0,
        mistakeCategories: {
          none: 0,
          calculation_error: 0,
          conceptual_misunderstanding: 0,
          incorrect_formula: 0,
          misreading_question: 0,
          incomplete_written_answer: 0
        },
        masteryScore: 0,
        lastPracticedAt: new Date().toISOString()
      };
      this.data.conceptProgress.push(progress);
    }

    progress.totalAttempts += 1;
    if (attempt.isCorrect === 'correct') {
      progress.correctAttempts += 1;
    } else if (attempt.isCorrect === 'partially_correct') {
      progress.correctAttempts += 0.5;
    }

    if (attempt.mistakeCategory && progress.mistakeCategories[attempt.mistakeCategory] !== undefined) {
      progress.mistakeCategories[attempt.mistakeCategory] += 1;
    }

    // Dynamic Mastery Calculation (Transparent score 0-100)
    // Weighted by accuracy and penalized for recurring conceptual misunderstandings
    const accuracy = (progress.correctAttempts / progress.totalAttempts) * 100;
    const conceptualPenalty = progress.mistakeCategories.conceptual_misunderstanding * 5;
    const hintsPenalty = Math.min(attempt.hintsUsed * 3, 15);
    const score = Math.max(5, Math.min(100, Math.round(accuracy - conceptualPenalty - hintsPenalty)));
    progress.masteryScore = score;
    progress.lastPracticedAt = new Date().toISOString();
  }

  public getConceptProgress(userId: string = DEFAULT_USER_ID): ConceptProgress[] {
    return this.data.conceptProgress.filter(p => p.userId === userId);
  }

  public getAttempts(userId: string = DEFAULT_USER_ID): PracticeAttempt[] {
    return this.data.practiceAttempts.filter(a => a.userId === userId);
  }

  // --- Tutor Chat ---
  public addChatMessage(msg: Omit<TutorChatMessage, 'id' | 'createdAt'>): TutorChatMessage {
    const newMsg: TutorChatMessage = {
      ...msg,
      id: `chat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString()
    };
    this.data.tutorChatMessages.push(newMsg);
    this.save();
    return newMsg;
  }

  public getChatMessages(questionId: string): TutorChatMessage[] {
    return this.data.tutorChatMessages.filter(m => m.questionId === questionId);
  }

  // --- Aggregate Views ---
  public getCompleteDocumentData(documentId: string): CompleteDocumentData | null {
    const document = this.getDocument(documentId);
    if (!document) return null;

    const job = this.getJob(documentId) || null;
    const questions = this.getQuestionsByDocument(documentId);

    const questionsData: CompleteQuestionData[] = questions.map(q => {
      const analysis = this.getAnalysis(q.id) || null;
      const generated = this.getGeneratedQuestions(q.id);
      return {
        question: q,
        analysis,
        generatedQuestions: generated
      };
    });

    return {
      document,
      job,
      questions: questionsData
    };
  }

  // --- Exam Attempts ---
  public createExamAttempt(attempt: Omit<ExamAttempt, 'id' | 'createdAt' | 'updatedAt'>): ExamAttempt {
    this.sync();
    const newAttempt: ExamAttempt = {
      ...attempt,
      id: `exam_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    if (!this.data.examAttempts) this.data.examAttempts = [];
    this.data.examAttempts.push(newAttempt);
    this.save();
    return newAttempt;
  }

  public getExamAttempt(id: string): ExamAttempt | undefined {
    this.sync();
    return (this.data.examAttempts || []).find(e => e.id === id);
  }

  public updateExamAttempt(id: string, updates: Partial<ExamAttempt>): ExamAttempt | undefined {
    this.sync();
    const idx = (this.data.examAttempts || []).findIndex(e => e.id === id);
    if (idx === -1) return undefined;

    this.data.examAttempts[idx] = {
      ...this.data.examAttempts[idx],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    this.save();
    return this.data.examAttempts[idx];
  }

  public listExamAttempts(userId: string = DEFAULT_USER_ID): ExamAttempt[] {
    this.sync();
    return (this.data.examAttempts || [])
      .filter(e => e.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
}

export const db = new DatabaseService();
