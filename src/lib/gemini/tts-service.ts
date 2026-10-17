// Concept Master AI - Gemini AI Text-To-Speech (TTS) Service
// Generates natural, human-grade audio explanations in Hindi & Hinglish using Gemini 3.8 Flash TTS.

import { GoogleGenAI } from '@google/genai';
import crypto from 'crypto';

export interface TTSRequest {
  text: string;
  voiceName?: string;
  gender?: 'female' | 'male';
}

export interface TTSResponse {
  audioBase64: string;
  mimeType: string;
  voice: string;
  fromCache?: boolean;
}

// In-memory audio cache to prevent redundant Gemini quota usage
const audioCache = new Map<string, { audioBase64: string; mimeType: string; voice: string }>();

// Prebuilt curated teacher voices for CBSE students
export const AVAILABLE_VOICES = [
  { id: 'Kore', name: 'Madam Kore (Clear & Warm)', gender: 'female' },
  { id: 'Aoede', name: 'Madam Aoede (Friendly & Breezy)', gender: 'female' },
  { id: 'Puck', name: 'Sir Puck (Upbeat & Energetic)', gender: 'male' },
  { id: 'Charon', name: 'Sir Charon (Informative & Deep)', gender: 'male' },
  { id: 'Fenrir', name: 'Sir Fenrir (Exciting & Dynamic)', gender: 'male' }
] as const;

export class GeminiTtsService {
  private ai: GoogleGenAI;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY || '';
    this.ai = new GoogleGenAI({ apiKey });
  }

  /**
   * Pre-processes raw mathematical / scientific text into natural spoken narration
   */
  public cleanTextForSpeech(raw: string): string {
    return raw
      .replace(/\\sqrt\{([^}]+)\}/g, 'square root of $1')
      .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '$1 divided by $2')
      .replace(/\\rightarrow/g, ' gives ')
      .replace(/\\implies/g, ' which implies that ')
      .replace(/\\times/g, ' multiplied by ')
      .replace(/\\pm/g, ' plus or minus ')
      .replace(/\s*=\s*/g, ' equals ')
      .replace(/\s*\+\s*/g, ' plus ')
      .replace(/\s*→\s*/g, ' gives ')
      .replace(/[\$*#_`]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Generates natural speech using Gemini 3.8 Flash TTS
   */
  public async generateAudio(req: TTSRequest): Promise<TTSResponse> {
    const cleanText = this.cleanTextForSpeech(req.text);

    // Pick voice: user preference, gender default, or fallback
    let voiceName = req.voiceName;
    if (!voiceName) {
      voiceName = req.gender === 'male' ? 'Puck' : 'Kore';
    }

    const cacheKey = crypto
      .createHash('sha256')
      .update(`${voiceName}:${cleanText}`)
      .digest('hex');

    if (audioCache.has(cacheKey)) {
      const cached = audioCache.get(cacheKey)!;
      return {
        ...cached,
        fromCache: true
      };
    }

    const modelsToTry = [
      'gemini-3.8-flash-tts',
      'gemini-3.8-flash-lite-tts'
    ];

    let lastError: Error | null = null;

    for (const model of modelsToTry) {
      try {
        const response = await this.ai.models.generateContent({
          model,
          contents: [{
            role: 'user',
            parts: [{
              text: cleanText,
              speechMetadata: {
                style: 'warm, friendly, patient and encouraging Indian teacher explaining clearly to a Class 10 student'
              }
            }]
          }],
          config: {
            responseModalities: ['AUDIO'],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName }
              }
            }
          }
        });

        const part = response.candidates?.[0]?.content?.parts?.[0];
        const audioBase64 = part?.inlineData?.data;
        const mimeType = part?.inlineData?.mimeType || 'audio/wav';

        if (audioBase64) {
          const result = { audioBase64, mimeType, voice: voiceName };
          audioCache.set(cacheKey, result);
          return result;
        }
      } catch (err: unknown) {
        console.warn(`Gemini TTS model ${model} failed:`, (err as Error)?.message || err);
        lastError = err as Error;
      }
    }

    throw new Error(`Gemini TTS generation failed on all models: ${lastError?.message || 'Unknown error'}`);
  }
}

export const geminiTtsService = new GeminiTtsService();
