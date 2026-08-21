export type VibeType = 'calm-breeze' | 'electric-storm' | 'melancholy-rain' | 'radiant-heat' | 'aurora-borealis';

export interface VibeConfig {
  id: VibeType;
  name: string;
  mood: string;
  description: string;
  tagline: string;
  palette: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    colorList: [number, number, number][]; // RGB colors for p5
  };
  defaultIntensity: number;
  defaultChaos: number;
  baseSpeed: number;
  trailAlpha: number;
}

export interface CanvasSettings {
  vibe: VibeType;
  intensity: number; // 1 - 100
  chaos: number; // 0 - 100
  isBreathing: boolean;
  breatheSpeed: number; // rate of breathing cycle
  particleCount: number; // e.g. 1500
  trailPersistence: number; // 1 - 50 (alpha of trail background)
  interactionMode: 'attract' | 'repel' | 'burst' | 'flow';
  isSoundEnabled: boolean;
  soundVolume: number; // 0 - 1
  showHUD: boolean;
  colorShift: number; // 0 - 360 hue rotation
}

export interface LiveWeatherData {
  cityName: string;
  temperature: number;
  condition: string;
  windSpeed: number;
  humidity: number;
  mappedVibe: VibeType;
  mappedIntensity: number;
  mappedChaos: number;
}
