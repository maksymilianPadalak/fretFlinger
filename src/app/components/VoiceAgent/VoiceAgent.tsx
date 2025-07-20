'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Preset } from '../MultiSequencer/types';

interface VoiceAgentProps {
  onPresetGenerated: (preset: Preset) => void;
  className?: string;
}

interface ConversationState {
  isActive: boolean;
  isListening: boolean;
  conversationId: string | null;
  lastResponse: string;
}

const VoiceAgent: React.FC<VoiceAgentProps> = ({
  onPresetGenerated,
  className = '',
}) => {
  const [conversation, setConversation] = useState<ConversationState>({
    isActive: false,
    isListening: false,
    conversationId: null,
    lastResponse: '',
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastPresetName, setLastPresetName] = useState<string>('');

  const websocketRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  const startVoiceConversation = useCallback(async () => {
    try {
      setError(null);
      setIsProcessing(true);

      // Initialize audio context
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext();
      }

      // Get microphone access
      if (!mediaStreamRef.current) {
        mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
      }

      // Connect to ElevenLabs Voice Agent WebSocket
      const agentId = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID;
      const apiKey = process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY;

      if (!agentId) {
        throw new Error('ElevenLabs Agent ID not configured');
      }

      const wsUrl = `wss://api.elevenlabs.io/v1/convai/conversation?agent_id=${agentId}&xi-api-key=${apiKey || ''}`;

      websocketRef.current = new WebSocket(wsUrl);

      websocketRef.current.onopen = () => {
        console.log('Connected to ElevenLabs Voice Agent');
        setConversation(prev => ({
          ...prev,
          isActive: true,
          isListening: true,
          conversationId: `conv_${Date.now()}`,
        }));
        setIsProcessing(false);
      };

      websocketRef.current.onmessage = async event => {
        try {
          const data = JSON.parse(event.data);
          console.log('Voice Agent Message:', data);

          if (data.type === 'conversation_initiation_metadata') {
            console.log('Conversation initiated');
          } else if (data.type === 'audio') {
            // Handle audio response from agent
            if (data.audio_event?.audio_base_64) {
              playAudioResponse(data.audio_event.audio_base_64);
            }
          } else if (data.type === 'user_transcript') {
            // User spoke - process the transcript
            if (data.user_transcript?.text) {
              await handleUserMessage(data.user_transcript.text);
            }
          }
        } catch (err) {
          console.error('Error processing voice message:', err);
        }
      };

      websocketRef.current.onerror = error => {
        console.error('WebSocket error:', error);
        setError('Voice connection failed');
        setIsProcessing(false);
      };

      websocketRef.current.onclose = () => {
        console.log('Voice Agent disconnected');
        setConversation(prev => ({
          ...prev,
          isActive: false,
          isListening: false,
        }));
        setIsProcessing(false);
      };

      // Start audio streaming
      if (mediaStreamRef.current && websocketRef.current) {
        startAudioStreaming();
      }
    } catch (err) {
      console.error('Failed to start voice conversation:', err);
      setError('Failed to start voice conversation');
      setIsProcessing(false);
    }
  }, []);

  const startAudioStreaming = useCallback(() => {
    if (!mediaStreamRef.current || !websocketRef.current) return;

    const mediaRecorder = new MediaRecorder(mediaStreamRef.current, {
      mimeType: 'audio/webm',
    });

    mediaRecorder.ondataavailable = event => {
      if (
        event.data.size > 0 &&
        websocketRef.current?.readyState === WebSocket.OPEN
      ) {
        // Convert blob to base64 and send to agent
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = reader.result?.toString().split(',')[1];
          if (base64) {
            websocketRef.current?.send(
              JSON.stringify({
                user_audio_chunk: base64,
              })
            );
          }
        };
        reader.readAsDataURL(event.data);
      }
    };

    mediaRecorder.start(100); // Send audio chunks every 100ms
  }, []);

  const playAudioResponse = useCallback(async (audioBase64: string) => {
    try {
      if (!audioContextRef.current) return;

      const audioData = atob(audioBase64);
      const audioBuffer = new ArrayBuffer(audioData.length);
      const view = new Uint8Array(audioBuffer);
      for (let i = 0; i < audioData.length; i++) {
        view[i] = audioData.charCodeAt(i);
      }

      const decodedAudio =
        await audioContextRef.current.decodeAudioData(audioBuffer);
      const source = audioContextRef.current.createBufferSource();
      source.buffer = decodedAudio;
      source.connect(audioContextRef.current.destination);
      source.start();
    } catch (err) {
      console.error('Error playing audio response:', err);
    }
  }, []);

  const handleUserMessage = useCallback(
    async (message: string) => {
      try {
        setIsProcessing(true);
        setError(null);

        // Send message to our preset generation API
        const response = await fetch('/api/voice-agent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message,
            conversation_id: conversation.conversationId,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to process voice command');
        }

        const { preset, response: agentResponse } = await response.json();

        if (preset) {
          // Apply the generated preset
          onPresetGenerated(preset);
          setLastPresetName(preset.name);
          setConversation(prev => ({
            ...prev,
            lastResponse: agentResponse,
          }));

          // Send response back to voice agent
          if (websocketRef.current?.readyState === WebSocket.OPEN) {
            websocketRef.current.send(
              JSON.stringify({
                type: 'conversation_response',
                response: agentResponse,
              })
            );
          }
        }
      } catch (err) {
        console.error('Error handling user message:', err);
        setError('Failed to generate preset from voice command');
      } finally {
        setIsProcessing(false);
      }
    },
    [conversation.conversationId, onPresetGenerated]
  );

  const stopVoiceConversation = useCallback(() => {
    if (websocketRef.current) {
      websocketRef.current.close();
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    setConversation({
      isActive: false,
      isListening: false,
      conversationId: null,
      lastResponse: '',
    });
  }, []);

  const generatePresetFromText = useCallback(
    async (description: string) => {
      try {
        setIsProcessing(true);
        setError(null);

        const response = await fetch('/api/generate-preset', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ description }),
        });

        if (!response.ok) {
          throw new Error('Failed to generate preset');
        }

        const { preset } = await response.json();
        onPresetGenerated(preset);
        setLastPresetName(preset.name);
      } catch (err) {
        console.error('Error generating preset:', err);
        setError('Failed to generate preset');
      } finally {
        setIsProcessing(false);
      }
    },
    [onPresetGenerated]
  );

  return (
    <div
      className={`p-6 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200 ${className}`}
    >
      <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
        <span className="mr-2">🎤</span>
        AI Voice Assistant
      </h3>

      <div className="space-y-4">
        {/* Voice Controls */}
        <div className="flex gap-3">
          {!conversation.isActive ? (
            <button
              onClick={startVoiceConversation}
              disabled={isProcessing}
              className="flex-1 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Connecting...
                </>
              ) : (
                <>
                  <span className="mr-2">🎙️</span>
                  Start Voice Chat
                </>
              )}
            </button>
          ) : (
            <button
              onClick={stopVoiceConversation}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center"
            >
              <span className="mr-2">⏹️</span>
              Stop Voice Chat
            </button>
          )}
        </div>

        {/* Status */}
        <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
          <div className="flex items-center">
            <div
              className={`w-3 h-3 rounded-full mr-2 ${
                conversation.isActive
                  ? 'bg-green-500 animate-pulse'
                  : 'bg-gray-300'
              }`}
            ></div>
            <span className="text-sm font-medium">
              {conversation.isActive
                ? conversation.isListening
                  ? 'Listening...'
                  : 'Connected'
                : 'Not connected'}
            </span>
          </div>
          {isProcessing && (
            <div className="flex items-center text-sm text-blue-600">
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 mr-2"></div>
              Generating...
            </div>
          )}
        </div>

        {/* Quick Text Input */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Or type your request:
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="e.g., 'Create a slow blues backing track in Em'"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              onKeyPress={e => {
                if (e.key === 'Enter') {
                  const input = e.target as HTMLInputElement;
                  generatePresetFromText(input.value);
                  input.value = '';
                }
              }}
            />
            <button
              onClick={() => {
                const input = document.querySelector(
                  'input[placeholder*="backing track"]'
                ) as HTMLInputElement;
                if (input?.value) {
                  generatePresetFromText(input.value);
                  input.value = '';
                }
              }}
              disabled={isProcessing}
              className="bg-purple-500 hover:bg-purple-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Generate
            </button>
          </div>
        </div>

        {/* Example Prompts */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Try saying:</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
            {[
              'Create a slow jazz backing track',
              'Make an energetic rock rhythm',
              'I need a blues shuffle in A',
              'Generate a mellow indie track',
              'Create something for metal guitar',
              'Make a reggae rhythm',
            ].map((example, index) => (
              <button
                key={index}
                onClick={() => generatePresetFromText(example)}
                disabled={isProcessing}
                className="text-left p-2 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 rounded text-gray-700 transition-colors"
              >
                {example}
              </button>
            ))}
          </div>
        </div>

        {/* Last Generated */}
        {lastPresetName && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="text-sm font-medium text-green-800">
              ✅ Generated: {lastPresetName}
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="text-sm text-red-800">{error}</div>
          </div>
        )}

        {/* Last Response */}
        {conversation.lastResponse && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="text-sm text-blue-800">
              🤖 {conversation.lastResponse}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VoiceAgent;
