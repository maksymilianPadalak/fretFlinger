'use client';

import { useConversation } from '@elevenlabs/react';
import { useCallback, useState } from 'react';

interface Preset {
  name: string;
  description: string;
  bpm: number;
  tracks: {
    [trackId: string]: {
      steps: { active: boolean; note: string }[];
      volume: number;
      muted: boolean;
    };
  };
}

interface VoiceConversationProps {
  onPresetGenerated: (preset: Preset) => void;
  className?: string;
}

export default function VoiceConversation({
  onPresetGenerated,
  className = '',
}: VoiceConversationProps) {
  const [lastMessage, setLastMessage] = useState<string>('');
  const [isProcessingPreset, setIsProcessingPreset] = useState(false);

  const conversation = useConversation({
    onConnect: () => {
      console.log('🎤 Voice conversation connected');
      setLastMessage(
        'Connected! You can now speak your backing track requests.'
      );
    },
    onDisconnect: () => {
      console.log('🎤 Voice conversation disconnected');
      setLastMessage('Disconnected from voice agent.');
    },
    onMessage: async message => {
      console.log('🎤 Voice message received:', message);

      // Handle the message based on its source and content
      if (message.source === 'user') {
        const userRequest = message.message;
        setLastMessage(`You said: "${userRequest}"`);
        // Don't generate preset immediately - let the AI agent respond first
      }

      // Check if this is an agent response that indicates preset generation
      if (message.source === 'ai') {
        const agentResponse = message.message;
        setLastMessage(`Agent: ${agentResponse}`);

        // Check if agent response indicates they're creating/generating a backing track
        if (shouldGeneratePreset(agentResponse)) {
          // Extract the musical description from the agent's response
          const description = extractMusicalDescription(agentResponse);
          await handlePresetGeneration(description);
        }
      }
    },
    onError: error => {
      console.error('🎤 Voice conversation error details:', error);

      // More detailed error message
      let errorMessage = 'Voice connection failed';
      if (typeof error === 'string') {
        errorMessage = error;
      } else if (error && typeof error === 'object') {
        errorMessage = JSON.stringify(error);
      }

      setLastMessage(`❌ Voice Error: ${errorMessage}`);

      // Check for common issues
      if (!process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID) {
        setLastMessage('❌ ElevenLabs Agent ID not configured');
      }
    },
  });

  // Check if agent response indicates they want to generate a backing track
  const shouldGeneratePreset = (agentResponse: string): boolean => {
    const indicators = [
      'create',
      'generate',
      'make',
      'build',
      'backing track',
      'rhythm',
      'beat',
      'groove',
      'track',
      'composition',
    ];

    const lowerResponse = agentResponse.toLowerCase();
    return indicators.some(indicator => lowerResponse.includes(indicator));
  };

  // Extract musical description from agent response
  const extractMusicalDescription = (agentResponse: string): string => {
    // Try to extract musical terms and descriptions
    const musicalTerms = [
      'rock',
      'blues',
      'jazz',
      'metal',
      'funk',
      'country',
      'pop',
      'fast',
      'slow',
      'energetic',
      'mellow',
      'aggressive',
      'gentle',
      'major',
      'minor',
      'bpm',
      'tempo',
      'rhythm',
      'groove',
      'heavy',
      'light',
      'distorted',
      'clean',
      'acoustic',
      'electric',
    ];

    const words = agentResponse.toLowerCase().split(/\s+/);
    const relevantWords = words.filter(
      word =>
        musicalTerms.some(term => word.includes(term)) ||
        /\d+\s*bpm/.test(word) ||
        /[a-g]#?\s*(major|minor)/.test(word)
    );

    // If we found musical terms, use them; otherwise use the full response
    if (relevantWords.length > 0) {
      return relevantWords.join(' ');
    }

    // Fallback: return a cleaned version of the response
    return agentResponse
      .replace(/^(I'll|I will|Let me|I'm going to)\s*/i, '')
      .trim();
  };

  // Handle the actual preset generation using OpenAI
  const handlePresetGeneration = async (description: string) => {
    setIsProcessingPreset(true);

    try {
      console.log(
        '🎵 Generating preset with OpenAI for AI description:',
        description
      );

      // Use the existing preset generation API (same as text input)
      const response = await fetch('/api/generate-preset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ description }),
      });

      if (!response.ok) {
        throw new Error(`Failed to generate preset: ${response.status}`);
      }

      const { preset } = await response.json();

      if (preset) {
        // Load the preset into the sequencer
        onPresetGenerated(preset);
        setLastMessage(
          `✅ Generated with OpenAI: ${preset.name} (${preset.bpm} BPM)`
        );
        console.log('🎵 OpenAI preset generated successfully:', preset.name);
      }
    } catch (error) {
      console.error('🎵 Error generating preset with OpenAI:', error);
      setLastMessage(
        `❌ Sorry, I couldn't generate that backing track. ${error instanceof Error ? error.message : 'Please try again.'}`
      );
    } finally {
      setIsProcessingPreset(false);
    }
  };

  const startConversation = useCallback(async () => {
    try {
      setLastMessage('Requesting microphone access...');

      // Check if microphone is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Microphone access not supported in this browser');
      }

      // Check HTTPS requirement
      if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
        throw new Error('Microphone access requires HTTPS or localhost');
      }

      // Request microphone permission with detailed error handling
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });

        // Stop the stream immediately as we just needed permission
        stream.getTracks().forEach(track => track.stop());
        setLastMessage(
          'Microphone access granted. Starting voice conversation...'
        );
      } catch (permissionError) {
        console.error('Microphone permission error:', permissionError);

        let errorMessage = 'Microphone access failed';

        if (permissionError instanceof Error) {
          if (permissionError.name === 'NotAllowedError') {
            errorMessage =
              'Microphone access denied. Please allow microphone access and try again.';
          } else if (permissionError.name === 'NotFoundError') {
            errorMessage =
              'No microphone found. Please connect a microphone and try again.';
          } else if (permissionError.name === 'NotSupportedError') {
            errorMessage = 'Microphone not supported in this browser.';
          } else {
            errorMessage = `Microphone error: ${permissionError.message}`;
          }
        }

        throw new Error(errorMessage);
      }

      // Check if ElevenLabs Agent ID is configured
      if (!process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID) {
        throw new Error(
          'ElevenLabs Agent ID not configured. Please add NEXT_PUBLIC_ELEVENLABS_AGENT_ID to your .env.local file.'
        );
      }

      // Start the conversation with your agent
      await conversation.startSession({
        agentId: process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID,
      });

      setLastMessage('Voice conversation started! You can now speak.');
    } catch (error) {
      console.error('Failed to start voice conversation:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';
      setLastMessage(`❌ Error: ${errorMessage}`);
    }
  }, [conversation]);

  const stopConversation = useCallback(async () => {
    setLastMessage('Stopping conversation...');
    await conversation.endSession();
  }, [conversation]);

  const isConnected = conversation.status === 'connected';
  const isConnecting = conversation.status === 'connecting';

  return (
    <div
      className={`p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200 ${className}`}
    >
      <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
        <span className="mr-2">🎙️</span>
        Voice AI Assistant
      </h3>

      {/* Connection Controls */}
      <div className="flex gap-3 mb-4">
        <button
          onClick={startConversation}
          disabled={
            isConnected ||
            isConnecting ||
            !process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID
          }
          className="flex-1 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center"
        >
          {isConnecting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Connecting...
            </>
          ) : (
            <>
              <span className="mr-2">🎤</span>
              Start Voice Chat
            </>
          )}
        </button>

        <button
          onClick={stopConversation}
          disabled={!isConnected}
          className="flex-1 bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center"
        >
          <span className="mr-2">⏹️</span>
          Stop Chat
        </button>
      </div>

      {/* Test Basic API Button */}
      <div className="mb-4">
        <button
          onClick={() => handlePresetGeneration('Create a blues backing track')}
          disabled={isProcessingPreset}
          className="w-full bg-purple-500 hover:bg-purple-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          {isProcessingPreset ? (
            <>
              <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Testing API...
            </>
          ) : (
            <>
              <span className="mr-2">🧪</span>
              Test API (Bypass Voice) - Generate Blues Track
            </>
          )}
        </button>
        <div className="text-xs text-gray-500 mt-1 text-center">
          This tests the OpenAI preset generation without voice
        </div>
      </div>

      {/* Status Display */}
      <div className="p-4 bg-white rounded-lg border mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            <div
              className={`w-3 h-3 rounded-full mr-2 ${
                isConnected
                  ? 'bg-green-500 animate-pulse'
                  : isConnecting
                    ? 'bg-yellow-500 animate-pulse'
                    : 'bg-gray-300'
              }`}
            ></div>
            <span className="text-sm font-medium">
              Status: {conversation.status}
            </span>
          </div>

          {isConnected && (
            <div className="flex items-center text-sm">
              <span
                className={`inline-block w-2 h-2 rounded-full mr-2 ${
                  conversation.isSpeaking
                    ? 'bg-blue-500 animate-pulse'
                    : 'bg-green-500'
                }`}
              ></span>
              {conversation.isSpeaking ? 'Agent speaking' : 'Listening...'}
            </div>
          )}
        </div>

        {isProcessingPreset && (
          <div className="flex items-center text-sm text-purple-600 mb-2">
            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-purple-600 mr-2"></div>
            🧠 Generating professional backing track with OpenAI GPT-4...
          </div>
        )}

        {lastMessage && (
          <div className="text-sm text-gray-700 bg-gray-50 p-2 rounded">
            {lastMessage}
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="space-y-3">
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="text-sm font-medium text-blue-800 mb-1">
            🗣️ How to Use (Hybrid AI):
          </h4>
          <ul className="text-xs text-blue-700 space-y-1">
            <li>
              1. Click &quot;Start Voice Chat&quot; and allow microphone access
            </li>
            <li>2. Have a natural conversation about what you want to play</li>
            <li>
              3. When the AI responds about creating a track, it auto-generates
              with OpenAI!
            </li>
            <li>
              4. Best of both: Natural conversation + High-quality OpenAI
              presets
            </li>
          </ul>
        </div>

        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
          <h4 className="text-sm font-medium text-green-800 mb-1">
            💡 Natural Conversation Examples:
          </h4>
          <div className="text-xs text-green-700 space-y-1">
            <div>&quot;I want to practice guitar, can you help me?&quot;</div>
            <div>&quot;I&apos;m in the mood for some blues today&quot;</div>
            <div>&quot;What about something fast and energetic?&quot;</div>
            <div>&quot;Can we do a jazz track around 90 BPM?&quot;</div>
          </div>
        </div>

        {!process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="text-red-800 text-sm font-medium">
              🚨 ElevenLabs Setup Required for Voice Chat
            </div>
            <div className="text-red-700 text-xs mt-2 space-y-1">
              <div>
                1. Go to{' '}
                <a
                  href="https://elevenlabs.io"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  elevenlabs.io
                </a>{' '}
                and create an account
              </div>
              <div>2. Create a voice agent and get your Agent ID</div>
              <div>3. Get your API key from settings</div>
              <div>4. Add to .env.local:</div>
              <div className="bg-red-100 p-2 rounded mt-1 font-mono text-xs">
                NEXT_PUBLIC_ELEVENLABS_AGENT_ID=your_agent_id
                <br />
                NEXT_PUBLIC_ELEVENLABS_API_KEY=your_api_key
              </div>
              <div>5. Restart the development server</div>
            </div>
          </div>
        )}

        {/* Debug Information */}
        <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
          <h4 className="text-sm font-medium text-gray-800 mb-1">
            🔧 Debug Info:
          </h4>
          <div className="text-xs text-gray-600 space-y-1">
            <div>
              Protocol:{' '}
              {typeof window !== 'undefined'
                ? window.location.protocol
                : 'unknown'}
            </div>
            <div>
              Host:{' '}
              {typeof window !== 'undefined'
                ? window.location.hostname
                : 'unknown'}
            </div>
            <div>
              Microphone API:{' '}
              {typeof navigator !== 'undefined' && navigator.mediaDevices
                ? '✅ Available'
                : '❌ Not available'}
            </div>
            <div>
              ElevenLabs Agent:{' '}
              {process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID
                ? '✅ Configured'
                : '❌ Not configured'}
            </div>
            <div>Status: {conversation.status}</div>
            <div>Mode: 🎤 ElevenLabs Voice + 🧠 OpenAI GPT-4 (Hybrid)</div>
            <div className="text-xs text-gray-500 mt-1">
              📝 Note: Add OPENAI_API_KEY to .env.local for GPT-4 generation
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
