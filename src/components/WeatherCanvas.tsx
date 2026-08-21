import React, { useEffect, useRef } from 'react';
import p5 from 'p5';
import { CanvasSettings, VibeType } from '../types';
import { VIBE_CONFIGS } from '../data/vibes';
import { ambientSynth } from '../audio/ambientSynth';

interface WeatherCanvasProps {
  settings: CanvasSettings;
  onTelemetryUpdate?: (fps: number, activeParticles: number, breatheVal: number) => void;
  onExportReady?: (exportFn: () => void) => void;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  baseSize: number;
  colorIdx: number;
  alpha: number;
  life: number;
  maxLife: number;
  history: { x: number; y: number }[];
  angle: number;
  angularSpeed: number;
}

interface SplashRipple {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
  color: [number, number, number];
}

interface LightningBolt {
  segments: { x1: number; y1: number; x2: number; y2: number; alpha: number }[];
  life: number;
}

export const WeatherCanvas: React.FC<WeatherCanvasProps> = ({
  settings,
  onTelemetryUpdate,
  onExportReady,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const p5InstanceRef = useRef<p5 | null>(null);
  const settingsRef = useRef<CanvasSettings>(settings);

  // Keep settings ref fresh for the p5 loop without recreating canvas
  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  useEffect(() => {
    if (!containerRef.current) return;

    // Clean up previous instance if any
    if (p5InstanceRef.current) {
      p5InstanceRef.current.remove();
      p5InstanceRef.current = null;
    }

    const sketch = (p: p5) => {
      let particles: Particle[] = [];
      let splashes: SplashRipple[] = [];
      let lightnings: LightningBolt[] = [];

      // Lerping state variables
      let currentIntensity = settingsRef.current.intensity;
      let currentChaos = settingsRef.current.chaos;
      let currentVibe: VibeType = settingsRef.current.vibe;
      let currentSpeed = VIBE_CONFIGS[currentVibe].baseSpeed;
      let currentTrailAlpha = VIBE_CONFIGS[currentVibe].trailAlpha;
      let currentColors = VIBE_CONFIGS[currentVibe].palette.colorList;

      let breathePhase = 0;
      let noiseZ = 0;
      let lightningFlashAlpha = 0;
      let lastLightningTime = 0;

      const createParticle = (customX?: number, customY?: number): Particle => {
        const x = customX !== undefined ? customX : p.random(p.width);
        const y = customY !== undefined ? customY : p.random(p.height);
        const size = p.random(1.5, 4.5);
        return {
          x,
          y,
          vx: p.random(-1, 1),
          vy: p.random(-1, 1),
          size,
          baseSize: size,
          colorIdx: Math.floor(p.random(currentColors.length)),
          alpha: p.random(140, 255),
          life: p.random(0, 100),
          maxLife: p.random(120, 300),
          history: [],
          angle: p.random(p.TWO_PI),
          angularSpeed: p.random(-0.08, 0.08),
        };
      };

      const initParticles = (count: number) => {
        particles = [];
        for (let i = 0; i < count; i++) {
          particles.push(createParticle());
        }
      };

      const spawnLightning = (startX: number, startY: number, targetX?: number, targetY?: number) => {
        const segments: { x1: number; y1: number; x2: number; y2: number; alpha: number }[] = [];
        let currX = startX;
        let currY = startY;
        const endX = targetX !== undefined ? targetX : p.random(p.width * 0.1, p.width * 0.9);
        const endY = targetY !== undefined ? targetY : p.random(p.height * 0.6, p.height);

        const steps = Math.floor(p.random(8, 16));
        const dx = (endX - currX) / steps;
        const dy = (endY - currY) / steps;

        for (let i = 0; i < steps; i++) {
          const nextX = currX + dx + p.random(-35, 35);
          const nextY = currY + dy + p.random(-10, 20);
          segments.push({
            x1: currX,
            y1: currY,
            x2: nextX,
            y2: nextY,
            alpha: 255,
          });

          // Branching bolt
          if (p.random() < 0.35 && i > 1) {
            const branchLen = p.random(25, 60);
            const branchAngle = p.random(-p.PI * 0.6, p.PI * 0.6);
            segments.push({
              x1: currX,
              y1: currY,
              x2: currX + Math.cos(branchAngle) * branchLen,
              y2: currY + Math.sin(branchAngle) * branchLen,
              alpha: 180,
            });
          }

          currX = nextX;
          currY = nextY;
        }

        lightnings.push({ segments, life: 12 });
        lightningFlashAlpha = p.random(110, 200);

        if (settingsRef.current.isSoundEnabled) {
          ambientSynth.triggerLightningStrike();
        }
      };

      p.setup = () => {
        const container = containerRef.current;
        const w = container ? container.clientWidth : window.innerWidth;
        const h = container ? container.clientHeight : window.innerHeight;
        const canvas = p.createCanvas(w, h);
        canvas.id('generative-weather-canvas');
        p.frameRate(60);
        p.background(0);

        initParticles(settingsRef.current.particleCount);

        // Expose snapshot export
        if (onExportReady) {
          onExportReady(() => {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
            p.saveCanvas(`weather-mood-${settingsRef.current.vibe}-${timestamp}`, 'png');
          });
        }
      };

      p.windowResized = () => {
        if (!containerRef.current) return;
        p.resizeCanvas(containerRef.current.clientWidth, containerRef.current.clientHeight);
      };

      p.draw = () => {
        const cfg = settingsRef.current;
        const vibeCfg = VIBE_CONFIGS[cfg.vibe];

        // Smooth state interpolation
        currentIntensity = p.lerp(currentIntensity, cfg.intensity, 0.05);
        currentChaos = p.lerp(currentChaos, cfg.chaos, 0.05);
        currentSpeed = p.lerp(currentSpeed, vibeCfg.baseSpeed * (currentIntensity / 45), 0.05);
        currentTrailAlpha = p.lerp(currentTrailAlpha, cfg.trailPersistence || vibeCfg.trailAlpha, 0.05);

        // Breathe Modulation
        let effectiveIntensity = currentIntensity;
        let breatheVal = 0;
        if (cfg.isBreathing) {
          breathePhase += 0.02 * (cfg.breatheSpeed || 1.0);
          breatheVal = Math.sin(breathePhase);
          const modulationAmp = 22 * (currentIntensity / 70);
          effectiveIntensity = p.constrain(currentIntensity + breatheVal * modulationAmp, 5, 100);
        }

        // Handle target color lerping
        currentColors = vibeCfg.palette.colorList;

        // Dynamic Particle Pool adjustments
        if (particles.length !== cfg.particleCount) {
          if (particles.length < cfg.particleCount) {
            const diff = cfg.particleCount - particles.length;
            for (let i = 0; i < diff; i++) {
              particles.push(createParticle());
            }
          } else if (particles.length > cfg.particleCount) {
            particles.splice(cfg.particleCount);
          }
        }

        // Trails Background Clear
        // Dynamic background tint blending
        p.noStroke();
        p.fill(3, 5, 9, currentTrailAlpha);
        p.rect(0, 0, p.width, p.height);

        // Lightning flash overlay for electric storm
        if (cfg.vibe === 'electric-storm') {
          const now = p.millis();
          const strikeInterval = p.map(effectiveIntensity, 1, 100, 7000, 1500);
          if (now - lastLightningTime > strikeInterval + p.random(-800, 1200)) {
            spawnLightning(p.random(p.width * 0.2, p.width * 0.8), 0);
            lastLightningTime = now;
          }
        }

        // Draw lightning bolts
        for (let i = lightnings.length - 1; i >= 0; i--) {
          const bolt = lightnings[i];
          p.strokeWeight(p.map(bolt.life, 0, 12, 1, 3.5));
          for (const seg of bolt.segments) {
            p.stroke(245, 245, 255, (bolt.life / 12) * seg.alpha);
            p.line(seg.x1, seg.y1, seg.x2, seg.y2);
          }
          bolt.life -= 1;
          if (bolt.life <= 0) {
            lightnings.splice(i, 1);
          }
        }

        // Lightning flash screen glow
        if (lightningFlashAlpha > 0) {
          p.fill(210, 190, 255, lightningFlashAlpha * 0.35);
          p.rect(0, 0, p.width, p.height);
          lightningFlashAlpha *= 0.82;
        }

        // Update noise phase
        noiseZ += 0.003 * (effectiveIntensity / 40);

        // Interaction coordinates
        const isMouseInside = p.mouseX >= 0 && p.mouseX <= p.width && p.mouseY >= 0 && p.mouseY <= p.height;
        const mouseX = p.mouseX;
        const mouseY = p.mouseY;

        // Render Splashes (Melancholy Rain)
        for (let i = splashes.length - 1; i >= 0; i--) {
          const splash = splashes[i];
          p.noFill();
          p.stroke(splash.color[0], splash.color[1], splash.color[2], splash.alpha);
          p.strokeWeight(1.2);
          p.ellipse(splash.x, splash.y, splash.radius * 2, splash.radius * 0.7);
          splash.radius += 0.9 + (effectiveIntensity / 80);
          splash.alpha -= 8;
          if (splash.alpha <= 0 || splash.radius >= splash.maxRadius) {
            splashes.splice(i, 1);
          }
        }

        // Particle System Loop
        const centerX = p.width / 2;
        const centerY = p.height / 2;

        for (let i = 0; i < particles.length; i++) {
          const pt = particles[i];
          pt.life++;

          // Mouse Attraction / Repulsion physics
          if (isMouseInside && p.mouseIsPressed) {
            const d = p.dist(pt.x, pt.y, mouseX, mouseY);
            if (d < 220 && d > 2) {
              const force = (1 - d / 220) * 4.0;
              const angleToMouse = p.atan2(mouseY - pt.y, mouseX - pt.x);

              if (cfg.interactionMode === 'attract') {
                pt.vx += Math.cos(angleToMouse) * force * 0.8;
                pt.vy += Math.sin(angleToMouse) * force * 0.8;
              } else if (cfg.interactionMode === 'repel') {
                pt.vx -= Math.cos(angleToMouse) * force * 1.5;
                pt.vy -= Math.sin(angleToMouse) * force * 1.5;
              } else if (cfg.interactionMode === 'flow') {
                // Swirl vortex
                pt.vx += Math.cos(angleToMouse + p.HALF_PI) * force * 1.2;
                pt.vy += Math.sin(angleToMouse + p.HALF_PI) * force * 1.2;
              }
            }
          }

          // VIBE SPECIFIC GENERATIVE ALGORITHMS
          switch (cfg.vibe) {
            case 'calm-breeze': {
              // Smooth Perlin flow field with horizontal oceanic drift
              const nScale = 0.0025;
              const nVal = p.noise(pt.x * nScale, pt.y * nScale, noiseZ);
              const flowAngle = p.map(nVal, 0, 1, -p.PI * 0.6, p.PI * 0.6);
              const chaosFactor = currentChaos / 100;

              const targetVx = (Math.cos(flowAngle) + 0.95) * currentSpeed + (p.random(-1, 1) * chaosFactor * 1.5);
              const targetVy = Math.sin(flowAngle) * (currentSpeed * 0.6) + (p.random(-1, 1) * chaosFactor * 1.2);

              pt.vx = p.lerp(pt.vx, targetVx, 0.08);
              pt.vy = p.lerp(pt.vy, targetVy, 0.08);
              break;
            }

            case 'electric-storm': {
              // Erratic jagged motion with sudden angular breaks
              const chaosFactor = currentChaos / 100;
              if (p.random() < 0.06 + chaosFactor * 0.12) {
                const snapAngles = [0, p.PI * 0.25, p.PI * 0.5, p.PI * 0.75, p.PI, -p.PI * 0.5, -p.PI * 0.25];
                pt.angle = snapAngles[Math.floor(p.random(snapAngles.length))];
                const burstSpd = currentSpeed * p.random(1.2, 2.6);
                pt.vx = Math.cos(pt.angle) * burstSpd;
                pt.vy = Math.sin(pt.angle) * burstSpd;
              } else {
                pt.vx += (p.random(-1, 1) * chaosFactor * 2.0);
                pt.vy += (p.random(-1, 1) * chaosFactor * 2.0) + (effectiveIntensity / 140);
              }
              pt.vx *= 0.96;
              pt.vy *= 0.96;
              break;
            }

            case 'melancholy-rain': {
              // Gravity driven vertical rainfall with splash ripples
              const gravity = 0.18 * (effectiveIntensity / 35);
              const rainWind = (p.noise(pt.x * 0.005, noiseZ) - 0.48) * 2.5 * (currentChaos / 50);

              pt.vx = p.lerp(pt.vx, rainWind, 0.1);
              pt.vy += gravity;
              if (pt.vy > currentSpeed * 2.2) {
                pt.vy = currentSpeed * 2.2;
              }

              // Splash condition when hitting bottom region
              if (pt.y >= p.height - p.random(5, 45)) {
                if (p.random() < 0.25 && splashes.length < 45) {
                  const col = currentColors[pt.colorIdx] || currentColors[0];
                  splashes.push({
                    x: pt.x,
                    y: pt.y,
                    radius: 2,
                    maxRadius: p.random(12, 28) * (effectiveIntensity / 40),
                    alpha: 190,
                    color: col,
                  });
                }
                pt.y = p.random(-40, 0);
                pt.x = p.random(p.width);
                pt.vy = p.random(2, 6);
              }
              break;
            }

            case 'radiant-heat': {
              // Concentric blooming radiation and heat convection shimmer
              const angleFromCenter = p.atan2(pt.y - centerY, pt.x - centerX);
              const distFromCenter = p.dist(pt.x, pt.y, centerX, centerY);
              const heatTurbulence = p.noise(pt.x * 0.008, pt.y * 0.008, noiseZ * 1.8) * p.TWO_PI * (currentChaos / 35);

              const outwardForce = p.map(distFromCenter, 0, p.width * 0.7, currentSpeed * 1.4, currentSpeed * 0.5);
              const shimmerX = Math.cos(angleFromCenter + heatTurbulence) * outwardForce;
              const shimmerY = Math.sin(angleFromCenter + heatTurbulence) * outwardForce - (0.4 * (effectiveIntensity / 40));

              pt.vx = p.lerp(pt.vx, shimmerX, 0.08);
              pt.vy = p.lerp(pt.vy, shimmerY, 0.08);
              break;
            }

            case 'aurora-borealis': {
              // Undulating magnetic ribbons
              const waveY = Math.sin(pt.x * 0.004 + noiseZ * 2) * 1.5;
              const waveX = Math.cos(pt.y * 0.003 + noiseZ) * 0.8;
              const nA = p.noise(pt.x * 0.003, pt.y * 0.002, noiseZ) * p.TWO_PI;

              pt.vx = p.lerp(pt.vx, (Math.cos(nA) + waveX) * currentSpeed, 0.07);
              pt.vy = p.lerp(pt.vy, (Math.sin(nA) + waveY) * (currentSpeed * 0.7), 0.07);
              break;
            }
          }

          // Apply displacement
          pt.x += pt.vx;
          pt.y += pt.vy;

          // Boundary Wrapping / Reset
          if (pt.x < -20) pt.x = p.width + 10;
          if (pt.x > p.width + 20) pt.x = -10;
          if (pt.y < -20) pt.y = p.height + 10;
          if (pt.y > p.height + 20) pt.y = -10;

          // Compute particle color & rendering
          const rgb = currentColors[pt.colorIdx] || currentColors[0];
          const dynamicSize = pt.baseSize * (0.7 + (effectiveIntensity / 120) * 0.7 + (cfg.isBreathing ? breatheVal * 0.25 : 0));

          // Draw particle
          p.noStroke();
          if (cfg.vibe === 'melancholy-rain') {
            // Raindrop streak
            p.stroke(rgb[0], rgb[1], rgb[2], pt.alpha * 0.85);
            p.strokeWeight(dynamicSize * 0.8);
            const streakLen = p.constrain(pt.vy * 2.5, 5, 24);
            p.line(pt.x, pt.y, pt.x - pt.vx * 1.5, pt.y - streakLen);
          } else if (cfg.vibe === 'electric-storm') {
            // Ionized spark glow
            p.fill(rgb[0], rgb[1], rgb[2], pt.alpha);
            p.circle(pt.x, pt.y, dynamicSize * 1.2);
            if (p.random() < 0.08) {
              p.stroke(255, 255, 255, 220);
              p.strokeWeight(1);
              p.line(pt.x, pt.y, pt.x + p.random(-8, 8), pt.y + p.random(-8, 8));
            }
          } else if (cfg.vibe === 'radiant-heat') {
            // Glowing radiant disk
            p.fill(rgb[0], rgb[1], rgb[2], pt.alpha * 0.8);
            p.circle(pt.x, pt.y, dynamicSize * 1.4);
            p.fill(255, 250, 220, pt.alpha * 0.9);
            p.circle(pt.x, pt.y, dynamicSize * 0.6);
          } else {
            // Soft floating orb / streamline
            p.fill(rgb[0], rgb[1], rgb[2], pt.alpha * 0.75);
            p.circle(pt.x, pt.y, dynamicSize);
          }
        }

        // Telemetry stream callback (debounced slightly via frameCount)
        if (onTelemetryUpdate && p.frameCount % 6 === 0) {
          onTelemetryUpdate(
            Math.round(p.frameRate()),
            particles.length,
            Number((breatheVal).toFixed(2))
          );
        }
      };

      p.mousePressed = () => {
        if (p.mouseX >= 0 && p.mouseX <= p.width && p.mouseY >= 0 && p.mouseY <= p.height) {
          if (settingsRef.current.interactionMode === 'burst') {
            // Spawn localized burst
            for (let k = 0; k < 40; k++) {
              const pNew = createParticle(p.mouseX, p.mouseY);
              const burstAng = p.random(p.TWO_PI);
              const burstSpd = p.random(4, 14);
              pNew.vx = Math.cos(burstAng) * burstSpd;
              pNew.vy = Math.sin(burstAng) * burstSpd;
              particles.push(pNew);
            }
            if (settingsRef.current.vibe === 'electric-storm') {
              spawnLightning(p.mouseX, p.mouseY, p.mouseX + p.random(-100, 100), p.mouseY + p.random(-100, 100));
            }
          }
        }
      };
    };

    p5InstanceRef.current = new p5(sketch, containerRef.current);

    return () => {
      if (p5InstanceRef.current) {
        p5InstanceRef.current.remove();
        p5InstanceRef.current = null;
      }
    };
  }, []); // Run once on mount

  return (
    <div
      ref={containerRef}
      id="weather-mood-canvas-wrapper"
      className="absolute inset-0 w-full h-full overflow-hidden bg-slate-950 select-none cursor-crosshair"
    />
  );
};
