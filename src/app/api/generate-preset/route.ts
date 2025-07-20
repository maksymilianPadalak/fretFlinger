import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('🎵 OpenAI preset generation API called');
    const { description } = await request.json();

    console.log('🎯 Description:', description);
    console.log('🔧 OpenAI API Key exists:', !!process.env.OPENAI_API_KEY);

    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      console.log('⚠️ OpenAI API key not found, using simple generator');
      return NextResponse.json({ preset: generateSimplePreset(description) });
    }

    // Use OpenAI to generate high-quality presets
    try {
      const openaiResponse = await fetch(
        'https://api.openai.com/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4',
            messages: [
              {
                role: 'system',
                content: `You are a professional music producer and backing track generator. Generate detailed, musical backing tracks based on user descriptions.

Return a JSON object with this exact structure:
{
  "name": "Track Name",
  "description": "Brief description",
  "bpm": 120,
  "tracks": {
    "kick": {"steps": [{"active": true/false, "note": "C1"}] (This array must be 64 elements long), "volume": 0.6, "muted": false},
    "snare": {"steps": [{"active": true/false, "note": "C2"}] (This array must be 64 elements long), "volume": 0.4, "muted": false},
    "hihat": {"steps": [{"active": true/false, "note": "C3"}] (This array must be 64 elements long), "volume": 0.3, "muted": false},
    "bass": {"steps": [{"active": true/false, "note": "C2/A1/F2/G2"}] (This array must be 64 elements long), "volume": 0.7, "muted": false},
    "piano": {"steps": [{"active": true/false, "note": "C/Am/F/G"}] (This array must be 64 elements long), "volume": 0.5, "muted": false},
    "pad": {"steps": [{"active": true/false, "note": "C/Am/F/G"}] (This array must be 64 elements long), "volume": 0.4, "muted": false},
    "lead": {"steps": [{"active": true/false, "note": "C4"}] (This array must be 64 elements long), "volume": 0.4, "muted": true}
  }
}

IMPORTANT: 
- Each track has exactly 64 steps so steps array must be 64 elements long!
- Use musical knowledge to create realistic drum patterns, bass lines, and chord progressions
- Match BPM to the style (slow ballads: 60-80, rock: 120-140, metal: 140-180, jazz: 90-120)
- Create interesting, musical patterns that guitarists can play along with
- Piano should sound realistic with appropriate chord voicings and timing (not just on every beat)
- Use appropriate note values (kick: C1, snare: C2, hihat: C3, bass: various notes, chords: C/Am/F/G etc.)
- Piano patterns should use authentic chord progressions and realistic timing
- Return ONLY the JSON object, no additional text.`,
              },
              {
                role: 'user',
                content: `Generate a backing track for: ${description}`,
              },
            ],
            temperature: 0.7,
            max_tokens: 2000,
          }),
        }
      );

      if (!openaiResponse.ok) {
        throw new Error(`OpenAI API error: ${openaiResponse.status}`);
      }

      const data = await openaiResponse.json();
      console.log('🧠 OpenAI response received');

      const content = data.choices[0].message.content.trim();

      // Parse the JSON response
      let preset;
      try {
        preset = JSON.parse(content);
        console.log('✅ OpenAI preset generated:', preset.name);
      } catch (parseError) {
        console.error('❌ JSON parse error:', parseError);
        console.log('🔄 Falling back to simple generator');
        preset = generateSimplePreset(description);
      }

      return NextResponse.json({ preset });
    } catch (openaiError) {
      console.error('❌ OpenAI error:', openaiError);
      console.log('🔄 Falling back to simple generator');
      const preset = generateSimplePreset(description);
      return NextResponse.json({ preset });
    }
  } catch (error) {
    console.error('❌ API Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate preset' },
      { status: 500 }
    );
  }
}

// Fallback simple generator
function generateSimplePreset(description: string) {
  console.log('🔧 Using simple preset generator for:', description);

  try {
    const lowerDesc = description.toLowerCase();

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
            note: 'C2',
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
            active: i % 8 === 2 || i % 8 === 6, // Piano chords on off-beats
            note: i < 16 ? 'C' : i < 32 ? 'Am' : i < 48 ? 'F' : 'G',
          })),
          volume: 0.7, // Louder for more realistic piano presence
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
  } catch (error) {
    console.error('❌ Error in simple generator:', error);
    throw error;
  }
}
