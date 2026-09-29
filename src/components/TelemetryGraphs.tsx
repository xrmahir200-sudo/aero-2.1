import React, { useRef, useEffect, useState } from 'react';
import { TelemetryPoint, EngineProfile } from '../types/engine';
import { Activity, Thermometer, Gauge, Zap, Flame, Pause, Play, Trash2 } from 'lucide-react';

interface TelemetryGraphsProps {
  telemetryHistory: TelemetryPoint[];
  profile: EngineProfile;
  isPaused: boolean;
  onTogglePause: () => void;
  onClearHistory: () => void;
}

type SelectedChannel = 'all' | 'egt' | 'rpm' | 'thrust' | 'fuel';

export const TelemetryGraphs: React.FC<TelemetryGraphsProps> = ({
  telemetryHistory,
  profile,
  isPaused,
  onTogglePause,
  onClearHistory
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [selectedChannel, setSelectedChannel] = useState<SelectedChannel>('all');
  const [hoveredPoint, setHoveredPoint] = useState<TelemetryPoint | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width = canvas.parentElement?.clientWidth || 900;
    const height = canvas.height = canvas.parentElement?.clientHeight || 480;

    // Background
    ctx.fillStyle = '#0f1013';
    ctx.fillRect(0, 0, width, height);

    const history = telemetryHistory;
    if (history.length < 2) {
      ctx.fillStyle = '#64748b';
      ctx.font = '12px monospace';
      ctx.fillText('COLLECTING REAL-TIME SENSOR TELEMETRY...', width * 0.35, height * 0.5);
      return;
    }

    // Grid lines & time division
    drawOscilloscopeGrid(ctx, width, height);

    // Render channels based on selection
    if (selectedChannel === 'all' || selectedChannel === 'thrust') {
      // Channel 1: Thrust & Throttle (Amber / Sky)
      drawSignal(ctx, history, (p) => p.throttle, 0, 110, '#38bdf8', width, height, 'Throttle %', 1.5, [4, 4]);
      drawSignal(ctx, history, (p) => p.thrustKN, 0, profile.maxWetThrustKN * 1.05, '#f59e0b', width, height, 'Thrust kN', 2.5);
    }

    if (selectedChannel === 'all' || selectedChannel === 'rpm') {
      // Channel 2: N1 & N2 Spools (Emerald / Indigo)
      drawSignal(ctx, history, (p) => p.n1, 0, 115, '#10b981', width, height, 'N1 Fan %', 2);
      drawSignal(ctx, history, (p) => p.n2, 0, 115, '#818cf8', width, height, 'N2 Core %', 2);
    }

    if (selectedChannel === 'all' || selectedChannel === 'egt') {
      // Channel 3: EGT Thermocouple with Caution & Critical Limits
      drawEGTWithLimits(ctx, history, profile, width, height);
    }

    if (selectedChannel === 'all' || selectedChannel === 'fuel') {
      // Channel 4: Fuel Flow (Violet)
      drawSignal(ctx, history, (p) => p.fuelFlowKgH, 0, 5500, '#c084fc', width, height, 'Fuel kg/h', 1.5);
      // Vibration (Rose)
      drawSignal(ctx, history, (p) => p.vibrationIps, 0, 5, '#f43f5e', width, height, 'Vibration ips', 2);
    }
  }, [telemetryHistory, selectedChannel, profile]);

  const drawOscilloscopeGrid = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;

    // Horizontal division lines (0%, 25%, 50%, 75%, 100%)
    for (let y = 0; y <= height; y += height / 4) {
      ctx.beginPath();
      ctx.moveTo(40, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Vertical time division lines
    for (let x = 40; x <= width; x += (width - 40) / 10) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
  };

  const drawSignal = (
    ctx: CanvasRenderingContext2D,
    data: TelemetryPoint[],
    accessor: (p: TelemetryPoint) => number,
    minVal: number,
    maxVal: number,
    color: string,
    width: number,
    height: number,
    label: string,
    lineWidth: number = 2,
    dash: number[] = []
  ) => {
    const leftMargin = 50;
    const plotWidth = width - leftMargin;
    const plotHeight = height - 20;

    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.setLineDash(dash);

    ctx.beginPath();
    for (let i = 0; i < data.length; i++) {
      const fracX = i / (data.length - 1);
      const x = leftMargin + fracX * plotWidth;
      const rawVal = accessor(data[i]);
      const normY = Math.max(0, Math.min(1, (rawVal - minVal) / (maxVal - minVal)));
      const y = plotHeight - normY * (plotHeight - 20);

      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
  };

  const drawEGTWithLimits = (
    ctx: CanvasRenderingContext2D,
    data: TelemetryPoint[],
    profile: EngineProfile,
    width: number,
    height: number
  ) => {
    const leftMargin = 50;
    const plotWidth = width - leftMargin;
    const plotHeight = height - 20;
    const minTemp = 300;
    const maxTemp = 1200;

    // Draw Caution line (e.g. 920°C)
    const cautionY = plotHeight - ((profile.maxEGT - minTemp) / (maxTemp - minTemp)) * (plotHeight - 20);
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.4)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(leftMargin, cautionY);
    ctx.lineTo(width, cautionY);
    ctx.stroke();

    // Draw Danger line (e.g. 1010°C)
    const dangerY = plotHeight - ((profile.dangerEGT - minTemp) / (maxTemp - minTemp)) * (plotHeight - 20);
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.6)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(leftMargin, dangerY);
    ctx.lineTo(width, dangerY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw EGT trace
    ctx.strokeStyle = '#f97316';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let i = 0; i < data.length; i++) {
      const fracX = i / (data.length - 1);
      const x = leftMargin + fracX * plotWidth;
      const egt = data[i].egt;
      const normY = Math.max(0, Math.min(1, (egt - minTemp) / (maxTemp - minTemp)));
      const y = plotHeight - normY * (plotHeight - 20);

      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);

      // Highlight thermal spikes
      if (i > 1 && data[i].egt - data[i - 1].egt > 8) {
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.stroke();
  };

  const latest = telemetryHistory[telemetryHistory.length - 1];

  return (
    <div className="flex flex-col h-full bg-[#111215] text-slate-200">
      {/* Oscilloscope Header Controls */}
      <div className="flex flex-wrap items-center justify-between px-3 py-2 bg-[#1a1b20] border-b border-[#2d2e36] text-xs">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-400" />
          <span className="font-semibold uppercase tracking-wider">High-Speed Multi-Channel Strip Chart</span>
        </div>

        {/* Channel Filters */}
        <div className="flex items-center gap-1 bg-[#111215] p-0.5 rounded border border-[#2d2e36]">
          {[
            { id: 'all', label: 'All Channels' },
            { id: 'egt', label: 'EGT Thermal' },
            { id: 'rpm', label: 'N1/N2 Spool' },
            { id: 'thrust', label: 'Thrust / Throttle' },
            { id: 'fuel', label: 'Fuel & Vibration' }
          ].map((ch) => (
            <button
              key={ch.id}
              onClick={() => setSelectedChannel(ch.id as SelectedChannel)}
              className={`px-2.5 py-1 text-[11px] rounded transition-colors ${
                selectedChannel === ch.id
                  ? 'bg-sky-600 text-white font-medium shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {ch.label}
            </button>
          ))}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={onTogglePause}
            className={`px-2.5 py-1 text-[11px] rounded font-mono border flex items-center gap-1 transition-colors ${
              isPaused
                ? 'bg-amber-600/80 border-amber-500 text-white animate-pulse'
                : 'bg-[#181920] border-[#333542] text-slate-300 hover:bg-[#282a36]'
            }`}
          >
            {isPaused ? <Play className="w-3 h-3 text-emerald-300" /> : <Pause className="w-3 h-3 text-amber-300" />}
            <span>{isPaused ? 'RESUME STREAM' : 'PAUSE WAVEFORM'}</span>
          </button>
          <button
            onClick={onClearHistory}
            className="px-2 py-1 text-[11px] font-mono rounded border border-[#333542] bg-[#181920] text-slate-400 hover:text-rose-400 hover:border-rose-900 transition-colors flex items-center gap-1"
          >
            <Trash2 className="w-3 h-3" /> Clear Buffer
          </button>
        </div>
      </div>

      {/* Main Graph Canvas */}
      <div className="relative flex-1 w-full h-full min-h-[360px]">
        <canvas ref={canvasRef} className="w-full h-full block" />

        {/* Live Channel Legend and Current Values */}
        {latest && (
          <div className="absolute top-2 right-2 bg-[#18191f]/90 backdrop-blur border border-[#333542] rounded p-2 text-xs font-mono shadow-xl grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1">
            <div className="flex items-center gap-1.5 text-amber-400">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <span>Thrust: {latest.thrustKN.toFixed(1)} kN</span>
            </div>
            <div className="flex items-center gap-1.5 text-sky-400">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
              <span>Throttle: {latest.throttle.toFixed(0)}%</span>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              <span>N1 Fan: {latest.n1.toFixed(1)}%</span>
            </div>
            <div className="flex items-center gap-1.5 text-indigo-400">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-400" />
              <span>N2 Core: {latest.n2.toFixed(1)}%</span>
            </div>
            <div className="flex items-center gap-1.5 text-orange-400">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-400" />
              <span>EGT: {Math.round(latest.egt)}°C</span>
            </div>
            <div className="flex items-center gap-1.5 text-purple-400">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-400" />
              <span>Fuel: {latest.fuelFlowKgH} kg/h</span>
            </div>
            <div className="flex items-center gap-1.5 text-rose-400">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
              <span>Vib: {latest.vibrationIps.toFixed(2)} ips</span>
            </div>
            <div className="flex items-center gap-1.5 text-teal-400">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-400" />
              <span>Margin: {latest.stallMargin.toFixed(1)}%</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
