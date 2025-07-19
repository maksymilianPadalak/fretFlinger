'use client';

import GuitarProcessor from './components/GuitarProcessor';
import MultiSequencer from './components/MultiSequencer';

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Guitar Audio Processor */}
        <GuitarProcessor />

        {/* Multi-Track Sequencer */}
        <MultiSequencer />
      </div>
    </main>
  );
}
