import React from 'react';
import { VibeType } from '../types';
import { VIBE_CONFIGS } from '../data/vibes';
import { Wind, Zap, CloudRain, Flame, Sparkles } from 'lucide-react';

interface VibeSelectorProps {
  currentVibe: VibeType;
  onSelectVibe: (vibe: VibeType) => void;
}

const ICONS: Record<VibeType, React.ElementType> = {
  'calm-breeze': Wind,
  'electric-storm': Zap,
  'melancholy-rain': CloudRain,
  'radiant-heat': Flame,
  'aurora-borealis': Sparkles,
};

export const VibeSelector: React.FC<VibeSelectorProps> = ({
  currentVibe,
  onSelectVibe,
}) => {
  const vibes = Object.values(VIBE_CONFIGS);

  return (
    <div id="vibe-selector-grid" className="grid grid-cols-2 sm:grid-cols-2 gap-2">
      {vibes.map((v) => {
        const Icon = ICONS[v.id] || Wind;
        const isActive = currentVibe === v.id;

        return (
          <button
            key={v.id}
            id={`vibe-btn-${v.id}`}
            onClick={() => onSelectVibe(v.id)}
            className={`group relative flex flex-col p-2.5 rounded-xl border text-left transition-all duration-200 cursor-pointer ${
              isActive
                ? 'bg-slate-800/90 border-cyan-400/50 shadow-lg shadow-cyan-500/10'
                : 'bg-slate-900/50 border-slate-800/80 hover:bg-slate-800/60 hover:border-slate-700/80'
            }`}
          >
            {/* Active Accent Pill */}
            {isActive && (
              <div
                className="absolute top-2 right-2 w-2 h-2 rounded-full animate-ping"
                style={{ backgroundColor: v.palette.primary }}
              />
            )}

            <div className="flex items-center gap-2 mb-1">
              <div
                className="p-1.5 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110"
                style={{
                  backgroundColor: `${v.palette.primary}20`,
                  color: v.palette.primary,
                }}
              >
                <Icon className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold tracking-wide text-slate-200 truncate">
                {v.name}
              </span>
            </div>

            <p className="text-[11px] text-slate-400 line-clamp-1">
              {v.mood}
            </p>

            {/* Color Swatch Dots */}
            <div className="flex items-center gap-1 mt-2">
              {v.palette.colorList.slice(0, 4).map((c, idx) => (
                <span
                  key={idx}
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: `rgb(${c.join(',')})` }}
                />
              ))}
            </div>
          </button>
        );
      })}
    </div>
  );
};
