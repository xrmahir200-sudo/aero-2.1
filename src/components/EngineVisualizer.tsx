import React, { useRef, useEffect, useState } from 'react';
import { EngineProfile, EngineSensors } from '../types/engine';
import { Thermometer, Eye, AlertTriangle } from 'lucide-react';

interface EngineVisualizerProps {
  sensors: EngineSensors;
  profile: EngineProfile;
}

type VisualMode = 'standard' | 'thermal_cfd' | 'pressure' | 'stress';

interface ComponentInfo {
  name: string;
  stage: string;
  temp: number;
  pressure: string;
  material: string;
  status: string;
}

export const EngineVisualizer: React.FC<EngineVisualizerProps> = ({ sensors, profile }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [visualMode, setVisualMode] = useState<VisualMode>('standard');
  const [showAirflowVectors, setShowAirflowVectors] = useState(true);

  // Rotation angles for fan and core spools
  const n1AngleRef = useRef(0);
  const n2AngleRef = useRef(0);
  const particlesRef = useRef<Array<{
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    maxLife: number;
    size: number;
    type: 'air' | 'flame_spark' | 'smoke' | 'halon' | 'fuel_spray';
  }>>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let lastTime = performance.now();

    const render = (time: number) => {
      const dt = Math.min(0.08, (time - lastTime) / 1000);
      lastTime = time;

      // Rotational speeds directly tied to simulated N1 and N2
      const n1Speed = (sensors.n1 / 100) * 32; // rad/s
      const n2Speed = (sensors.n2 / 100) * 62; // rad/s
      n1AngleRef.current = (n1AngleRef.current + n1Speed * dt) % (Math.PI * 2);
      n2AngleRef.current = (n2AngleRef.current + n2Speed * dt) % (Math.PI * 2);

      // Handle canvas resizing
      const width = (canvas.width = canvas.parentElement?.clientWidth || 900);
      const height = (canvas.height = canvas.parentElement?.clientHeight || 480);

      // Deep dark aerospace test cell environment
      ctx.fillStyle = '#0a0b0e';
      ctx.fillRect(0, 0, width, height);

      // Draw high-precision engineering grid
      drawTestBenchGrid(ctx, width, height);

      // Coordinate mapping for engine geometry
      const originX = width * 0.15;
      const originY = height * 0.5;
      const scale = Math.min(width / 1050, height / 520);

      // 1. Draw Exhaust Flame, Supersonic Mach Discs & Heat Haze Shimmer (Behind engine)
      drawHighGraphicExhaust(ctx, originX + 680 * scale, originY, scale, sensors, time);

      // 2. Draw Metallic Nacelle Cowling Outer Shell (With metallic gradients & specular rims)
      drawNacelleStructure(ctx, originX, originY, scale, sensors, profile, visualMode);

      // 3. Draw Cold Bypass Duct Aerodynamic Streamlines
      drawBypassDuct(ctx, originX, originY, scale, sensors, visualMode);

      // 4. Draw Core Multistage Axial Compressor & Stator Rows
      drawCoreCompressor(ctx, originX, originY, scale, sensors, n2AngleRef.current, visualMode);

      // 5. Draw Annular Combustor with Volumetric Plasma Flame & Fuel Atomizers
      drawCombustionChamber(ctx, originX, originY, scale, sensors, time, visualMode);

      // 6. Draw High & Low Pressure Turbine Stages (Glowing thermal blackbody emissivity)
      drawTurbineSection(ctx, originX, originY, scale, sensors, n2AngleRef.current, n1AngleRef.current, visualMode);

      // 7. Draw Front Titanium Fan / Propeller with High-Speed Motion Blur
      drawFrontFanStage(ctx, originX, originY, scale, sensors, profile, n1AngleRef.current, visualMode);

      // 8. Particle System (Aerodynamic Streamlines, Fuel Spray, Sparks, and Halon Cloud)
      updateAndDrawParticles(ctx, originX, originY, scale, sensors, dt, showAirflowVectors);

      // 9. Nacelle Fire & Halon Extinguishing Overlay
      if (sensors.fireActive) {
        drawNacelleFireOverlay(ctx, originX, originY, scale, time);
      }
      if (sensors.fireBottle1Discharged || sensors.fireBottle2Discharged) {
        drawHalonSuppressionCloud(ctx, originX, originY, scale, time);
      }

      // 10. Thermal Spike Transient Shockwave Alert Ring
      if (sensors.thermalSpikeActive) {
        drawThermalSpikeWarningRing(ctx, originX + 510 * scale, originY, scale, sensors.thermalSpikeDelta, time);
      }

      // 11. Engineering Measurement Stations Overlay
      drawAviationMeasurementOverlays(ctx, originX, originY, scale);

      animationId = requestAnimationFrame(render);
    };

    animationId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationId);
  }, [sensors, profile, visualMode, showAirflowVectors]);

  // Background Precision Grid
  const drawTestBenchGrid = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.025)';
    ctx.lineWidth = 1;
    const step = 40;
    for (let x = 0; x < width; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Engine Centerline Axis
    ctx.setLineDash([10, 4, 2, 4]);
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
    ctx.beginPath();
    ctx.moveTo(0, height * 0.5);
    ctx.lineTo(width, height * 0.5);
    ctx.stroke();
    ctx.setLineDash([]);
  };

  // High-Graphic Volumetric Exhaust Plume & Supersonic Mach Shock Diamonds
  const drawHighGraphicExhaust = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    scale: number,
    sensors: EngineSensors,
    time: number
  ) => {
    const thrustNorm = Math.min(1.2, sensors.thrustKN / 160);
    if (thrustNorm < 0.04 && !sensors.afterburnerActive) return;

    const length = (180 + thrustNorm * 300 + (sensors.afterburnerActive ? 220 : 0)) * scale;
    const nozzleRadius = (45 + (sensors.nozzlePositionPercent / 100) * 16) * scale;
    const flicker = Math.sin(time * 0.035) * (4 * scale);

    ctx.save();

    // 1. Layered Turbulent Thermal Exhaust Plume
    const plumeGrad = ctx.createLinearGradient(x, y, x + length, y);
    if (sensors.afterburnerActive) {
      plumeGrad.addColorStop(0, 'rgba(255, 255, 240, 0.98)');
      plumeGrad.addColorStop(0.12, 'rgba(255, 170, 40, 0.9)');
      plumeGrad.addColorStop(0.35, 'rgba(217, 70, 239, 0.75)'); // Supersonic violet plasma
      plumeGrad.addColorStop(0.7, 'rgba(239, 68, 68, 0.45)');
      plumeGrad.addColorStop(1, 'rgba(239, 68, 68, 0)');
    } else {
      const egtFrac = Math.min(1, Math.max(0, (sensors.egt - 300) / 700));
      plumeGrad.addColorStop(0, `rgba(255, ${Math.round(230 - egtFrac * 60)}, 120, ${0.5 + egtFrac * 0.45})`);
      plumeGrad.addColorStop(0.3, `rgba(251, 146, 60, ${0.4 + egtFrac * 0.4})`);
      plumeGrad.addColorStop(0.65, `rgba(239, 68, 68, ${0.2 + egtFrac * 0.3})`);
      plumeGrad.addColorStop(1, 'rgba(239, 68, 68, 0)');
    }

    ctx.fillStyle = plumeGrad;
    ctx.beginPath();
    ctx.moveTo(x, y - nozzleRadius);
    ctx.bezierCurveTo(
      x + length * 0.4,
      y - nozzleRadius * 1.5 + flicker,
      x + length * 0.8,
      y - nozzleRadius * 0.7,
      x + length,
      y
    );
    ctx.bezierCurveTo(
      x + length * 0.8,
      y + nozzleRadius * 0.7,
      x + length * 0.4,
      y + nozzleRadius * 1.5 - flicker,
      x,
      y + nozzleRadius
    );
    ctx.closePath();
    ctx.fill();

    // 2. Supersonic Mach Discs (Shock Diamonds) in High Thrust / Afterburner
    if (sensors.afterburnerActive || sensors.throttle > 86) {
      const numDiamonds = sensors.afterburnerActive ? 6 : 4;
      const diamondSpacing = (42 + thrustNorm * 22) * scale;

      for (let i = 1; i <= numDiamonds; i++) {
        const dx = x + i * diamondSpacing;
        const dW = (18 - i * 1.8) * scale;
        const dH = (24 - i * 2.2) * scale;
        const pulse = Math.sin(time * 0.04 + i) * (2 * scale);

        // Mach diamond white incandescent core
        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        ctx.beginPath();
        ctx.moveTo(dx - dW, y);
        ctx.lineTo(dx, y - dH + pulse);
        ctx.lineTo(dx + dW, y);
        ctx.lineTo(dx, y + dH - pulse);
        ctx.closePath();
        ctx.fill();

        // Shockwave cyan / magenta refraction perimeter
        ctx.strokeStyle = sensors.afterburnerActive ? 'rgba(192, 132, 252, 0.95)' : 'rgba(56, 189, 248, 0.85)';
        ctx.lineWidth = 2 * scale;
        ctx.stroke();
      }
    }

    // 3. Heat Haze Refractive Waves trailing behind exhaust
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.lineWidth = 1.5;
    for (let w = 0; w < 3; w++) {
      const waveY = y - 30 * scale + w * 30 * scale;
      ctx.beginPath();
      for (let wx = 0; wx < length * 0.8; wx += 20 * scale) {
        const waveOffset = Math.sin(time * 0.02 + wx * 0.05 + w) * (6 * scale);
        if (wx === 0) ctx.moveTo(x + wx, waveY + waveOffset);
        else ctx.lineTo(x + wx, waveY + waveOffset);
      }
      ctx.stroke();
    }

    ctx.restore();
  };

  // Metallic Nacelle Structure with Specular Rim Lighting
  const drawNacelleStructure = (
    ctx: CanvasRenderingContext2D,
    ox: number,
    oy: number,
    scale: number,
    sensors: EngineSensors,
    profile: EngineProfile,
    mode: VisualMode
  ) => {
    const fanRadius = 145 * scale;
    const coreLength = 680 * scale;

    ctx.save();

    // 1. Top Cowling Metallic Gradient
    const topGrad = ctx.createLinearGradient(ox, oy - fanRadius * 1.2, ox, oy - fanRadius * 0.7);
    topGrad.addColorStop(0, '#334155'); // Highlight metallic rim
    topGrad.addColorStop(0.35, '#1e242f');
    topGrad.addColorStop(1, '#0f172a');

    ctx.fillStyle = mode === 'thermal_cfd' ? 'rgba(30, 41, 59, 0.85)' : topGrad;
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2 * scale;

    ctx.beginPath();
    ctx.moveTo(ox - 30 * scale, oy - fanRadius * 1.08);
    ctx.lineTo(ox + 220 * scale, oy - fanRadius * 1.06);
    ctx.lineTo(ox + 420 * scale, oy - fanRadius * 0.82);
    ctx.lineTo(ox + coreLength * 0.9, oy - fanRadius * 0.65);
    ctx.lineTo(ox + coreLength, oy - fanRadius * 0.52);
    ctx.lineTo(ox + coreLength - 10 * scale, oy - fanRadius * 0.48);
    ctx.lineTo(ox + 400 * scale, oy - fanRadius * 0.72);
    ctx.lineTo(ox + 210 * scale, oy - fanRadius * 0.96);
    ctx.lineTo(ox - 20 * scale, oy - fanRadius * 0.98);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 2. Bottom Cowling Metallic Gradient (Mirrored)
    const botGrad = ctx.createLinearGradient(ox, oy + fanRadius * 0.7, ox, oy + fanRadius * 1.2);
    botGrad.addColorStop(0, '#0f172a');
    botGrad.addColorStop(0.65, '#1e242f');
    botGrad.addColorStop(1, '#334155');

    ctx.fillStyle = mode === 'thermal_cfd' ? 'rgba(30, 41, 59, 0.85)' : botGrad;
    ctx.beginPath();
    ctx.moveTo(ox - 30 * scale, oy + fanRadius * 1.08);
    ctx.lineTo(ox + 220 * scale, oy + fanRadius * 1.06);
    ctx.lineTo(ox + 420 * scale, oy + fanRadius * 0.82);
    ctx.lineTo(ox + coreLength * 0.9, oy + fanRadius * 0.65);
    ctx.lineTo(ox + coreLength, oy + fanRadius * 0.52);
    ctx.lineTo(ox + coreLength - 10 * scale, oy + fanRadius * 0.48);
    ctx.lineTo(ox + 400 * scale, oy + fanRadius * 0.72);
    ctx.lineTo(ox + 210 * scale, oy + fanRadius * 0.96);
    ctx.lineTo(ox - 20 * scale, oy + fanRadius * 0.98);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 3. Polished Titanium Intake Lip (Chrome highlight)
    const lipGrad = ctx.createLinearGradient(ox - 35 * scale, oy, ox, oy);
    lipGrad.addColorStop(0, '#f8fafc');
    lipGrad.addColorStop(0.5, '#94a3b8');
    lipGrad.addColorStop(1, '#334155');
    ctx.fillStyle = lipGrad;

    ctx.beginPath();
    ctx.ellipse(ox - 24 * scale, oy - fanRadius * 1.03, 14 * scale, 8 * scale, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(ox - 24 * scale, oy + fanRadius * 1.03, 14 * scale, 8 * scale, 0, 0, Math.PI * 2);
    ctx.fill();

    // 4. Chevron Serrations on Nacelle (Boeing 787 Dreamliner & 737 MAX acoustic treatment)
    if (profile.id === 'b787_genx' || profile.id === 'b737_leap1b') {
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1.5 * scale;
      const chevronBaseX = ox + coreLength * 0.9;
      for (let c = 0; c < 4; c++) {
        const cyTop = oy - fanRadius * 0.65 + c * 8 * scale;
        ctx.beginPath();
        ctx.moveTo(chevronBaseX, cyTop);
        ctx.lineTo(chevronBaseX + 16 * scale, cyTop + 4 * scale);
        ctx.lineTo(chevronBaseX, cyTop + 8 * scale);
        ctx.stroke();

        const cyBot = oy + fanRadius * 0.65 - c * 8 * scale;
        ctx.beginPath();
        ctx.moveTo(chevronBaseX, cyBot);
        ctx.lineTo(chevronBaseX + 16 * scale, cyBot - 4 * scale);
        ctx.lineTo(chevronBaseX, cyBot - 8 * scale);
        ctx.stroke();
      }
    }

    ctx.restore();
  };

  // Aerodynamic Bypass Duct (Cold Fan Flow)
  const drawBypassDuct = (
    ctx: CanvasRenderingContext2D,
    ox: number,
    oy: number,
    scale: number,
    sensors: EngineSensors,
    mode: VisualMode
  ) => {
    const fanRadius = 145 * scale;
    const coreRadius = 70 * scale;

    ctx.save();
    const bypassGrad = ctx.createLinearGradient(ox, oy - fanRadius, ox + 380 * scale, oy - coreRadius);
    if (mode === 'thermal_cfd') {
      bypassGrad.addColorStop(0, 'rgba(56, 189, 248, 0.45)');
      bypassGrad.addColorStop(1, 'rgba(59, 130, 246, 0.35)');
    } else {
      bypassGrad.addColorStop(0, 'rgba(14, 165, 233, 0.18)');
      bypassGrad.addColorStop(1, 'rgba(2, 132, 199, 0.08)');
    }

    ctx.fillStyle = bypassGrad;
    ctx.beginPath();
    ctx.moveTo(ox + 80 * scale, oy - fanRadius * 0.92);
    ctx.lineTo(ox + 380 * scale, oy - fanRadius * 0.72);
    ctx.lineTo(ox + 380 * scale, oy - coreRadius * 1.05);
    ctx.lineTo(ox + 80 * scale, oy - coreRadius * 1.05);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(ox + 80 * scale, oy + fanRadius * 0.92);
    ctx.lineTo(ox + 380 * scale, oy + fanRadius * 0.72);
    ctx.lineTo(ox + 380 * scale, oy + coreRadius * 1.05);
    ctx.lineTo(ox + 80 * scale, oy + coreRadius * 1.05);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  };

  // Multistage Compressor Section with High-Speed Rotor Blades
  const drawCoreCompressor = (
    ctx: CanvasRenderingContext2D,
    ox: number,
    oy: number,
    scale: number,
    sensors: EngineSensors,
    n2Angle: number,
    mode: VisualMode
  ) => {
    const startX = ox + 110 * scale;
    const coreWidth = 220 * scale;
    const stages = 9;

    ctx.save();

    // Compressor casing
    ctx.fillStyle = '#1c1e24';
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 1.5 * scale;
    ctx.beginPath();
    ctx.moveTo(startX, oy - 72 * scale);
    ctx.lineTo(startX + coreWidth, oy - 48 * scale);
    ctx.lineTo(startX + coreWidth, oy + 48 * scale);
    ctx.lineTo(startX, oy + 72 * scale);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // High-speed rotor blade rows with dynamic lighting
    for (let s = 0; s < stages; s++) {
      const frac = s / (stages - 1);
      const stageX = startX + frac * (coreWidth - 15 * scale);
      const stageHeight = (70 - frac * 24) * scale;

      if (mode === 'thermal_cfd') {
        const tempNorm = frac;
        ctx.strokeStyle = `rgba(${Math.round(40 + tempNorm * 215)}, ${Math.round(180 - tempNorm * 50)}, 60, 0.9)`;
      } else if (mode === 'pressure') {
        const prNorm = Math.pow(frac, 1.6);
        ctx.strokeStyle = `rgba(${Math.round(prNorm * 240)}, ${Math.round(120 + (1 - prNorm) * 110)}, 255, 0.95)`;
      } else {
        ctx.strokeStyle = '#cbd5e1';
      }

      ctx.lineWidth = (3.5 - frac * 1.5) * scale;

      // Realistic blade oscillation and high-speed motion blur
      const bladeSweep = Math.sin(n2Angle + s * 1.4) * (4 * scale);
      ctx.beginPath();
      ctx.moveTo(stageX + bladeSweep, oy - stageHeight);
      ctx.lineTo(stageX - bladeSweep * 0.5, oy - 16 * scale);
      ctx.moveTo(stageX - bladeSweep * 0.5, oy + 16 * scale);
      ctx.lineTo(stageX + bladeSweep, oy + stageHeight);
      ctx.stroke();

      // Motion blur shimmer line behind rotor at high N2
      if (sensors.n2 > 45) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 1 * scale;
        ctx.beginPath();
        ctx.moveTo(stageX - bladeSweep, oy - stageHeight * 0.9);
        ctx.lineTo(stageX + bladeSweep * 0.8, oy - 18 * scale);
        ctx.stroke();
      }
    }

    // High Pressure Central Spool Drive Shaft
    const shaftGrad = ctx.createLinearGradient(startX, oy - 14 * scale, startX, oy + 14 * scale);
    shaftGrad.addColorStop(0, '#64748b');
    shaftGrad.addColorStop(0.5, '#94a3b8');
    shaftGrad.addColorStop(1, '#334155');
    ctx.fillStyle = shaftGrad;
    ctx.fillRect(startX, oy - 14 * scale, coreWidth + 240 * scale, 28 * scale);

    ctx.restore();
  };

  // Annular Combustor with Volumetric Swirling Plasma Flame & Fuel Injectors
  const drawCombustionChamber = (
    ctx: CanvasRenderingContext2D,
    ox: number,
    oy: number,
    scale: number,
    sensors: EngineSensors,
    time: number,
    mode: VisualMode
  ) => {
    const cx = ox + 335 * scale;
    const cWidth = 140 * scale;
    const cHeight = 52 * scale;

    ctx.save();

    // Combustor liner outer wall with thermal vents
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2 * scale;
    ctx.strokeRect(cx, oy - cHeight, cWidth, cHeight * 2);

    // Fuel spray injectors with micro fuel cones
    ctx.fillStyle = '#cbd5e1';
    for (let f = 0; f < 3; f++) {
      const fy = oy - cHeight * 0.65 + f * cHeight * 0.65;
      ctx.fillRect(cx - 10 * scale, fy - 3 * scale, 12 * scale, 6 * scale);

      // Atomized fuel cone spray
      if (!sensors.flameoutActive && sensors.fuelFlowKgH > 50) {
        ctx.fillStyle = 'rgba(165, 243, 252, 0.35)';
        ctx.beginPath();
        ctx.moveTo(cx + 2 * scale, fy);
        ctx.lineTo(cx + 22 * scale, fy - 8 * scale);
        ctx.lineTo(cx + 22 * scale, fy + 8 * scale);
        ctx.closePath();
        ctx.fill();
      }
    }

    // Dynamic Volumetric Combustion Flame
    if (!sensors.flameoutActive) {
      const egtFrac = Math.min(1.2, Math.max(0.1, sensors.egt / 1000));
      const flicker1 = Math.sin(time * 0.04) * (5 * scale);
      const flicker2 = Math.cos(time * 0.065) * (4 * scale);

      // Radial Plasma Glow
      const fireGrad = ctx.createRadialGradient(
        cx + cWidth * 0.45,
        oy,
        8 * scale,
        cx + cWidth * 0.5,
        oy,
        cHeight * 1.35
      );

      if (sensors.thermalSpikeActive) {
        // High-Graphic Thermal Shockwave: Blinding orange/white plasma
        fireGrad.addColorStop(0, 'rgba(255, 255, 255, 0.98)');
        fireGrad.addColorStop(0.25, 'rgba(254, 240, 138, 0.95)');
        fireGrad.addColorStop(0.55, 'rgba(249, 115, 22, 0.88)');
        fireGrad.addColorStop(0.85, 'rgba(239, 68, 68, 0.65)');
        fireGrad.addColorStop(1, 'rgba(239, 68, 68, 0)');
      } else {
        // Stoichiometric Combustor Flame: Cyan core + Amber envelope
        fireGrad.addColorStop(0, 'rgba(165, 243, 252, 0.98)'); // Intense blue plasma
        fireGrad.addColorStop(0.25, `rgba(251, 191, 36, ${0.75 + egtFrac * 0.22})`);
        fireGrad.addColorStop(0.65, `rgba(249, 115, 22, ${0.5 + egtFrac * 0.4})`);
        fireGrad.addColorStop(1, 'rgba(220, 38, 38, 0)');
      }

      ctx.fillStyle = fireGrad;

      // Swirling flame geometry
      ctx.beginPath();
      ctx.moveTo(cx + 10 * scale, oy - cHeight * 0.7);
      ctx.quadraticCurveTo(cx + cWidth * 0.55, oy - cHeight * 0.85 + flicker1, cx + cWidth, oy);
      ctx.quadraticCurveTo(cx + cWidth * 0.55, oy + cHeight * 0.85 + flicker2, cx + 10 * scale, oy + cHeight * 0.7);
      ctx.closePath();
      ctx.fill();

      // Swirling inner flame filaments
      ctx.strokeStyle = sensors.thermalSpikeActive ? 'rgba(255, 255, 255, 0.85)' : 'rgba(254, 215, 170, 0.65)';
      ctx.lineWidth = 1.5 * scale;
      ctx.beginPath();
      ctx.moveTo(cx + 25 * scale, oy - 12 * scale);
      ctx.bezierCurveTo(cx + 65 * scale, oy - 22 * scale + flicker1, cx + 95 * scale, oy + 12 * scale + flicker2, cx + cWidth - 10 * scale, oy);
      ctx.stroke();
    }

    ctx.restore();
  };

  // High & Low Pressure Turbine Stages with Dynamic Thermal Blackbody Radiance
  const drawTurbineSection = (
    ctx: CanvasRenderingContext2D,
    ox: number,
    oy: number,
    scale: number,
    sensors: EngineSensors,
    n2Angle: number,
    n1Angle: number,
    mode: VisualMode
  ) => {
    const tx = ox + 480 * scale;
    const tWidth = 140 * scale;
    const stages = 5;

    ctx.save();

    // Physical thermal glow calculation based on simulated EGT
    const egt = sensors.egt;
    let glowColor = 'rgba(100, 116, 139, 0.9)'; // cold alloy

    if (egt > 520) {
      const red = Math.min(255, 140 + (egt - 520) * 0.38);
      const green = Math.max(20, Math.min(240, (egt - 680) * 0.7));
      const blue = Math.max(10, Math.min(220, (egt - 900) * 1.15));
      glowColor = `rgba(${Math.round(red)}, ${Math.round(green)}, ${Math.round(blue)}, 0.98)`;

      // Ambient radial radiance casting red/amber glow inside turbine casing
      const glowGrad = ctx.createRadialGradient(tx + tWidth * 0.5, oy, 10 * scale, tx + tWidth * 0.5, oy, 90 * scale);
      glowGrad.addColorStop(0, `rgba(${Math.round(red)}, ${Math.round(green)}, 20, 0.35)`);
      glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(tx + tWidth * 0.5, oy, 85 * scale, 0, Math.PI * 2);
      ctx.fill();
    }

    // Diverging turbine nozzle casing
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 1.5 * scale;
    ctx.beginPath();
    ctx.moveTo(tx, oy - 50 * scale);
    ctx.lineTo(tx + tWidth, oy - 68 * scale);
    ctx.lineTo(tx + tWidth, oy + 68 * scale);
    ctx.lineTo(tx, oy + 50 * scale);
    ctx.closePath();
    ctx.stroke();

    // Turbine rotor blade rows with high-speed rotation blur
    for (let s = 0; s < stages; s++) {
      const frac = s / (stages - 1);
      const stageX = tx + frac * (tWidth - 10 * scale);
      const stageHeight = (50 + frac * 18) * scale;
      const angle = s < 2 ? n2Angle : n1Angle;

      ctx.strokeStyle = glowColor;
      ctx.lineWidth = 3.5 * scale;

      const bladeShift = Math.cos(angle + s * 1.6) * (4 * scale);
      ctx.beginPath();
      ctx.moveTo(stageX + bladeShift, oy - stageHeight);
      ctx.lineTo(stageX - bladeShift, oy - 14 * scale);
      ctx.moveTo(stageX - bladeShift, oy + 14 * scale);
      ctx.lineTo(stageX + bladeShift, oy + stageHeight);
      ctx.stroke();
    }

    ctx.restore();
  };

  // Front Titanium Fan / Propeller with Motion Blur & Archimedean Spiral
  const drawFrontFanStage = (
    ctx: CanvasRenderingContext2D,
    ox: number,
    oy: number,
    scale: number,
    sensors: EngineSensors,
    profile: EngineProfile,
    n1Angle: number,
    mode: VisualMode
  ) => {
    ctx.save();

    // 1. Turboprop Propeller Rendering (ATR 72-600 PW127M)
    if (profile.isTurboprop) {
      const propRadius = 180 * scale;
      const numPropBlades = 6;

      // High-speed propeller motion blur disc
      if (sensors.n1 > 20) {
        const discGrad = ctx.createRadialGradient(ox, oy, 30 * scale, ox, oy, propRadius);
        discGrad.addColorStop(0, 'rgba(15, 23, 42, 0.4)');
        discGrad.addColorStop(0.85, 'rgba(30, 41, 59, 0.25)');
        discGrad.addColorStop(0.96, 'rgba(250, 204, 21, 0.35)'); // Yellow safety tip ring
        discGrad.addColorStop(1, 'rgba(250, 204, 21, 0)');
        ctx.fillStyle = discGrad;
        ctx.beginPath();
        ctx.arc(ox + 10 * scale, oy, propRadius, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.lineWidth = 10 * scale;
      for (let b = 0; b < numPropBlades; b++) {
        const angle = n1Angle + (b * Math.PI * 2) / numPropBlades;
        const tipX = ox - 20 * scale + Math.sin(angle) * (18 * scale);
        const tipY = oy - Math.cos(angle) * propRadius;

        // Composite blade body (matte carbon-black)
        ctx.strokeStyle = '#0f172a';
        ctx.beginPath();
        ctx.moveTo(ox + 10 * scale, oy);
        ctx.lineTo(tipX, tipY);
        ctx.stroke();

        // High-vis yellow safety blade tip
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 11 * scale;
        ctx.beginPath();
        ctx.moveTo(tipX - Math.sin(angle) * (3 * scale), tipY + Math.cos(angle) * (3 * scale));
        ctx.lineTo(tipX, tipY);
        ctx.stroke();
        ctx.lineWidth = 10 * scale;
      }

      // Propeller Hub spinner
      const coneLength = 65 * scale;
      const coneRadius = 32 * scale;
      const spinnerGrad = ctx.createLinearGradient(ox - coneLength, oy, ox + 15 * scale, oy);
      spinnerGrad.addColorStop(0, '#0f172a');
      spinnerGrad.addColorStop(1, '#334155');
      ctx.fillStyle = spinnerGrad;
      ctx.beginPath();
      ctx.moveTo(ox - coneLength, oy);
      ctx.quadraticCurveTo(ox - coneLength * 0.4, oy - coneRadius, ox + 15 * scale, oy - coneRadius);
      ctx.lineTo(ox + 15 * scale, oy + coneRadius);
      ctx.quadraticCurveTo(ox - coneLength * 0.4, oy + coneRadius, ox - coneLength, oy);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 2 * scale;
      ctx.stroke();

      ctx.restore();
      return;
    }

    // 2. Wide-Chord Turbofan Titanium Blades with Motion Blur
    const fanRadius = 145 * scale;
    const numBlades = 18;

    // High-speed fan rotational blur disc when N1 > 40%
    if (sensors.n1 > 35) {
      const fanBlurGrad = ctx.createRadialGradient(ox + 30 * scale, oy, 35 * scale, ox + 30 * scale, oy, fanRadius);
      fanBlurGrad.addColorStop(0, 'rgba(148, 163, 184, 0.15)');
      fanBlurGrad.addColorStop(0.85, 'rgba(203, 213, 225, 0.28)');
      fanBlurGrad.addColorStop(1, 'rgba(241, 245, 249, 0.05)');
      ctx.fillStyle = fanBlurGrad;
      ctx.beginPath();
      ctx.arc(ox + 30 * scale, oy, fanRadius * 0.96, 0, Math.PI * 2);
      ctx.fill();
    }

    // Individual titanium blades with aerodynamic twist
    ctx.lineWidth = 6 * scale;
    for (let b = 0; b < numBlades; b++) {
      const angle = n1Angle + (b * Math.PI * 2) / numBlades;
      const bladeX = ox + 32 * scale;
      const bladeTopY = oy - Math.sin(angle) * fanRadius * 0.96;

      const isDamagedBlade = sensors.birdStrikeDamage > 0 && (b === 3 || b === 4);

      if (isDamagedBlade) {
        ctx.strokeStyle = '#ef4444';
      } else if (mode === 'stress') {
        const stress = (sensors.n1 / 100) * 0.85;
        ctx.strokeStyle = `rgba(${Math.round(stress * 255)}, 120, 240, 0.88)`;
      } else {
        // Shaded titanium alloy with specular leading edge glint
        const glint = (Math.sin(angle + Math.PI / 4) + 1) * 0.5;
        ctx.strokeStyle = `rgba(${Math.round(180 + glint * 60)}, ${Math.round(195 + glint * 50)}, ${Math.round(210 + glint * 45)}, 0.92)`;
      }

      ctx.beginPath();
      ctx.moveTo(bladeX, oy);
      ctx.lineTo(bladeX - Math.cos(angle) * (24 * scale), bladeTopY);
      ctx.stroke();
    }

    // Aerodynamic Nose Cone (Spinner)
    const coneLength = 55 * scale;
    const coneRadius = 38 * scale;
    const spinnerGrad = ctx.createLinearGradient(ox - coneLength, oy, ox + 30 * scale, oy);
    spinnerGrad.addColorStop(0, '#090d16');
    spinnerGrad.addColorStop(0.7, '#1e293b');
    spinnerGrad.addColorStop(1, '#334155');

    ctx.fillStyle = spinnerGrad;
    ctx.beginPath();
    ctx.moveTo(ox - coneLength, oy);
    ctx.quadraticCurveTo(ox - coneLength * 0.4, oy - coneRadius, ox + 25 * scale, oy - coneRadius);
    ctx.lineTo(ox + 25 * scale, oy + coneRadius);
    ctx.quadraticCurveTo(ox - coneLength * 0.4, oy + coneRadius, ox - coneLength, oy);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 1.5 * scale;
    ctx.stroke();

    // Archimedean Spiral on spinner (aviation bird-strike deterrent marking)
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.5 * scale;
    ctx.beginPath();
    const spiralAngle = n1Angle;
    for (let theta = 0; theta < Math.PI * 2.5; theta += 0.12) {
      const r = (theta / (Math.PI * 2.5)) * coneRadius * 0.85;
      const sx = ox - coneLength + (theta / (Math.PI * 2.5)) * (coneLength * 0.8);
      const sy = oy + Math.sin(theta + spiralAngle) * r;
      if (theta === 0) ctx.moveTo(sx, sy);
      else ctx.lineTo(sx, sy);
    }
    ctx.stroke();

    ctx.restore();
  };

  // Dynamic Particle Simulation (Streamlines, Fuel Droplets, Sparks, and Halon Cloud)
  const updateAndDrawParticles = (
    ctx: CanvasRenderingContext2D,
    ox: number,
    oy: number,
    scale: number,
    sensors: EngineSensors,
    dt: number,
    showAirflow: boolean
  ) => {
    const particles = particlesRef.current;
    const speedMultiplier = (sensors.n1 / 100) * 480 + 70;

    // Spawn airflow streamline particles
    if (showAirflow && Math.random() < 0.75) {
      particles.push({
        x: ox - 140 * scale,
        y: oy + (Math.random() - 0.5) * 270 * scale,
        vx: speedMultiplier * scale,
        vy: 0,
        size: 3 * scale,
        life: 0,
        maxLife: 1.8,
        type: 'air'
      });
    }

    // Spawn combustion sparks during afterburner or high-speed thrust
    if ((sensors.afterburnerActive || sensors.throttle > 90) && Math.random() < 0.6) {
      particles.push({
        x: ox + 680 * scale + (Math.random() * 80) * scale,
        y: oy + (Math.random() - 0.5) * 35 * scale,
        vx: (speedMultiplier * 1.6 + Math.random() * 200) * scale,
        vy: (Math.random() - 0.5) * 60 * scale,
        size: (2 + Math.random() * 2) * scale,
        life: 0,
        maxLife: 0.6,
        type: 'flame_spark'
      });
    }

    // Spawn Halon extinguisher particles if discharged
    if (sensors.fireBottle1Discharged || sensors.fireBottle2Discharged) {
      for (let i = 0; i < 5; i++) {
        particles.push({
          x: ox + (180 + Math.random() * 240) * scale,
          y: oy - 120 * scale,
          vx: (Math.random() - 0.5) * 90 * scale,
          vy: (80 + Math.random() * 120) * scale,
          size: (12 + Math.random() * 16) * scale,
          life: 0,
          maxLife: 2.4,
          type: 'halon'
        });
      }
    }

    // Update and draw particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life += dt;
      if (p.life >= p.maxLife) {
        particles.splice(i, 1);
        continue;
      }

      p.x += p.vx * dt;
      p.y += p.vy * dt;

      const alpha = 1 - p.life / p.maxLife;

      if (p.type === 'air') {
        ctx.fillStyle = `rgba(56, 189, 248, ${alpha * 0.55})`;
        ctx.fillRect(p.x, p.y, 6 * scale, 1.5 * scale);
      } else if (p.type === 'flame_spark') {
        ctx.fillStyle = `rgba(254, 240, 138, ${alpha * 0.9})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'halon') {
        ctx.fillStyle = `rgba(241, 245, 249, ${alpha * 0.65})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size + p.life * 14 * scale, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  };

  // Nacelle Fire Dynamic Flame Overlay
  const drawNacelleFireOverlay = (
    ctx: CanvasRenderingContext2D,
    ox: number,
    oy: number,
    scale: number,
    time: number
  ) => {
    ctx.save();
    const fireX = ox + 280 * scale;
    const fireY = oy - 95 * scale;
    const pulse = Math.sin(time * 0.05) * (8 * scale);

    const grad = ctx.createRadialGradient(fireX, fireY, 8 * scale, fireX, fireY, (75 + pulse) * scale);
    grad.addColorStop(0, 'rgba(255, 240, 180, 0.98)');
    grad.addColorStop(0.3, 'rgba(239, 68, 68, 0.9)');
    grad.addColorStop(0.8, 'rgba(185, 28, 28, 0.45)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(fireX, fireY, (72 + pulse) * scale, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#fee2e2';
    ctx.font = `bold ${Math.round(12 * scale)}px monospace`;
    ctx.fillText('WARNING: NACELLE FIRE DETECTED', fireX - 105 * scale, fireY - 32 * scale);

    ctx.restore();
  };

  // Halon Extinguisher Fog Cloud
  const drawHalonSuppressionCloud = (
    ctx: CanvasRenderingContext2D,
    ox: number,
    oy: number,
    scale: number,
    time: number
  ) => {
    ctx.save();
    const pulse = Math.sin(time * 0.03) * (5 * scale);
    ctx.fillStyle = 'rgba(226, 232, 240, 0.28)';
    ctx.beginPath();
    ctx.ellipse(ox + 310 * scale, oy, (185 + pulse) * scale, 125 * scale, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  // Thermal Spike Transient Warning Ring
  const drawThermalSpikeWarningRing = (
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    scale: number,
    deltaT: number,
    time: number
  ) => {
    ctx.save();
    const pulse = (Math.sin(time * 0.08) + 1) * 0.5;
    ctx.strokeStyle = `rgba(249, 115, 22, ${0.4 + pulse * 0.6})`;
    ctx.lineWidth = 3 * scale;
    ctx.setLineDash([6, 6]);

    ctx.beginPath();
    ctx.arc(cx, cy, (85 + pulse * 18) * scale, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#ea580c';
    ctx.font = `bold ${Math.round(11 * scale)}px sans-serif`;
    ctx.fillText(`THERMAL SPIKE: +${deltaT}°C TRANSIENT`, cx - 72 * scale, cy - 90 * scale);
    ctx.restore();
  };

  // Aviation Engineering Measurement Stations
  const drawAviationMeasurementOverlays = (
    ctx: CanvasRenderingContext2D,
    ox: number,
    oy: number,
    scale: number
  ) => {
    ctx.save();
    ctx.fillStyle = '#94a3b8';
    ctx.font = `${Math.round(10 * scale)}px monospace`;

    const stations = [
      { name: 'STA 1.0 INLET', x: ox - 40 * scale, y: oy + 175 * scale },
      { name: 'STA 2.0 FAN', x: ox + 60 * scale, y: oy + 175 * scale },
      { name: 'STA 3.0 HPC', x: ox + 280 * scale, y: oy + 175 * scale },
      { name: 'STA 4.0 BURNER', x: ox + 410 * scale, y: oy + 175 * scale },
      { name: 'STA 5.0 TURBINE', x: ox + 550 * scale, y: oy + 175 * scale },
      { name: 'STA 8.0 NOZZLE', x: ox + 680 * scale, y: oy + 175 * scale }
    ];

    stations.forEach((st) => {
      ctx.fillText(st.name, st.x - 20 * scale, st.y);
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(st.x + 20 * scale, st.y - 12 * scale);
      ctx.lineTo(st.x + 20 * scale, st.y - 28 * scale);
      ctx.stroke();
    });

    ctx.restore();
  };

  return (
    <div className="relative w-full h-full min-h-[460px] flex flex-col bg-[#111215] overflow-hidden">
      {/* Top Graphic Controls Bar */}
      <div className="flex flex-wrap items-center justify-between px-3 py-2 bg-[#1a1b20] border-b border-[#2d2e36] text-xs z-10">
        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-medium flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5 text-sky-400" /> Visualization Mode:
          </span>
          <div className="flex items-center bg-[#111215] p-0.5 rounded border border-[#2d2e36]">
            {[
              { id: 'standard', label: 'Cutaway Mechanical' },
              { id: 'thermal_cfd', label: 'Thermal CFD Heatmap' },
              { id: 'pressure', label: 'Pressure Gradient' },
              { id: 'stress', label: 'Blade Stress' }
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => setVisualMode(m.id as VisualMode)}
                className={`px-2.5 py-1 text-[11px] rounded transition-colors ${
                  visualMode === m.id
                    ? 'bg-sky-600 text-white font-medium shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1.5 text-slate-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showAirflowVectors}
              onChange={(e) => setShowAirflowVectors(e.target.checked)}
              className="accent-sky-500 rounded"
            />
            <span className="text-[11px]">Streamline Vectors</span>
          </label>

          {sensors.thermalSpikeActive && (
            <div className="flex items-center gap-1 text-amber-400 font-mono text-[11px] animate-pulse">
              <Thermometer className="w-3.5 h-3.5" />
              <span>THERMAL SPIKE ACTIVE (+{sensors.thermalSpikeDelta}°C)</span>
            </div>
          )}

          {sensors.fireActive && (
            <div className="flex items-center gap-1 text-rose-400 font-mono text-[11px] font-bold animate-bounce">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>ENGINE FIRE IN NACELLE</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Canvas Visualizer */}
      <div className="relative flex-1 w-full h-full min-h-[380px]">
        <canvas
          ref={canvasRef}
          className="w-full h-full block border"
          style={{ borderColor: '#f1f7f9' }}
        />

        {/* Live HUD Floating Telemetry Badge */}
        <div className="absolute top-3 left-3 bg-[#18191f]/90 backdrop-blur border border-[#333542] rounded p-2.5 text-xs font-mono shadow-xl pointer-events-none">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1 border-b border-slate-700/50 pb-1 flex items-center justify-between">
            <span>Core Telemetry</span>
            <span className="text-emerald-400">ACTIVE</span>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px]">
            <div className="text-slate-400">N1 Fan Speed:</div>
            <div className="text-sky-300 text-right font-bold">{sensors.n1.toFixed(1)}%</div>
            <div className="text-slate-400">N2 Core Spool:</div>
            <div className="text-sky-300 text-right font-bold">{sensors.n2.toFixed(1)}%</div>
            <div className="text-slate-400">EGT Thermocouple:</div>
            <div
              className={`text-right font-bold ${
                sensors.egt > 920 ? 'text-rose-400' : sensors.egt > 800 ? 'text-amber-300' : 'text-emerald-300'
              }`}
            >
              {Math.round(sensors.egt)}°C
            </div>
            <div className="text-slate-400">Gross Thrust:</div>
            <div className="text-amber-300 text-right font-bold">{sensors.thrustKN.toFixed(1)} kN</div>
            <div className="text-slate-400">Compressor Pr:</div>
            <div className="text-slate-200 text-right">{sensors.corePressureRatio}:1</div>
            <div className="text-slate-400">Stall Margin:</div>
            <div
              className={`text-right font-bold ${
                sensors.stallMarginPercent < 8 ? 'text-rose-400' : 'text-emerald-400'
              }`}
            >
              +{sensors.stallMarginPercent}%
            </div>
          </div>
        </div>

        {/* Station Legend at bottom right */}
        <div className="absolute bottom-3 right-3 bg-[#18191f]/90 backdrop-blur border border-[#333542] rounded px-3 py-1.5 text-[11px] font-mono text-slate-400 flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-400 inline-block" /> Cold Bypass Flow
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> Core Gas Path
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" /> Combustor & Reheat
          </div>
        </div>
      </div>
    </div>
  );
};
