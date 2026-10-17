// Concept Master AI - Question Understanding Tutor Chat Service
import { geminiClient } from './client';
import { QuestionAnalysis, OriginalQuestion, TutorChatMessage } from '../types';

export class TutorChatService {
  /**
   * Generates a progressive help hint/explanation (Level 1, 2, or 3)
   */
  public async getProgressiveHelp(
    question: OriginalQuestion,
    analysis: QuestionAnalysis,
    level: 1 | 2 | 3
  ): Promise<string> {
    if (level === 1) {
      // Level 1: A small nudge without giving away the answer
      const prompt = `You are a warm, patient CBSE Class 10 Tutor for Concept Master AI.
The student is trying to solve this question:
"${question.extractedText}"
Subject: ${analysis.subject} | Chapter: ${analysis.chapter}

Provide a LEVEL 1 HINT:
- Give a gentle, encouraging hint or nudge in conversational Hinglish.
- Point out what they should observe or notice first.
- DO NOT reveal the formula directly or give the answer. Keep it under 2 sentences.`;

      return geminiClient.generateText(prompt, { temperature: 0.3 });
    } else if (level === 2) {
      // Level 2: Relevant concept and recommended strategy
      const prompt = `You are a warm, patient CBSE Class 10 Tutor for Concept Master AI.
Question: "${question.extractedText}"
Subject: ${analysis.subject} | Chapter: ${analysis.chapter}
Core Concept: ${analysis.concepts.join(', ')}

Provide a LEVEL 2 CONCEPT GUIDANCE:
- Explain the key concept and the formula/rule required in clear Hinglish.
- Outline the solving approach step-by-step without doing the full arithmetic/final answer.`;

      return geminiClient.generateText(prompt, { temperature: 0.3 });
    } else {
      // Level 3: Complete worked solution
      return `### Complete Worked Solution\n\n**Solving Strategy:** ${analysis.solvingStrategy.whyApproach}\n\n` +
        analysis.stepByStepSolution.map(s => `**Step ${s.stepNumber}: ${s.heading}**\n${s.explanation}\n${s.calculationOrReasoning ? `\`\`\`\n${s.calculationOrReasoning}\n\`\`\`` : ''}`).join('\n\n') +
        `\n\n**Board Exam Answer:**\n${analysis.boardExamAnswer.headingsAndContent.map(h => `${h.heading ? `**${h.heading}:** ` : ''}${h.content}`).join('\n')}`;
    }
  }

  /**
   * Contextual follow-up Q&A conversation with the student
   */
  public async answerFollowUp(
    question: OriginalQuestion,
    analysis: QuestionAnalysis,
    history: TutorChatMessage[],
    userMessage: string
  ): Promise<string> {
    const formattedHistory = history
      .slice(-6)
      .map(m => `${m.role === 'user' ? 'Student' : 'Tutor'}: ${m.content}`)
      .join('\n');

    const prompt = `You are the dedicated Question Understanding Tutor for Concept Master AI.
You are helping a CBSE Class 10 student understand this specific question.

Context:
Question ${question.originalNumber}: "${question.extractedText}"
Subject: ${analysis.subject}
Chapter: ${analysis.chapter}
Concepts: ${analysis.concepts.join(', ')}
Strategy: ${analysis.solvingStrategy.whyApproach}
Model Answer: ${analysis.boardExamAnswer.conclusion || analysis.boardExamAnswer.headingsAndContent.map(h => h.content).join(' ')}

Conversation History:
${formattedHistory}

Student: "${userMessage}"

TUTOR INSTRUCTIONS:
- Answer the student's question directly, clearly, and patiently.
- Use warm, relatable Hinglish (mixing English keywords with natural conversational Hindi).
- If they ask "why this formula", explain the physical/mathematical intuition.
- If they ask for "simpler Hinglish", break it down into everyday examples.
- If they ask for an "alternative method", provide one if valid.
- Format equations in readable form. Keep explanations engaging and concise.`;

    return geminiClient.generateText(prompt, { temperature: 0.4 });
  }
}

export const tutorChatService = new TutorChatService();
