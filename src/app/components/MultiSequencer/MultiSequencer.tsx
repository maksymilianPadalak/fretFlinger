'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import * as Tone from 'tone';

interface MultiSequencerProps {
  className?: string;
}

interface Step {
  active: boolean;
  note: string;
}

interface Track {
  id: string;
  name: string;
  steps: Step[];
  volume: number;
  muted: boolean;
  color: string;
}

const MultiSequencer: React.FC<MultiSequencerProps> = ({ className = '' }) => {
  const [tracks, setTracks] = useState<Track[]>([
    {
      id: 'kick',
      name: 'Kick',
      steps: new Array(16)
        .fill(null)
        .map(() => ({ active: false, note: 'C1' })),
      volume: 0.8,
      muted: false,
      color: 'red',
    },
    {
      id: 'bass',
      name: 'Bass',
      steps: new Array(16)
        .fill(null)
        .map(() => ({ active: false, note: 'E2' })),
      volume: 0.6,
      muted: false,
      color: 'blue',
    },
    {
      id: 'pad',
      name: 'Pad',
      steps: new Array(16)
        .fill(null)
        .map(() => ({ active: false, note: 'C4' })),
      volume: 0.4,
      muted: false,
      color: 'green',
    },
  ]);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState<number>(-1);
  const [bpm, setBpm] = useState<number>(120);
  const [masterVolume, setMasterVolume] = useState<number>(0.7);

  const sequenceRef = useRef<Tone.Sequence | null>(null);
  const kickSynthRef = useRef<Tone.MembraneSynth | null>(null);
  const bassSynthRef = useRef<Tone.MonoSynth | null>(null);
  const padSynthRef = useRef<Tone.PolySynth | null>(null);
  const masterVolumeRef = useRef<Tone.Volume | null>(null);
  const tracksRef = useRef<Track[]>(tracks);

  // Initialize Tone.js instruments
  useEffect(() => {
    const initTone = async () => {
      try {
        // Create master volume control
        masterVolumeRef.current = new Tone.Volume(
          Tone.gainToDb(masterVolume)
        ).toDestination();

        // Create kick drum synth
        kickSynthRef.current = new Tone.MembraneSynth({
          pitchDecay: 0.05,
          octaves: 10,
          oscillator: { type: 'sine' },
          envelope: { attack: 0.001, decay: 0.4, sustain: 0.01, release: 1.4 },
        }).connect(masterVolumeRef.current);

        // Create bass synth
        bassSynthRef.current = new Tone.MonoSynth({
          oscillator: { type: 'sawtooth' },
          envelope: { attack: 0.05, decay: 0.3, sustain: 0.4, release: 0.8 },
          filterEnvelope: {
            attack: 0.1,
            decay: 0.2,
            sustain: 0.5,
            release: 0.8,
          },
        }).connect(masterVolumeRef.current);

        // Create pad synth (polyphonic for chords)
        padSynthRef.current = new Tone.PolySynth(Tone.Synth, {
          oscillator: { type: 'sine' },
          envelope: { attack: 0.1, decay: 0.3, sustain: 0.7, release: 0.8 },
        }).connect(masterVolumeRef.current);
      } catch (error) {
        console.error('Failed to initialize Tone.js:', error);
      }
    };

    initTone();

    return () => {
      // Cleanup Tone.js resources
      stopSequencer();
      kickSynthRef.current?.dispose();
      bassSynthRef.current?.dispose();
      padSynthRef.current?.dispose();
      masterVolumeRef.current?.dispose();
    };
  }, []);

  // Update master volume
  useEffect(() => {
    if (masterVolumeRef.current) {
      masterVolumeRef.current.volume.value = Tone.gainToDb(masterVolume);
    }
  }, [masterVolume]);

  // Keep tracksRef in sync and update synth volumes
  useEffect(() => {
    tracksRef.current = tracks;

    // Update all synth volumes when tracks change
    tracks.forEach(track => {
      switch (track.id) {
        case 'kick':
          if (kickSynthRef.current) {
            kickSynthRef.current.volume.value = Tone.gainToDb(track.volume);
          }
          break;
        case 'bass':
          if (bassSynthRef.current) {
            bassSynthRef.current.volume.value = Tone.gainToDb(track.volume);
          }
          break;
        case 'pad':
          if (padSynthRef.current) {
            padSynthRef.current.volume.value = Tone.gainToDb(track.volume);
          }
          break;
      }
    });
  }, [tracks]);

  // Update BPM in real-time
  useEffect(() => {
    if (isPlaying) {
      Tone.Transport.bpm.value = bpm;
    }
  }, [bpm, isPlaying]);

  // Play sounds using Tone.js with proper timing
  const playKick = useCallback((noteString: string, time?: number) => {
    if (kickSynthRef.current) {
      try {
        if (time !== undefined) {
          kickSynthRef.current.triggerAttackRelease(noteString, '8n', time);
        } else {
          kickSynthRef.current.triggerAttackRelease(noteString, '8n');
        }
      } catch (error) {
        console.warn('Kick synth timing error:', error);
      }
    }
  }, []);

  const playBass = useCallback((noteString: string, time?: number) => {
    if (bassSynthRef.current) {
      try {
        if (time !== undefined) {
          bassSynthRef.current.triggerAttackRelease(noteString, '4n', time);
        } else {
          bassSynthRef.current.triggerAttackRelease(noteString, '4n');
        }
      } catch (error) {
        console.warn('Bass synth timing error:', error);
      }
    }
  }, []);

  const playPad = useCallback((noteString: string, time?: number) => {
    if (padSynthRef.current) {
      try {
        if (time !== undefined) {
          padSynthRef.current.triggerAttackRelease(noteString, '2n', time);
        } else {
          padSynthRef.current.triggerAttackRelease(noteString, '2n');
        }
      } catch (error) {
        console.warn('Pad synth timing error:', error);
      }
    }
  }, []);

  const playTrackSound = useCallback(
    (trackId: string, note: string) => {
      const track = tracksRef.current.find(t => t.id === trackId);
      if (!track || track.muted) return;

      switch (trackId) {
        case 'kick':
          playKick(note);
          break;
        case 'bass':
          playBass(note);
          break;
        case 'pad':
          playPad(note);
          break;
      }
    },
    [playKick, playBass, playPad]
  );

  const toggleStep = useCallback(
    (trackId: string, stepIndex: number) => {
      setTracks(prevTracks => {
        const newTracks = prevTracks.map(track => {
          if (track.id === trackId) {
            const newSteps = [...track.steps];
            const wasActive = newSteps[stepIndex].active;
            newSteps[stepIndex] = {
              ...newSteps[stepIndex],
              active: !newSteps[stepIndex].active,
            };

            // Play sound when activating step
            if (!wasActive && newSteps[stepIndex].active) {
              playTrackSound(trackId, newSteps[stepIndex].note);
            }

            return { ...track, steps: newSteps };
          }
          return track;
        });
        tracksRef.current = newTracks;
        return newTracks;
      });
    },
    [playTrackSound]
  );

  const updateStepNote = useCallback(
    (trackId: string, stepIndex: number, newNote: string) => {
      setTracks(prevTracks => {
        const newTracks = prevTracks.map(track => {
          if (track.id === trackId) {
            const newSteps = [...track.steps];
            newSteps[stepIndex] = {
              ...newSteps[stepIndex],
              note: newNote,
            };
            return { ...track, steps: newSteps };
          }
          return track;
        });
        tracksRef.current = newTracks;
        return newTracks;
      });
    },
    []
  );

  const updateTrackVolume = useCallback((trackId: string, volume: number) => {
    // Update synth volume immediately
    switch (trackId) {
      case 'kick':
        if (kickSynthRef.current) {
          kickSynthRef.current.volume.value = Tone.gainToDb(volume);
        }
        break;
      case 'bass':
        if (bassSynthRef.current) {
          bassSynthRef.current.volume.value = Tone.gainToDb(volume);
        }
        break;
      case 'pad':
        if (padSynthRef.current) {
          padSynthRef.current.volume.value = Tone.gainToDb(volume);
        }
        break;
    }

    setTracks(prevTracks =>
      prevTracks.map(track =>
        track.id === trackId ? { ...track, volume } : track
      )
    );
  }, []);

  const toggleTrackMute = useCallback((trackId: string) => {
    setTracks(prevTracks =>
      prevTracks.map(track =>
        track.id === trackId ? { ...track, muted: !track.muted } : track
      )
    );
  }, []);

  const clearTrack = useCallback((trackId: string) => {
    setTracks(prevTracks => {
      const newTracks = prevTracks.map(track => {
        if (track.id === trackId) {
          const clearedSteps = track.steps.map(step => ({
            ...step,
            active: false,
          }));
          return { ...track, steps: clearedSteps };
        }
        return track;
      });
      tracksRef.current = newTracks;
      return newTracks;
    });
  }, []);

  const playSequencer = useCallback(async () => {
    // Start Tone.js audio context
    if (Tone.context.state !== 'running') {
      await Tone.start();
    }

    Tone.Transport.bpm.value = bpm;

    // Create a sequence
    sequenceRef.current = new Tone.Sequence(
      (time, step) => {
        // Update UI on the next animation frame
        Tone.Draw.schedule(() => {
          setCurrentStep(step);
        }, time);

        // Play all active tracks for this step
        tracksRef.current.forEach(track => {
          if (!track.muted && track.steps[step].active) {
            const note = track.steps[step].note;

            // Schedule sounds at the precise time
            switch (track.id) {
              case 'kick':
                if (kickSynthRef.current) {
                  kickSynthRef.current.triggerAttackRelease(note, '8n', time);
                }
                break;
              case 'bass':
                if (bassSynthRef.current) {
                  bassSynthRef.current.triggerAttackRelease(note, '4n', time);
                }
                break;
              case 'pad':
                if (padSynthRef.current) {
                  padSynthRef.current.triggerAttackRelease(note, '2n', time);
                }
                break;
            }
          }
        });
      },
      Array.from({ length: 16 }, (_, i) => i),
      '16n'
    );

    sequenceRef.current.start(0);
    Tone.Transport.start();
    setIsPlaying(true);
  }, [bpm]);

  const stopSequencer = useCallback(() => {
    Tone.Transport.stop();
    sequenceRef.current?.stop();
    sequenceRef.current?.dispose();
    sequenceRef.current = null;
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

  const getNotesForTrack = (trackId: string): string[] => {
    switch (trackId) {
      case 'kick':
        // Kick drums - low frequencies
        return [
          'C1',
          'D1',
          'E1',
          'F1',
          'G1',
          'A1',
          'B1',
          'C2',
          'D2',
          'E2',
          'F2',
          'G2',
        ];
      case 'bass':
        // Bass - low to mid-low frequencies
        return [
          'C1',
          'D1',
          'E1',
          'F1',
          'G1',
          'A1',
          'B1',
          'C2',
          'D2',
          'E2',
          'F2',
          'G2',
          'A2',
          'B2',
          'C3',
        ];
      case 'pad':
        // Pad - wide range for chords and melodies
        return [
          'C3',
          'D3',
          'E3',
          'F3',
          'G3',
          'A3',
          'B3',
          'C4',
          'D4',
          'E4',
          'F4',
          'G4',
          'A4',
          'B4',
          'C5',
          'D5',
          'E5',
        ];
      default:
        return ['C3', 'D3', 'E3', 'F3', 'G3', 'A3', 'B3', 'C4'];
    }
  };

  const getTrackColorClasses = (
    color: string,
    active: boolean,
    muted: boolean
  ) => {
    if (muted) return 'bg-gray-300 border-gray-400 text-gray-500';

    const colorMap = {
      red: active
        ? 'bg-red-500 border-red-600 text-white'
        : 'bg-red-100 border-red-300 text-red-700',
      blue: active
        ? 'bg-blue-500 border-blue-600 text-white'
        : 'bg-blue-100 border-blue-300 text-blue-700',
      green: active
        ? 'bg-green-500 border-green-600 text-white'
        : 'bg-green-100 border-green-300 text-green-700',
    };

    return (
      colorMap[color as keyof typeof colorMap] ||
      'bg-gray-100 border-gray-300 text-gray-600'
    );
  };

  return (
    <div className={`p-6 bg-white rounded-lg shadow-lg ${className}`}>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        Multi-Track Sequencer (Tone.js)
      </h2>

      {/* Master Controls */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-4 mb-4">
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
        </div>

        <div className="grid grid-cols-2 gap-4">
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
              Master Volume: {Math.round(masterVolume * 100)}%
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={masterVolume}
              onChange={e => setMasterVolume(parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Step position indicator */}
      <div className="flex gap-1 mb-6">
        {Array.from({ length: 16 }, (_, index) => (
          <div
            key={index}
            className={`flex-1 h-2 rounded-full transition-all duration-150 ${
              currentStep === index && isPlaying
                ? 'bg-yellow-400'
                : index % 4 === 0
                  ? 'bg-red-300'
                  : 'bg-gray-300'
            }`}
          />
        ))}
      </div>

      {/* Tracks */}
      {tracks.map(track => (
        <div key={track.id} className="mb-6 p-4 border rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-700">
              {track.name}
              <span className="text-sm font-normal text-gray-500 ml-2">
                ({getNotesForTrack(track.id)[0]}-
                {
                  getNotesForTrack(track.id)[
                    getNotesForTrack(track.id).length - 1
                  ]
                }
                )
              </span>
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => toggleTrackMute(track.id)}
                className={`px-3 py-1 rounded text-sm font-medium ${
                  track.muted
                    ? 'bg-red-500 text-white'
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                {track.muted ? 'Muted' : 'Active'}
              </button>
              <button
                onClick={() => clearTrack(track.id)}
                className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Track steps */}
          <div className="flex gap-1 mb-3">
            {track.steps.map((step, stepIndex) => (
              <div
                key={stepIndex}
                className="flex-1 flex flex-col items-center"
              >
                <button
                  onClick={() => toggleStep(track.id, stepIndex)}
                  className={`
                    w-full h-8 rounded border-2 transition-all duration-150 text-xs font-bold flex flex-col items-center justify-center
                    ${getTrackColorClasses(track.color, step.active, track.muted)}
                    ${currentStep === stepIndex && isPlaying ? 'ring-2 ring-yellow-400 scale-110' : ''}
                  `}
                >
                  <span className="text-xs leading-none">{stepIndex + 1}</span>
                  {step.active && (
                    <span className="text-xs leading-none font-normal opacity-75">
                      {step.note}
                    </span>
                  )}
                </button>
                {step.active && (
                  <select
                    value={step.note}
                    onChange={e =>
                      updateStepNote(track.id, stepIndex, e.target.value)
                    }
                    className="mt-1 text-xs border rounded px-1 py-0.5 w-full text-center bg-white"
                    onClick={e => e.stopPropagation()}
                  >
                    {getNotesForTrack(track.id).map(note => (
                      <option key={note} value={note}>
                        {note}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            ))}
          </div>

          {/* Track volume */}
          <div>
            <label className="block text-xs text-gray-600 mb-1">
              Volume: {Math.round(track.volume * 100)}%
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={track.volume}
              onChange={e =>
                updateTrackVolume(track.id, parseFloat(e.target.value))
              }
              className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>
      ))}
    </div>
  );
};

export default MultiSequencer;
