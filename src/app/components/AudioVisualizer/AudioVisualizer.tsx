import { forwardRef, useEffect, useRef } from 'react';

interface AudioVisualizerProps {
  className?: string;
  audioContext?: AudioContext | null;
  sourceNode?: MediaStreamAudioSourceNode | null;
  isRecording?: boolean;
}

const AudioVisualizer = forwardRef<HTMLDivElement, AudioVisualizerProps>(
  ({ className = '', audioContext, sourceNode, isRecording = false }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationFrameRef = useRef<number | undefined>(undefined);
    const analyserRef = useRef<AnalyserNode | undefined>(undefined);

    useEffect(() => {
      if (!audioContext || !sourceNode || !canvasRef.current) return;

      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Set canvas size
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;

      // Create analyzer node
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.8;
      sourceNode.connect(analyser);
      analyserRef.current = analyser;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const draw = () => {
        animationFrameRef.current = requestAnimationFrame(draw);

        analyser.getByteTimeDomainData(dataArray);

        ctx.fillStyle = 'rgb(248, 250, 252)'; // bg-gray-100 equivalent
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.lineWidth = 2;
        ctx.strokeStyle = isRecording
          ? 'rgb(239, 68, 68)'
          : 'rgb(59, 130, 246)'; // red-500 when recording, blue-500 otherwise
        ctx.beginPath();

        const sliceWidth = canvas.width / bufferLength;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const v = dataArray[i] / 128.0;
          const y = (v * canvas.height) / 2;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }

          x += sliceWidth;
        }

        ctx.lineTo(canvas.width, canvas.height / 2);
        ctx.stroke();
      };

      draw();

      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        if (analyserRef.current) {
          analyserRef.current.disconnect();
        }
      };
    }, [audioContext, sourceNode, isRecording]);

    return (
      <div
        ref={ref}
        id="visualizer"
        className={`w-full h-32 my-4 bg-gray-100 rounded border ${className}`}
      >
        <canvas ref={canvasRef} className="w-full h-full rounded" />
      </div>
    );
  }
);

AudioVisualizer.displayName = 'AudioVisualizer';

export default AudioVisualizer;
