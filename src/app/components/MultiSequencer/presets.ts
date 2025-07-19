import { Preset } from './types';

export const PRESETS: Preset[] = [
  {
    name: 'Slow & Sad Emotional',
    description: 'Melancholic ballad in C major for emotional guitar solos',
    bpm: 80,
    tracks: {
      kick: {
        steps: new Array(32).fill(null).map((_, i) => ({
          active: i % 8 === 0,
          note: 'C1',
        })),
        volume: 0.6,
        muted: false,
      },
      snare: {
        steps: new Array(32).fill(null).map((_, i) => ({
          active: i % 16 === 8,
          note: 'C2',
        })),
        volume: 0.4,
        muted: false,
      },
      hihat: {
        steps: new Array(32).fill(null).map((_, i) => ({
          active: i % 4 === 2,
          note: 'C3',
        })),
        volume: 0.3,
        muted: false,
      },
      bass: {
        steps: new Array(32).fill(null).map((_, i) => ({
          active: i % 16 === 0 || i % 16 === 8,
          note: i < 8 ? 'C2' : i < 16 ? 'A1' : i < 24 ? 'F2' : 'G2',
        })),
        volume: 0.5,
        muted: false,
      },
      piano: {
        steps: new Array(32).fill(null).map((_, i) => ({
          active: i % 8 === 4,
          note: i < 8 ? 'C' : i < 16 ? 'Am' : i < 24 ? 'F' : 'G',
        })),
        volume: 0.4,
        muted: false,
      },
      pad: {
        steps: new Array(32).fill(null).map((_, i) => ({
          active: i % 16 === 0,
          note: i < 16 ? 'C' : i < 24 ? 'F' : 'G',
        })),
        volume: 0.3,
        muted: false,
      },
      lead: {
        steps: new Array(32)
          .fill(null)
          .map(() => ({ active: false, note: 'C4' })),
        volume: 0.4,
        muted: true,
      },
    },
  },
  {
    name: 'Blues Groove',
    description: 'Classic 12-bar blues feel with swing rhythm',
    bpm: 120,
    tracks: {
      kick: {
        steps: new Array(32).fill(null).map((_, i) => ({
          active: i % 4 === 0,
          note: 'C1',
        })),
        volume: 0.7,
        muted: false,
      },
      snare: {
        steps: new Array(32).fill(null).map((_, i) => ({
          active: i % 8 === 4,
          note: 'D2',
        })),
        volume: 0.6,
        muted: false,
      },
      hihat: {
        steps: new Array(32).fill(null).map((_, i) => ({
          active: i % 2 === 1,
          note: 'C3',
        })),
        volume: 0.4,
        muted: false,
      },
      bass: {
        steps: new Array(32).fill(null).map((_, i) => ({
          active: i % 4 === 0 || i % 4 === 2,
          note:
            i < 8
              ? 'C2'
              : i < 12
                ? 'C2'
                : i < 16
                  ? 'F2'
                  : i < 20
                    ? 'F2'
                    : i < 24
                      ? 'C2'
                      : i < 28
                        ? 'G2'
                        : 'F2',
        })),
        volume: 0.6,
        muted: false,
      },
      piano: {
        steps: new Array(32).fill(null).map((_, i) => ({
          active: i % 4 === 1 || i % 4 === 3,
          note:
            i < 8
              ? 'C'
              : i < 12
                ? 'C'
                : i < 16
                  ? 'F'
                  : i < 20
                    ? 'F'
                    : i < 24
                      ? 'C'
                      : i < 28
                        ? 'G'
                        : 'F',
        })),
        volume: 0.5,
        muted: false,
      },
      pad: {
        steps: new Array(32)
          .fill(null)
          .map(() => ({ active: false, note: 'C' })),
        volume: 0.3,
        muted: true,
      },
      lead: {
        steps: new Array(32)
          .fill(null)
          .map(() => ({ active: false, note: 'C4' })),
        volume: 0.4,
        muted: true,
      },
    },
  },
  {
    name: 'Energetic Rock',
    description: 'Driving rock rhythm for high-energy guitar playing',
    bpm: 140,
    tracks: {
      kick: {
        steps: new Array(32).fill(null).map((_, i) => ({
          active: i % 4 === 0 || i % 8 === 6,
          note: 'C1',
        })),
        volume: 0.8,
        muted: false,
      },
      snare: {
        steps: new Array(32).fill(null).map((_, i) => ({
          active: i % 8 === 4,
          note: 'D2',
        })),
        volume: 0.7,
        muted: false,
      },
      hihat: {
        steps: new Array(32).fill(null).map((_, i) => ({
          active: true,
          note: 'C3',
        })),
        volume: 0.5,
        muted: false,
      },
      bass: {
        steps: new Array(32).fill(null).map((_, i) => ({
          active: i % 2 === 0,
          note: i < 8 ? 'C2' : i < 16 ? 'A1' : i < 24 ? 'F2' : 'G2',
        })),
        volume: 0.7,
        muted: false,
      },
      piano: {
        steps: new Array(32)
          .fill(null)
          .map(() => ({ active: false, note: 'C' })),
        volume: 0.4,
        muted: true,
      },
      pad: {
        steps: new Array(32).fill(null).map((_, i) => ({
          active: i % 16 === 0,
          note: i < 8 ? 'C' : i < 16 ? 'Am' : i < 24 ? 'F' : 'G',
        })),
        volume: 0.4,
        muted: false,
      },
      lead: {
        steps: new Array(32).fill(null).map((_, i) => ({
          active: i % 16 === 12,
          note: i < 8 ? 'G4' : i < 16 ? 'C5' : i < 24 ? 'F4' : 'G4',
        })),
        volume: 0.5,
        muted: false,
      },
    },
  },
];
