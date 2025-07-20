import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { message, conversation_id } = await request.json();

    // Call OpenAI to understand the user's intent
    const openaiResponse = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/generate-preset`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description: message,
        }),
      }
    );

    if (!openaiResponse.ok) {
      throw new Error('Failed to generate preset');
    }

    const { preset } = await openaiResponse.json();

    // Return the preset data that will be sent to the voice agent
    return NextResponse.json({
      preset,
      response: `I've created a custom backing track called "${preset.name}" for you. ${preset.description} It's set to ${preset.bpm} BPM. The preset has been loaded and is ready to play!`,
    });
  } catch (error) {
    console.error('Voice agent error:', error);
    return NextResponse.json(
      {
        response:
          "I'm sorry, I had trouble creating that backing track. Could you try describing what style of music you'd like again?",
      },
      { status: 500 }
    );
  }
}

// Webhook endpoint for ElevenLabs Voice Agent
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const message = url.searchParams.get('message');
  const conversationId = url.searchParams.get('conversation_id');

  if (!message) {
    return NextResponse.json(
      { error: 'Message parameter required' },
      { status: 400 }
    );
  }

  try {
    // Process the voice command
    const result = await POST(
      new NextRequest(request.url, {
        method: 'POST',
        body: JSON.stringify({
          message,
          conversation_id: conversationId,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      })
    );

    return result;
  } catch (error) {
    console.error('Voice webhook error:', error);
    return NextResponse.json(
      { error: 'Failed to process voice command' },
      { status: 500 }
    );
  }
}
