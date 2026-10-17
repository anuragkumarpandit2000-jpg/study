import { geminiTtsService } from '../src/lib/gemini/tts-service';

async function verify() {
  console.log('Testing Female voice (Kore)...');
  const femaleRes = await geminiTtsService.generateAudio({
    text: 'Namaste! Is question me iron aur water ko balance karna hai.',
    voiceName: 'Kore'
  });
  console.log('Female voice OK:', femaleRes.voice, 'Base64 length:', femaleRes.audioBase64.length);

  console.log('Testing Male voice (Puck)...');
  const maleRes = await geminiTtsService.generateAudio({
    text: 'Sir Puck explaining chemical reaction balancing for class 10.',
    voiceName: 'Puck'
  });
  console.log('Male voice OK:', maleRes.voice, 'Base64 length:', maleRes.audioBase64.length);

  console.log('Testing cache on second call...');
  const cacheRes = await geminiTtsService.generateAudio({
    text: 'Namaste! Is question me iron aur water ko balance karna hai.',
    voiceName: 'Kore'
  });
  console.log('Cache hit:', cacheRes.fromCache === true);
}

verify().then(() => console.log('ALL TTS TESTS PASSED')).catch(console.error);
