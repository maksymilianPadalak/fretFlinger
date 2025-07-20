import { useCallback } from 'react';
import * as Tone from 'tone';
import { getChordNotes } from './audioUtils';
import { Track } from './types';

export const useAudioPlayback = (synthRefs: {
  kickSynthRef: React.MutableRefObject<Tone.MembraneSynth | null>;
  snareSynthRef: React.MutableRefObject<Tone.NoiseSynth | null>;
  hihatSynthRef: React.MutableRefObject<Tone.MetalSynth | null>;
  bassSynthRef: React.MutableRefObject<Tone.MonoSynth | null>;
  pianoSynthRef: React.MutableRefObject<Tone.PolySynth | Tone.Sampler | null>;
  padSynthRef: React.MutableRefObject<Tone.PolySynth | null>;
  leadSynthRef: React.MutableRefObject<Tone.MonoSynth | null>;
}) => {
  const playKick = useCallback(
    (noteString: string, time?: number) => {
      if (synthRefs.kickSynthRef.current) {
        try {
          if (time !== undefined) {
            synthRefs.kickSynthRef.current.triggerAttackRelease(
              noteString,
              '8n',
              time
            );
          } else {
            synthRefs.kickSynthRef.current.triggerAttackRelease(
              noteString,
              '8n'
            );
          }
        } catch (error) {
          console.warn('Kick synth timing error:', error);
        }
      }
    },
    [synthRefs.kickSynthRef]
  );

  const playSnare = useCallback(
    (noteString: string, time?: number) => {
      if (synthRefs.snareSynthRef.current) {
        try {
          if (time !== undefined) {
            synthRefs.snareSynthRef.current.triggerAttackRelease('8n', time);
          } else {
            synthRefs.snareSynthRef.current.triggerAttackRelease('8n');
          }
        } catch (error) {
          console.warn('Snare synth timing error:', error);
        }
      }
    },
    [synthRefs.snareSynthRef]
  );

  const playHihat = useCallback(
    (noteString: string, time?: number) => {
      if (synthRefs.hihatSynthRef.current) {
        try {
          if (time !== undefined) {
            synthRefs.hihatSynthRef.current.triggerAttackRelease(
              'C4',
              '16n',
              time
            );
          } else {
            synthRefs.hihatSynthRef.current.triggerAttackRelease('C4', '16n');
          }
        } catch (error) {
          console.warn('Hihat synth timing error:', error);
        }
      }
    },
    [synthRefs.hihatSynthRef]
  );

  const playBass = useCallback(
    (noteString: string, time?: number) => {
      if (synthRefs.bassSynthRef.current) {
        try {
          if (time !== undefined) {
            synthRefs.bassSynthRef.current.triggerAttackRelease(
              noteString,
              '4n',
              time
            );
          } else {
            synthRefs.bassSynthRef.current.triggerAttackRelease(
              noteString,
              '4n'
            );
          }
        } catch (error) {
          console.warn('Bass synth timing error:', error);
        }
      }
    },
    [synthRefs.bassSynthRef]
  );

  const playPiano = useCallback(
    (chordName: string, time?: number) => {
      if (synthRefs.pianoSynthRef.current) {
        try {
          const chord = getChordNotes(chordName);
          if (chord) {
            if (time !== undefined) {
              synthRefs.pianoSynthRef.current.triggerAttackRelease(
                chord,
                '8n',
                time
              );
            } else {
              synthRefs.pianoSynthRef.current.triggerAttackRelease(chord, '8n');
            }
          }
        } catch (error) {
          console.warn('Piano synth timing error:', error);
        }
      }
    },
    [synthRefs.pianoSynthRef]
  );

  const playPad = useCallback(
    (chordName: string, time?: number) => {
      if (synthRefs.padSynthRef.current) {
        try {
          const chord = getChordNotes(chordName);
          if (chord) {
            if (time !== undefined) {
              synthRefs.padSynthRef.current.triggerAttackRelease(
                chord,
                '8n',
                time
              );
            } else {
              synthRefs.padSynthRef.current.triggerAttackRelease(chord, '8n');
            }
          }
        } catch (error) {
          console.warn('Pad synth timing error:', error);
        }
      }
    },
    [synthRefs.padSynthRef]
  );

  const playLead = useCallback(
    (noteString: string, time?: number) => {
      if (synthRefs.leadSynthRef.current) {
        try {
          if (time !== undefined) {
            synthRefs.leadSynthRef.current.triggerAttackRelease(
              noteString,
              '8n',
              time
            );
          } else {
            synthRefs.leadSynthRef.current.triggerAttackRelease(
              noteString,
              '8n'
            );
          }
        } catch (error) {
          console.warn('Lead synth timing error:', error);
        }
      }
    },
    [synthRefs.leadSynthRef]
  );

  const playTrackSound = useCallback(
    (
      trackId: string,
      note: string,
      tracksRef: React.MutableRefObject<Track[]>
    ) => {
      const track = tracksRef.current.find(t => t.id === trackId);
      if (!track || track.muted) return;

      switch (trackId) {
        case 'kick':
          playKick(note);
          break;
        case 'snare':
          playSnare(note);
          break;
        case 'hihat':
          playHihat(note);
          break;
        case 'bass':
          playBass(note);
          break;
        case 'piano':
          playPiano(note);
          break;
        case 'pad':
          playPad(note);
          break;
        case 'lead':
          playLead(note);
          break;
      }
    },
    [playKick, playSnare, playHihat, playBass, playPiano, playPad, playLead]
  );

  return {
    playKick,
    playSnare,
    playHihat,
    playBass,
    playPiano,
    playPad,
    playLead,
    playTrackSound,
  };
};
