'use client';

import { useState } from 'react';
import GuitarProcessor from './components/GuitarProcessor';
import MultiSequencer from './components/MultiSequencer';
import AIGenerator from './components/AIGenerator';
import VoiceConversation from './components/VoiceConversation';

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

export default function Home() {
  const [currentPreset, setCurrentPreset] = useState<Preset | null>(null);
  const [loadedPresetName, setLoadedPresetName] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'text' | 'voice'>('text');

  const handlePresetGenerated = (preset: Preset) => {
    console.log('New preset generated:', preset.name);
    setCurrentPreset(preset);
  };

  const handlePresetLoaded = (presetName: string) => {
    console.log('Preset loaded into sequencer:', presetName);
    setLoadedPresetName(presetName);

    // Clear the current preset after a brief delay to avoid re-triggering
    setTimeout(() => {
      setCurrentPreset(null);
    }, 500);
  };

  return (
    <main className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">FretFlinger</h1>
          <p className="text-lg text-gray-600">
            AI-Powered Guitar Backing Track Generator
          </p>
          {loadedPresetName && (
            <div className="mt-4 inline-block px-4 py-2 bg-green-100 text-green-800 rounded-lg border border-green-200">
              🎵 Currently loaded: <strong>{loadedPresetName}</strong>
            </div>
          )}
        </div>

        {/* AI Generator Section */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            AI Backing Track Generator
          </h2>

          {/* Tab Navigation */}
          <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('text')}
              className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
                activeTab === 'text'
                  ? 'bg-white text-purple-600 shadow'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <span className="mr-2">⌨️</span>
              Text Input
            </button>
            <button
              onClick={() => setActiveTab('voice')}
              className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
                activeTab === 'voice'
                  ? 'bg-white text-green-600 shadow'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <span className="mr-2">🎤</span>
              Voice Input
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'text' && (
            <AIGenerator onPresetGenerated={handlePresetGenerated} />
          )}

          {activeTab === 'voice' && (
            <VoiceConversation onPresetGenerated={handlePresetGenerated} />
          )}
        </div>

        {/* Guitar Audio Processor */}
        <GuitarProcessor />

        {/* Multi-Track Sequencer */}
        <MultiSequencer
          externalPreset={currentPreset}
          onPresetLoaded={handlePresetLoaded}
        />

        {/* Footer Info */}
        <div className="text-center text-sm text-gray-500 space-y-2">
          <div>
            🎸 Generate backing tracks with AI, record your guitar, and create
            amazing music!
          </div>
          <div className="flex justify-center space-x-6 text-xs">
            <span>Text AI: Always available</span>
            <span>Voice AI: Requires ElevenLabs setup</span>
            <span>Recording: Requires microphone access</span>
          </div>
        </div>

        {/* Debug Info (development only) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="p-4 bg-gray-100 rounded-lg text-xs text-gray-600">
            <div className="font-semibold mb-2">Debug Info:</div>
            <div>Current preset: {currentPreset?.name || 'None'}</div>
            <div>Loaded preset: {loadedPresetName || 'None'}</div>
            <div>Active tab: {activeTab}</div>
            <div>
              ElevenLabs Agent ID:{' '}
              {process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID
                ? '✅ Configured'
                : '❌ Not configured'}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
