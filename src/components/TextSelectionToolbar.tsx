'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Copy, 
  Check, 
  Highlighter, 
  Volume2, 
  Square, 
  Loader2, 
  Play, 
  Pause, 
  RotateCcw,
  Sparkles,
  X
} from 'lucide-react';

interface SelectionCoords {
  top: number;
  left: number;
  placement: 'above' | 'below';
}

export function TextSelectionToolbar() {
  const [selectedText, setSelectedText] = useState<string>('');
  const [coords, setCoords] = useState<SelectionCoords | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [highlighted, setHighlighted] = useState<boolean>(false);
  const [highlightColor, setHighlightColor] = useState<string>('yellow'); // yellow, green, blue

  // Audio TTS State
  const [isLoadingAudio, setIsLoadingAudio] = useState<boolean>(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [isAudioActive, setIsAudioActive] = useState<boolean>(false);
  const [activeSpeakingText, setActiveSpeakingText] = useState<string>('');
  const [selectedVoice, setSelectedVoice] = useState<'Puck' | 'Kore'>('Puck');
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [audioError, setAudioError] = useState<string | null>(null);

  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const toolbarRef = useRef<HTMLDivElement | null>(null);
  const savedRangeRef = useRef<Range | null>(null);

  // Audio cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioElementRef.current) {
        audioElementRef.current.pause();
        audioElementRef.current = null;
      }
    };
  }, []);

  // Selection detection
  useEffect(() => {
    const handleSelectionChange = () => {
      // If we are currently interacting with the toolbar, do not clear
      const activeEl = document.activeElement;
      if (toolbarRef.current && toolbarRef.current.contains(activeEl)) {
        return;
      }

      const selection = window.getSelection();
      if (!selection || selection.isCollapsed) {
        // If selection cleared, hide toolbar only if audio is not playing
        if (!isAudioActive) {
          setCoords(null);
          setSelectedText('');
        }
        return;
      }

      const text = selection.toString().trim();
      if (text.length < 2) {
        if (!isAudioActive) {
          setCoords(null);
          setSelectedText('');
        }
        return;
      }

      // Check if selection is inside an interactive input or textarea
      const anchorNode = selection.anchorNode;
      const parentElement = anchorNode instanceof Element ? anchorNode : anchorNode?.parentElement;
      if (parentElement?.closest('input, textarea')) {
        return;
      }

      try {
        const range = selection.getRangeAt(0);
        savedRangeRef.current = range.cloneRange();
        const rect = range.getBoundingClientRect();

        if (rect.width === 0 || rect.height === 0) return;

        // Determine if placed above or below selection
        const spaceAbove = rect.top;
        const placement = spaceAbove > 70 ? 'above' : 'below';

        const top = placement === 'above' 
          ? rect.top + window.scrollY - 52
          : rect.bottom + window.scrollY + 8;

        // Center horizontally and clamp to viewport margins
        const centerX = rect.left + window.scrollX + rect.width / 2;
        const clampedX = Math.max(130, Math.min(window.innerWidth - 130, centerX));

        setCoords({ top, left: clampedX, placement });
        setSelectedText(text);
        setCopied(false);
        setHighlighted(false);
      } catch {
        // Ignore any detached range errors
      }
    };

    // Document listener on mouseup and keyup
    document.addEventListener('mouseup', handleSelectionChange);
    document.addEventListener('keyup', handleSelectionChange);

    return () => {
      document.removeEventListener('mouseup', handleSelectionChange);
      document.removeEventListener('keyup', handleSelectionChange);
    };
  }, [isAudioActive]);

  // Copy Action
  const handleCopy = async () => {
    if (!selectedText) return;
    try {
      await navigator.clipboard.writeText(selectedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch (err) {
      console.warn('Clipboard write failed:', err);
    }
  };

  // Highlight Action
  const handleHighlight = () => {
    const selection = window.getSelection();
    const range = savedRangeRef.current || (selection && !selection.isCollapsed ? selection.getRangeAt(0) : null);
    if (!range) return;

    try {
      const colorClasses: Record<string, string> = {
        yellow: 'bg-amber-200/90 text-gray-900',
        green: 'bg-emerald-200/90 text-gray-900',
        blue: 'bg-blue-200/90 text-blue-950'
      };

      const mark = document.createElement('mark');
      mark.className = `${colorClasses[highlightColor] || colorClasses.yellow} rounded-xs px-1 shadow-2xs font-medium cursor-pointer transition select-text`;
      mark.title = 'Highlight (Click to remove)';
      mark.onclick = (e) => {
        e.stopPropagation();
        const parent = mark.parentNode;
        while (mark.firstChild) parent?.insertBefore(mark.firstChild, mark);
        parent?.removeChild(mark);
      };

      range.surroundContents(mark);
      setHighlighted(true);
      setTimeout(() => setHighlighted(false), 1800);
    } catch {
      // Fallback for complex ranges across multiple paragraphs
      try {
        const colorHex: Record<string, string> = {
          yellow: '#fef08a',
          green: '#a7f3d0',
          blue: '#bae6fd'
        };
        document.execCommand('hiliteColor', false, colorHex[highlightColor] || '#fef08a');
        setHighlighted(true);
        setTimeout(() => setHighlighted(false), 1800);
      } catch {
        // Safe fallback
      }
    }
  };

  // Listen (Gemini TTS) Action
  const handleListen = async () => {
    if (!selectedText) return;

    setIsLoadingAudio(true);
    setAudioError(null);
    setIsAudioActive(true);
    setActiveSpeakingText(selectedText);

    try {
      // Stop any existing audio playback
      if (audioElementRef.current) {
        audioElementRef.current.pause();
        audioElementRef.current = null;
      }

      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: selectedText,
          voiceName: selectedVoice,
          gender: selectedVoice === 'Puck' ? 'male' : 'female'
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to synthesize speech via Gemini');
      }

      // Create audio from returned base64 WAV
      const audioUrl = `data:${data.mimeType || 'audio/wav'};base64,${data.audioBase64}`;
      const audio = new Audio(audioUrl);
      audio.playbackRate = playbackSpeed;

      audio.onplay = () => setIsPlayingAudio(true);
      audio.onpause = () => setIsPlayingAudio(false);
      audio.onended = () => {
        setIsPlayingAudio(false);
        setIsAudioActive(false);
      };
      audio.onerror = () => {
        setIsPlayingAudio(false);
        setAudioError('Audio playback failed');
      };

      audioElementRef.current = audio;
      await audio.play();
    } catch (err: any) {
      console.error('Error generating selection audio:', err);
      setAudioError(err.message || 'TTS Error');
      setIsAudioActive(false);
    } finally {
      setIsLoadingAudio(false);
    }
  };

  const togglePlayPause = () => {
    if (!audioElementRef.current) return;
    if (isPlayingAudio) {
      audioElementRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      audioElementRef.current.play();
      setIsPlayingAudio(true);
    }
  };

  const handleStopAudio = () => {
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      audioElementRef.current.currentTime = 0;
      audioElementRef.current = null;
    }
    setIsPlayingAudio(false);
    setIsAudioActive(false);
  };

  const handleSpeedChange = (newSpeed: number) => {
    setPlaybackSpeed(newSpeed);
    if (audioElementRef.current) {
      audioElementRef.current.playbackRate = newSpeed;
    }
  };

  // If nothing is selected and no audio is active, render nothing
  if (!coords && !isAudioActive) {
    return null;
  }

  return (
    <>
      {/* Floating Toolbar positioned right at cursor selection */}
      {coords && (
        <div
          ref={toolbarRef}
          onMouseDown={(e) => {
            // Prevent selection from collapsing when user clicks on toolbar buttons
            e.preventDefault();
            e.stopPropagation();
          }}
          style={{
            position: 'absolute',
            top: `${coords.top}px`,
            left: `${coords.left}px`,
            transform: 'translateX(-50%)',
            zIndex: 9999
          }}
          className="flex items-center gap-1 bg-gray-900/95 backdrop-blur-md text-white px-2 py-1.5 rounded-xl shadow-xl border border-gray-700/80 animate-in fade-in zoom-in-95 duration-150 select-none text-xs"
        >
          {/* Action 1: Copy */}
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg hover:bg-gray-800 text-gray-200 hover:text-white transition cursor-pointer font-medium"
            title="Copy selection"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-300 font-bold">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-gray-300" />
                <span>Copy</span>
              </>
            )}
          </button>

          <div className="w-[1px] h-3.5 bg-gray-700 mx-0.5" />

          {/* Action 2: Highlight */}
          <div className="flex items-center space-x-1">
            <button
              type="button"
              onClick={handleHighlight}
              className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg hover:bg-gray-800 text-gray-200 hover:text-white transition cursor-pointer font-medium"
              title="Highlight selected text"
            >
              {highlighted ? (
                <>
                  <Check className="w-3.5 h-3.5 text-amber-300" />
                  <span className="text-amber-200 font-bold">Marked!</span>
                </>
              ) : (
                <>
                  <Highlighter className="w-3.5 h-3.5 text-amber-300" />
                  <span>Highlight</span>
                </>
              )}
            </button>

            {/* Quick Color Picker */}
            <div className="flex items-center space-x-1 px-1">
              <button
                type="button"
                onClick={() => setHighlightColor('yellow')}
                className={`w-3.5 h-3.5 rounded-full bg-amber-300 hover:scale-110 transition ${highlightColor === 'yellow' ? 'ring-2 ring-white' : ''}`}
                title="Yellow Marker"
              />
              <button
                type="button"
                onClick={() => setHighlightColor('green')}
                className={`w-3.5 h-3.5 rounded-full bg-emerald-400 hover:scale-110 transition ${highlightColor === 'green' ? 'ring-2 ring-white' : ''}`}
                title="Green Marker"
              />
              <button
                type="button"
                onClick={() => setHighlightColor('blue')}
                className={`w-3.5 h-3.5 rounded-full bg-sky-300 hover:scale-110 transition ${highlightColor === 'blue' ? 'ring-2 ring-white' : ''}`}
                title="Blue Marker"
              />
            </div>
          </div>

          <div className="w-[1px] h-3.5 bg-gray-700 mx-0.5" />

          {/* Action 3: Listen (Gemini TTS) */}
          <button
            type="button"
            onClick={handleListen}
            disabled={isLoadingAudio}
            className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold transition cursor-pointer shadow-xs disabled:opacity-50"
            title="Read aloud with Gemini AI voice"
          >
            {isLoadingAudio ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Preparing...</span>
              </>
            ) : isPlayingAudio ? (
              <>
                <Square className="w-3 h-3 text-amber-300 fill-amber-300" />
                <span>Stop</span>
              </>
            ) : (
              <>
                <Volume2 className="w-3.5 h-3.5 text-amber-300" />
                <span>Listen (Suno)</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Floating Active TTS Audio Player Bar (Pinned at bottom-right when playing) */}
      {isAudioActive && (
        <div 
          className="fixed bottom-6 right-6 z-50 bg-gray-950/95 text-white p-3.5 rounded-2xl shadow-2xl border border-blue-500/30 backdrop-blur-md max-w-sm w-full animate-in slide-in-from-bottom-4 duration-200"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-800">
            <div className="flex items-center space-x-2">
              <div className="relative flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white">
                <Volume2 className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
              </div>
              <div>
                <span className="text-xs font-bold text-gray-200 block">Gemini Voice Teacher</span>
                <span className="text-[10px] text-gray-400">
                  {selectedVoice === 'Puck' ? '👨‍🏫 Sir Puck (Male)' : '👩‍🏫 Madam Kore (Female)'}
                </span>
              </div>
            </div>

            <button
              onClick={handleStopAudio}
              className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800 transition cursor-pointer"
              title="Close player"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Snippet of what is being spoken */}
          <p className="text-[11px] text-gray-300 line-clamp-2 italic mb-3 bg-gray-900/80 p-2 rounded-lg border border-gray-800">
            "{activeSpeakingText}"
          </p>

          {/* Controls: Play/Pause, Stop, Voice Toggle, Speed */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center space-x-1.5">
              <button
                type="button"
                onClick={togglePlayPause}
                className="p-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition cursor-pointer"
                title={isPlayingAudio ? 'Pause' : 'Play'}
              >
                {isPlayingAudio ? (
                  <Pause className="w-4 h-4" />
                ) : (
                  <Play className="w-4 h-4 fill-white" />
                )}
              </button>

              <button
                type="button"
                onClick={handleStopAudio}
                className="p-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition cursor-pointer"
                title="Stop Audio"
              >
                <Square className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Voice Switcher */}
            <div className="flex items-center bg-gray-900 rounded-lg p-0.5 border border-gray-800 text-[10px]">
              <button
                type="button"
                onClick={() => {
                  setSelectedVoice('Puck');
                  if (activeSpeakingText) {
                    // Regenerate with Puck
                    handleListen();
                  }
                }}
                className={`px-2 py-1 rounded-md font-bold transition cursor-pointer ${selectedVoice === 'Puck' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
              >
                Puck (M)
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedVoice('Kore');
                  if (activeSpeakingText) {
                    // Regenerate with Kore
                    handleListen();
                  }
                }}
                className={`px-2 py-1 rounded-md font-bold transition cursor-pointer ${selectedVoice === 'Kore' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'}`}
              >
                Kore (F)
              </button>
            </div>

            {/* Speed Toggles */}
            <div className="flex items-center bg-gray-900 rounded-lg p-0.5 border border-gray-800 text-[10px]">
              {[1, 1.25, 1.5].map((speed) => (
                <button
                  key={speed}
                  type="button"
                  onClick={() => handleSpeedChange(speed)}
                  className={`px-1.5 py-1 rounded-md font-bold transition cursor-pointer ${
                    playbackSpeed === speed ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {speed}x
                </button>
              ))}
            </div>
          </div>

          {audioError && (
            <p className="text-[10px] text-red-400 mt-2 text-center font-medium">
              {audioError}
            </p>
          )}
        </div>
      )}
    </>
  );
}
