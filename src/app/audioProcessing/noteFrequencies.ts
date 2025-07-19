// Note frequency mapping based on equal temperament tuning
// A4 = 440 Hz as the reference

interface NoteFrequencies {
  [key: string]: number;
}

// Base frequencies for octave 4 (middle octave)
const baseFrequencies: NoteFrequencies = {
  c: 261.63,
  'c#': 277.18,
  db: 277.18,
  d: 293.66,
  'd#': 311.13,
  eb: 311.13,
  e: 329.63,
  f: 349.23,
  'f#': 369.99,
  gb: 369.99,
  g: 392.0,
  'g#': 415.3,
  ab: 415.3,
  a: 440.0,
  'a#': 466.16,
  bb: 466.16,
  b: 493.88,
};

/**
 * Convert a note string (e.g., "a4", "c#3", "bb5") to its frequency in Hz
 * @param noteString - The note in format: note + octave (e.g., "a4", "c#3")
 * @returns The frequency in Hz, or null if invalid note
 */
export const noteToHz = (noteString: string): number | null => {
  if (!noteString || noteString.length < 2) {
    return null;
  }

  // Parse the note string
  const match = noteString.toLowerCase().match(/^([a-g][#b]?)(\d+)$/);
  if (!match) {
    return null;
  }

  const [, noteName, octaveStr] = match;
  const octave = parseInt(octaveStr, 10);

  // Check if octave is valid (typically 0-8 for piano range)
  if (octave < 0 || octave > 8) {
    return null;
  }

  // Get base frequency
  const baseFreq = baseFrequencies[noteName];
  if (!baseFreq) {
    return null;
  }

  // Calculate frequency for the given octave
  // Each octave doubles or halves the frequency
  const octaveDifference = octave - 4; // 4 is our reference octave
  const frequency = baseFreq * Math.pow(2, octaveDifference);

  return Math.round(frequency * 100) / 100; // Round to 2 decimal places
};

/**
 * Get all available note names (without octaves)
 */
export const getAvailableNotes = (): string[] => {
  return Object.keys(baseFrequencies);
};

/**
 * Check if a note string is valid
 * @param noteString - The note string to validate
 */
export const isValidNote = (noteString: string): boolean => {
  return noteToHz(noteString) !== null;
};

/**
 * Convert Hz back to the closest note string
 * @param frequency - Frequency in Hz
 * @returns The closest note string or null if out of range
 */
export const hzToNote = (frequency: number): string | null => {
  if (frequency <= 0) return null;

  // Find the closest note across all octaves (0-8)
  let closestNote = '';
  let smallestDifference = Infinity;

  for (let octave = 0; octave <= 8; octave++) {
    for (const [noteName, baseFreq] of Object.entries(baseFrequencies)) {
      const noteFreq = baseFreq * Math.pow(2, octave - 4);
      const difference = Math.abs(frequency - noteFreq);

      if (difference < smallestDifference) {
        smallestDifference = difference;
        closestNote = `${noteName}${octave}`;
      }
    }
  }

  return closestNote || null;
};

export default {
  noteToHz,
  getAvailableNotes,
  isValidNote,
  hzToNote,
};
