// Concept Master AI - Core Data Model & Types

export type ProcessingStatus = 
  | 'UPLOADED'
  | 'VALIDATING'
  | 'EXTRACTING'
  | 'DETECTING_QUESTIONS'
  | 'REVIEWING_QUESTION_INVENTORY'
  | 'ANALYSING'
  | 'GENERATING_VARIATIONS'
  | 'VERIFYING'
  | 'READY_FOR_PRACTICE'
  | 'NEEDS_USER_REVIEW'
  | 'PARTIALLY_COMPLETED'
  | 'FAILED'
  | 'CANCELLED';

export type ReviewStatus = 'pending' | 'confirmed' | 'ambiguous' | 'edited';

export type QuestionDifficulty = 'Easy' | 'Medium' | 'Hard';

export type VerificationStatus = 'pending' | 'verified' | 'needs_review' | 'verification_failed';

export type MistakeCategory = 
  | 'none'
  | 'calculation_error'
  | 'conceptual_misunderstanding'
  | 'incorrect_formula'
  | 'misreading_question'
  | 'incomplete_written_answer';

export type VariationType =
  | 'basic_application'
  | 'changed_conditions'
  | 'reverse_problem'
  | 'missing_value'
  | 'conceptual_interpretation'
  | 'application_based'
  | 'different_format'
  | 'error_identification'
  | 'multistep_reasoning'
  | 'challenging_transfer';

export interface User {
  id: string;
  name: string;
  email?: string;
  createdAt: string;
}

export interface Document {
  id: string;
  userId: string;
  filename: string;
  fileType: 'pdf' | 'image' | 'text';
  processingStatus: ProcessingStatus;
  pageCount: number;
  rawText?: string;
  subject: string;
  classLevel: string;
  chapter?: string;
  board: string;
  examType: string;
  preferredLanguage: string;
  variationsCount: number;
  difficultyDistribution: 'balanced' | 'easy_to_hard' | 'board_level' | 'challenging';
  createdAt: string;
  updatedAt: string;
}

export interface AnalysisJob {
  id: string;
  documentId: string;
  status: ProcessingStatus;
  totalQuestions: number;
  completedQuestions: number;
  errorCount: number;
  currentStage: string;
  lastError?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OriginalQuestion {
  id: string;
  documentId: string;
  parentQuestionId?: string | null;
  originalNumber: string;
  subpartIdentifier?: string | null;
  extractedText: string;
  sourcePage: number;
  marks?: number | null;
  diagramReference?: string | null;
  extractionConfidence: number; // 0 to 1
  reviewStatus: ReviewStatus;
  createdAt: string;
}

export interface SolutionStep {
  stepNumber: number;
  heading: string;
  explanation: string;
  formula?: string;
  calculationOrReasoning?: string;
}

export interface CommonMistake {
  mistake: string;
  whyItOccurs: string;
  prevention: string;
}

export interface QuestionAnalysis {
  id: string;
  originalQuestionId: string;
  schemaVersion: string;
  meaningHinglish: string;
  givenInformation: string[];
  whatToFind: string[];
  subject: string;
  chapter: string;
  concepts: string[];
  subtopics: string[];
  prerequisites: string[];
  difficulty: QuestionDifficulty;
  difficultyReason: string;
  questionType: string;
  requiredKnowledge: {
    formulas?: string[];
    definitions?: string[];
    theorems?: string[];
    rules?: string[];
    units?: string[];
  };
  solvingStrategy: {
    noticeFirst: string;
    keyConcept: string;
    whyApproach: string;
    stepPlan: string[];
    alternativeMethods?: string;
  };
  stepByStepSolution: SolutionStep[];
  boardExamAnswer: {
    format: string;
    essentialPoints: string[];
    headingsAndContent: { heading?: string; content: string }[];
    conclusion?: string;
    suggestedMarks: number;
  };
  commonMistakes: CommonMistake[];
  verificationStatus: VerificationStatus;
  verificationNotes?: string;
  createdAt: string;
}

export interface GeneratedQuestion {
  id: string;
  originalQuestionId: string;
  variationNumber: number;
  variationType: VariationType;
  questionText: string;
  concept: string;
  learningObjective: string;
  questionType: string;
  difficulty: QuestionDifficulty;
  requiredKnowledge: string[];
  expectedAnswer: string;
  stepByStepSolution: SolutionStep[];
  examAnswer: string;
  verificationStatus: VerificationStatus;
  verificationNotes?: string;
  createdAt: string;
}

export interface PracticeAttempt {
  id: string;
  userId: string;
  questionId: string;
  questionOrigin: 'original' | 'generated';
  questionText: string;
  submittedAnswer: string;
  evaluation: {
    scorePercentage: number;
    estimatedMarksAwarded?: number;
    maxMarks?: number;
    strengths: string[];
    missingPoints: string[];
    reasoningErrors: string[];
    presentationTips: string[];
    correctedAnswer: string;
    detailedFeedback: string;
  };
  isCorrect: 'correct' | 'partially_correct' | 'incorrect';
  mistakeCategory: MistakeCategory;
  hintsUsed: number;
  timeSpentSeconds: number;
  createdAt: string;
}

export interface ConceptProgress {
  id: string;
  userId: string;
  subject: string;
  chapter: string;
  conceptKey: string;
  conceptName: string;
  totalAttempts: number;
  correctAttempts: number;
  mistakeCategories: Record<MistakeCategory, number>;
  masteryScore: number; // 0 to 100
  lastPracticedAt: string;
}

export interface TutorChatMessage {
  id: string;
  questionId: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

export interface CompleteQuestionData {
  question: OriginalQuestion;
  analysis?: QuestionAnalysis | null;
  generatedQuestions: GeneratedQuestion[];
}

export interface CompleteDocumentData {
  document: Document;
  job?: AnalysisJob | null;
  questions: CompleteQuestionData[];
}

export interface ExamQuestionResponse {
  questionId: string;
  responseText?: string;
  imageAttachment?: {
    data: string; // Base64
    mimeType: string;
    filename?: string;
  };
  status: 'answered' | 'marked_for_review' | 'unattempted';
  updatedAt: string;
}

export interface ExamEvaluationStep {
  stepNumber: number;
  description: string;
  marksAwarded: number;
  maxMarks: number;
  feedback: string;
}

export interface ExamQuestionResult {
  questionId: string;
  questionNumber: string;
  section?: string;
  marks: number;
  scored: number;
  studentAnswerPreview: string;
  modelAnswer: string;
  evaluationFeedback: string;
  mistakeCategory: MistakeCategory;
  stepBreakdown: ExamEvaluationStep[];
}

export interface ExamAttempt {
  id: string;
  userId: string;
  documentId: string;
  paperTitle: string;
  subject: string;
  year?: string;
  durationMinutes: number;
  startedAt: string;
  submittedAt?: string;
  timeSpentSeconds: number;
  status: 'in_progress' | 'submitted' | 'evaluated';
  responses: Record<string, ExamQuestionResponse>;
  evaluation?: {
    totalScore: number;
    maxScore: number;
    percentage: number;
    grade: string;
    summaryFeedback: string;
    sectionScores: Record<string, { scored: number; max: number; count: number }>;
    questionResults: ExamQuestionResult[];
  };
  createdAt: string;
  updatedAt: string;
}

