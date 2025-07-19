import Image from 'next/image';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center p-8">
      <h1 className="text-6xl md:text-8xl font-black text-center tracking-tight leading-none text-white animate-glow">
        <span className="inline-block bg-gradient-to-r from-red-400 to-cyan-400 bg-clip-text text-transparent animate-slide-in-left">
          Fret
        </span>
        <span className="inline-block bg-gradient-to-r from-blue-200 to-pink-200 bg-clip-text text-transparent animate-slide-in-right">
          Flinger
        </span>
      </h1>
    </main>
  );
}
