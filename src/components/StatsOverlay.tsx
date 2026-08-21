import React from 'react';
import { VibeConfig } from '../types';
import { Activity, Wind, Waves, Gauge } from 'lucide-react';

interface StatsOverlayProps {
  fps: number;
  particleCount: number;
  breatheVal: number;
  isBreathing: boolean;
  intensity: number;
  chaos: number;
  currentVibeConfig: VibeConfig;
}

export const StatsOverlay: React.FC<StatsOverlayProps> = ({
  fps,
  particleCount,
  breatheVal,
  isBreathing,
  intensity,
  chaos,
  currentVibeConfig,
}) => {
  return (
    <div
      id="telemetry-stats-overlay"
      className="pointer-events-none fixed bottom-4 left-4 z-20 flex flex-col gap-2 max-w-xs"
    >
      <div className="bg-slate-950/75 backdrop-blur-md border border-slate-800/80 rounded-2xl p-3.5 shadow-2xl text-slate-300 transition-all">
        {/* Header Mood info */}
        <div className="flex items-center justify-between gap-3 border-b border-slate-800/60 pb-2 mb-2">
          <div className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full animate-pulse"
              style={{ backgroundColor: currentVibeConfig.palette.primary }}
            />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-100">
              {currentVibeConfig.name}
            </span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">
            {fps > 0 ? `${fps} FPS` : '60 FPS'}
          </span>
        </div>

        <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-2 mb-2.5">
          {currentVibeConfig.tagline}
        </p>

        {/* Realtime Metrics Grid */}
        <div className="grid grid-cols-3 gap-1.5 pt-1 text-[10px] font-mono">
          <div className="bg-slate-900/60 rounded-lg p-1.5 border border-slate-800/50 flex flex-col">
            <span className="text-slate-500 flex items-center gap-1">
              <Gauge className="w-2.5 h-2.5" /> Particles
            </span>
            <span className="text-slate-200 font-medium">{particleCount.toLocaleString()}</span>
          </div>

          <div className="bg-slate-900/60 rounded-lg p-1.5 border border-slate-800/50 flex flex-col">
            <span className="text-slate-500 flex items-center gap-1">
              <Wind className="w-2.5 h-2.5" /> Intensity
            </span>
            <span className="text-slate-200 font-medium">{intensity}%</span>
          </div>

          <div className="bg-slate-900/60 rounded-lg p-1.5 border border-slate-800/50 flex flex-col">
            <span className="text-slate-500 flex items-center gap-1">
              <Activity className="w-2.5 h-2.5" /> Chaos
            </span>
            <span className="text-slate-200 font-medium">{chaos}%</span>
          </div>
        </div>

        {/* Breathe Indicator Bar if active */}
        {isBreathing && (
          <div className="mt-2.5 pt-2 border-t border-slate-800/50 flex items-center justify-between text-[10px]">
            <span className="text-cyan-400 font-mono flex items-center gap-1">
              <Waves className="w-3 h-3 animate-pulse" /> Sine Breathe Modulator
            </span>
            <span className="font-mono text-slate-400">
              {breatheVal >= 0 ? `+${(breatheVal * 100).toFixed(0)}%` : `${(breatheVal * 100).toFixed(0)}%`}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
