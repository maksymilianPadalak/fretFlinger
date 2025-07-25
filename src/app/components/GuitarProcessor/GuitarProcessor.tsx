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
  getRecordingDuration,
  getRecordingSize,
  formatDuration,
  formatSize,
  waitForRecordingProcessing,
} from '../../audioProcessing';
import AudioVisualizer from '../AudioVisualizer';

interface GuitarProcessorProps {
  className?: string;
}

export default function GuitarProcessor({
  className = '',
}: GuitarProcessorProps) {
  const visualizerRef = useRef<HTMLDivElement>(null);
  const contextRef = useRef<AudioContext>(null!);
  const [recording, setRecording] = useState(false);
  const [hasRecordedAudio, setHasRecordedAudio] = useState(false);
  const [audioReady, setAudioReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [recordingInfo, setRecordingInfo] = useState<{
    duration: string;
    size: string;
  } | null>(null);
  const [loadingRecordingInfo, setLoadingRecordingInfo] = useState(false);

  useEffect(() => {
    const initializeAudio = async () => {
      try {
        setIsLoading(true);
        if (contextRef !== null) {
          const success = await setupContext(contextRef);
          if (success) {
            setAudioReady(true);
          }
        }
      } catch (error) {
        console.error('Failed to initialize audio:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAudio();
  }, []);

  const handleRecordClick = async () => {
    if (recording) {
      const stopped = stopRecording();
      if (stopped) {
        setRecording(false);
        setHasRecordedAudio(true);
        setLoadingRecordingInfo(true);
        setRecordingInfo(null);

        try {
          await waitForRecordingProcessing();
          const duration = await getRecordingDuration();
          const size = getRecordingSize();

          if (duration !== null && size !== null) {
            setRecordingInfo({
              duration: formatDuration(duration),
              size: formatSize(size),
            });
          }
        } catch (error) {
          console.error('Error processing recording info:', error);
        } finally {
          setLoadingRecordingInfo(false);
        }
      }
    } else {
      const started = await startRecording();
      if (started) {
        setRecording(true);
        setHasRecordedAudio(false);
        setRecordingInfo(null);
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
    <div
      className={`max-w-sm mx-auto bg-white rounded-lg shadow-lg p-6 ${className}`}
    >
      <h1 className="text-2xl font-medium text-center text-gray-900 mb-4">
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

      {/* Convolution Reverb Control */}
      <div className="mb-6 p-4 bg-gray-50 rounded border">
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-700">
            🎸 Guitar Reverb (Convolution)
          </label>
          <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
            ✓ Active
          </span>
        </div>
        <div className="text-xs text-gray-500 text-center">
          Real convolution reverb with impulse response - Dry + Wet signal mix
        </div>
      </div>

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
          }`}
        >
          Play
        </button>
      </div>

      {loadingRecordingInfo && (
        <div className="mt-4 p-4 bg-gray-50 rounded border">
          <div className="flex items-center justify-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500"></div>
            <span className="text-sm text-gray-600">
              Calculating duration...
            </span>
          </div>
        </div>
      )}

      {recordingInfo && (
        <div className="mt-4 p-4 bg-gray-50 rounded border">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="text-sm text-gray-600">
                Duration:{' '}
                <span className="font-medium text-gray-900">
                  {recordingInfo.duration}
                </span>
              </div>
              <div className="text-sm text-gray-600">
                Size:{' '}
                <span className="font-medium text-gray-900">
                  {recordingInfo.size}
                </span>
              </div>
            </div>
            <button
              onClick={handlePlayClick}
              className="px-4 py-2 bg-blue-500 text-white rounded font-medium hover:bg-blue-600 transition-colors"
            >
              Play Recording
            </button>
          </div>
        </div>
      )}

      <div className="text-center text-sm text-gray-500 mt-4">
        {recording
          ? 'Recording...'
          : hasRecordedAudio
            ? 'Ready to play'
            : 'Click Record to start'}
      </div>
    </div>
  );
}
