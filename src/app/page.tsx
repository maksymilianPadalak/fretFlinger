'use client';

import { useState } from 'react';
import GuitarProcessor from './components/GuitarProcessor';
import MultiSequencer from './components/MultiSequencer';
import AIGenerator from './components/AIGenerator';

// Define the preset type
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

        {/* AI Generator */}
        <AIGenerator onPresetGenerated={handlePresetGenerated} />

        {/* Guitar Audio Processor */}
        <GuitarProcessor />

        {/* Multi-Track Sequencer */}
        <MultiSequencer
          externalPreset={currentPreset}
          onPresetLoaded={handlePresetLoaded}
        />

        {/* Debug Info (remove this later) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="p-4 bg-gray-100 rounded-lg text-xs text-gray-600">
            <div>Debug: Current preset: {currentPreset?.name || 'None'}</div>
            <div>Debug: Loaded preset: {loadedPresetName || 'None'}</div>
          </div>
        )}
      </div>
    </main>
  );
}
