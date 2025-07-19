'use client';

import { useEffect, useRef, useState } from 'react';
import {
  setupContext,
  startRecording,
  stopRecording,
  playRecording,
  isRecording,
  hasRecording,
} from './audioProcessing';

export default function Home() {
  const visualizerRef = useRef<HTMLDivElement>(null);
  const contextRef = useRef<AudioContext>(null!);
  const [recording, setRecording] = useState(false);
  const [hasRecordedAudio, setHasRecordedAudio] = useState(false);

  useEffect(() => {
    if (contextRef !== null) {
      setupContext(contextRef);
    }

    return () => {
      if (contextRef.current) {
        contextRef.current.close();
      }
    };
  }, []);

  const handleRecordClick = async () => {
    if (recording) {
      const stopped = stopRecording();
      if (stopped) {
        setRecording(false);
        setHasRecordedAudio(true);
      }
    } else {
      const started = await startRecording();
      if (started) {
        setRecording(true);
      }
    }
  };

  const handlePlayClick = () => {
    const played = playRecording();
    if (!played) {
      console.log('No recording available to play');
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center p-8">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 max-w-md w-full">
        <h1 className="text-4xl font-black text-center tracking-tight leading-none text-white mb-8">
          Guitar Audio Processor
        </h1>

        <div
          ref={visualizerRef}
          id="visualizer"
          className="w-full h-32 bg-black/20 rounded-lg border border-white/20 mb-6"
        />

        <div className="flex gap-6 justify-center">
          <button
            onClick={handleRecordClick}
            className={`px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 hover:scale-105 active:scale-95 ${
              recording
                ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg'
                : 'bg-purple-500 hover:bg-purple-600 text-white shadow-lg'
            }`}
          >
            <div className="flex items-center gap-3">
              {recording ? (
                <>
                  <div className="w-4 h-4 bg-white rounded-full animate-pulse"></div>
                  <span>Stop Recording</span>
                </>
              ) : (
                <>
                  <div className="w-4 h-4 bg-white rounded-full"></div>
                  <span>Record</span>
                </>
              )}
            </div>
          </button>

          <button
            onClick={handlePlayClick}
            disabled={!hasRecordedAudio}
            className={`px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 hover:scale-105 active:scale-95 ${
              hasRecordedAudio
                ? 'bg-green-500 hover:bg-green-600 text-white shadow-lg'
                : 'bg-gray-400 text-gray-200 cursor-not-allowed'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 bg-white rounded-full"></div>
              <span>Play</span>
            </div>
          </button>
        </div>

        <div className="mt-4 text-center text-white/80">
          {recording
            ? 'Recording...'
            : hasRecordedAudio
              ? 'Ready to play'
              : 'Click Record to start'}
        </div>
      </div>
    </main>
  );
}
