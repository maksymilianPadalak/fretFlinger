'use client';

import { useEffect, useRef } from 'react';
import { setupContext } from './audioProcessing';

export default function Home() {
  const visualizerRef = useRef<HTMLDivElement>(null);
  const contextRef = useRef<AudioContext>(null!);

  useEffect(() => {
    if (contextRef !== null) {
      setupContext(contextRef);
    }

    return () => {
      if (contextRef.current) {
        contextRef.current.close();
      }
    };
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center p-8">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 max-w-md w-full">
        <h1 className="text-4xl font-black text-center tracking-tight leading-none text-white mb-8">
          Guitar Audio Processor
        </h1>
        <div
          ref={visualizerRef}
          id="visualizer"
          className="w-full h-32 bg-black/20 rounded-lg border border-white/20"
        />
        <div className="mt-4 text-center text-white/80">
          Connecting Audio...
        </div>
      </div>
    </main>
  );
}
