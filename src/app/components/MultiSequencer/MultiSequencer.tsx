'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import * as Tone from 'tone';
import { MultiSequencerProps, Track, Preset } from './types';
import { PRESETS } from './presets';
import {
  getNotesForTrack,
  getTrackColorClasses,
  getChordNotes,
} from './audioUtils';
import { useAudioPlayback } from './useAudioHooks';

const MultiSequencer: React.FC<MultiSequencerProps> = ({
  className = '',
  externalPreset = null,
  onPresetLoaded,
}) => {
  const [tracks, setTracks] = useState<Track[]>([
    {
      id: 'kick',
      name: 'Kick',
      steps: new Array(64)
        .fill(null)
        .map(() => ({ active: false, note: 'C1' })),
      volume: 0.6,
      muted: false,
      color: 'red',
    },
    {
      id: 'snare',
      name: 'Snare',
      steps: new Array(64)
        .fill(null)
        .map(() => ({ active: false, note: 'C2' })),
      volume: 0.4,
      muted: false,
      color: 'orange',
    },
    {
      id: 'hihat',
      name: 'Hi-Hat',
      steps: new Array(64)
        .fill(null)
        .map(() => ({ active: false, note: 'C3' })),
      volume: 0.3,
      muted: false,
      color: 'yellow',
    },
    {
      id: 'bass',
      name: 'Bass',
      steps: new Array(64)
        .fill(null)
        .map(() => ({ active: false, note: 'E2' })),
      volume: 0.5,
      muted: false,
      color: 'blue',
    },
    {
      id: 'piano',
      name: 'Piano',
      steps: new Array(64).fill(null).map(() => ({ active: false, note: 'C' })),
      volume: 0.4,
      muted: false,
      color: 'purple',
    },
    {
      id: 'pad',
      name: 'Pad',
      steps: new Array(64).fill(null).map(() => ({ active: false, note: 'C' })),
      volume: 0.3,
      muted: false,
      color: 'green',
    },
    {
      id: 'lead',
      name: 'Lead',
      steps: new Array(64)
        .fill(null)
        .map(() => ({ active: false, note: 'C4' })),
      volume: 0.4,
      muted: false,
      color: 'pink',
    },
  ]);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState<number>(-1);
  const [bpm, setBpm] = useState<number>(120);
  const [masterVolume, setMasterVolume] = useState<number>(0.5); // Lower default volume for mellow sound

  const [selectedPreset, setSelectedPreset] = useState<string>('');

  const sequenceRef = useRef<Tone.Sequence | null>(null);
  const kickSynthRef = useRef<Tone.MembraneSynth | null>(null);
  const snareSynthRef = useRef<Tone.NoiseSynth | null>(null);
  const hihatSynthRef = useRef<Tone.MetalSynth | null>(null);
  const bassSynthRef = useRef<Tone.MonoSynth | null>(null);
  const pianoSynthRef = useRef<Tone.PolySynth | null>(null);
  const padSynthRef = useRef<Tone.PolySynth | null>(null);
  const leadSynthRef = useRef<Tone.MonoSynth | null>(null);
  const masterVolumeRef = useRef<Tone.Volume | null>(null);
  const mainReverbRef = useRef<Tone.Reverb | null>(null);
  const drumReverbRef = useRef<Tone.Reverb | null>(null);
  const leadReverbRef = useRef<Tone.Reverb | null>(null);
  const delayRef = useRef<Tone.PingPongDelay | null>(null);
  const chorusRef = useRef<Tone.Chorus | null>(null);
  const compressorRef = useRef<Tone.Compressor | null>(null);
  const autoFilterRef = useRef<Tone.AutoFilter | null>(null);
  const tracksRef = useRef<Track[]>(tracks);

  // Use the audio playback hook
  const { playTrackSound } = useAudioPlayback({
    kickSynthRef,
    snareSynthRef,
    hihatSynthRef,
    bassSynthRef,
    pianoSynthRef,
    padSynthRef,
    leadSynthRef,
  });

  // Initialize Tone.js instruments with Bon Iver-style effects
  useEffect(() => {
    const initTone = async () => {
      try {
        // Create Bon Iver-style effect chain
        delayRef.current = new Tone.PingPongDelay('8n', 0.3).toDestination();
        chorusRef.current = new Tone.Chorus(4, 2.5, 0.5).toDestination();
        compressorRef.current = new Tone.Compressor(-30, 3).toDestination();
        autoFilterRef.current = new Tone.AutoFilter('4n').toDestination();
        autoFilterRef.current.start();

        // Create multiple reverb effects for different instruments
        mainReverbRef.current = new Tone.Reverb({
          decay: 6,
          preDelay: 0.3,
          wet: 0.6,
        }).connect(delayRef.current);

        drumReverbRef.current = new Tone.Reverb({
          decay: 2.5,
          preDelay: 0.08,
          wet: 0.4,
        }).connect(compressorRef.current);

        leadReverbRef.current = new Tone.Reverb({
          decay: 4,
          preDelay: 0.15,
          wet: 0.5,
        }).connect(chorusRef.current);

        // Create master volume control
        masterVolumeRef.current = new Tone.Volume(
          Tone.gainToDb(masterVolume)
        ).toDestination();

        // Create warm, filtered kick drum with Bon Iver processing
        kickSynthRef.current = new Tone.MembraneSynth({
          pitchDecay: 0.2,
          octaves: 4,
          oscillator: {
            type: 'sine',
          },
          envelope: {
            attack: 0.02,
            decay: 1.2,
            sustain: 0.03,
            release: 2.5,
          },
        });

        // Add filter and connect to effects chain
        const kickFilter = new Tone.Filter(120, 'lowpass').connect(
          drumReverbRef.current
        );
        kickSynthRef.current.connect(kickFilter);
        kickSynthRef.current.volume.value = -8;

        // Create soft, filtered snare with ethereal processing
        snareSynthRef.current = new Tone.NoiseSynth({
          noise: { type: 'pink' },
          envelope: {
            attack: 0.02,
            decay: 0.4,
            sustain: 0.0,
            release: 0.8,
          },
        });

        const snareFilter = new Tone.Filter(3000, 'lowpass').connect(
          drumReverbRef.current
        );
        snareSynthRef.current.connect(snareFilter);
        snareSynthRef.current.volume.value = -12;

        // Create soft, filtered hi-hat with dreamy processing
        hihatSynthRef.current = new Tone.MetalSynth({
          envelope: {
            attack: 0.008,
            decay: 0.15,
            release: 0.08,
          },
          harmonicity: 2.5,
          modulationIndex: 12,
          resonance: 1500,
          octaves: 0.8,
        });

        const hihatFilter = new Tone.Filter(8000, 'lowpass').connect(
          drumReverbRef.current
        );
        hihatSynthRef.current.connect(hihatFilter);
        hihatSynthRef.current.volume.value = -18;

        // Create warm, Bon Iver-style bass with filter and delay
        bassSynthRef.current = new Tone.MonoSynth({
          oscillator: { type: 'sine' },
          envelope: { attack: 0.08, decay: 0.6, sustain: 0.7, release: 1.2 },
          filterEnvelope: {
            attack: 0.15,
            decay: 0.4,
            sustain: 0.8,
            release: 1.0,
          },
          filter: {
            Q: 0.8,
            frequency: 800,
          },
        });

        const bassFilter = new Tone.Filter(1200, 'lowpass').connect(
          mainReverbRef.current
        );
        bassSynthRef.current.connect(bassFilter);
        bassSynthRef.current.volume.value = 1;

        // Create dreamy Bon Iver piano with heavy filtering and delay
        pianoSynthRef.current = new Tone.PolySynth(Tone.Synth, {
          oscillator: {
            type: 'sine',
          },
          envelope: {
            attack: 0.08,
            decay: 0.6,
            sustain: 0.4,
            release: 2.5,
          },
        });

        // Piano gets the full Bon Iver treatment: filter -> chorus -> delay -> reverb
        const pianoFilter = new Tone.Filter(1800, 'lowpass');
        const pianoChorus = new Tone.Chorus(2, 3, 0.3);
        const pianoDelay = new Tone.PingPongDelay('8n.', 0.25);

        pianoSynthRef.current
          .connect(pianoFilter)
          .connect(pianoChorus)
          .connect(pianoDelay)
          .connect(mainReverbRef.current);

        pianoSynthRef.current.volume.value = -5;

        // Create lush, ethereal pad with heavy Bon Iver processing
        padSynthRef.current = new Tone.PolySynth(Tone.Synth, {
          oscillator: { type: 'sine' },
          envelope: { attack: 0.8, decay: 1.0, sustain: 0.9, release: 4.0 },
        });

        // Pad gets auto-filter and heavy effects
        padSynthRef.current
          .connect(autoFilterRef.current)
          .connect(chorusRef.current)
          .connect(mainReverbRef.current);

        padSynthRef.current.volume.value = -10;

        // Create smooth, Bon Iver lead with filter and chorus
        leadSynthRef.current = new Tone.MonoSynth({
          oscillator: { type: 'triangle' },
          envelope: { attack: 0.1, decay: 0.5, sustain: 0.6, release: 1.5 },
          filterEnvelope: {
            attack: 0.08,
            decay: 0.4,
            sustain: 0.7,
            release: 1.2,
          },
          filter: {
            Q: 0.6,
            frequency: 2000,
          },
        });

        const leadFilter = new Tone.Filter(3000, 'lowpass').connect(
          leadReverbRef.current
        );
        leadSynthRef.current.connect(leadFilter);
        leadSynthRef.current.volume.value = -8;
      } catch (error) {
        console.error('Failed to initialize Tone.js:', error);
      }
    };

    initTone();

    return () => {
      // Cleanup Tone.js resources
      stopSequencer();
      kickSynthRef.current?.dispose();
      snareSynthRef.current?.dispose();
      hihatSynthRef.current?.dispose();
      bassSynthRef.current?.dispose();
      pianoSynthRef.current?.dispose();
      padSynthRef.current?.dispose();
      leadSynthRef.current?.dispose();
      mainReverbRef.current?.dispose();
      drumReverbRef.current?.dispose();
      leadReverbRef.current?.dispose();
      delayRef.current?.dispose();
      chorusRef.current?.dispose();
      compressorRef.current?.dispose();
      autoFilterRef.current?.dispose();
      masterVolumeRef.current?.dispose();
    };
  }, []);

  // Update master volume
  useEffect(() => {
    if (masterVolumeRef.current) {
      masterVolumeRef.current.volume.value = Tone.gainToDb(masterVolume);
    }
  }, [masterVolume]);

  // Keep tracksRef in sync and update synth volumes (with mellow adjustments)
  useEffect(() => {
    tracksRef.current = tracks;

    // Update all synth volumes when tracks change
    tracks.forEach(track => {
      switch (track.id) {
        case 'kick':
          if (kickSynthRef.current) {
            kickSynthRef.current.volume.value =
              -8 + Tone.gainToDb(track.volume);
          }
          break;
        case 'snare':
          if (snareSynthRef.current) {
            snareSynthRef.current.volume.value =
              -12 + Tone.gainToDb(track.volume);
          }
          break;
        case 'hihat':
          if (hihatSynthRef.current) {
            hihatSynthRef.current.volume.value =
              -18 + Tone.gainToDb(track.volume);
          }
          break;
        case 'bass':
          if (bassSynthRef.current) {
            bassSynthRef.current.volume.value = 1 + Tone.gainToDb(track.volume);
          }
          break;
        case 'piano':
          if (pianoSynthRef.current) {
            pianoSynthRef.current.volume.value =
              -5 + Tone.gainToDb(track.volume);
          }
          break;
        case 'pad':
          if (padSynthRef.current) {
            padSynthRef.current.volume.value =
              -10 + Tone.gainToDb(track.volume);
          }
          break;
        case 'lead':
          if (leadSynthRef.current) {
            leadSynthRef.current.volume.value =
              -8 + Tone.gainToDb(track.volume);
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

  useEffect(() => {
    if (externalPreset) {
      loadExternalPreset(externalPreset);
    }
  }, [externalPreset]);

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
              playTrackSound(trackId, newSteps[stepIndex].note, tracksRef);
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
    // Update synth volume immediately with mellow adjustments
    switch (trackId) {
      case 'kick':
        if (kickSynthRef.current) {
          kickSynthRef.current.volume.value = -8 + Tone.gainToDb(volume);
        }
        break;
      case 'snare':
        if (snareSynthRef.current) {
          snareSynthRef.current.volume.value = -12 + Tone.gainToDb(volume);
        }
        break;
      case 'hihat':
        if (hihatSynthRef.current) {
          hihatSynthRef.current.volume.value = -18 + Tone.gainToDb(volume);
        }
        break;
      case 'bass':
        if (bassSynthRef.current) {
          bassSynthRef.current.volume.value = 1 + Tone.gainToDb(volume);
        }
        break;
      case 'piano':
        if (pianoSynthRef.current) {
          pianoSynthRef.current.volume.value = -5 + Tone.gainToDb(volume);
        }
        break;
      case 'pad':
        if (padSynthRef.current) {
          padSynthRef.current.volume.value = -10 + Tone.gainToDb(volume);
        }
        break;
      case 'lead':
        if (leadSynthRef.current) {
          leadSynthRef.current.volume.value = -8 + Tone.gainToDb(volume);
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

    // Create a sequence with 64 steps
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

            try {
              // Schedule sounds at the precise time
              switch (track.id) {
                case 'kick':
                  if (kickSynthRef.current) {
                    kickSynthRef.current.triggerAttackRelease(note, '8n', time);
                  }
                  break;
                case 'snare':
                  if (snareSynthRef.current) {
                    snareSynthRef.current.triggerAttackRelease('8n', time);
                  }
                  break;
                case 'hihat':
                  if (hihatSynthRef.current) {
                    hihatSynthRef.current.triggerAttackRelease(
                      'C4',
                      '16n',
                      time
                    );
                  }
                  break;
                case 'bass':
                  if (bassSynthRef.current) {
                    bassSynthRef.current.triggerAttackRelease(note, '4n', time);
                  }
                  break;
                case 'piano':
                  if (pianoSynthRef.current) {
                    const chord = getChordNotes(note);
                    if (chord) {
                      pianoSynthRef.current.triggerAttackRelease(
                        chord,
                        '8n',
                        time
                      );
                    }
                  }
                  break;
                case 'pad':
                  if (padSynthRef.current) {
                    const chord = getChordNotes(note);
                    if (chord) {
                      padSynthRef.current.triggerAttackRelease(
                        chord,
                        '8n',
                        time
                      );
                    }
                  }
                  break;
                case 'lead':
                  if (leadSynthRef.current) {
                    leadSynthRef.current.triggerAttackRelease(note, '8n', time);
                  }
                  break;
              }
            } catch (error) {
              console.warn(`Timing error for ${track.id}:`, error);
            }
          }
        });
      },
      Array.from({ length: 64 }, (_, i) => i), // Changed to 64 steps
      '16n'
    );

    sequenceRef.current.start(0);
    Tone.Transport.start();
    setIsPlaying(true);
  }, [bpm]);
  const stopSequencer = useCallback(() => {
    try {
      // Stop transport first
      if (Tone.Transport.state === 'started') {
        Tone.Transport.stop();
      }

      // Clean up sequence safely
      if (sequenceRef.current) {
        try {
          sequenceRef.current.stop();
        } catch (error) {
          console.warn('Error stopping sequence:', error);
        }

        try {
          sequenceRef.current.dispose();
        } catch (error) {
          console.warn('Error disposing sequence:', error);
        }

        sequenceRef.current = null;
      }

      // Reset state
      setIsPlaying(false);
      setCurrentStep(-1);
    } catch (error) {
      console.error('Error in stopSequencer:', error);
      // Force reset state even if there's an error
      setIsPlaying(false);
      setCurrentStep(-1);
    }
  }, []);

  const handlePlayStop = () => {
    if (isPlaying) {
      stopSequencer();
    } else {
      playSequencer();
    }
  };

  const loadPreset = useCallback(
    (presetName: string) => {
      const preset = PRESETS.find(p => p.name === presetName);
      if (!preset) return;

      // Stop sequencer if playing
      if (isPlaying) {
        stopSequencer();
      }

      // Update BPM
      setBpm(preset.bpm);

      // Update tracks
      setTracks(prevTracks => {
        const newTracks = prevTracks.map(track => {
          const presetTrack = preset.tracks[track.id];
          if (presetTrack) {
            return {
              ...track,
              steps: presetTrack.steps,
              volume: presetTrack.volume,
              muted: presetTrack.muted,
            };
          }
          return track;
        });
        tracksRef.current = newTracks;
        return newTracks;
      });

      setSelectedPreset(presetName);
    },
    [isPlaying]
  );

  const loadExternalPreset = useCallback(
    (preset: Preset) => {
      // Stop sequencer if playing
      if (isPlaying) {
        stopSequencer();
      }

      // Update BPM
      setBpm(preset.bpm);

      // Update tracks
      setTracks(prevTracks => {
        const newTracks = prevTracks.map(track => {
          const presetTrack = preset.tracks[track.id];
          if (presetTrack) {
            return {
              ...track,
              steps: presetTrack.steps,
              volume: presetTrack.volume,
              muted: presetTrack.muted,
            };
          }
          return track;
        });
        tracksRef.current = newTracks;
        return newTracks;
      });

      setSelectedPreset(preset.name);

      // Notify parent component
      if (onPresetLoaded) {
        onPresetLoaded(preset.name);
      }
    },
    [isPlaying, onPresetLoaded, stopSequencer]
  );

  return (
    <div className={`p-6 bg-white rounded-lg shadow-lg ${className}`}>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        Guitar Backing Track Machine
      </h2>

      {/* Preset Selection */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h3 className="text-lg font-semibold text-blue-800 mb-3">
          Backing Track Presets
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Preset
            </label>
            <select
              value={selectedPreset}
              onChange={e => loadPreset(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Custom / No Preset</option>
              {PRESETS.map(preset => (
                <option key={preset.name} value={preset.name}>
                  {preset.name}
                </option>
              ))}
            </select>
          </div>
          {selectedPreset && (
            <div className="bg-white p-3 rounded border">
              <h4 className="font-medium text-gray-800">
                {PRESETS.find(p => p.name === selectedPreset)?.name}
              </h4>
              <p className="text-sm text-gray-600 mt-1">
                {PRESETS.find(p => p.name === selectedPreset)?.description}
              </p>
              <p className="text-sm text-blue-600 mt-2">
                BPM: {PRESETS.find(p => p.name === selectedPreset)?.bpm}
              </p>
            </div>
          )}
        </div>
      </div>

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

      {/* Step position indicator - now 64 steps in 4 rows */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 mb-2">
          Step Position
        </h4>
        <div className="grid grid-rows-4 gap-1">
          {Array.from({ length: 4 }, (_, rowIndex) => (
            <div key={rowIndex} className="flex gap-1">
              {Array.from({ length: 16 }, (_, colIndex) => {
                const stepIndex = rowIndex * 16 + colIndex;
                return (
                  <div
                    key={stepIndex}
                    className={`flex-1 h-3 rounded-full transition-all duration-150 ${
                      currentStep === stepIndex && isPlaying
                        ? 'bg-yellow-400'
                        : stepIndex % 4 === 0
                          ? 'bg-red-300'
                          : 'bg-gray-300'
                    }`}
                  >
                    <span className="block text-xs text-center text-gray-600 leading-3">
                      {stepIndex + 1}
                    </span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Tracks */}
      {tracks.map(track => (
        <div key={track.id} className="mb-6 p-4 border rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-700">
              {track.name}
              <span className="text-sm font-normal text-gray-500 ml-2">
                {track.id === 'pad' || track.id === 'piano'
                  ? '(C Major Chords)'
                  : `(${getNotesForTrack(track.id)[0]}-${getNotesForTrack(track.id)[getNotesForTrack(track.id).length - 1]})`}
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

          {/* Track steps - now 64 steps in 4 rows */}
          <div className="mb-3">
            <div className="grid grid-rows-4 gap-2">
              {Array.from({ length: 4 }, (_, rowIndex) => (
                <div key={rowIndex} className="flex gap-1">
                  {Array.from({ length: 16 }, (_, colIndex) => {
                    const stepIndex = rowIndex * 16 + colIndex;
                    const step = track.steps[stepIndex];
                    return (
                      <div
                        key={stepIndex}
                        className="flex-1 flex flex-col items-center"
                      >
                        <button
                          onClick={() => toggleStep(track.id, stepIndex)}
                          className={`
                            w-full h-8 rounded border-2 transition-all duration-150 text-xs font-bold flex flex-col items-center justify-center
                            ${getTrackColorClasses(track.color, step.active, track.muted)}
                            ${currentStep === stepIndex && isPlaying ? 'ring-2 ring-yellow-400 scale-105' : ''}
                          `}
                        >
                          <span className="text-xs leading-none">
                            {stepIndex + 1}
                          </span>
                          {step.active && (
                            <span className="text-xs leading-none font-normal opacity-75">
                              {step.note.length > 2
                                ? step.note.substring(0, 2)
                                : step.note}
                            </span>
                          )}
                        </button>
                        {step.active && (
                          <select
                            value={step.note}
                            onChange={e =>
                              updateStepNote(
                                track.id,
                                stepIndex,
                                e.target.value
                              )
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
                    );
                  })}
                </div>
              ))}
            </div>
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
