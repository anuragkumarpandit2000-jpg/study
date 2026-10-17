import fs from 'fs';
import { documentService } from '../src/lib/gemini/document-service';

async function testPdf() {
  const filePath = 'D:/anurag/study/QUESTIONS/PYQS/SCIENCE/SCIENCE 2024/31_1_1_Science.pdf';
  if (!fs.existsSync(filePath)) {
    console.error('File not found:', filePath);
    return;
  }
  const buf = fs.readFileSync(filePath);
  console.log('File read successfully! Size:', buf.length, 'bytes');

  const res = await documentService.extractFromPdf(buf, '31_1_1_Science.pdf');
  console.log('Page count:', res.pageCount);
  console.log('Extracted text length:', res.text.length);
  console.log('--- Sample text snippet ---');
  console.log(res.text.substring(0, 500));
}

testPdf().catch(console.error);
