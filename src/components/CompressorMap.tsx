import React, { useRef, useEffect } from 'react';
import { EngineSensors, EngineProfile, TelemetryPoint } from '../types/engine';
import { Compass, AlertTriangle, ShieldCheck, HelpCircle } from 'lucide-react';

interface CompressorMapProps {
  sensors: EngineSensors;
  profile: EngineProfile;
  telemetryHistory: TelemetryPoint[];
}

export const CompressorMap: React.FC<CompressorMapProps> = ({
  sensors,
  profile,
  telemetryHistory
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width = canvas.parentElement?.clientWidth || 700;
    const height = canvas.height = canvas.parentElement?.clientHeight || 450;

    // Background
    ctx.fillStyle = '#0f1013';
    ctx.fillRect(0, 0, width, height);

    const margin = { top: 40, right: 40, bottom: 50, left: 60 };
    const plotWidth = width - margin.left - margin.right;
    const plotHeight = height - margin.top - margin.bottom;

    // Scale domains
    const maxMassFlow = 520; // kg/s
    const maxPR = profile.pressureRatioMax * 1.15; // e.g. ~48

    const toX = (flow: number) => margin.left + (flow / maxMassFlow) * plotWidth;
    const toY = (pr: number) => margin.top + plotHeight - ((pr - 1) / (maxPR - 1)) * plotHeight;

    // 1. Grid and Axes
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.lineWidth = 1;
    for (let flow = 50; flow <= maxMassFlow; flow += 50) {
      const x = toX(flow);
      ctx.beginPath();
      ctx.moveTo(x, margin.top);
      ctx.lineTo(x, margin.top + plotHeight);
      ctx.stroke();

      ctx.fillStyle = '#64748b';
      ctx.font = '10px monospace';
      ctx.fillText(`${flow}`, x - 10, margin.top + plotHeight + 18);
    }

    for (let pr = 5; pr <= maxPR; pr += 5) {
      const y = toY(pr);
      ctx.beginPath();
      ctx.moveTo(margin.left, y);
      ctx.lineTo(margin.left + plotWidth, y);
      ctx.stroke();

      ctx.fillStyle = '#64748b';
      ctx.font = '10px monospace';
      ctx.fillText(`${pr}:1`, margin.left - 35, y + 3);
    }

    // Axis Labels
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 11px monospace';
    ctx.fillText('CORRECTED AIR MASS FLOW (kg/s)', width * 0.4, height - 12);
    ctx.save();
    ctx.translate(16, height * 0.55);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('PRESSURE RATIO (P3 / P2)', 0, 0);
    ctx.restore();

    // 2. Surge Boundary / Stall Line (The red hazard envelope)
    ctx.save();
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2.5;
    ctx.setLineDash([5, 4]);

    ctx.beginPath();
    const surgePoints: [number, number][] = [
      [30, 2.5],
      [80, 7.8],
      [140, 15.5],
      [220, 26.0],
      [310, 36.5],
      [390, 44.0],
      [440, 47.0]
    ];

    surgePoints.forEach(([f, pr], idx) => {
      const x = toX(f);
      const y = toY(pr * (profile.pressureRatioMax / 42));
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
    ctx.restore();

    // Surge label
    ctx.fillStyle = '#ef4444';
    ctx.font = 'bold 11px monospace';
    ctx.fillText('COMPRESSOR SURGE LINE (STALL BOUNDARY)', toX(120), toY(20));

    // 3. Constant Speed Lines (% N2 rpm: 60%, 70%, 80%, 90%, 100%, 105%)
    const speedContours = [60, 70, 80, 90, 95, 100, 105];
    speedContours.forEach((speed) => {
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();

      const baseFlow = (speed / 100) * 360;
      const basePr = Math.pow(speed / 100, 2.7) * profile.pressureRatioMax;

      for (let delta = -40; delta <= 30; delta += 10) {
        const f = Math.max(20, baseFlow + delta);
        // Vertical-ish curve with steep drop at choke flow
        const pr = Math.max(1.2, basePr - (delta * 0.15) - Math.pow(Math.max(0, delta) / 10, 2) * 1.5);
        const x = toX(f);
        const y = toY(pr);
        if (delta === -40) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      ctx.fillStyle = '#38bdf8';
      ctx.font = '9px monospace';
      ctx.fillText(`${speed}% N2`, toX(baseFlow - 35), toY(basePr) - 6);
    });

    // 4. Steady-State Operating Running Line (Green)
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let n = 20; n <= 105; n += 5) {
      const f = 40 + Math.pow(n / 100, 1.8) * 410;
      const pr = 1.2 + Math.pow(n / 100, 2.75) * (profile.pressureRatioMax - 1.2);
      const x = toX(f);
      const y = toY(pr);
      if (n === 20) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    ctx.fillStyle = '#10b981';
    ctx.font = '10px monospace';
    ctx.fillText('STEADY-STATE RUNNING LINE', toX(240), toY(18) + 24);

    // 5. Breadcrumb trail of recent operating points (transient path during speed variation)
    if (telemetryHistory.length > 5) {
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.6)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      const recent = telemetryHistory.slice(-40);
      recent.forEach((pt, idx) => {
        const x = toX(pt.massFlow);
        const y = toY(pt.pressureRatio);
        if (idx === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    }

    // 6. Current Live Operating Point (Bright Pulsing Amber Indicator)
    const curX = toX(sensors.airMassFlowKgS);
    const curY = toY(sensors.corePressureRatio);

    // Halo pulse
    const pulse = (Math.sin(Date.now() / 120) + 1) * 0.5;
    ctx.fillStyle = `rgba(245, 158, 11, ${0.25 + pulse * 0.35})`;
    ctx.beginPath();
    ctx.arc(curX, curY, 14 + pulse * 6, 0, Math.PI * 2);
    ctx.fill();

    // Center dot
    ctx.fillStyle = sensors.stallMarginPercent < 6 ? '#ef4444' : '#f59e0b';
    ctx.beginPath();
    ctx.arc(curX, curY, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Coordinates tag
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px monospace';
    ctx.fillText(
      `OP: PR ${sensors.corePressureRatio.toFixed(1)} | ${sensors.airMassFlowKgS} kg/s`,
      curX + 12,
      curY - 8
    );
  }, [sensors, profile, telemetryHistory]);

  return (
    <div className="flex flex-col h-full bg-[#111215] text-slate-200">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between px-3 py-2 bg-[#1a1b20] border-b border-[#2d2e36] text-xs">
        <div className="flex items-center gap-2">
          <Compass className="w-4 h-4 text-sky-400" />
          <span className="font-semibold uppercase tracking-wider">Compressor Aerodynamic Characteristic Map</span>
        </div>

        {/* Real-time Stall Margin Gauge */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-mono text-xs">
            <span className="text-slate-400">STALL MARGIN:</span>
            <span
              className={`font-bold px-2 py-0.5 rounded border ${
                sensors.stallMarginPercent < 5
                  ? 'bg-rose-950 border-rose-600 text-rose-300 animate-pulse'
                  : sensors.stallMarginPercent < 12
                  ? 'bg-amber-950 border-amber-600 text-amber-300'
                  : 'bg-emerald-950 border-emerald-600 text-emerald-300'
              }`}
            >
              +{sensors.stallMarginPercent.toFixed(1)}%{' '}
              {sensors.stallMarginPercent < 5 ? '[CRITICAL SURGE]' : sensors.stallMarginPercent < 12 ? '[CAUTION]' : '[NOMINAL]'}
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-1 text-[11px] text-slate-400">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Transient rapid throttle pushes point toward red surge line</span>
          </div>
        </div>
      </div>

      {/* Main Canvas */}
      <div className="relative flex-1 w-full h-full min-h-[380px]">
        <canvas ref={canvasRef} className="w-full h-full block" />

        {/* Floating Explanation Overlay */}
        <div className="absolute bottom-4 left-16 bg-[#18191f]/90 backdrop-blur border border-[#333542] rounded p-2.5 text-[11px] font-mono text-slate-300 max-w-sm pointer-events-none">
          <div className="font-bold text-sky-400 mb-1">Aerodynamic Surge Physics:</div>
          <div className="text-slate-400 text-[10px] leading-relaxed">
            During sudden acceleration, rapid fuel injection causes high backpressure before the compressor can accelerate airflow. The operating point rises vertically toward the red surge line, where aerodynamic stall and explosive acoustic bangs occur.
          </div>
        </div>
      </div>
    </div>
  );
};
