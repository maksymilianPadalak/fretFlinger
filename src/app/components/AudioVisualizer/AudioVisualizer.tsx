import { forwardRef } from 'react';

interface AudioVisualizerProps {
  className?: string;
}

const AudioVisualizer = forwardRef<HTMLDivElement, AudioVisualizerProps>(
  ({ className = '' }, ref) => {
    return (
      <div
        ref={ref}
        id="visualizer"
        className={`w-full h-32 my-4 bg-gray-100 rounded border ${className}`}
      />
    );
  }
);

AudioVisualizer.displayName = 'AudioVisualizer';

export default AudioVisualizer;
