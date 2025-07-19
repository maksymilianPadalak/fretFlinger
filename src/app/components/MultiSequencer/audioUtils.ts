import * as Tone from 'tone';
import { TrackColor } from './types';

// C major scale chords mapping
export const getChordNotes = (chordName: string): string[] | null => {
  const chords: { [key: string]: string[] } = {
    C: ['C4', 'E4', 'G4'],
    Dm: ['D4', 'F4', 'A4'],
    Em: ['E4', 'G4', 'B4'],
    F: ['F4', 'A4', 'C5'],
    G: ['G4', 'B4', 'D5'],
    Am: ['A4', 'C5', 'E5'],
    Bdim: ['B4', 'D5', 'F5'],
    C5: ['C5', 'E5', 'G5'],
  };
  return chords[chordName] || null;
};

// Note mappings for each track type
export const getNotesForTrack = (trackId: string): string[] => {
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
    case 'snare':
      // Snare - medium-low frequencies
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
    case 'hihat':
      // Hi-hat - high frequencies
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
    case 'piano':
      // Piano - C major scale chords (same as pad)
      return ['C', 'Dm', 'Em', 'F', 'G', 'Am', 'Bdim', 'C5'];
    case 'pad':
      // Pad - C major scale chords
      return ['C', 'Dm', 'Em', 'F', 'G', 'Am', 'Bdim', 'C5'];
    case 'lead':
      // Lead - high frequencies
      return [
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
        'F5',
        'G5',
        'A5',
        'B5',
        'C6',
      ];
    default:
      return ['C3', 'D3', 'E3', 'F3', 'G3', 'A3', 'B3', 'C4'];
  }
};

// Color classes for track visualization
export const getTrackColorClasses = (
  color: string,
  active: boolean,
  muted: boolean
) => {
  if (muted) return 'bg-gray-300 border-gray-400 text-gray-500';

  const colorMap = {
    red: active
      ? 'bg-red-500 border-red-600 text-white'
      : 'bg-red-100 border-red-300 text-red-700',
    orange: active
      ? 'bg-orange-500 border-orange-600 text-white'
      : 'bg-orange-100 border-orange-300 text-orange-700',
    yellow: active
      ? 'bg-yellow-500 border-yellow-600 text-white'
      : 'bg-yellow-100 border-yellow-300 text-yellow-700',
    blue: active
      ? 'bg-blue-500 border-blue-600 text-white'
      : 'bg-blue-100 border-blue-300 text-blue-700',
    purple: active
      ? 'bg-purple-500 border-purple-600 text-white'
      : 'bg-purple-100 border-purple-300 text-purple-700',
    green: active
      ? 'bg-green-500 border-green-600 text-white'
      : 'bg-green-100 border-green-300 text-green-700',
    pink: active
      ? 'bg-pink-500 border-pink-600 text-white'
      : 'bg-pink-100 border-pink-300 text-pink-700',
  };

  return (
    colorMap[color as keyof typeof colorMap] ||
    'bg-gray-100 border-gray-300 text-gray-600'
  );
};

// Audio synthesis initialization
export const initializeAudio = async () => {
  const masterVolume = 0.7;

  // Create reverb effect for pads and piano
  const reverb = new Tone.Reverb({
    decay: 3,
    preDelay: 0.1,
    wet: 0.3,
  }).toDestination();

  // Create master volume control
  const masterVolumeNode = new Tone.Volume(
    Tone.gainToDb(masterVolume)
  ).toDestination();

  // Create kick drum synth
  const kickSynth = new Tone.MembraneSynth({
    pitchDecay: 0.05,
    octaves: 10,
    oscillator: {
      type: 'sine',
    },
    envelope: {
      attack: 0.001,
      decay: 0.3,
      sustain: 0.01,
      release: 1.2,
    },
  }).connect(masterVolumeNode);
  kickSynth.volume.value = 3;

  // Create snare drum synth
  const snareSynth = new Tone.NoiseSynth({
    noise: { type: 'white' },
    envelope: {
      attack: 0.005,
      decay: 0.1,
      sustain: 0.0,
      release: 0.1,
    },
  }).connect(masterVolumeNode);
  snareSynth.volume.value = 0;

  // Create hi-hat synth
  const hihatSynth = new Tone.MetalSynth({
    envelope: {
      attack: 0.001,
      decay: 0.1,
      release: 0.01,
    },
    harmonicity: 5.1,
    modulationIndex: 32,
    resonance: 4000,
    octaves: 1.5,
  }).connect(masterVolumeNode);
  hihatSynth.volume.value = -10;

  // Create bass synth
  const bassSynth = new Tone.MonoSynth({
    oscillator: { type: 'sawtooth' },
    envelope: { attack: 0.05, decay: 0.3, sustain: 0.4, release: 0.8 },
    filterEnvelope: {
      attack: 0.1,
      decay: 0.2,
      sustain: 0.5,
      release: 0.8,
    },
  }).connect(masterVolumeNode);

  // Create piano synth with reverb
  const pianoSynth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'triangle' },
    envelope: { attack: 0.02, decay: 0.3, sustain: 0.4, release: 0.8 },
  }).connect(reverb);

  // Create pad synth with reverb
  const padSynth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'sine' },
    envelope: { attack: 0.1, decay: 0.3, sustain: 0.7, release: 0.8 },
  }).connect(reverb);

  // Create lead synth
  const leadSynth = new Tone.MonoSynth({
    oscillator: { type: 'sawtooth' },
    envelope: { attack: 0.01, decay: 0.2, sustain: 0.3, release: 0.5 },
    filterEnvelope: {
      attack: 0.01,
      decay: 0.1,
      sustain: 0.8,
      release: 0.5,
    },
  }).connect(masterVolumeNode);

  return {
    kickSynth,
    snareSynth,
    hihatSynth,
    bassSynth,
    pianoSynth,
    padSynth,
    leadSynth,
    masterVolumeNode,
    reverb,
  };
};

// Audio cleanup function
export const cleanupAudio = (
  synthRefs: Record<string, Tone.ToneAudioNode | null>
) => {
  Object.values(synthRefs).forEach(synth => {
    if (synth && 'dispose' in synth && typeof synth.dispose === 'function') {
      synth.dispose();
    }
  });
};
