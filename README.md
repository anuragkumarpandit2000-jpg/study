# CONCEPT MASTER AI
> *"Understand Every Question. Master Every Concept."*

A full-stack, AI-powered educational platform designed specifically for **CBSE Class 10 Board Examination** excellence across **all subjects** (Mathematics, Science, Social Science, English, Hindi, etc.), built with Next.js 16, TypeScript, Tailwind CSS, KaTeX, and Google Gemini AI.

---

## 🌟 Key Architecture & Capabilities

### 1. Document Extraction & Question Inventory
- **Multi-Input Support:** PDF upload (multipage, digital parsing via `pdf-parse` + scanned PDF OCR via Gemini Vision), Image upload (JPG/PNG textbook photos and worksheets), and structured Manual Input.
- **Complete Question Inventory Audit:** Detects every question and subquestion (e.g. `Q1`, `Q2`, `Q3(a)`, `Q3(b)`), assigns marks, extracts diagrams, and provides an interactive verification interface for students before analysis begins.
- **Zero Omission Guarantee:** The system tracks page-by-page progress and ensures no question is silently dropped.

### 2. Staged 13-Point Pedagogical Analysis
For every confirmed original question, Gemini generates:
1. **Original Question Wording**
2. **Student-Friendly Hinglish Meaning** ("Ye question aapse kya pooch raha hai...")
3. **What is Given** (variables, conditions, equations, diagrams)
4. **What Must Be Found** (exact outcomes, proof targets)
5. **CBSE Chapter & Concept Identification** (verified NCERT/CBSE topics)
6. **Question Classification** (Numerical, Proof, MCQ, Short/Long Answer, Case-based, Assertion-Reason)
7. **Difficulty Depth Analysis** (Easy/Medium/Hard with conceptual justification)
8. **Required Formulas & Theorems** (with KaTeX mathematical rendering)
9. **Solving Strategy** (What to notice first, key concept, step plan)
10. **Step-by-Step Pedagogical Solution**
11. **CBSE Board Exam Ready Model Answer** (Step marking, formal English presentation, headings, boxed answers)
12. **Common Student Mistakes & Traps** (Specific mistake, why it occurs, how to prevent it)
13. **Independent Academic Verification** (Deterministic checks & multi-model audit)

### 3. Question Multiplier (10 Targeted Variations per Original)
Generates exactly 10 distinct, mathematically and conceptually coherent practice questions spanning:
- Basic concept application
- Changed values / conditions
- Reverse problem-solving
- Missing-value problems
- Conceptual interpretation
- Real-world / Case-based scenario
- Different format (MCQ, Assertion-Reason)
- Error identification ("Spot the mistake")
- Multistep reasoning
- Challenging transfer question

### 4. Question Understanding Tutor & Contextual Chat
- **10 Expandable Understanding Sections**
- **3 Progressive Help Levels:**
  - *Level 1:* Gentle nudge / observation hint
  - *Level 2:* Core concept and approach plan
  - *Level 3:* Complete worked solution
- **Live Contextual Chat:** Direct follow-up questions answered in real-time by Gemini (e.g. "Why did we use this formula?", "Explain in simpler Hinglish", "Another valid method?").

### 5. Practice & Test Modes
- **Mode A: Guided Practice** (Step-by-step solving with progressive hints and instant board feedback)
- **Mode B: Test Mode** (Timed CBSE exam simulator with question navigation palette and evaluation)
- **Mode C: Weakness Revision** (Targeted questions addressing demonstrated misconceptions)

### 6. Board Answer Writing Coach
- Evaluates student written answers against CBSE marking rubrics.
- Estimates marks awarded based on step marking.
- Identifies missing points, reasoning errors, and presentation improvements.
- Categorizes mistakes: `calculation_error`, `conceptual_misunderstanding`, `incorrect_formula`, `misreading_question`, `incomplete_written_answer`.

### 7. Adaptive Learning & Real Analytics
- Real-time Concept Mastery Profile (0–100%) grounded exclusively in actual practice submissions.
- Mistake breakdown and automated priority revision recommendations.

---

## 🚀 Getting Started

### 1. Environment Setup
The Gemini API key is securely configured in `.env.local`:
```bash
GEMINI_API_KEY="your_api_key_here"
GEMINI_MODEL="gemini-3.5-flash"
GEMINI_FALLBACK_MODEL="gemini-3.5-flash-lite"
```

### 2. Run the Development Server
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

### 3. Run Automated Tests
```bash
npm test
```
Runs the 21-point automated test suite verifying database persistence, question detection, 13-point analysis, 10 variations, verification, and evaluation.

### 4. Seed Demo Data
```bash
npm run seed
```
Seeds an authentic CBSE Class 10 Mathematics Standard question paper with complete analysis and 10 generated variations.
