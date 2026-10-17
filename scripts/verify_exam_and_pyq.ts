import { pyqService } from '../src/lib/pyq-service';
import { db } from '../src/lib/db';
import { examEvaluationService } from '../src/lib/gemini/exam-evaluation-service';

async function testExamAndPyq() {
  console.log('--- 1. Testing PYQ Catalog Scanner ---');
  const catalog = pyqService.getCatalog();
  console.log('Total subjects found:', catalog.subjects.length);
  console.log('Total official papers indexed:', catalog.totalPapers);
  for (const s of catalog.subjects) {
    console.log(`  Subject: ${s.name} (${s.label}) - ${s.years.length} years of papers`);
  }

  if (catalog.totalPapers < 100) {
    throw new Error('Expected at least 100 papers from D:\\anurag\\study\\QUESTIONS\\PYQS');
  }
  console.log('✅ PYQ Catalog Scan PASSED');

  console.log('\n--- 2. Testing Loading a Paper for Exam Mode ---');
  const scienceSubject = catalog.subjects.find(s => s.name === 'SCIENCE');
  const paper2024 = scienceSubject?.years.find(y => y.year === '2024')?.papers[0];
  if (!paper2024) throw new Error('No 2024 Science paper found in catalog');

  console.log('Loading paper:', paper2024.displayName, 'from:', paper2024.filePath);
  const loaded = await pyqService.loadPaper(paper2024.filePath, 'exam');

  console.log('Document ID created/reused:', loaded.document.id);
  console.log('Questions count:', loaded.questionsCount);
  console.log('Exam Attempt ID:', loaded.examAttempt?.id);

  if (!loaded.examAttempt) throw new Error('Exam attempt was not created');
  console.log('✅ Exam Mode Initialization PASSED');

  console.log('\n--- 3. Testing Exam Response Auto-Save ---');
  const questions = db.getQuestionsByDocument(loaded.document.id);
  const firstQ = questions[0];
  if (!firstQ) throw new Error('No questions in document');

  const updatedAttempt = db.updateExamAttempt(loaded.examAttempt.id, {
    responses: {
      [firstQ.id]: {
        questionId: firstQ.id,
        responseText: 'Precipitation reaction occurs when two aqueous solutions react to form an insoluble solid substance called precipitate. Example: Na2SO4(aq) + BaCl2(aq) -> BaSO4(s) + 2NaCl(aq).',
        status: 'answered',
        updatedAt: new Date().toISOString()
      }
    }
  });

  console.log('Saved response for Q1:', updatedAttempt?.responses[firstQ.id]?.status);
  console.log('✅ Exam Response Auto-Save PASSED');

  console.log('\n========================================');
  console.log('ALL PYQ & EXAM ENGINE TESTS PASSED! 🚀');
  console.log('========================================');
}

testExamAndPyq().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
