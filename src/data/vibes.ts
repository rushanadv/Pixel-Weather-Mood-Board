import { VibeConfig, VibeType } from '../types';

export const VIBE_CONFIGS: Record<VibeType, VibeConfig> = {
  'calm-breeze': {
    id: 'calm-breeze',
    name: 'Calm Breeze',
    mood: 'Tranquil & Flowing',
    tagline: 'Horizontal Perlin streams drifting in ocean serenity',
    description: 'Smooth Perlin noise flow fields. Particles drift softly in sweeping horizontal curves with ethereal mint and teal luminosity.',
    palette: {
      primary: '#2dd4bf', // teal-400
      secondary: '#38bdf8', // sky-400
      accent: '#6ee7b7', // emerald-300
      background: '#04171a',
      colorList: [
        [45, 212, 191],   // Teal
        [56, 189, 248],   // Soft Blue
        [110, 231, 183],  // Mint Green
        [14, 165, 233],   // Sky Blue
        [167, 243, 208],  // Pale Mint
      ],
    },
    defaultIntensity: 35,
    defaultChaos: 20,
    baseSpeed: 1.8,
    trailAlpha: 14,
  },
  'electric-storm': {
    id: 'electric-storm',
    name: 'Electric Storm',
    mood: 'Anxious & Energetic',
    tagline: 'Jagged ionized paths, lightning arcs and erratic kinetic pulses',
    description: 'High velocity jagged trajectories with sharp acute turns, sudden discharge bursts, and thunderous canvas-wide lightning flash pulses.',
    palette: {
      primary: '#a855f7', // purple-500
      secondary: '#facc15', // yellow-400
      accent: '#f8fafc', // white
      background: '#090514',
      colorList: [
        [168, 85, 247],   // Deep Purple
        [250, 204, 21],   // Neon Yellow
        [248, 250, 252],  // Stark White
        [192, 132, 252],  // Violet
        [254, 240, 138],  // Bright Yellow
      ],
    },
    defaultIntensity: 78,
    defaultChaos: 72,
    baseSpeed: 4.5,
    trailAlpha: 25,
  },
  'melancholy-rain': {
    id: 'melancholy-rain',
    name: 'Melancholy Rain',
    mood: 'Somber & Reflective',
    tagline: 'Gravity-driven streaks cascading with liquid splash impacts',
    description: 'Vertical gravity-driven raindrops accelerating downward, forming reflective pooling trails and delicate splash rings upon impact.',
    palette: {
      primary: '#94a3b8', // slate-400
      secondary: '#64748b', // slate-500
      accent: '#cbd5e1', // silver/slate-300
      background: '#090c10',
      colorList: [
        [148, 163, 184],  // Slate Gray
        [100, 116, 139],  // Muted Slate
        [203, 213, 225],  // Silver Blue
        [71, 85, 105],    // Dark Slate
        [226, 232, 240],  // Frosted White
      ],
    },
    defaultIntensity: 45,
    defaultChaos: 15,
    baseSpeed: 3.2,
    trailAlpha: 20,
  },
  'radiant-heat': {
    id: 'radiant-heat',
    name: 'Radiant Heat',
    mood: 'Joyful & Expansive',
    tagline: 'Outward radial thermal blooms shimmering with solar warmth',
    description: 'Concentric thermal waves radiating outward from the core with shimmering atmospheric refraction, vibrant embers, and solar warmth.',
    palette: {
      primary: '#f97316', // orange-500
      secondary: '#ef4444', // red-500
      accent: '#fde047', // yellow-300
      background: '#150604',
      colorList: [
        [249, 115, 22],   // Warm Orange
        [239, 68, 68],    // Crimson
        [253, 224, 71],   // Bright Golden Yellow
        [251, 146, 60],   // Amber
        [254, 202, 202],  // Solar White-Pink
      ],
    },
    defaultIntensity: 60,
    defaultChaos: 40,
    baseSpeed: 2.8,
    trailAlpha: 18,
  },
  'aurora-borealis': {
    id: 'aurora-borealis',
    name: 'Aurora Borealis',
    mood: 'Mystic & Ethereal',
    tagline: 'Ribbons of geomagnetic ionization undulating across the night',
    description: 'Curving magnetic folds of emerald, indigo, and violet undulating gracefully like polar curtains under deep stellar silence.',
    palette: {
      primary: '#10b981', // emerald-500
      secondary: '#8b5cf6', // violet-500
      accent: '#34d399', // emerald-400
      background: '#020617',
      colorList: [
        [16, 185, 129],   // Emerald
        [139, 92, 246],   // Violet
        [52, 211, 153],   // Mint Glow
        [99, 102, 241],   // Indigo
        [216, 180, 254],  // Lilac
      ],
    },
    defaultIntensity: 42,
    defaultChaos: 28,
    baseSpeed: 2.0,
    trailAlpha: 12,
  },
};
