import { Preset } from './types';

// Define presets directly to avoid JSON import issues
export const PRESETS: Preset[] = [
  {
    name: 'Slow & Sad Emotional',
    description:
      'Melancholic ballad in C major for emotional guitar solos - perfect for expressive playing',
    bpm: 75,
    tracks: {
      kick: {
        steps: Array.from({ length: 64 }, (_, i) => ({
          active: i === 0 || i === 16 || i === 32 || i === 48,
          note: 'C1',
        })),
        volume: 0.4,
        muted: false,
      },
      snare: {
        steps: Array.from({ length: 64 }, (_, i) => ({
          active: i === 8 || i === 24 || i === 40 || i === 56,
          note: 'C2',
        })),
        volume: 0.3,
        muted: false,
      },
      hihat: {
        steps: Array.from({ length: 64 }, (_, i) => ({
          active: i % 4 === 2,
          note: 'C3',
        })),
        volume: 0.2,
        muted: false,
      },
      bass: {
        steps: Array.from({ length: 64 }, (_, i) => ({
          active: i % 8 === 0,
          note: i < 16 ? 'C2' : i < 32 ? 'A1' : i < 48 ? 'F2' : 'G2',
        })),
        volume: 0.7,
        muted: false,
      },
      piano: {
        steps: Array.from({ length: 64 }, (_, i) => ({
          active: i % 16 === 4 || i % 16 === 11,
          note: i < 16 ? 'C' : i < 32 ? 'Am' : i < 48 ? 'F' : 'G',
        })),
        volume: 0.6,
        muted: false,
      },
      pad: {
        steps: Array.from({ length: 64 }, (_, i) => ({
          active: i % 16 === 0,
          note: i < 16 ? 'C' : i < 32 ? 'Am' : i < 48 ? 'F' : 'G',
        })),
        volume: 0.4,
        muted: false,
      },
      lead: {
        steps: Array.from({ length: 64 }, () => ({
          active: false,
          note: 'C4',
        })),
        volume: 0.3,
        muted: true,
      },
    },
  },
  {
    name: 'Blues Groove',
    description:
      'Authentic 12-bar blues progression with shuffle feel - perfect for blues guitar improvisation',
    bpm: 115,
    tracks: {
      kick: {
        steps: Array.from({ length: 64 }, (_, i) => ({
          active: i % 4 === 0,
          note: 'C1',
        })),
        volume: 0.6,
        muted: false,
      },
      snare: {
        steps: Array.from({ length: 64 }, (_, i) => ({
          active: i % 8 === 6,
          note: 'D2',
        })),
        volume: 0.5,
        muted: false,
      },
      hihat: {
        steps: Array.from({ length: 64 }, (_, i) => ({
          active: i % 2 === 1,
          note: 'C3',
        })),
        volume: 0.4,
        muted: false,
      },
      bass: {
        steps: Array.from({ length: 64 }, (_, i) => ({
          active: i % 2 === 0,
          note:
            i < 16
              ? 'C2'
              : i < 24
                ? 'C2'
                : i < 32
                  ? 'F2'
                  : i < 40
                    ? 'F2'
                    : i < 48
                      ? 'C2'
                      : i < 56
                        ? 'G2'
                        : 'G2',
        })),
        volume: 0.8,
        muted: false,
      },
      piano: {
        steps: Array.from({ length: 64 }, (_, i) => ({
          active: i % 2 === 1,
          note:
            i < 16
              ? 'C'
              : i < 24
                ? 'C'
                : i < 32
                  ? 'F'
                  : i < 40
                    ? 'F'
                    : i < 48
                      ? 'C'
                      : i < 56
                        ? 'G'
                        : 'C',
        })),
        volume: 0.7,
        muted: false,
      },
      pad: {
        steps: Array.from({ length: 64 }, () => ({
          active: false,
          note: 'C',
        })),
        volume: 0.3,
        muted: true,
      },
      lead: {
        steps: Array.from({ length: 64 }, () => ({
          active: false,
          note: 'C4',
        })),
        volume: 0.4,
        muted: true,
      },
    },
  },
  {
    name: 'Energetic Rock',
    description:
      'Driving rock rhythm with powerful drums and energy - perfect for high-intensity guitar playing',
    bpm: 145,
    tracks: {
      kick: {
        steps: Array.from({ length: 64 }, (_, i) => ({
          active: i % 8 === 0 || i % 16 === 6,
          note: 'C1',
        })),
        volume: 0.8,
        muted: false,
      },
      snare: {
        steps: Array.from({ length: 64 }, (_, i) => ({
          active: i % 8 === 4,
          note: 'D2',
        })),
        volume: 0.7,
        muted: false,
      },
      hihat: {
        steps: Array.from({ length: 64 }, (_, i) => ({
          active: true,
          note: 'C3',
        })),
        volume: 0.5,
        muted: false,
      },
      bass: {
        steps: Array.from({ length: 64 }, (_, i) => ({
          active: i % 2 === 0,
          note: i < 16 ? 'C2' : i < 32 ? 'A1' : i < 48 ? 'F2' : 'G2',
        })),
        volume: 0.8,
        muted: false,
      },
      piano: {
        steps: Array.from({ length: 64 }, () => ({
          active: false,
          note: 'C',
        })),
        volume: 0.4,
        muted: true,
      },
      pad: {
        steps: Array.from({ length: 64 }, (_, i) => ({
          active: i % 16 === 0,
          note: i < 16 ? 'C' : i < 32 ? 'Am' : i < 48 ? 'F' : 'G',
        })),
        volume: 0.5,
        muted: false,
      },
      lead: {
        steps: Array.from({ length: 64 }, (_, i) => ({
          active: i % 16 === 12,
          note: i < 16 ? 'G4' : i < 32 ? 'C5' : i < 48 ? 'F4' : 'G4',
        })),
        volume: 0.6,
        muted: false,
      },
    },
  },
];
