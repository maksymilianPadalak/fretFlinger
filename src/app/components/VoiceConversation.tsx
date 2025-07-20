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
  const [isConnected, setIsConnected] = useState(false); // Track connection state

  const conversation = useConversation({
    onConnect: () => {
      console.log('🎤 Voice conversation connected');
      setIsConnected(true);
      setLastMessage(
        'Connected! You can now speak your backing track requests.'
      );
    },
    onDisconnect: () => {
      console.log('🎤 Voice conversation disconnected');
      setIsConnected(false);
      setLastMessage('Disconnected from voice agent.');
    },
    onMessage: async (message: any) => {
      // Using 'any' temporarily due to potential type mismatch
      console.log('🎤 Voice message received:', message);

      // Check if this is a user transcript (what the user said)
      if (message.type === 'user_transcript' && message.user_transcript?.text) {
        const userRequest = message.user_transcript.text;
        setLastMessage(`You said: "${userRequest}"`);
        await handleVoiceRequest(userRequest);
      }

      // Check if this is an agent response
      if (
        message.type === 'agent_response' &&
        message.agent_response?.agent_response_text
      ) {
        setLastMessage(`Agent: ${message.agent_response.agent_response_text}`);
      }

      // Handle unexpected audio messages
      if (message.type === 'audio' && message.audio?.data) {
        console.log(
          '🎵 Received audio data, size:',
          message.audio.data.byteLength
        );
        try {
          // Attempt to log audio data (decoding commented out unless needed)
          // const audioContext = new AudioContext();
          // const audioBuffer = await audioContext.decodeAudioData(message.audio.data);
          // console.log('Audio decoded successfully:', audioBuffer);
        } catch (error) {
          console.error('🎵 Error decoding audio data:', error);
          setLastMessage(
            `Error: Unable to decode audio data. ${error instanceof Error ? error.message : ''}`
          );
        }
      }
    },
    onError: error => {
      console.error('🎤 Voice conversation error:', error);
      setLastMessage(`Error: ${error?.message || 'Voice connection failed'}`);
      setIsConnected(false); // Ensure connection state reflects error
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
      console.log('Preset received from API:', preset); // Debug log

      if (preset) {
        // Load the preset into the sequencer
        onPresetGenerated(preset);

        // Send confirmation back to the agent (if supported)
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
      await navigator.mediaDevices.getUserMedia({ audio: true });
      setLastMessage('Starting voice conversation...');
      await conversation.startSession({
        agentId: process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID!, // Your agent ID from env
      });
    } catch (error) {
      console.error('Failed to start voice conversation:', error);
      setLastMessage(
        `Failed to start: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      setIsConnected(false);
    }
  }, [conversation]);

  const stopConversation = useCallback(async () => {
    setLastMessage('Stopping conversation...');
    await conversation.endSession();
    setIsConnected(false);
  }, [conversation]);

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
          disabled={isConnected}
          className="flex-1 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center"
        >
          {isConnected ? (
            <>
              <span className="mr-2">🎤</span>
              Connected
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
                isConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-300'
              }`}
            ></div>
            <span className="text-sm font-medium">
              Status: {isConnected ? 'Connected' : 'Not Connected'}
            </span>
          </div>
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
            <li>1. Click "Start Voice Chat" and allow microphone access</li>
            <li>2. Speak your backing track request naturally</li>
            <li>3. Example: "Create a slow blues backing track in E minor"</li>
            <li>4. The AI will generate and load your track automatically!</li>
          </ul>
        </div>

        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
          <h4 className="text-sm font-medium text-green-800 mb-1">
            💡 Voice Examples:
          </h4>
          <div className="text-xs text-green-700 space-y-1">
            <div>"I need a fast rock rhythm for guitar practice"</div>
            <div>"Create something jazzy and mellow at 90 BPM"</div>
            <div>"Make a blues shuffle in A that I can solo over"</div>
            <div>"Generate an energetic metal backing track"</div>
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
