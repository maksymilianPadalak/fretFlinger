'use client';

import React, { useState } from 'react';

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

interface AIGeneratorProps {
  onPresetGenerated: (preset: Preset) => void;
  className?: string;
}

export default function AIGenerator({
  onPresetGenerated,
  className,
}: AIGeneratorProps) {
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lastGenerated, setLastGenerated] = useState('');
  const [error, setError] = useState('');

  const generatePreset = async (description: string) => {
    if (!description.trim()) return;

    setIsLoading(true);
    setError('');

    try {
      console.log('Generating preset for:', description);

      const response = await fetch('/api/generate-preset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ description }),
      });

      if (!response.ok) {
        throw new Error(`Failed to generate: ${response.status}`);
      }

      const { preset } = await response.json();
      console.log('Generated preset:', preset);

      if (preset) {
        onPresetGenerated(preset);
        setLastGenerated(preset.name);
        setInputValue('');
      }
    } catch (err) {
      console.error('Generation error:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to generate preset'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    generatePreset(inputValue);
  };

  const quickPresets = [
    'Create a slow blues backing track',
    'Make an energetic rock rhythm',
    'Generate a jazz progression',
    'Create a metal backing track',
  ];

  return (
    <div className="p-6 bg-purple-50 rounded-lg border border-purple-200">
      <h3 className="text-xl font-bold text-gray-800 mb-4">
        🤖 AI Backing Track Generator
      </h3>

      <form onSubmit={handleSubmit} className="mb-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            placeholder="Describe your backing track"
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !inputValue.trim()}
            className="bg-purple-500 hover:bg-purple-600 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-medium"
          >
            {isLoading ? 'Generating...' : 'Generate'}
          </button>
        </div>
      </form>

      {isLoading && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg mb-4">
          <div className="text-blue-800 text-sm">
            🎵 Creating your backing track...
          </div>
        </div>
      )}

      {lastGenerated && !isLoading && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg mb-4">
          <div className="text-green-800 text-sm font-medium">
            ✅ Generated: {lastGenerated}
          </div>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg mb-4">
          <div className="text-red-800 text-sm font-medium">❌ {error}</div>
        </div>
      )}

      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">Quick Examples:</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {quickPresets.map((preset, index) => (
            <button
              key={index}
              onClick={() => generatePreset(preset)}
              disabled={isLoading}
              className="text-left p-3 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg text-sm"
            >
              <div className="font-medium text-purple-600">"{preset}"</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
