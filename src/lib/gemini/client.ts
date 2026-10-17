// Concept Master AI - Gemini AI Client
// Supports Google Gen AI SDK (@google/genai) and direct REST with structured JSON schemas,
// exponential backoff, rate limit handling, and graceful model fallback.

import { jsonrepair } from 'jsonrepair';

interface GenerateOptions {
  model?: string;
  temperature?: number;
  maxOutputTokens?: number;
  responseMimeType?: 'application/json' | 'text/plain';
  responseSchema?: Record<string, unknown>;
  systemInstruction?: string;
  inlineData?: {
    mimeType: string;
    data: string; // Base64
  };
}

export class GeminiClient {
  private apiKey: string;
  private defaultModel: string;
  private fallbackModel: string;

  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY || '';
    this.defaultModel = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';
    this.fallbackModel = process.env.GEMINI_FALLBACK_MODEL || 'gemini-3-flash-preview';

    if (!this.apiKey) {
      console.warn('WARNING: GEMINI_API_KEY is not set in environment!');
    }
  }

  public async generateText(prompt: string, options: GenerateOptions = {}): Promise<string> {
    const rawList = [
      options.model || this.defaultModel,
      this.fallbackModel,
      'gemini-3.5-flash-lite',
      'gemini-3-flash-preview',
      'gemini-flash-latest'
    ];
    // Filter duplicates while preserving order
    const modelsToTry = Array.from(new Set(rawList.filter(Boolean)));

    let lastError: Error | null = null;

    for (const model of modelsToTry) {
      try {
        const text = await this.callApiWithRetry(model, prompt, options);
        if (text) return text;
      } catch (err: unknown) {
        console.warn(`Model ${model} failed, attempting next if available:`, (err as Error)?.message || err);
        lastError = err as Error;
      }
    }

    throw new Error(`All Gemini models failed. Last error: ${lastError?.message || 'Unknown error'}`);
  }

  public async generateStructuredJson<T>(prompt: string, schema?: Record<string, unknown>, options: GenerateOptions = {}): Promise<T> {
    const jsonOptions: GenerateOptions = {
      ...options,
      responseMimeType: 'application/json',
      responseSchema: schema
    };

    const text = await this.generateText(prompt, jsonOptions);

    // Clean possible markdown code fences if model enclosed in ```json ... ```
    let cleaned = text.trim();
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.replace(/^```json\s*/, '').replace(/```\s*$/, '');
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```\s*/, '').replace(/```\s*$/, '');
    }

    // 1. First attempt: Direct standard JSON parse
    try {
      return JSON.parse(cleaned) as T;
    } catch {
      // 2. Second attempt: Escape unescaped backslashes (frequent in LaTeX/math: \implies, \frac, \sqrt, \alpha)
      try {
        const escapedLatex = cleaned.replace(/\\([^"\\/bfnrtu])/g, '\\\\$1');
        return JSON.parse(escapedLatex) as T;
      } catch {
        // 3. Third attempt: Resilient structural repair via jsonrepair
        try {
          const repaired = jsonrepair(cleaned);
          return JSON.parse(repaired) as T;
        } catch (repairErr) {
          console.error('Failed all JSON parsing strategies for model output:', text);
          throw new Error(`Gemini response was not valid JSON: ${(repairErr as Error).message}`);
        }
      }
    }
  }

  private async callApiWithRetry(
    model: string,
    prompt: string,
    options: GenerateOptions,
    retries = 3,
    delayMs = 1500
  ): Promise<string> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.apiKey}`;

    const parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [];

    if (options.inlineData) {
      parts.push({
        inlineData: {
          mimeType: options.inlineData.mimeType,
          data: options.inlineData.data
        }
      });
    }

    parts.push({ text: prompt });

    const contents = [{ role: 'user', parts }];

    const generationConfig: Record<string, unknown> = {
      temperature: options.temperature ?? 0.2,
      maxOutputTokens: options.maxOutputTokens ?? 8192
    };

    if (options.responseMimeType === 'application/json') {
      generationConfig.responseMimeType = 'application/json';
      if (options.responseSchema) {
        generationConfig.responseSchema = options.responseSchema;
      }
    }

    const bodyPayload: Record<string, unknown> = {
      contents,
      generationConfig
    };

    if (options.systemInstruction) {
      bodyPayload.systemInstruction = {
        parts: [{ text: options.systemInstruction }]
      };
    }

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(bodyPayload)
        });

        if (!res.ok) {
          const errText = await res.text();
          // If hard quota limit is exceeded, don't wait - fail immediately so next model is tried
          if (res.status === 429 && (errText.includes('quota') || errText.includes('RESOURCE_EXHAUSTED') || errText.includes('Quota exceeded'))) {
            console.warn(`Model ${model} quota exhausted. Immediately switching to fallback model.`);
            throw new Error(`Gemini API quota exhausted on ${model}`);
          }
          // If transient rate limit or server error, retry with exponential backoff
          if ((res.status === 429 || res.status === 503 || res.status === 500) && attempt < retries) {
            console.warn(`Gemini API returned status ${res.status}. Retrying in ${delayMs * attempt}ms...`);
            await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
            continue;
          }
          throw new Error(`Gemini API error [${res.status}]: ${errText}`);
        }

        const data = await res.json();
        const candidate = data.candidates?.[0];
        if (!candidate || !candidate.content?.parts?.[0]?.text) {
          if (candidate?.finishReason && candidate.finishReason !== 'STOP') {
            throw new Error(`Generation finished with reason: ${candidate.finishReason}`);
          }
          throw new Error('Empty response from Gemini API');
        }

        return candidate.content.parts[0].text;
      } catch (err: unknown) {
        if (attempt === retries) throw err;
        console.warn(`Request failed (attempt ${attempt}/${retries}): ${(err as Error).message}`);
        await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
      }
    }

    throw new Error('Retries exhausted for Gemini API call');
  }
}

export const geminiClient = new GeminiClient();
