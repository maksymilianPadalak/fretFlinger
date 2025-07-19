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
    <main className="min-h-screen bg-white flex items-center justify-center p-2">
      <div className="max-w-sm w-full ">
        <h1 className="text-2xl font-medium text-center text-gray-900">
          Guitar Audio Processor
        </h1>

        <div
          ref={visualizerRef}
          id="visualizer"
          className="w-full h-24 my-4 bg-gray-100 rounded border"
        />

        <div className="flex gap-4">
          <button
            onClick={handleRecordClick}
            className={`flex-1 py-3 px-4 rounded font-medium transition-colors cursor-pointer ${
              recording
                ? 'bg-red-500 text-white hover:bg-red-600'
                : 'bg-gray-900 text-white hover:bg-gray-800'
            }`}
          >
            {recording ? 'Stop' : 'Record'}
          </button>

          <button
            onClick={handlePlayClick}
            disabled={!hasRecordedAudio}
            className={`flex-1 py-3 px-4 rounded font-medium transition-colors ${
              hasRecordedAudio
                ? 'bg-gray-900 text-white hover:bg-gray-800 cursor-pointer'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }
            `}
          >
            Play
          </button>
        </div>

        <div className="text-center text-sm text-gray-500 mt-4">
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
