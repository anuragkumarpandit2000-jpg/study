// Script to seed representative authentic CBSE Class 10 Paper into DB
import { db } from '../src/lib/db';
import { OriginalQuestion, QuestionAnalysis, GeneratedQuestion } from '../src/lib/types';

async function seed() {
  console.log('Seeding authentic CBSE Class 10 Paper...');

  const doc = db.createDocument({
    userId: 'user_default_cbse10',
    filename: 'CBSE_Class10_Mathematics_Standard_Sample.pdf',
    fileType: 'pdf',
    processingStatus: 'READY_FOR_PRACTICE',
    pageCount: 3,
    rawText: `CBSE CLASS X - MATHEMATICS STANDARD
SECTION A
Q1. Find the value of k for which the quadratic equation 2x^2 + kx + 3 = 0 has two real and equal roots. [2 marks]

Q2. Prove that sqrt(5) is an irrational number. [3 marks]

SECTION B
Q3(a). If alpha and beta are the zeroes of the polynomial p(x) = x^2 - 5x + 6, find the value of (alpha^2 + beta^2). [2 marks]
Q3(b). In an AP, if the 17th term exceeds its 10th term by 7, find the common difference d. [2 marks]`,
    subject: 'Mathematics',
    classLevel: 'Class 10',
    chapter: 'Quadratic Equations & Polynomials',
    board: 'CBSE',
    examType: 'CBSE Board Examination',
    preferredLanguage: 'Hinglish',
    variationsCount: 10,
    difficultyDistribution: 'balanced'
  });

  // Questions
  const qList = [
    {
      documentId: doc.id,
      originalNumber: 'Q1',
      subpartIdentifier: null,
      parentQuestionId: null,
      extractedText: 'Find the value(s) of k for which the quadratic equation 2x^2 + kx + 3 = 0 has two real and equal roots. [2 marks]',
      sourcePage: 1,
      marks: 2,
      extractionConfidence: 1.0,
      reviewStatus: 'confirmed' as const
    },
    {
      documentId: doc.id,
      originalNumber: 'Q2',
      subpartIdentifier: null,
      parentQuestionId: null,
      extractedText: 'Prove that sqrt(5) is an irrational number. [3 marks]',
      sourcePage: 1,
      marks: 3,
      extractionConfidence: 1.0,
      reviewStatus: 'confirmed' as const
    },
    {
      documentId: doc.id,
      originalNumber: 'Q3',
      subpartIdentifier: '(a)',
      parentQuestionId: null,
      extractedText: 'If alpha and beta are the zeroes of the polynomial p(x) = x^2 - 5x + 6, find the value of (alpha^2 + beta^2). [2 marks]',
      sourcePage: 2,
      marks: 2,
      extractionConfidence: 1.0,
      reviewStatus: 'confirmed' as const
    },
    {
      documentId: doc.id,
      originalNumber: 'Q3',
      subpartIdentifier: '(b)',
      parentQuestionId: null,
      extractedText: 'In an AP, if the 17th term exceeds its 10th term by 7, find the common difference d. [2 marks]',
      sourcePage: 2,
      marks: 2,
      extractionConfidence: 1.0,
      reviewStatus: 'confirmed' as const
    }
  ];

  const createdQuestions = db.addQuestions(qList);

  // Analysis for Q1
  const q1 = createdQuestions[0];
  const q1Analysis = db.saveAnalysis({
    originalQuestionId: q1.id,
    schemaVersion: '1.0',
    meaningHinglish: 'Is question me ek quadratic equation di gayi hai: 2x^2 + kx + 3 = 0. Hame bataya gaya hai ki iske dono roots "real and equal" hain. Hume unknown constant "k" ki value nikaalni hai.',
    givenInformation: [
      'Quadratic equation: 2x^2 + kx + 3 = 0',
      'Coefficients: a = 2, b = k, c = 3',
      'Condition: The roots are real and equal'
    ],
    whatToFind: ['All possible real values of the constant k'],
    subject: 'Mathematics',
    chapter: 'Quadratic Equations',
    concepts: ['Discriminant D = b^2 - 4ac', 'Nature of Roots'],
    subtopics: ['Equal roots condition D = 0'],
    prerequisites: ['Standard quadratic form ax^2 + bx + c = 0', 'Solving basic equations with radicals'],
    difficulty: 'Medium',
    difficultyReason: 'Direct formula application, but students often forget the negative sign when taking square roots (k = +- 2*sqrt(6)).',
    questionType: 'numerical',
    requiredKnowledge: {
      formulas: ['D = b^2 - 4ac', 'For real and equal roots: D = 0', 'k = \\pm \\sqrt{4ac}'],
      theorems: ['Nature of roots theorem based on sign of discriminant'],
      rules: ['Always take both positive and negative roots when solving k^2 = N']
    },
    solvingStrategy: {
      noticeFirst: 'Key phrase: "two real and equal roots". In CBSE, this immediately triggers the discriminant condition D = 0.',
      keyConcept: 'D = b^2 - 4ac = 0',
      whyApproach: 'It is the most direct and mathematically exact criterion without needing to factor or graph.',
      stepPlan: [
        'Compare 2x^2 + kx + 3 = 0 with ax^2 + bx + c = 0 to extract a=2, b=k, c=3.',
        'Write the discriminant formula D = b^2 - 4ac.',
        'Substitute values and equate to zero: k^2 - 4(2)(3) = 0.',
        'Solve k^2 = 24 => k = +- 2*sqrt(6).'
      ],
      alternativeMethods: 'Using quadratic formula roots x = (-b +- sqrt(D))/(2a), the +- term vanishes only when D = 0.'
    },
    stepByStepSolution: [
      {
        stepNumber: 1,
        heading: 'Identify standard coefficients',
        explanation: 'Comparing the given equation $2x^2 + kx + 3 = 0$ with the standard quadratic equation $ax^2 + bx + c = 0$:',
        calculationOrReasoning: 'a = 2, \\quad b = k, \\quad c = 3'
      },
      {
        stepNumber: 2,
        heading: 'Apply equal roots condition',
        explanation: 'For a quadratic equation to have two real and equal roots, its discriminant $D$ must be equal to zero.',
        formula: 'D = b^2 - 4ac = 0',
        calculationOrReasoning: 'k^2 - 4(2)(3) = 0'
      },
      {
        stepNumber: 3,
        heading: 'Solve for k',
        explanation: 'Simplify and take the square root on both sides:',
        calculationOrReasoning: 'k^2 - 24 = 0 \\implies k^2 = 24 \\implies k = \\pm \\sqrt{24} = \\pm 2\\sqrt{6}'
      }
    ],
    boardExamAnswer: {
      format: 'CBSE 2-Mark Standard Answer Presentation',
      essentialPoints: [
        'Stating a=2, b=k, c=3',
        'Stating condition for real and equal roots: D = 0 or b^2 - 4ac = 0',
        'Writing both positive and negative roots: k = +-2*sqrt(6)'
      ],
      headingsAndContent: [
        { heading: 'Given Equation', content: '$2x^2 + kx + 3 = 0$. Here $a = 2, b = k, c = 3$.' },
        { heading: 'Condition for Equal Roots', content: 'For real and equal roots, Discriminant $D = 0$\n$\\implies b^2 - 4ac = 0$' },
        { heading: 'Calculation', content: '$k^2 - 4(2)(3) = 0$\n$k^2 - 24 = 0$\n$k^2 = 24$\n$k = \\pm \\sqrt{24} = \\pm 2\\sqrt{6}$' }
      ],
      conclusion: 'Hence, the required values of k are $2\\sqrt{6}$ and $-2\\sqrt{6}$.',
      suggestedMarks: 2
    },
    commonMistakes: [
      {
        mistake: 'Writing only k = 2*sqrt(6) and omitting the negative root -2*sqrt(6).',
        whyItOccurs: 'Students instinctively take only principal positive square root.',
        prevention: 'Remember: an equation k^2 = N always yields two roots, k = +sqrt(N) and k = -sqrt(N). CBSE examiners deduct 0.5 to 1 mark for missing the negative root.'
      },
      {
        mistake: 'Confusing D >= 0 (real roots) with D = 0 (real and equal roots).',
        whyItOccurs: 'Rushing through question keywords.',
        prevention: 'Underline "equal" in the question paper.'
      }
    ],
    verificationStatus: 'verified',
    verificationNotes: 'Independently recalculated: for k = 2*sqrt(6), 2x^2 + 2*sqrt(6)x + 3 = (sqrt(2)x + sqrt(3))^2 = 0, verifying unique double root.'
  });

  // 10 Variations for Q1
  const variations: Omit<GeneratedQuestion, 'id' | 'createdAt'>[] = [
    {
      originalQuestionId: q1.id,
      variationNumber: 1,
      variationType: 'basic_application',
      questionText: 'Find the values of p for which the quadratic equation px^2 - 6x + 1 = 0 has real and equal roots.',
      concept: 'Discriminant D = b^2 - 4ac',
      learningObjective: 'Direct application of D=0 when the leading coefficient is the unknown variable',
      questionType: 'numerical',
      difficulty: 'Easy',
      requiredKnowledge: ['D = b^2 - 4ac = 0'],
      expectedAnswer: 'p = 9',
      stepByStepSolution: [
        { stepNumber: 1, heading: 'Coefficients', explanation: 'a = p, b = -6, c = 1' },
        { stepNumber: 2, heading: 'D = 0', explanation: '(-6)^2 - 4(p)(1) = 0 => 36 - 4p = 0 => 4p = 36 => p = 9.' }
      ],
      examAnswer: 'Comparing with standard form, a=p, b=-6, c=1. For equal roots D = 0. Therefore (-6)^2 - 4(p)(1) = 0 => 36 = 4p => p = 9.',
      verificationStatus: 'verified'
    },
    {
      originalQuestionId: q1.id,
      variationNumber: 2,
      variationType: 'changed_conditions',
      questionText: 'For what value of m will the equation 3x^2 + 2mx + 12 = 0 have equal roots?',
      concept: 'Nature of Roots',
      learningObjective: 'Handling algebraic fractions and radicals in equal root calculations',
      questionType: 'numerical',
      difficulty: 'Medium',
      requiredKnowledge: ['D = b^2 - 4ac = 0'],
      expectedAnswer: 'm = +- 6',
      stepByStepSolution: [
        { stepNumber: 1, heading: 'Formulate condition', explanation: 'b^2 - 4ac = (2m)^2 - 4(3)(12) = 0 => 4m^2 - 144 = 0 => m^2 = 36 => m = +-6.' }
      ],
      examAnswer: 'For equal roots, D = 0. (2m)^2 - 4(3)(12) = 0 => 4m^2 = 144 => m^2 = 36 => m = +-6.',
      verificationStatus: 'verified'
    },
    {
      originalQuestionId: q1.id,
      variationNumber: 3,
      variationType: 'reverse_problem',
      questionText: 'If x = 3 is a double (repeated) root of the quadratic equation x^2 - 6x + c = 0, determine the value of c using the discriminant.',
      concept: 'Repeated Roots & Discriminant',
      learningObjective: 'Reverse reasoning: from known repeated root to constant term via D=0',
      questionType: 'numerical',
      difficulty: 'Medium',
      requiredKnowledge: ['Repeated roots imply D = 0', 'c = (b/2)^2'],
      expectedAnswer: 'c = 9',
      stepByStepSolution: [
        { stepNumber: 1, heading: 'Repeated roots condition', explanation: 'Double root means roots are real and equal, hence D = 0.' },
        { stepNumber: 2, heading: 'Calculate c', explanation: '(-6)^2 - 4(1)(c) = 0 => 36 - 4c = 0 => c = 9.' }
      ],
      examAnswer: 'A repeated root means real and equal roots, so D = 0. (-6)^2 - 4(1)(c) = 0 => 36 = 4c => c = 9.',
      verificationStatus: 'verified'
    },
    {
      originalQuestionId: q1.id,
      variationNumber: 4,
      variationType: 'missing_value',
      questionText: 'The equation (k - 12)x^2 + 2(k - 12)x + 2 = 0 has equal roots. Find the value of k (k != 12).',
      concept: 'Discriminant with Binomial Coefficients',
      learningObjective: 'Handling non-zero coefficient constraints in quadratic definitions',
      questionType: 'numerical',
      difficulty: 'Hard',
      requiredKnowledge: ['D = 0', 'Quadratic coefficient cannot be zero'],
      expectedAnswer: 'k = 14',
      stepByStepSolution: [
        { stepNumber: 1, heading: 'Apply D = 0', explanation: '[2(k - 12)]^2 - 4(k - 12)(2) = 0 => 4(k - 12)^2 - 8(k - 12) = 0' },
        { stepNumber: 2, heading: 'Factor out (k - 12)', explanation: '4(k - 12)[(k - 12) - 2] = 0. Since k != 12, k - 14 = 0 => k = 14.' }
      ],
      examAnswer: 'D = 0 => 4(k-12)^2 - 8(k-12) = 0 => 4(k-12)(k-14) = 0. Since k != 12 (otherwise equation is not quadratic), k = 14.',
      verificationStatus: 'verified'
    },
    {
      originalQuestionId: q1.id,
      variationNumber: 5,
      variationType: 'conceptual_interpretation',
      questionText: 'Explain geometrically what it means for the graph of y = 2x^2 + kx + 3 to have real and equal roots.',
      concept: 'Geometric Interpretation of Roots',
      learningObjective: 'Connecting algebraic D=0 with coordinate parabola tangency',
      questionType: 'short_answer',
      difficulty: 'Medium',
      requiredKnowledge: ['Parabola touches x-axis at exactly one point when D = 0'],
      expectedAnswer: 'The parabola touches the x-axis at exactly one point (tangent to x-axis)',
      stepByStepSolution: [
        { stepNumber: 1, heading: 'Geometric definition', explanation: 'Roots of ax^2 + bx + c = 0 are the x-intercepts of the parabola y = ax^2 + bx + c.' },
        { stepNumber: 2, heading: 'Equal roots meaning', explanation: 'Having real and equal roots means there is exactly one x-intercept; the vertex of the parabola lies on the x-axis.' }
      ],
      examAnswer: 'Geometrically, when a quadratic equation has real and equal roots, the graph of the parabola touches the x-axis at exactly one single point, meaning the x-axis is tangent to the parabola.',
      verificationStatus: 'verified'
    },
    {
      originalQuestionId: q1.id,
      variationNumber: 6,
      variationType: 'application_based',
      questionText: 'A ball thrown vertically follows height h(t) = -5t^2 + 20t + c. Determine c if the ball touches height h = 20 m at exactly one instant.',
      concept: 'Kinematics & Quadratic Discriminant',
      learningObjective: 'Applying equal root condition to peak height physics problems',
      questionType: 'case_based',
      difficulty: 'Medium',
      requiredKnowledge: ['D = 0 for single instant of contact'],
      expectedAnswer: 'c = 0',
      stepByStepSolution: [
        { stepNumber: 1, heading: 'Form equation', explanation: '20 = -5t^2 + 20t + c => 5t^2 - 20t + (20 - c) = 0.' },
        { stepNumber: 2, heading: 'Equate D = 0', explanation: '(-20)^2 - 4(5)(20 - c) = 0 => 400 - 20(20 - c) = 0 => 400 - 400 + 20c = 0 => c = 0.' }
      ],
      examAnswer: 'At height h=20, 5t^2 - 20t + (20 - c) = 0. For exactly one instant, D = 0 => (-20)^2 - 4(5)(20 - c) = 0 => 20c = 0 => c = 0.',
      verificationStatus: 'verified'
    },
    {
      originalQuestionId: q1.id,
      variationNumber: 7,
      variationType: 'different_format',
      questionText: 'Assertion (A): The equation x^2 + 4x + 4 = 0 has two distinct real roots.\nReason (R): For real and equal roots, the discriminant D = b^2 - 4ac must be 0.\nChoose the correct option: (a) Both A and R are true and R explains A. (b) Both A and R are true but R does not explain A. (c) A is false, but R is true. (d) A is true, but R is false.',
      concept: 'Assertion & Reason Format',
      learningObjective: 'CBSE Assertion-Reason format competency',
      questionType: 'assertion_reason',
      difficulty: 'Easy',
      requiredKnowledge: ['Evaluation of D for x^2 + 4x + 4 = 0 gives D = 0 (equal roots, not distinct)'],
      expectedAnswer: '(c) Assertion (A) is false, but Reason (R) is true.',
      stepByStepSolution: [
        { stepNumber: 1, heading: 'Check Assertion', explanation: 'D = 4^2 - 4(1)(4) = 16 - 16 = 0. Since D=0, roots are equal, NOT distinct. Hence A is false.' },
        { stepNumber: 2, heading: 'Check Reason', explanation: 'By definition of nature of roots, D = 0 corresponds to equal roots. Hence R is true.' }
      ],
      examAnswer: 'Correct Option: (c) Assertion (A) is false, but Reason (R) is true. Justification: D = 4^2 - 4(1)(4) = 0, which means roots are equal, so (A) is incorrect.',
      verificationStatus: 'verified'
    },
    {
      originalQuestionId: q1.id,
      variationNumber: 8,
      variationType: 'error_identification',
      questionText: 'A student solved 4x^2 - 12x + k = 0 for equal roots as: "D = b^2 - 4ac = 0 => (-12)^2 - 4(4)(k) = 0 => -144 - 16k = 0 => k = -9." Identify the student\'s error and write the correct value of k.',
      concept: 'Common Sign Errors in Discriminant',
      learningObjective: 'Spotting squaring of negative signs: (-12)^2 = +144',
      questionType: 'short_answer',
      difficulty: 'Easy',
      requiredKnowledge: ['(-b)^2 is positive'],
      expectedAnswer: 'Error: (-12)^2 was written as -144 instead of +144. Correct value: k = 9.',
      stepByStepSolution: [
        { stepNumber: 1, heading: 'Identify error', explanation: 'The student calculated (-12)^2 as -144. However, the square of any real number is non-negative: (-12)^2 = +144.' },
        { stepNumber: 2, heading: 'Correct calculation', explanation: '144 - 16k = 0 => 16k = 144 => k = 9.' }
      ],
      examAnswer: 'Error: The student incorrectly computed (-12)^2 as -144 instead of +144.\nCorrection: 144 - 16k = 0 => 16k = 144 => k = 9.',
      verificationStatus: 'verified'
    },
    {
      originalQuestionId: q1.id,
      variationNumber: 9,
      variationType: 'multistep_reasoning',
      questionText: 'If the roots of the quadratic equation (a - b)x^2 + (b - c)x + (c - a) = 0 are equal, prove that 2a = b + c (i.e. a, b, c are in AP).',
      concept: 'Advanced Discriminant & Algebraic Identities',
      learningObjective: 'Combining equal roots condition with cyclic sum x = 1 root inspection',
      questionType: 'proof',
      difficulty: 'Hard',
      requiredKnowledge: ['Sum of coefficients = 0 implies x = 1 is a root', 'Equal roots mean both roots equal 1'],
      expectedAnswer: 'Proven: 2a = b + c',
      stepByStepSolution: [
        { stepNumber: 1, heading: 'Observe sum of coefficients', explanation: '(a - b) + (b - c) + (c - a) = 0. Therefore, x = 1 is a root of the equation.' },
        { stepNumber: 2, heading: 'Utilize equal roots condition', explanation: 'Since the roots are equal, both roots must be 1. Therefore, product of roots = 1 * 1 = 1.' },
        { stepNumber: 3, heading: 'Relate to coefficients', explanation: 'Product of roots = (c - a)/(a - b) = 1 => c - a = a - b => 2a = b + c. Hence proved!' }
      ],
      examAnswer: 'Sum of coefficients = (a-b)+(b-c)+(c-a) = 0, so x = 1 is a root. Since roots are equal, the second root is also 1. Product of roots = 1 => (c-a)/(a-b) = 1 => c - a = a - b => 2a = b + c. Hence proved.',
      verificationStatus: 'verified'
    },
    {
      originalQuestionId: q1.id,
      variationNumber: 10,
      variationType: 'challenging_transfer',
      questionText: 'Find all positive integers k such that the quadratic equation x^2 - kx + 16 = 0 has two distinct integer roots.',
      concept: 'Diophantine Factorization & Distinct Roots',
      learningObjective: 'Transferring discriminant inequalities to integer factor pairs',
      questionType: 'numerical',
      difficulty: 'Hard',
      requiredKnowledge: ['D = k^2 - 64 > 0', 'Product of roots = 16 for integer factor pairs'],
      expectedAnswer: 'k = 10, 17',
      stepByStepSolution: [
        { stepNumber: 1, heading: 'Factor pairs of 16', explanation: 'Roots alpha * beta = 16. Distinct integer factor pairs (alpha, beta) where alpha != beta are (1, 16) and (2, 8). (4, 4) is omitted because roots must be distinct.' },
        { stepNumber: 2, heading: 'Determine k', explanation: 'Sum of roots k = alpha + beta. For (1, 16): k = 1 + 16 = 17. For (2, 8): k = 2 + 8 = 10.' }
      ],
      examAnswer: 'Let integer roots be p and q. Then pq = 16 and p + q = k. Since roots are distinct, factor pairs (p, q) of 16 are (1, 16) and (2, 8). Thus k = 1+16 = 17 or k = 2+8 = 10.',
      verificationStatus: 'verified'
    }
  ];

  db.saveGeneratedQuestions(variations);

  // Seed initial practice attempt to populate real analytics
  db.recordAttempt({
    userId: 'user_default_cbse10',
    questionId: q1.id,
    questionOrigin: 'original',
    questionText: q1.extractedText,
    submittedAnswer: 'D = b^2 - 4ac. Here a=2, b=k, c=3. k^2 - 4(2)(3) = 0. k^2 = 24. k = 2*sqrt(6).',
    evaluation: {
      scorePercentage: 75,
      estimatedMarksAwarded: 1.5,
      maxMarks: 2,
      strengths: ['Correctly identified a, b, c', 'Applied D = 0 condition correctly'],
      missingPoints: ['Omitted the negative root k = -2*sqrt(6)'],
      reasoningErrors: ['k^2 = 24 gives two roots +-2*sqrt(6)'],
      presentationTips: ['Always write both plus and minus signs when taking square roots on both sides.'],
      correctedAnswer: 'k = \\pm 2\\sqrt{6}',
      detailedFeedback: 'Very good start! You identified the coefficients and applied D = 0 accurately. The only slip was omitting the negative root. Remember that (-2*sqrt(6))^2 is also 24!'
    },
    isCorrect: 'partially_correct',
    mistakeCategory: 'incomplete_written_answer',
    hintsUsed: 1,
    timeSpentSeconds: 95
  });

  console.log('✅ Demo CBSE Class 10 Paper seeded successfully!');
}

seed().catch(console.error);
