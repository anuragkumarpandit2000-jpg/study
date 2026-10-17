// Concept Master AI - Comprehensive System & Pipeline Test Suite
import { questionDetectionService } from '../src/lib/gemini/question-detection-service';
import { questionAnalysisService } from '../src/lib/gemini/question-analysis-service';
import { questionMultiplierService } from '../src/lib/gemini/question-multiplier-service';
import { answerVerificationService } from '../src/lib/gemini/answer-verification-service';
import { answerEvaluationService } from '../src/lib/gemini/answer-evaluation-service';
import { db } from '../src/lib/db';
import { OriginalQuestion, QuestionAnalysis } from '../src/lib/types';

async function runTests() {
  console.log('====================================================');
  console.log('🚀 STARTING CONCEPT MASTER AI COMPREHENSIVE TEST SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName}`);
      if (detail) console.error(`   Detail: ${detail}`);
      failed++;
    }
  }

  // --- TEST 1: Database CRUD & Atomic Persistence ---
  console.log('--- Test Suite 1: Relational Database & Persistence ---');
  try {
    const testDoc = db.createDocument({
      userId: 'test_user',
      filename: 'CBSE_Class10_Maths_Sample.pdf',
      fileType: 'pdf',
      processingStatus: 'UPLOADED',
      pageCount: 2,
      rawText: 'Sample text',
      subject: 'Mathematics',
      classLevel: 'Class 10',
      board: 'CBSE',
      examType: 'Board Exam',
      preferredLanguage: 'Hinglish',
      variationsCount: 10,
      difficultyDistribution: 'balanced'
    });
    assert(testDoc.id.startsWith('doc_'), 'Document created with unique ID');
    assert(db.getDocument(testDoc.id) !== undefined, 'Document retrievable from persistent store');
  } catch (e: any) {
    assert(false, 'Database test threw exception', e.message);
  }

  // --- TEST 2: Question Inventory Detection & Multipart Handling ---
  console.log('\n--- Test Suite 2: Question Detection Engine & Subparts ---');
  try {
    const samplePaperText = `
SECTION A
Q1. If 2x^2 + kx + 3 = 0 has two real and equal roots, find the value of k. [2 marks]

Q2. Prove that sqrt(5) is an irrational number. [3 marks]

SECTION B
Q3(a). Find the zeroes of quadratic polynomial x^2 - 5x + 6. [2 marks]
Q3(b). In an AP, if 17th term exceeds 10th term by 7, find common difference. [2 marks]
`;
    const pages = [{ pageNumber: 1, text: samplePaperText }];
    const inventory = await questionDetectionService.detectInventory(samplePaperText, pages, 'Mathematics', 'Class 10');

    assert(inventory.questions.length >= 4, 'Detected all 4 questions/subparts without omission', `Detected ${inventory.questions.length}`);
    
    const subparts = inventory.questions.filter(q => q.subpartIdentifier !== null && q.subpartIdentifier !== undefined);
    assert(subparts.length >= 2, 'Accurately distinguished parent and subparts (3(a), 3(b))', `Found ${subparts.length} subparts`);

    // Verify DB insertion
    const linked = questionDetectionService.linkQuestions('test_doc_id', inventory.questions);
    const inserted = db.addQuestions(linked);
    assert(inserted.length === linked.length, 'All inventory questions inserted with unique IDs');
  } catch (e: any) {
    assert(false, 'Question detection test threw exception', e.message);
  }

  // --- TEST 3: Staged 13-Point Question Analysis Pedagogy ---
  console.log('\n--- Test Suite 3: Gemini Staged 13-Point Pedagogical Analysis ---');
  try {
    const testQ: OriginalQuestion = {
      id: 'q_test_maths',
      documentId: 'doc_test',
      parentQuestionId: null,
      originalNumber: 'Q1',
      subpartIdentifier: null,
      extractedText: 'Find the value(s) of k for which the quadratic equation 2x^2 + kx + 3 = 0 has two real and equal roots. [2 marks]',
      sourcePage: 1,
      marks: 2,
      extractionConfidence: 1.0,
      reviewStatus: 'confirmed',
      createdAt: new Date().toISOString()
    };

    const analysis = await questionAnalysisService.analyzeQuestion(testQ, 'Mathematics', 'Class 10', 'Hinglish');

    assert(analysis.meaningHinglish.length > 20, 'Generated student-friendly Hinglish meaning');
    assert(Array.isArray(analysis.givenInformation) && analysis.givenInformation.length > 0, 'Extracted given information');
    assert(Array.isArray(analysis.whatToFind) && analysis.whatToFind.length > 0, 'Identified what must be found');
    assert(analysis.chapter.length > 0, `Identified correct chapter (${analysis.chapter})`);
    assert(Array.isArray(analysis.concepts) && analysis.concepts.length > 0, `Identified concepts (${analysis.concepts.join(', ')})`);
    assert(analysis.stepByStepSolution.length >= 2, 'Provided structured step-by-step solution');
    assert(analysis.boardExamAnswer.headingsAndContent.length >= 2, 'Generated formal CBSE board exam answer format');
    assert(analysis.commonMistakes.length >= 1, 'Identified specific student mistakes and prevention');

    // Save to DB
    const saved = db.saveAnalysis(analysis);
    assert(saved.id.startsWith('qa_'), 'Analysis saved to database');
  } catch (e: any) {
    assert(false, 'Question analysis test threw exception', e.message);
  }

  // --- TEST 4: Question Multiplier Engine (10 Variations per Original) ---
  console.log('\n--- Test Suite 4: Question Multiplier (10 Diverse Practice Variations) ---');
  try {
    const testQ: OriginalQuestion = {
      id: 'q_test_mult',
      documentId: 'doc_test',
      parentQuestionId: null,
      originalNumber: 'Q1',
      extractedText: 'Find the value of k for which 2x^2 + kx + 3 = 0 has real and equal roots.',
      sourcePage: 1,
      marks: 2,
      extractionConfidence: 1.0,
      reviewStatus: 'confirmed',
      createdAt: new Date().toISOString()
    };

    const dummyAnalysis: QuestionAnalysis = {
      id: 'qa_dummy',
      originalQuestionId: testQ.id,
      schemaVersion: '1.0',
      meaningHinglish: 'Is question me discriminant zero karna hai.',
      givenInformation: ['Quadratic equation: 2x^2 + kx + 3 = 0', 'Roots are real and equal'],
      whatToFind: ['Value of k'],
      subject: 'Mathematics',
      chapter: 'Quadratic Equations',
      concepts: ['Nature of Roots', 'Discriminant D = b^2 - 4ac'],
      subtopics: ['Equal roots condition D = 0'],
      prerequisites: ['Standard form ax^2 + bx + c = 0'],
      difficulty: 'Medium',
      difficultyReason: 'Requires recognizing D=0 and taking square root',
      questionType: 'numerical',
      requiredKnowledge: { formulas: ['D = b^2 - 4ac', 'For equal roots, D = 0'] },
      solvingStrategy: {
        noticeFirst: 'The condition "real and equal roots"',
        keyConcept: 'D = b^2 - 4ac = 0',
        whyApproach: 'Directly relates coefficients to roots condition',
        stepPlan: ['Identify a, b, c', 'Set b^2 - 4ac = 0', 'Solve for k']
      },
      stepByStepSolution: [
        { stepNumber: 1, heading: 'Identify coefficients', explanation: 'a=2, b=k, c=3' },
        { stepNumber: 2, heading: 'Apply condition', explanation: 'k^2 - 4(2)(3) = 0 => k^2 = 24 => k = +-2*sqrt(6)' }
      ],
      boardExamAnswer: {
        format: 'Step-wise',
        essentialPoints: ['Mentioning D=0', 'Both positive and negative roots'],
        headingsAndContent: [{ heading: 'Solution', content: 'k = \\pm 2\\sqrt{6}' }],
        conclusion: 'The required values of k are 2*sqrt(6) and -2*sqrt(6).',
        suggestedMarks: 2
      },
      commonMistakes: [{ mistake: 'Forgetting +- sign', whyItOccurs: 'Only taking positive root', prevention: 'k^2 = 24 has two roots' }],
      verificationStatus: 'verified',
      createdAt: new Date().toISOString()
    };

    // Generate 10 variations
    const variations = await questionMultiplierService.generateVariations(testQ, dummyAnalysis, 10, 'balanced');
    assert(variations.length === 10, `Generated exactly 10 distinct practice variations (Received: ${variations.length})`);

    const variationTypes = new Set(variations.map(v => v.variationType));
    assert(variationTypes.size >= 2, `Variations span multiple pedagogical types (${variationTypes.size} unique types)`);

    const allHaveSolutions = variations.every(v => v.expectedAnswer && v.stepByStepSolution.length > 0);
    assert(allHaveSolutions, 'Every generated variation includes a complete step-by-step solution');
  } catch (e: any) {
    assert(false, 'Question multiplier test threw exception', e.message);
  }

  // --- TEST 5: Independent Answer Verification ---
  console.log('\n--- Test Suite 5: Independent Answer Verification Engine ---');
  try {
    const verResult = await answerVerificationService.verifyAnswer(
      'Find the roots of x^2 - 5x + 6 = 0.',
      'x = 2 and x = 3',
      'Mathematics',
      [
        { explanation: 'Factorise the quadratic: (x - 2)(x - 3) = 0', calculationOrReasoning: 'x = 2 or x = 3' }
      ]
    );
    assert(verResult.status === 'verified', `Verification confirmed correct answer (${verResult.status})`);
  } catch (e: any) {
    assert(false, 'Answer verification test threw exception', e.message);
  }

  // --- TEST 6: Board Answer Writing Coach Evaluation ---
  console.log('\n--- Test Suite 6: Board Answer Evaluation & Rubric ---');
  try {
    const evalResult = await answerEvaluationService.evaluateStudentAnswer(
      'State Ohm\'s law and write its mathematical formula.',
      'Ohm\'s law states that electric current through a conductor between two points is directly proportional to voltage across the two points, provided temperature remains constant. Formula: V = IR.',
      'Ohm\'s law says V is proportional to I. So V = IR.',
      'Science',
      2
    );

    assert(evalResult.scorePercentage >= 50, `Evaluated student answer (${evalResult.scorePercentage}%)`);
    assert(evalResult.estimatedMarksAwarded !== undefined, `Estimated marks awarded (${evalResult.estimatedMarksAwarded}/${evalResult.maxMarks})`);
    assert(evalResult.missingPoints.length > 0 || evalResult.presentationTips.length > 0, 'Identified missing points (e.g. constant temperature condition)');
  } catch (e: any) {
    assert(false, 'Answer evaluation test threw exception', e.message);
  }

  // --- SUMMARY ---
  console.log('\n====================================================');
  console.log(`TEST SUITE RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Test runner fatal error:', err);
  process.exit(1);
});
