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

        // Generate preset based on what the user said
        await handleVoiceRequest(userRequest);
      }

      // Check if this is an agent response
      if (message.source === 'ai') {
        setLastMessage(`Agent: ${message.message}`);
      }
    },
    onError: error => {
      console.error('🎤 Voice conversation error:', error);
      setLastMessage(`Error: ${error || 'Voice connection failed'}`);
    },
  });

  const handleVoiceRequest = async (userRequest: string) => {
    setIsProcessingPreset(true);

    try {
      console.log('🎵 Generating preset for voice request:', userRequest);

      // Use the existing preset generation API
      const response = await fetch('/api/generate-preset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ description: userRequest }),
      });

      if (!response.ok) {
        throw new Error(`Failed to generate preset: ${response.status}`);
      }

      const { preset } = await response.json();

      if (preset) {
        // Load the preset into the sequencer
        onPresetGenerated(preset);

        // Send confirmation back to the agent
        const confirmationMessage = `Perfect! I've created "${preset.name}" at ${preset.bpm} BPM. The backing track is loaded and ready to play. You can now jam along with your guitar!`;

        setLastMessage(`✅ Generated: ${preset.name}`);
        console.log('🎵 Preset generated successfully:', preset.name);
      }
    } catch (error) {
      console.error('🎵 Error generating preset from voice:', error);
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

      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true });

      setLastMessage('Starting voice conversation...');

      // Start the conversation with your agent
      await conversation.startSession({
        agentId: process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID!, // Your agent ID from env
      });
    } catch (error) {
      console.error('Failed to start voice conversation:', error);
      setLastMessage(
        `Failed to start: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
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
          disabled={isConnected || isConnecting}
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
            Generating backing track...
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
            🗣️ How to Use:
          </h4>
          <ul className="text-xs text-blue-700 space-y-1">
            <li>
              1. Click &quot;Start Voice Chat&quot; and allow microphone access
            </li>
            <li>2. Speak your backing track request naturally</li>
            <li>
              3. Example: &quot;Create a slow blues backing track in E
              minor&quot;
            </li>
            <li>4. The AI will generate and load your track automatically!</li>
          </ul>
        </div>

        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
          <h4 className="text-sm font-medium text-green-800 mb-1">
            💡 Voice Examples:
          </h4>
          <div className="text-xs text-green-700 space-y-1">
            <div>&quot;I need a fast rock rhythm for guitar practice&quot;</div>
            <div>&quot;Create something jazzy and mellow at 90 BPM&quot;</div>
            <div>
              &quot;Make a blues shuffle in A that I can solo over&quot;
            </div>
            <div>&quot;Generate an energetic metal backing track&quot;</div>
          </div>
        </div>

        {!process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="text-yellow-800 text-sm font-medium">
              ⚠️ Setup Required
            </div>
            <div className="text-yellow-700 text-xs mt-1">
              Add your ElevenLabs Agent ID to .env.local as
              NEXT_PUBLIC_ELEVENLABS_AGENT_ID
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
