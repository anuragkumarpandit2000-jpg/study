'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Volume2, Play, Pause, RotateCcw, Loader2, Sparkles, UserCheck } from 'lucide-react';

interface AudioExplanationPlayerProps {
  textToSpeak: string;
  label?: string;
  preferredLanguage?: string;
}

const VOICE_OPTIONS = [
  { id: 'Kore', label: '👩‍🏫 Madam Kore (Female)', gender: 'female' },
  { id: 'Puck', label: '👨‍🏫 Sir Puck (Male)', gender: 'male' },
  { id: 'Aoede', label: '👩‍🏫 Madam Aoede (Female - Calm)', gender: 'female' },
  { id: 'Charon', label: '👨‍🏫 Sir Charon (Male - Deep)', gender: 'male' },
];

export const AudioExplanationPlayer: React.FC<AudioExplanationPlayerProps> = ({
  textToSpeak,
  label = 'Gemini AI Voice Explanation'
}) => {
  const [selectedVoice, setSelectedVoice] = useState<string>('Kore');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Audio cache keyed by `voice:textHash` to avoid re-fetching
  const audioBlobUrlRef = useRef<Map<string, string>>(new Map());
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  // Clean up audio object on unmount
  useEffect(() => {
    return () => {
      if (audioElementRef.current) {
        audioElementRef.current.pause();
        audioElementRef.current = null;
      }
      // Revoke any blob URLs
      audioBlobUrlRef.current.forEach((url) => {
        try {
          URL.revokeObjectURL(url);
        } catch {}
      });
      audioBlobUrlRef.current.clear();
    };
  }, []);

  const formatTime = (secs: number): string => {
    if (isNaN(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const setupAudio = (audioUrl: string) => {
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      audioElementRef.current = null;
    }

    const audio = new Audio(audioUrl);
    audio.playbackRate = playbackRate;

    audio.onloadedmetadata = () => {
      setDuration(audio.duration || 0);
    };

    audio.ontimeupdate = () => {
      setCurrentTime(audio.currentTime || 0);
    };

    audio.onended = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.onerror = () => {
      setIsPlaying(false);
      setErrorMsg('Audio playback error');
    };

    audioElementRef.current = audio;
    return audio;
  };

  const handlePlayPause = async () => {
    setErrorMsg(null);

    // If currently playing, pause
    if (isPlaying && audioElementRef.current) {
      audioElementRef.current.pause();
      setIsPlaying(false);
      return;
    }

    // If already loaded and paused, resume
    if (audioElementRef.current && audioElementRef.current.src) {
      audioElementRef.current.playbackRate = playbackRate;
      try {
        await audioElementRef.current.play();
        setIsPlaying(true);
        return;
      } catch (e) {
        console.warn('Resume error, re-fetching:', e);
      }
    }

    // Check memory cache for this voice & text
    const cacheKey = `${selectedVoice}:${textToSpeak}`;
    const cachedUrl = audioBlobUrlRef.current.get(cacheKey);

    if (cachedUrl) {
      const audio = setupAudio(cachedUrl);
      try {
        await audio.play();
        setIsPlaying(true);
      } catch (err) {
        console.error('Play error with cached audio:', err);
      }
      return;
    }

    // Fetch from Gemini TTS API
    setIsLoading(true);
    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: textToSpeak,
          voiceName: selectedVoice
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gemini TTS request failed');
      }

      // Convert base64 to Blob URL for clean streaming playback
      const byteCharacters = atob(data.audioBase64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: data.mimeType || 'audio/wav' });
      const blobUrl = URL.createObjectURL(blob);

      audioBlobUrlRef.current.set(cacheKey, blobUrl);

      const audio = setupAudio(blobUrl);
      await audio.play();
      setIsPlaying(true);
    } catch (err: unknown) {
      console.error('TTS error:', err);
      setErrorMsg((err as Error).message || 'Voice generate karne me dikkat aayi');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStop = () => {
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      audioElementRef.current.currentTime = 0;
    }
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (audioElementRef.current) {
      audioElementRef.current.currentTime = newTime;
    }
  };

  const toggleRate = () => {
    const rates = [1, 1.25, 1.5, 0.85];
    const nextIdx = (rates.indexOf(playbackRate) + 1) % rates.length;
    const newRate = rates[nextIdx];
    setPlaybackRate(newRate);

    if (audioElementRef.current) {
      audioElementRef.current.playbackRate = newRate;
    }
  };

  const handleVoiceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newVoice = e.target.value;
    setSelectedVoice(newVoice);
    handleStop();
    if (audioElementRef.current) {
      audioElementRef.current = null;
    }
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 p-2 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 text-xs text-blue-950 shadow-xs">
      <div className="flex items-center gap-2">
        <span className="flex items-center gap-1 font-bold text-blue-900 bg-white px-2 py-1 rounded-lg border border-blue-200 shadow-2xs">
          <Sparkles className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
          <span>Gemini Voice</span>
        </span>

        {/* Voice Selector Dropdown (Male / Female) */}
        <div className="relative inline-flex items-center">
          <UserCheck className="w-3 h-3 text-blue-600 absolute left-2 pointer-events-none" />
          <select
            value={selectedVoice}
            onChange={handleVoiceChange}
            disabled={isLoading}
            className="pl-6 pr-2 py-1 rounded-md bg-white border border-blue-200 text-[11px] font-semibold text-blue-900 hover:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer disabled:opacity-50"
            title="Aawaz chuno (Male ya Female teacher voice)"
          >
            {VOICE_OPTIONS.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-1">
        {/* Play / Pause Button */}
        <button
          type="button"
          onClick={handlePlayPause}
          disabled={isLoading}
          className={`flex items-center gap-1 px-3 py-1 rounded-md font-bold text-white shadow-xs transition ${
            isLoading
              ? 'bg-blue-400 cursor-not-allowed'
              : isPlaying
              ? 'bg-amber-600 hover:bg-amber-700'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
          title={isPlaying ? 'Pause' : 'Suno'}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Generating...</span>
            </>
          ) : isPlaying ? (
            <>
              <Pause className="w-3.5 h-3.5 fill-current" />
              <span>Pause</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>🔊 Suno</span>
            </>
          )}
        </button>

        {/* Stop Button (visible when playing or loaded) */}
        {(isPlaying || currentTime > 0) && (
          <button
            type="button"
            onClick={handleStop}
            className="p-1 hover:bg-white rounded-md text-gray-500 hover:text-red-600 transition"
            title="Stop Audio"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Time progress bar if audio is loaded */}
        {duration > 0 && (
          <div className="flex items-center gap-1.5 flex-1 max-w-[160px]">
            <span className="text-[10px] text-gray-600 font-mono w-7 text-right">
              {formatTime(currentTime)}
            </span>
            <input
              type="range"
              min="0"
              max={duration || 100}
              step="0.1"
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-1 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <span className="text-[10px] text-gray-500 font-mono w-7">
              {formatTime(duration)}
            </span>
          </div>
        )}

        {/* Playback speed toggle */}
        <button
          type="button"
          onClick={toggleRate}
          className="px-1.5 py-0.5 font-bold rounded bg-white hover:bg-blue-100 border border-blue-200 text-blue-700 transition text-[10px]"
          title="Speed badlo (0.85x, 1x, 1.25x, 1.5x)"
        >
          {playbackRate}x
        </button>
      </div>

      {errorMsg && (
        <span className="text-[11px] text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded">
          {errorMsg}
        </span>
      )}
    </div>
  );
};
