'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { noteToHz } from '../../audioProcessing/noteFrequencies';

interface SequencerProps {
  className?: string;
}

const Sequencer: React.FC<SequencerProps> = ({ className = '' }) => {
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [steps, setSteps] = useState<boolean[]>(new Array(16).fill(false));
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState<number>(-1);
  const [bpm, setBpm] = useState<number>(120);
  const [volume, setVolume] = useState<number>(0.5);

  const gainNodeRef = useRef<GainNode | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const stepsRef = useRef<boolean[]>(steps);

  // Initialize audio context
  useEffect(() => {
    const initAudio = async () => {
      try {
        const context = new AudioContext();
        const gainNode = context.createGain();
        gainNode.connect(context.destination);
        gainNode.gain.value = volume;

        setAudioContext(context);
        gainNodeRef.current = gainNode;
      } catch (error) {
        console.error('Failed to initialize audio context:', error);
      }
    };

    initAudio();

    return () => {
      stopSequencer();
      audioContext?.close();
    };
  }, []);

  // Update volume when volume state changes
  useEffect(() => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = volume;
    }
  }, [volume]);

  // Keep stepsRef in sync with steps state
  useEffect(() => {
    stepsRef.current = steps;
  }, [steps]);

  const playNote = useCallback(
    (noteString: string, duration: number = 150) => {
      if (!audioContext || !gainNodeRef.current) {
        return;
      }

      const frequency = noteToHz(noteString);
      if (!frequency) {
        return;
      }

      try {
        // Stop any currently playing note
        if (oscillatorRef.current) {
          try {
            oscillatorRef.current.stop();
            oscillatorRef.current.disconnect();
          } catch (error) {
            // Oscillator might already be stopped
          }
        }

        // Create new oscillator
        const oscillator = audioContext.createOscillator();
        oscillator.frequency.setValueAtTime(
          frequency,
          audioContext.currentTime
        );
        oscillator.type = 'square'; // Using square wave for a more electronic sound

        // Connect to gain node
        oscillator.connect(gainNodeRef.current);

        // Store reference
        oscillatorRef.current = oscillator;

        // Start the oscillator
        oscillator.start();

        // Stop after duration
        const stopTime = audioContext.currentTime + duration / 1000;
        oscillator.stop(stopTime);

        // Clean up when finished
        oscillator.onended = () => {
          if (oscillatorRef.current === oscillator) {
            oscillatorRef.current = null;
          }
          oscillator.disconnect();
        };
      } catch (error) {
        console.error('Error playing note:', error);
      }
    },
    [audioContext]
  );

  // Update BPM in real-time while playing
  useEffect(() => {
    if (isPlaying && audioContext) {
      // Restart the sequencer with the new BPM, maintaining current position
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      const stepDuration = (60 / bpm / 4) * 1000; // 16th notes in milliseconds

      const playStep = (stepIndex: number) => {
        setCurrentStep(stepIndex);

        // Use the ref to get the current steps (real-time updates)
        if (stepsRef.current[stepIndex]) {
          playNote('c3', stepDuration * 0.8); // Play for 80% of step duration
        }
      };

      intervalRef.current = setInterval(() => {
        setCurrentStep(prevStep => {
          const nextStep = (prevStep + 1) % 16;
          playStep(nextStep);
          return nextStep;
        });
      }, stepDuration);
    }
  }, [bpm, isPlaying, audioContext, playNote]);

  const toggleStep = useCallback(
    (stepIndex: number) => {
      setSteps(prevSteps => {
        const newSteps = [...prevSteps];
        const wasActive = newSteps[stepIndex];
        newSteps[stepIndex] = !newSteps[stepIndex];

        // Update the ref so the playing loop uses the latest pattern
        stepsRef.current = newSteps;

        // If step is being activated (turned on), play the note immediately
        if (!wasActive && newSteps[stepIndex]) {
          playNote('c3', 200); // Play for 200ms when activating step
        }

        return newSteps;
      });
    },
    [playNote]
  );

  const clearAllSteps = useCallback(() => {
    const newSteps = new Array(16).fill(false);
    setSteps(newSteps);
    stepsRef.current = newSteps;
  }, []);

  const playSequencer = useCallback(() => {
    if (!audioContext) return;

    setIsPlaying(true);
    setCurrentStep(0);

    const stepDuration = (60 / bpm / 4) * 1000; // 16th notes in milliseconds

    const playStep = (stepIndex: number) => {
      setCurrentStep(stepIndex);

      // Use the ref to get the current steps (real-time updates)
      if (stepsRef.current[stepIndex]) {
        playNote('c3', stepDuration * 0.8); // Play for 80% of step duration
      }
    };

    let stepIndex = 0;
    playStep(stepIndex);

    intervalRef.current = setInterval(() => {
      stepIndex = (stepIndex + 1) % 16;
      playStep(stepIndex);
    }, stepDuration);
  }, [audioContext, bpm, playNote]);

  const stopSequencer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Stop any playing note
    if (oscillatorRef.current) {
      try {
        oscillatorRef.current.stop();
        oscillatorRef.current.disconnect();
        oscillatorRef.current = null;
      } catch (error) {
        // Oscillator might already be stopped
      }
    }

    setIsPlaying(false);
    setCurrentStep(-1);
  }, []);

  const handlePlayStop = () => {
    if (isPlaying) {
      stopSequencer();
    } else {
      playSequencer();
    }
  };

  return (
    <div className={`p-6 bg-white rounded-lg shadow-lg ${className}`}>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Step Sequencer</h2>

      {/* Step Grid */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-3">Steps (C3)</h3>
        <div className="grid grid-cols-8 gap-2 mb-4">
          {steps.map((isActive, index) => (
            <button
              key={index}
              onClick={() => toggleStep(index)}
              className={`
                aspect-square w-12 h-12 rounded-md border-2 transition-all duration-150 font-bold text-sm
                ${
                  isActive
                    ? 'bg-blue-500 border-blue-600 text-white shadow-lg'
                    : 'bg-gray-100 border-gray-300 text-gray-600 hover:bg-gray-200'
                }
                ${
                  currentStep === index && isPlaying
                    ? 'ring-4 ring-yellow-400 ring-opacity-75 scale-110'
                    : ''
                }
              `}
            >
              {index + 1}
            </button>
          ))}
        </div>

        {/* Step indicators */}
        <div className="grid grid-cols-8 gap-2 mb-4">
          {steps.map((_, index) => (
            <div
              key={index}
              className={`
                h-1 rounded-full transition-all duration-150
                ${
                  currentStep === index && isPlaying
                    ? 'bg-yellow-400'
                    : index % 4 === 0
                      ? 'bg-red-300'
                      : 'bg-gray-300'
                }
              `}
            />
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="space-y-4 mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={handlePlayStop}
            className={`px-6 py-2 rounded-md text-white font-medium transition-colors ${
              isPlaying
                ? 'bg-red-500 hover:bg-red-600'
                : 'bg-green-500 hover:bg-green-600'
            }`}
          >
            {isPlaying ? 'Stop' : 'Play'}
          </button>

          <button
            onClick={clearAllSteps}
            className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
          >
            Clear All
          </button>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            BPM: {bpm}
          </label>
          <input
            type="range"
            min="60"
            max="180"
            step="5"
            value={bpm}
            onChange={e => setBpm(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Volume: {Math.round(volume * 100)}%
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={volume}
            onChange={e => setVolume(parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
        </div>
      </div>

      {/* Pattern Display */}
      <div className="bg-gray-50 p-4 rounded-md">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Pattern</h4>
        <div className="text-sm font-mono">
          {steps.map((isActive, index) => (
            <span
              key={index}
              className={`
                inline-block w-6 text-center
                ${isActive ? 'text-blue-600 font-bold' : 'text-gray-400'}
                ${currentStep === index && isPlaying ? 'bg-yellow-200' : ''}
              `}
            >
              {isActive ? '●' : '○'}
            </span>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Active steps: {steps.filter(Boolean).length}/16
        </p>
      </div>
    </div>
  );
};

export default Sequencer;
