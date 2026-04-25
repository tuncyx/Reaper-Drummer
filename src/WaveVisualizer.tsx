import React, { useRef, useEffect } from 'react';
import * as Tone from 'tone';

interface WaveVisualizerProps {
  analyzer: Tone.Analyser | null;
  isPlaying: boolean;
}

export function WaveVisualizer({ analyzer, isPlaying }: WaveVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>();
  const historyRef = useRef<number[]>(Array(1000).fill(0));

  const draw = () => {
    if (!canvasRef.current || !analyzer) return;
    const canvas = canvasRef.current;
    
    // Resize canvas safely to container
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
      historyRef.current = Array(width).fill(0);
    }
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background
    ctx.fillStyle = '#222225';
    ctx.fillRect(0, 0, width, height);

    // DAW Track Background lines
    ctx.beginPath();
    ctx.strokeStyle = '#2a2a2d';
    ctx.lineWidth = 1;
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();

    if (isPlaying) {
      const values = analyzer.getValue() as Float32Array;
      
      // Calculate RMS or peak for this frame
      let peak = 0;
      for (let i = 0; i < values.length; i++) {
        if (Math.abs(values[i]) > peak) {
          peak = Math.abs(values[i]);
        }
      }
      
      historyRef.current.push(peak);
      if (historyRef.current.length > width) {
        historyRef.current.shift();
      }
    } else {
      // Don't scroll when not playing, but we can slowly decay or just do nothing
    }

    // Draw the DAW waveform (filled shape)
    const history = historyRef.current;
    ctx.beginPath();
    ctx.fillStyle = '#14b8a6'; // tailwind teal-500
    ctx.strokeStyle = '#0d9488'; // tailwind teal-600
    ctx.lineWidth = 1;

    // Draw upper half
    ctx.moveTo(0, height / 2);
    for (let i = 0; i < history.length; i++) {
      const v = history[i];
      ctx.lineTo(i, (height / 2) - (v * (height / 2)));
    }
    // Draw lower half (mirror)
    for (let i = history.length - 1; i >= 0; i--) {
      const v = history[i];
      ctx.lineTo(i, (height / 2) + (v * (height / 2)));
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    requestRef.current = requestAnimationFrame(draw);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(draw);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [analyzer, isPlaying]);

  return (
    <div className="w-full h-full relative p-2 bg-[#2a2a2d]">
       <div className="absolute top-2 left-2 bg-[#1c1c1e] text-[10px] text-gray-400 px-2 py-0.5 rounded shadow z-10 opacity-80 border border-[#333]">Audio Region</div>
       <canvas 
         ref={canvasRef} 
         className="w-full h-full block rounded border border-[#111] shadow-inner"
       />
    </div>
  );
}

