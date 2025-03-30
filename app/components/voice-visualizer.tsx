import { useEffect, useRef, useState } from 'react';

interface VoiceVisualizerProps {
  stream: MediaStream | null;
  isListening: boolean;
}

const VoiceVisualizer = ({ stream, isListening }: VoiceVisualizerProps) => {
  const [volume, setVolume] = useState(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    if (!stream) return;

    audioContextRef.current = new AudioContext();
    analyserRef.current = audioContextRef.current.createAnalyser();
    const source = audioContextRef.current.createMediaStreamSource(stream);
    source.connect(analyserRef.current);
    analyserRef.current.fftSize = 256;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);

    const updateVolume = () => {
      if (!analyserRef.current) return;
      
      analyserRef.current.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((acc, val) => acc + val, 0) / dataArray.length;
      setVolume(average / 128); // Нормалізуємо до діапазону 0-1
      
      animationFrameRef.current = requestAnimationFrame(updateVolume);
    };

    updateVolume();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [stream]);

  // Ще більш агресивна реакція з більшими розмірами
  const getBarHeight = (baseHeight: number, multiplier: number = 1) => {
    const minHeight = baseHeight * 0.15;
    const dynamicHeight = baseHeight * volume * multiplier * 5.0;
    return Math.max(minHeight, Math.min(baseHeight * 3.0, dynamicHeight));
  };

  return (
    <div className="relative w-70 h-70">
      {/* Фонове коло з товстішою рамкою */}
      <div 
        className={`
          absolute 
          inset-0 
          rounded-full 
          transition-all
          duration-150
          border-[16px]
          ${isListening ? 'opacity-100' : 'opacity-90'}
        `}
        style={{
          backgroundColor: '#2B4235',
          borderColor: '#416650'
        }}
      />
      
      {/* Іконка звукових хвиль */}
      <div className="absolute inset-0 flex items-center justify-center">
        <svg 
          viewBox="-100 -100 200 200"
          className={`w-40 h-40 transition-all duration-50
            ${isListening ? 'opacity-100' : 'opacity-80'}`}
        >
          <g style={{ fill: '#D9D9D9' }}>
            {/* 4 дуже широкі лінії з правильними проміжками */}
            <rect 
              x="-90" 
              y={-getBarHeight(25)} 
              width="35"
              height={getBarHeight(50, 1.0)}
              rx="17.5" 
            />
            <rect 
              x="-40" 
              y={-getBarHeight(30)} 
              width="35"
              height={getBarHeight(60, 1.2)}
              rx="17.5" 
            />
            <rect 
              x="10" 
              y={-getBarHeight(30)} 
              width="35"
              height={getBarHeight(60, 1.2)}
              rx="17.5" 
            />
            <rect 
              x="60" 
              y={-getBarHeight(25)} 
              width="35"
              height={getBarHeight(50, 1.0)}
              rx="17.5" 
            />
          </g>
        </svg>
      </div>

      {/* Анімоване кільце */}
      <div 
        className={`
          absolute 
          inset-0 
          rounded-full 
          border-2
          transition-all
          duration-150
          ${isListening ? 'opacity-100' : 'opacity-0'}
        `}
        style={{
          borderColor: '#416650',
          transform: `scale(${1 + (volume * 0.5)})`
        }}
      />
    </div>
  );
};

export default VoiceVisualizer; 