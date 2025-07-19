'use client';

import { useEffect, useRef, useState } from 'react';
import {
  setupContext,
  startRecording,
  stopRecording,
  playRecording,
  isRecording,
  hasRecording,
  getAudioContext,
  getSourceNode,
} from './audioProcessing';
import AudioVisualizer from './components/AudioVisualizer';

export default function Home() {
  const visualizerRef = useRef<HTMLDivElement>(null);
  const contextRef = useRef<AudioContext>(null!);
  const [recording, setRecording] = useState(false);
  const [hasRecordedAudio, setHasRecordedAudio] = useState(false);
  const [audioReady, setAudioReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeAudio = async () => {
      try {
        setIsLoading(true);
        if (contextRef !== null) {
          const success = await setupContext(contextRef);
          if (success) {
            setAudioReady(true);
          }
          // If not successful, audioReady remains false and error state will be shown
        }
      } catch (error) {
        console.error('Failed to initialize audio:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAudio();

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

        {isLoading ? (
          <div className="w-full h-32 my-4 bg-gray-100 rounded border flex items-center justify-center">
            <div className="text-center text-gray-500">
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500"></div>
                <span className="text-sm">Requesting microphone access...</span>
              </div>
              <div className="text-xs mt-2">
                Please allow microphone access when prompted
              </div>
            </div>
          </div>
        ) : audioReady ? (
          <AudioVisualizer
            ref={visualizerRef}
            audioContext={getAudioContext()}
            sourceNode={getSourceNode()}
            isRecording={recording}
          />
        ) : (
          <div className="w-full h-32 my-4 bg-gray-100 rounded border flex items-center justify-center">
            <div className="text-center text-gray-500">
              <div className="text-sm">Microphone access denied</div>
              <div className="text-xs mt-1">
                Please allow microphone access and refresh the page
              </div>
            </div>
          </div>
        )}

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
