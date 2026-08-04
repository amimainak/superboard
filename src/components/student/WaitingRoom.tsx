'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { useAppStore } from '@/store/app-store';
import { Button } from '@/components/ui/button';
import { Pencil, Loader2, Image as ImageIcon } from 'lucide-react';
import type { BrandingConfig } from '@/types';

type Props = {
  onJoin: () => void;
  branding?: BrandingConfig;
  roomCode: string;
  tutorPresent?: boolean;
};

// ---------- Mini Scratch-Pad Canvas ----------
function ScratchPad() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);

  const getPos = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      const canvas = canvasRef.current!;
      const rect = canvas.getBoundingClientRect();
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      return {
        x: ((clientX - rect.left) / rect.width) * canvas.width,
        y: ((clientY - rect.top) / rect.height) * canvas.height,
      };
    },
    [],
  );

  const startDraw = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      drawingRef.current = true;
      lastPosRef.current = getPos(e);
    },
    [getPos],
  );

  const draw = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (!drawingRef.current || !lastPosRef.current) return;
      const ctx = canvasRef.current?.getContext('2d');
      if (!ctx) return;
      const pos = getPos(e);
      ctx.beginPath();
      ctx.moveTo(lastPosRef.current.x, lastPosRef.current.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
      lastPosRef.current = pos;
    },
    [getPos],
  );

  const stopDraw = useCallback(() => {
    drawingRef.current = false;
    lastPosRef.current = null;
  }, []);

  // Initialise blank canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  return (
    <div className="relative w-full max-w-md mx-auto rounded-xl border border-white/20 overflow-hidden bg-white shadow-lg">
      <div className="flex items-center gap-2 px-3 py-1.5 bg-white/60 border-b border-white/20">
        <Pencil className="size-3.5 text-white/70" />
        <span className="text-xs text-white/70 font-medium">Doodle while you wait</span>
      </div>
      <canvas
        ref={canvasRef}
        width={640}
        height={240}
        className="w-full h-36 touch-none cursor-crosshair"
        onMouseDown={startDraw}
        onMouseMove={draw}
        onMouseUp={stopDraw}
        onMouseLeave={stopDraw}
        onTouchStart={startDraw}
        onTouchMove={draw}
        onTouchEnd={stopDraw}
      />
    </div>
  );
}

// ---------- Animated Dots ----------
function AnimatedDots() {
  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? '' : prev + '.'));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return <span>{dots}</span>;
}

// ---------- Main Component ----------
export default function WaitingRoom({ onJoin, branding, roomCode, tutorPresent = false }: Props) {
  // Merge prop branding with store branding (prop takes priority)
  const storeBranding = useAppStore((s) => s.room.branding);
  const brand = branding ?? storeBranding;

  const brandColor = brand.color ?? '#059669';
  const agencyName = brand.agencyName ?? 'Superboard';
  const logoUrl = brand.logoUrl;

  // Compute a lighter tint for the background
  const bgStyle: React.CSSProperties = {
    background: `linear-gradient(135deg, ${brandColor} 0%, ${brandColor}cc 50%, ${brandColor}99 100%)`,
  };

  return (
    <div
      className="fixed inset-0 z-40 flex flex-col items-center justify-center gap-6 text-white"
      style={bgStyle}
    >
      {/* Logo or default icon */}
      <div className="flex flex-col items-center gap-3">
        {logoUrl ? (
          <img
            src={logoUrl}
            alt={`${agencyName} logo`}
            width={96}
            height={96}
            loading="lazy"
            className="w-24 h-24 rounded-2xl object-contain drop-shadow-lg bg-white/10 p-2"
          />
        ) : (
          <div className="w-24 h-24 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center drop-shadow-lg">
            <ImageIcon className="size-12 text-white/90" />
          </div>
        )}

        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-center drop-shadow-sm">
          Welcome to {agencyName}&apos;s classroom
        </h1>

        <p className="text-sm text-white/60 font-mono">
          Room code: <span className="font-bold text-white/80">{roomCode}</span>
        </p>
      </div>

      {/* Scratch pad */}
      <div className="w-full px-6">
        <ScratchPad />
      </div>

      {/* Status + Action */}
      <div className="flex flex-col items-center gap-4 mt-2">
        {!tutorPresent ? (
          <div className="flex items-center gap-2 text-white/80 text-sm">
            <Loader2 className="size-4 animate-spin" />
            <span>
              Waiting for your tutor to join
              <AnimatedDots />
            </span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <p className="text-white/80 text-sm">Your tutor is ready!</p>
            <Button
              size="lg"
              className="bg-white text-emerald-700 hover:bg-white/90 font-semibold shadow-xl rounded-xl px-8 h-12 text-base"
              onClick={onJoin}
            >
              Join Lesson
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
