import { GoogleGenAI } from '@google/genai';

const apiKey = process.env.GEMINI_API_KEY;
console.log('Using API key:', apiKey ? `${apiKey.substring(0, 6)}...` : 'NONE');

const ai = new GoogleGenAI({ apiKey });

async function testTTS() {
  const models = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-3.8-flash-tts', 'gemini-3.8-flash-lite-tts'];
  for (const m of models) {
    try {
      console.log('--- Trying model:', m);
      const res = await ai.models.generateContent({
        model: m,
        contents: [{
          role: 'user',
          parts: [{
            text: 'Namaste students! Aaj hum chemical reactions ko balance karna step by step sikhenge.',
            speechMetadata: { style: 'friendly and clear Indian teacher' }
          }]
        }],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' }
            }
          }
        }
      });
      const parts = res.candidates?.[0]?.content?.parts || [];
      console.log('Parts count:', parts.length);
      for (const p of parts) {
        if (p.inlineData) {
          console.log('Found audio! mimeType:', p.inlineData.mimeType, 'base64 length:', p.inlineData.data?.length);
        } else if (p.text) {
          console.log('Text part:', p.text.substring(0, 100));
        }
      }
      return;
    } catch (e: any) {
      console.log('Error on', m, ':', e.message || e);
    }
  }
}

testTTS().catch(console.error);
