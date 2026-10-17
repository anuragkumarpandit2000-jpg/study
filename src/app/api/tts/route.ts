// Concept Master AI - TTS API Route
// Generates natural teacher audio via Gemini 3.8 Flash TTS

import { NextRequest, NextResponse } from 'next/server';
import { geminiTtsService } from '@/lib/gemini/tts-service';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { text, voiceName, gender } = body;

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Text is required for TTS generation' },
        { status: 400 }
      );
    }

    // Limit text length to prevent excessive API load if needed
    const truncatedText = text.length > 2500 ? text.substring(0, 2500) + '...' : text;

    const audioResult = await geminiTtsService.generateAudio({
      text: truncatedText,
      voiceName,
      gender
    });

    return NextResponse.json({
      success: true,
      audioBase64: audioResult.audioBase64,
      mimeType: audioResult.mimeType,
      voice: audioResult.voice,
      fromCache: audioResult.fromCache ?? false
    });
  } catch (error: unknown) {
    console.error('Error in /api/tts:', error);
    return NextResponse.json(
      {
        success: false,
        error: (error as Error)?.message || 'Failed to synthesize speech via Gemini'
      },
      { status: 500 }
    );
  }
}
