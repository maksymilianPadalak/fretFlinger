import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('API called');
    const { description } = await request.json();

    console.log('Description:', description);

    // Simple preset generator (no external APIs for now)
    const generateSimplePreset = (desc: string) => {
      const lowerDesc = desc.toLowerCase();

      // Determine BPM and style based on description
      let bpm = 120;
      let style = 'Custom';

      if (lowerDesc.includes('slow') || lowerDesc.includes('ballad')) {
        bpm = 75;
        style = 'Slow';
      } else if (
        lowerDesc.includes('fast') ||
        lowerDesc.includes('rock') ||
        lowerDesc.includes('metal')
      ) {
        bpm = 140;
        style = 'Rock';
      } else if (lowerDesc.includes('blues')) {
        bpm = 100;
        style = 'Blues';
      } else if (lowerDesc.includes('jazz')) {
        bpm = 110;
        style = 'Jazz';
      }

      return {
        name: `${style} Backing Track`,
        description: `Generated ${style.toLowerCase()} backing track at ${bpm} BPM`,
        bpm,
        tracks: {
          kick: {
            steps: Array.from({ length: 64 }, (_, i) => ({
              active: i % 8 === 0, // Kick on 1, 9, 17, etc.
              note: 'C1',
            })),
            volume: 0.6,
            muted: false,
          },
          snare: {
            steps: Array.from({ length: 64 }, (_, i) => ({
              active: i % 8 === 4, // Snare on 5, 13, 21, etc.
              note: 'D2',
            })),
            volume: 0.4,
            muted: false,
          },
          hihat: {
            steps: Array.from({ length: 64 }, (_, i) => ({
              active: i % 2 === 1, // Hi-hat on off-beats
              note: 'C3',
            })),
            volume: 0.3,
            muted: false,
          },
          bass: {
            steps: Array.from({ length: 64 }, (_, i) => ({
              active: i % 4 === 0, // Bass on quarter notes
              note: i < 16 ? 'C2' : i < 32 ? 'A1' : i < 48 ? 'F2' : 'G2',
            })),
            volume: 0.7,
            muted: false,
          },
          piano: {
            steps: Array.from({ length: 64 }, (_, i) => ({
              active: i % 8 === 2 || i % 8 === 6, // Piano chords
              note: i < 16 ? 'C' : i < 32 ? 'Am' : i < 48 ? 'F' : 'G',
            })),
            volume: 0.5,
            muted: false,
          },
          pad: {
            steps: Array.from({ length: 64 }, (_, i) => ({
              active: i % 16 === 0, // Pad on first beat of each bar
              note: i < 16 ? 'C' : i < 32 ? 'Am' : i < 48 ? 'F' : 'G',
            })),
            volume: 0.4,
            muted: false,
          },
          lead: {
            steps: Array.from({ length: 64 }, () => ({
              active: false, // Lead is empty by default
              note: 'C4',
            })),
            volume: 0.4,
            muted: true,
          },
        },
      };
    };

    const preset = generateSimplePreset(description);
    console.log('Generated preset:', preset.name);

    return NextResponse.json({ preset });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate preset' },
      { status: 500 }
    );
  }
}
