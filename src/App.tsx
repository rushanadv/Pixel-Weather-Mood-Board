import { useState, useEffect, useRef, useCallback } from 'react';
import { WeatherCanvas } from './components/WeatherCanvas';
import { ControlPanel } from './components/ControlPanel';
import { StatsOverlay } from './components/StatsOverlay';
import { CanvasSettings, LiveWeatherData, VibeType } from './types';
import { VIBE_CONFIGS } from './data/vibes';
import { ambientSynth } from './audio/ambientSynth';
import { Sparkles, Eye, EyeOff, Info, X } from 'lucide-react';

const DEFAULT_SETTINGS: CanvasSettings = {
  vibe: 'calm-breeze',
  intensity: 35,
  chaos: 20,
  isBreathing: true,
  breatheSpeed: 1.0,
  particleCount: 1600,
  trailPersistence: 14,
  interactionMode: 'flow',
  isSoundEnabled: false,
  soundVolume: 0.5,
  showHUD: true,
  colorShift: 0,
};

export default function App() {
  const [settings, setSettings] = useState<CanvasSettings>(DEFAULT_SETTINGS);
  const [fps, setFps] = useState<number>(60);
  const [activeParticles, setActiveParticles] = useState<number>(1600);
  const [breatheVal, setBreatheVal] = useState<number>(0);
  const [liveWeather, setLiveWeather] = useState<LiveWeatherData | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showInfoModal, setShowInfoModal] = useState<boolean>(false);
  const exportFnRef = useRef<(() => void) | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 3200);
  }, []);

  const handleUpdateSettings = useCallback(
    (updater: Partial<CanvasSettings> | ((prev: CanvasSettings) => CanvasSettings)) => {
      setSettings((prev) => {
        if (typeof updater === 'function') {
          return updater(prev);
        }
        return { ...prev, ...updater };
      });
    },
    []
  );

  // Sync ambient sound generator
  useEffect(() => {
    if (settings.isSoundEnabled) {
      ambientSynth.start(settings.vibe, settings.soundVolume);
    } else {
      ambientSynth.stop();
    }
  }, [settings.isSoundEnabled]);

  useEffect(() => {
    if (settings.isSoundEnabled) {
      ambientSynth.setVibe(settings.vibe);
    }
  }, [settings.vibe, settings.isSoundEnabled]);

  useEffect(() => {
    if (settings.isSoundEnabled) {
      ambientSynth.setVolume(settings.soundVolume);
    }
  }, [settings.soundVolume, settings.isSoundEnabled]);

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.code === 'Space') {
        e.preventDefault();
        handleUpdateSettings((prev) => ({ isBreathing: !prev.isBreathing }));
        showToast(`Breathe Modulator ${!settings.isBreathing ? 'Activated' : 'Paused'}`);
      } else if (e.key === '1') {
        handleUpdateSettings({ vibe: 'calm-breeze', intensity: 35, chaos: 20 });
      } else if (e.key === '2') {
        handleUpdateSettings({ vibe: 'electric-storm', intensity: 78, chaos: 72 });
      } else if (e.key === '3') {
        handleUpdateSettings({ vibe: 'melancholy-rain', intensity: 45, chaos: 15 });
      } else if (e.key === '4') {
        handleUpdateSettings({ vibe: 'radiant-heat', intensity: 60, chaos: 40 });
      } else if (e.key === '5') {
        handleUpdateSettings({ vibe: 'aurora-borealis', intensity: 42, chaos: 28 });
      } else if (e.key.toLowerCase() === 'h') {
        handleUpdateSettings((prev) => ({ showHUD: !prev.showHUD }));
      } else if (e.key.toLowerCase() === 'm') {
        handleUpdateSettings((prev) => ({ isSoundEnabled: !prev.isSoundEnabled }));
      } else if (e.key.toLowerCase() === 's') {
        handleExportScreenshot();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUpdateSettings, settings.isBreathing, showToast]);

  const handleExportScreenshot = () => {
    if (exportFnRef.current) {
      exportFnRef.current();
      showToast('Generative artwork snapshot saved as PNG');
    }
  };

  const handleResetDefaults = () => {
    setSettings(DEFAULT_SETTINGS);
    setLiveWeather(null);
    showToast('Reset to default Calm Breeze settings');
  };

  const currentVibeConfig = VIBE_CONFIGS[settings.vibe] || VIBE_CONFIGS['calm-breeze'];

  return (
    <main
      id="weather-mood-visualizer-root"
      className="relative w-screen h-screen overflow-hidden bg-black select-none font-sans"
    >
      {/* 1. Full-Viewport Generative Canvas Layer */}
      <WeatherCanvas
        settings={settings}
        onTelemetryUpdate={(currFps, count, bVal) => {
          setFps(currFps);
          setActiveParticles(count);
          setBreatheVal(bVal);
        }}
        onExportReady={(fn) => {
          exportFnRef.current = fn;
        }}
      />

      {/* 2. Zen Mode HUD Visibility Toggle (Top Left) */}
      <div className="fixed top-4 left-4 z-30 flex items-center gap-2">
        <button
          id="btn-toggle-hud"
          onClick={() => handleUpdateSettings((prev) => ({ showHUD: !prev.showHUD }))}
          className="p-2.5 rounded-xl bg-slate-950/80 backdrop-blur-md border border-slate-800/80 text-slate-300 hover:text-slate-100 hover:bg-slate-900 transition-all shadow-lg flex items-center gap-2 text-xs font-medium cursor-pointer"
          title="Toggle Zen UI Mode (Key: H)"
        >
          {settings.showHUD ? (
            <>
              <EyeOff className="w-4 h-4 text-slate-400" />
              <span className="hidden sm:inline">Zen View</span>
            </>
          ) : (
            <>
              <Eye className="w-4 h-4 text-cyan-400" />
              <span className="hidden sm:inline">Show Controls</span>
            </>
          )}
        </button>

        {settings.showHUD && (
          <button
            id="btn-open-info"
            onClick={() => setShowInfoModal(true)}
            className="p-2.5 rounded-xl bg-slate-950/80 backdrop-blur-md border border-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-900 transition-all shadow-lg text-xs cursor-pointer"
            title="About Generative Art & Shortcuts"
          >
            <Info className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* 3. Floating Control Panel (Top Right) */}
      {settings.showHUD && (
        <ControlPanel
          settings={settings}
          onUpdateSettings={handleUpdateSettings}
          onExportScreenshot={handleExportScreenshot}
          onResetDefaults={handleResetDefaults}
          liveWeather={liveWeather}
          onLiveWeatherSynced={(weather) => {
            setLiveWeather(weather);
            showToast(`Synced ${weather.cityName} weather (${weather.temperature}°C)`);
          }}
        />
      )}

      {/* 4. Bottom Left Telemetry & Mood Details */}
      {settings.showHUD && (
        <StatsOverlay
          fps={fps}
          particleCount={activeParticles}
          breatheVal={breatheVal}
          isBreathing={settings.isBreathing}
          intensity={settings.intensity}
          chaos={settings.chaos}
          currentVibeConfig={currentVibeConfig}
        />
      )}

      {/* 5. Minimalist Ambient Breathing Ring Indicator (Bottom Right) */}
      {settings.isBreathing && (
        <div className="pointer-events-none fixed bottom-4 right-4 z-20 flex items-center gap-2 bg-slate-950/60 backdrop-blur-md border border-slate-800/60 px-3 py-1.5 rounded-full text-[11px] text-slate-300 font-mono">
          <span
            className="w-2.5 h-2.5 rounded-full transition-transform duration-300"
            style={{
              backgroundColor: currentVibeConfig.palette.primary,
              transform: `scale(${1 + (breatheVal + 1) * 0.4})`,
              boxShadow: `0 0 10px ${currentVibeConfig.palette.primary}`,
            }}
          />
          <span>Breathe Cycle {breatheVal > 0 ? 'Exhale' : 'Inhale'}</span>
        </div>
      )}

      {/* 6. Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed bottom-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl bg-slate-900/90 text-cyan-300 border border-cyan-500/40 backdrop-blur-lg shadow-2xl text-xs font-medium flex items-center gap-2 animate-fade-in">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 7. Info / Keyboard Shortcuts Modal */}
      {showInfoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-2xl text-slate-200">
            <button
              onClick={() => setShowInfoModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-900 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <h2 className="text-base font-semibold text-slate-100 mb-1 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              Real-Time Weather Mood Visualizer
            </h2>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              An abstract generative art piece that breathes and shifts dynamically with meteorological and emotional atmospheres using Perlin noise flow fields, kinetic particle physics, and smooth interpolation.
            </p>

            <div className="space-y-3 text-xs mb-5">
              <div className="font-semibold text-slate-300 uppercase tracking-wider text-[10px]">
                Interactive Keybindings
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800/80 flex items-center justify-between">
                  <span className="text-slate-400">Spacebar</span>
                  <span className="text-cyan-300">Breathe Mode</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800/80 flex items-center justify-between">
                  <span className="text-slate-400">Keys 1 – 5</span>
                  <span className="text-cyan-300">Switch Vibes</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800/80 flex items-center justify-between">
                  <span className="text-slate-400">Key H</span>
                  <span className="text-cyan-300">Toggle Zen HUD</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800/80 flex items-center justify-between">
                  <span className="text-slate-400">Key M</span>
                  <span className="text-cyan-300">Ambient Synth</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800/80 flex items-center justify-between">
                  <span className="text-slate-400">Key S</span>
                  <span className="text-cyan-300">Save PNG Snap</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800/80 flex items-center justify-between">
                  <span className="text-slate-400">Mouse Drag</span>
                  <span className="text-cyan-300">Vortex & Forces</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowInfoModal(false)}
              className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              Enter Experience
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
