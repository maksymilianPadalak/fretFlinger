'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { noteToHz, isValidNote } from '../../audioProcessing/noteFrequencies';

interface NotePlayerProps {
  className?: string;
}

interface PlayingNote {
  note: string;
  frequency: number;
  startTime: number;
}

const NotePlayer: React.FC<NotePlayerProps> = ({ className = '' }) => {
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentNote, setCurrentNote] = useState<string>('');
  const [inputValue, setInputValue] = useState<string>('a4');
  const [sequence, setSequence] = useState<string>('a4 b4 c5 d5 e5 f5 g5 a5');
  const [volume, setVolume] = useState<number>(0.5);
  const [noteDuration, setNoteDuration] = useState<number>(500);
  const [playingNotes, setPlayingNotes] = useState<PlayingNote[]>([]);

  const oscillatorsRef = useRef<Set<OscillatorNode>>(new Set());
  const gainNodeRef = useRef<GainNode | null>(null);
  const sequenceTimeoutsRef = useRef<Set<NodeJS.Timeout>>(new Set());

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
      // Cleanup on unmount
      stopAllNotes();
      audioContext?.close();
    };
  }, []);

  // Update volume when volume state changes
  useEffect(() => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = volume;
    }
  }, [volume]);

  const stopAllNotes = useCallback(() => {
    // Stop all oscillators
    oscillatorsRef.current.forEach(oscillator => {
      try {
        oscillator.stop();
        oscillator.disconnect();
      } catch (error) {
        // Oscillator might already be stopped
      }
    });
    oscillatorsRef.current.clear();

    // Clear all timeouts
    sequenceTimeoutsRef.current.forEach(timeout => {
      clearTimeout(timeout);
    });
    sequenceTimeoutsRef.current.clear();

    setIsPlaying(false);
    setCurrentNote('');
    setPlayingNotes([]);
  }, []);

  const playNote = useCallback(
    (noteString: string, duration: number = noteDuration) => {
      if (!audioContext || !gainNodeRef.current) {
        console.error('Audio context not initialized');
        return;
      }

      const frequency = noteToHz(noteString);
      if (!frequency) {
        console.error(`Invalid note: ${noteString}`);
        return;
      }

      try {
        // Create oscillator
        const oscillator = audioContext.createOscillator();
        oscillator.frequency.setValueAtTime(
          frequency,
          audioContext.currentTime
        );
        oscillator.type = 'sine'; // You can change this to 'square', 'sawtooth', or 'triangle'

        // Connect to gain node
        oscillator.connect(gainNodeRef.current);

        // Add to tracking set
        oscillatorsRef.current.add(oscillator);

        // Start the oscillator
        oscillator.start();

        // Stop after duration
        const stopTime = audioContext.currentTime + duration / 1000;
        oscillator.stop(stopTime);

        // Clean up when finished
        oscillator.onended = () => {
          oscillatorsRef.current.delete(oscillator);
          oscillator.disconnect();
        };

        // Update UI
        setCurrentNote(noteString);
        const playingNote: PlayingNote = {
          note: noteString,
          frequency,
          startTime: Date.now(),
        };

        setPlayingNotes(prev => [...prev, playingNote]);

        // Remove from playing notes after duration
        setTimeout(() => {
          setPlayingNotes(prev =>
            prev.filter(n => n.startTime !== playingNote.startTime)
          );
          if (oscillatorsRef.current.size === 0) {
            setCurrentNote('');
          }
        }, duration);
      } catch (error) {
        console.error('Error playing note:', error);
      }
    },
    [audioContext, noteDuration]
  );

  const playSequence = useCallback(() => {
    if (!sequence.trim()) return;

    const notes = sequence
      .trim()
      .split(/\s+/)
      .filter(note => isValidNote(note));
    if (notes.length === 0) {
      console.error('No valid notes found in sequence');
      return;
    }

    setIsPlaying(true);

    notes.forEach((note, index) => {
      const timeout = setTimeout(
        () => {
          playNote(note, noteDuration);

          // If this is the last note, set playing to false after its duration
          if (index === notes.length - 1) {
            setTimeout(() => {
              setIsPlaying(false);
            }, noteDuration);
          }
        },
        index * (noteDuration + 50)
      ); // 50ms gap between notes

      sequenceTimeoutsRef.current.add(timeout);
    });
  }, [sequence, playNote, noteDuration]);

  const handleSingleNotePlay = () => {
    if (!isValidNote(inputValue)) {
      console.error(`Invalid note: ${inputValue}`);
      return;
    }
    playNote(inputValue);
  };

  const handleSequencePlay = () => {
    if (isPlaying) {
      stopAllNotes();
    } else {
      playSequence();
    }
  };

  return (
    <div className={`p-6 bg-white rounded-lg shadow-lg ${className}`}>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Note Player</h2>

      {/* Single Note Player */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-700 mb-3">
          Play Single Note
        </h3>
        <div className="flex items-center gap-3 mb-2">
          <input
            type="text"
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            placeholder="e.g., a4, c#3, bb5"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleSingleNotePlay}
            disabled={!isValidNote(inputValue)}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            Play Note
          </button>
        </div>
        {!isValidNote(inputValue) && inputValue && (
          <p className="text-sm text-red-500">
            Invalid note format. Use format like: a4, c#3, bb5
          </p>
        )}
      </div>

      {/* Sequence Player */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-700 mb-3">
          Play Note Sequence
        </h3>
        <div className="mb-3">
          <textarea
            value={sequence}
            onChange={e => setSequence(e.target.value)}
            placeholder="Enter notes separated by spaces (e.g., a4 b4 c5 d5)"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            rows={3}
          />
        </div>
        <button
          onClick={handleSequencePlay}
          className={`px-6 py-2 rounded-md text-white transition-colors ${
            isPlaying
              ? 'bg-red-500 hover:bg-red-600'
              : 'bg-green-500 hover:bg-green-600'
          }`}
        >
          {isPlaying ? 'Stop Sequence' : 'Play Sequence'}
        </button>
      </div>

      {/* Controls */}
      <div className="mb-6 space-y-4">
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
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Note Duration: {noteDuration}ms
          </label>
          <input
            type="range"
            min="100"
            max="2000"
            step="100"
            value={noteDuration}
            onChange={e => setNoteDuration(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
          />
        </div>
      </div>

      {/* Status Display */}
      <div className="bg-gray-50 p-4 rounded-md">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Status</h4>
        {playingNotes.length > 0 ? (
          <div>
            <p className="text-sm text-green-600 font-medium">
              Playing: {playingNotes.map(n => n.note).join(', ')}
            </p>
            {playingNotes.map((note, index) => (
              <p key={index} className="text-xs text-gray-500">
                {note.note}: {note.frequency.toFixed(2)} Hz
              </p>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No notes playing</p>
        )}
      </div>

      {/* Quick Note Buttons */}
      <div className="mt-6">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Quick Play</h4>
        <div className="grid grid-cols-7 gap-2">
          {['c4', 'd4', 'e4', 'f4', 'g4', 'a4', 'b4'].map(note => (
            <button
              key={note}
              onClick={() => playNote(note)}
              className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-md transition-colors"
            >
              {note.toUpperCase()}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-2 mt-2">
          {['c5', 'd5', 'e5', 'f5', 'g5', 'a5', 'b5'].map(note => (
            <button
              key={note}
              onClick={() => playNote(note)}
              className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-md transition-colors"
            >
              {note.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NotePlayer;
