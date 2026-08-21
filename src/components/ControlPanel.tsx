import React, { useState } from 'react';
import { CanvasSettings, VibeType, LiveWeatherData } from '../types';
import { VIBE_CONFIGS } from '../data/vibes';
import { VibeSelector } from './VibeSelector';
import {
  Sliders,
  Waves,
  Sparkles,
  Volume2,
  VolumeX,
  Camera,
  Maximize2,
  Minimize2,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  CloudSun,
  MousePointer,
  Radio,
  Search,
  MapPin,
  Loader2,
} from 'lucide-react';
import { fetchLiveWeatherByCity, fetchLiveWeatherByCoords } from '../utils/weatherApi';

interface ControlPanelProps {
  settings: CanvasSettings;
  onUpdateSettings: (updater: Partial<CanvasSettings> | ((prev: CanvasSettings) => CanvasSettings)) => void;
  onExportScreenshot: () => void;
  onResetDefaults: () => void;
  liveWeather: LiveWeatherData | null;
  onLiveWeatherSynced: (data: LiveWeatherData) => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  settings,
  onUpdateSettings,
  onExportScreenshot,
  onResetDefaults,
  liveWeather,
  onLiveWeatherSynced,
}) => {
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'mood' | 'physics' | 'live'>('mood');
  const [cityQuery, setCityQuery] = useState<string>('');
  const [isLoadingWeather, setIsLoadingWeather] = useState<boolean>(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);

  const currentConfig = VIBE_CONFIGS[settings.vibe];

  const handleVibeChange = (newVibe: VibeType) => {
    const nextCfg = VIBE_CONFIGS[newVibe];
    onUpdateSettings({
      vibe: newVibe,
      intensity: nextCfg.defaultIntensity,
      chaos: nextCfg.defaultChaos,
    });
  };

  const handleCitySearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cityQuery.trim()) return;
    setIsLoadingWeather(true);
    setWeatherError(null);
    try {
      const data = await fetchLiveWeatherByCity(cityQuery.trim());
      onLiveWeatherSynced(data);
      onUpdateSettings({
        vibe: data.mappedVibe,
        intensity: data.mappedIntensity,
        chaos: data.mappedChaos,
      });
      setCityQuery('');
    } catch (err: unknown) {
      setWeatherError(err instanceof Error ? err.message : 'Weather fetch error');
    } finally {
      setIsLoadingWeather(false);
    }
  };

  const handleGeoSync = () => {
    if (!navigator.geolocation) {
      setWeatherError('Geolocation not supported');
      return;
    }
    setIsLoadingWeather(true);
    setWeatherError(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const data = await fetchLiveWeatherByCoords(pos.coords.latitude, pos.coords.longitude);
          onLiveWeatherSynced(data);
          onUpdateSettings({
            vibe: data.mappedVibe,
            intensity: data.mappedIntensity,
            chaos: data.mappedChaos,
          });
        } catch (err: unknown) {
          setWeatherError(err instanceof Error ? err.message : 'Weather sync error');
        } finally {
          setIsLoadingWeather(false);
        }
      },
      () => {
        setWeatherError('Location permission denied or unavailable');
        setIsLoadingWeather(false);
      }
    );
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  return (
    <div
      id="floating-control-panel"
      className="fixed top-4 right-4 z-30 w-full max-w-sm sm:max-w-md transition-all duration-300 pointer-events-auto"
    >
      <div className="bg-slate-950/80 backdrop-blur-xl border border-slate-800/90 rounded-2xl shadow-2xl overflow-hidden text-slate-100 ring-1 ring-white/5">
        {/* Header bar */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-800/70 bg-slate-900/40">
          <div className="flex items-center gap-2.5">
            <div
              className="w-3 h-3 rounded-full shadow-lg"
              style={{
                backgroundColor: currentConfig.palette.primary,
                boxShadow: `0 0 12px ${currentConfig.palette.primary}`,
              }}
            />
            <div>
              <h1 className="text-sm font-semibold tracking-tight text-slate-100 flex items-center gap-1.5">
                Weather Mood Visualizer
              </h1>
              <p className="text-[11px] text-slate-400 font-mono">
                {currentConfig.mood}
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-1">
            <button
              id="btn-sound-toggle"
              onClick={() => onUpdateSettings({ isSoundEnabled: !settings.isSoundEnabled })}
              title={settings.isSoundEnabled ? 'Mute ambient synth' : 'Enable ambient synth'}
              className={`p-2 rounded-lg text-xs transition-colors cursor-pointer ${
                settings.isSoundEnabled
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              {settings.isSoundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            <button
              id="btn-export-screenshot"
              onClick={onExportScreenshot}
              title="Export high-res PNG artwork"
              className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 text-xs transition-colors cursor-pointer"
            >
              <Camera className="w-4 h-4" />
            </button>

            <button
              id="btn-fullscreen-toggle"
              onClick={toggleFullscreen}
              title="Toggle Fullscreen"
              className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 text-xs transition-colors cursor-pointer"
            >
              <Maximize2 className="w-4 h-4" />
            </button>

            <button
              id="btn-minimize-panel"
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 text-xs transition-colors cursor-pointer"
              title={isMinimized ? 'Expand panel' : 'Minimize panel'}
            >
              {isMinimized ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Panel Body */}
        {!isMinimized && (
          <div className="p-4 space-y-4 max-h-[82vh] overflow-y-auto custom-scrollbar">
            {/* Tab Navigation */}
            <div className="flex rounded-xl bg-slate-900/80 p-1 border border-slate-800/80 text-xs font-medium">
              <button
                id="tab-mood-btn"
                onClick={() => setActiveTab('mood')}
                className={`flex-1 py-1.5 px-2 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeTab === 'mood'
                    ? 'bg-slate-800 text-slate-100 shadow-sm border border-slate-700/60'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" /> Weather Moods
              </button>
              <button
                id="tab-physics-btn"
                onClick={() => setActiveTab('physics')}
                className={`flex-1 py-1.5 px-2 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeTab === 'physics'
                    ? 'bg-slate-800 text-slate-100 shadow-sm border border-slate-700/60'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" /> Generative Controls
              </button>
              <button
                id="tab-live-btn"
                onClick={() => setActiveTab('live')}
                className={`flex-1 py-1.5 px-2 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeTab === 'live'
                    ? 'bg-slate-800 text-slate-100 shadow-sm border border-slate-700/60'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <CloudSun className="w-3.5 h-3.5" /> Live Sync
              </button>
            </div>

            {/* TAB 1: MOOD SELECTOR & CORE SLIDERS */}
            {activeTab === 'mood' && (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                      Select Weather Mood
                    </label>
                    <span className="text-[11px] text-cyan-400 font-mono">
                      {currentConfig.name}
                    </span>
                  </div>
                  <VibeSelector
                    currentVibe={settings.vibe}
                    onSelectVibe={handleVibeChange}
                  />
                </div>

                {/* Intensity Slider */}
                <div className="space-y-2 bg-slate-900/40 p-3 rounded-xl border border-slate-800/60">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                      Intensity / Strength
                    </span>
                    <span className="font-mono text-cyan-400 font-medium">
                      {settings.intensity}%
                    </span>
                  </div>
                  <input
                    id="slider-intensity"
                    type="range"
                    min="1"
                    max="100"
                    value={settings.intensity}
                    onChange={(e) => onUpdateSettings({ intensity: Number(e.target.value) })}
                    className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>Gentle (1%)</span>
                    <span>Moderate (50%)</span>
                    <span>Violent (100%)</span>
                  </div>
                </div>

                {/* Chaos / Entropy Slider */}
                <div className="space-y-2 bg-slate-900/40 p-3 rounded-xl border border-slate-800/60">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      Chaos / Entropy
                    </span>
                    <span className="font-mono text-amber-400 font-medium">
                      {settings.chaos}%
                    </span>
                  </div>
                  <input
                    id="slider-chaos"
                    type="range"
                    min="0"
                    max="100"
                    value={settings.chaos}
                    onChange={(e) => onUpdateSettings({ chaos: Number(e.target.value) })}
                    className="w-full accent-amber-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>Harmonic (0%)</span>
                    <span>Turbulent (50%)</span>
                    <span>Stochastic (100%)</span>
                  </div>
                </div>

                {/* Breathe Auto-Modulator Toggle */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`p-2 rounded-lg transition-colors ${
                        settings.isBreathing
                          ? 'bg-cyan-500/20 text-cyan-300'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      <Waves className={`w-4 h-4 ${settings.isBreathing ? 'animate-pulse' : ''}`} />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-200">
                        Breathe Auto-Modulator
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Sine-wave oscillation simulating breathing
                      </div>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      id="toggle-breathe"
                      type="checkbox"
                      checked={settings.isBreathing}
                      onChange={(e) => onUpdateSettings({ isBreathing: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-500" />
                  </label>
                </div>
              </div>
            )}

            {/* TAB 2: GENERATIVE PHYSICS & INTERACTION */}
            {activeTab === 'physics' && (
              <div className="space-y-4">
                {/* Particle Count Density */}
                <div className="space-y-2 bg-slate-900/40 p-3 rounded-xl border border-slate-800/60">
                  <label className="text-xs font-semibold text-slate-300 block">
                    Particle Density
                  </label>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    {[
                      { label: 'Zen (800)', val: 800 },
                      { label: 'Balanced (1600)', val: 1600 },
                      { label: 'Dense (2800)', val: 2800 },
                    ].map((opt) => (
                      <button
                        key={opt.val}
                        onClick={() => onUpdateSettings({ particleCount: opt.val })}
                        className={`py-1.5 px-2 rounded-lg border text-center transition-all cursor-pointer ${
                          settings.particleCount === opt.val
                            ? 'bg-slate-800 border-cyan-400/50 text-cyan-300 font-medium'
                            : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:bg-slate-800'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Trail Persistence */}
                <div className="space-y-2 bg-slate-900/40 p-3 rounded-xl border border-slate-800/60">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-300">Trail Persistence</span>
                    <span className="font-mono text-slate-400">{settings.trailPersistence}</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="45"
                    value={settings.trailPersistence}
                    onChange={(e) => onUpdateSettings({ trailPersistence: Number(e.target.value) })}
                    className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>Long Ethereal Trails</span>
                    <span>Crisp Particles</span>
                  </div>
                </div>

                {/* Mouse Interaction Mode */}
                <div className="space-y-2 bg-slate-900/40 p-3 rounded-xl border border-slate-800/60">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
                    <MousePointer className="w-3.5 h-3.5 text-cyan-400" />
                    Interactive Cursor Field (Click & Drag)
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {[
                      { id: 'flow', label: 'Vortex Swirl' },
                      { id: 'repel', label: 'Repel Blast' },
                      { id: 'attract', label: 'Graviton Attract' },
                      { id: 'burst', label: 'Spark Generator' },
                    ].map((mode) => (
                      <button
                        key={mode.id}
                        onClick={() => onUpdateSettings({ interactionMode: mode.id as CanvasSettings['interactionMode'] })}
                        className={`py-1.5 px-2 rounded-lg border text-left transition-all cursor-pointer ${
                          settings.interactionMode === mode.id
                            ? 'bg-slate-800 border-cyan-400/50 text-cyan-300 font-medium'
                            : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:bg-slate-800'
                        }`}
                      >
                        {mode.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Ambient Sound Volume */}
                {settings.isSoundEnabled && (
                  <div className="space-y-2 bg-slate-900/40 p-3 rounded-xl border border-slate-800/60">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                        <Volume2 className="w-3.5 h-3.5 text-cyan-400" /> Ambient Drone Volume
                      </span>
                      <span className="font-mono text-cyan-400 font-medium">
                        {Math.round(settings.soundVolume * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.05"
                      max="1.0"
                      step="0.05"
                      value={settings.soundVolume}
                      onChange={(e) => onUpdateSettings({ soundVolume: Number(e.target.value) })}
                      className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                    />
                  </div>
                )}

                {/* Reset Defaults */}
                <button
                  onClick={onResetDefaults}
                  className="w-full py-2 px-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 text-xs font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Reset Default Settings
                </button>
              </div>
            )}

            {/* TAB 3: LIVE REAL-TIME WEATHER SYNC */}
            {activeTab === 'live' && (
              <div className="space-y-3">
                <p className="text-xs text-slate-300 leading-relaxed">
                  Map live meteorological telemetry (temperature, wind speed, precipitation) from any city directly into the generative mood algorithm.
                </p>

                {/* Search City form */}
                <form onSubmit={handleCitySearch} className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="e.g. Kyoto, Reykjavik, Miami..."
                      value={cityQuery}
                      onChange={(e) => setCityQuery(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isLoadingWeather || !cityQuery.trim()}
                    className="px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs font-medium transition-colors cursor-pointer flex items-center gap-1"
                  >
                    {isLoadingWeather ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Fetch'}
                  </button>
                </form>

                {/* Current Location Button */}
                <button
                  onClick={handleGeoSync}
                  disabled={isLoadingWeather}
                  className="w-full py-2 px-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-slate-100 hover:bg-slate-800/80 text-xs font-medium transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                  Auto-Detect My Local Weather
                </button>

                {/* Error Banner */}
                {weatherError && (
                  <div className="p-2.5 rounded-xl bg-rose-950/50 border border-rose-800/50 text-rose-300 text-xs">
                    {weatherError}
                  </div>
                )}

                {/* Live Weather Synced Card */}
                {liveWeather && (
                  <div className="p-3 rounded-xl bg-slate-900/90 border border-cyan-500/30 text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-200 flex items-center gap-1">
                        <Radio className="w-3 h-3 text-emerald-400 animate-ping" />
                        {liveWeather.cityName}
                      </span>
                      <span className="font-mono text-cyan-300 text-sm font-bold">
                        {liveWeather.temperature}°C
                      </span>
                    </div>
                    <p className="text-slate-400 text-[11px]">{liveWeather.condition}</p>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800/60 font-mono">
                      <span>Wind: {liveWeather.windSpeed} km/h</span>
                      <span>Humidity: {liveWeather.humidity}%</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
