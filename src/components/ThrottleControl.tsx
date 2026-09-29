import React from 'react';
import { EngineSensors, EngineProfile } from '../types/engine';
import {
  Gauge,
  Zap,
  Flame,
  RotateCcw,
  ArrowUpRight,
  ArrowDownRight,
  PlaneTakeoff,
  PlaneLanding,
  Navigation,
  Rocket,
  Sliders
} from 'lucide-react';
import { soundEngine } from '../services/soundEngine';

interface ThrottleControlProps {
  sensors: EngineSensors;
  profile: EngineProfile;
  slewRate: number;
  multiEngineSensors?: EngineSensors[];
  onSetThrottle: (val: number) => void;
  onSetIndividualThrottle?: (index: number, val: number) => void;
  onSetSlewRate: (val: number) => void;
  onToggleReverse: () => void;
  onEmergencyCutoff: () => void;
}

export const ThrottleControl: React.FC<ThrottleControlProps> = ({
  sensors,
  profile,
  slewRate,
  multiEngineSensors,
  onSetThrottle,
  onSetIndividualThrottle,
  onSetSlewRate,
  onToggleReverse,
  onEmergencyCutoff
}) => {
  const [throttleMode, setThrottleMode] = React.useState<'gang' | 'split'>('gang');
  const maxThrottle = profile.hasAfterburner ? 110 : 100;
  const numEngines = profile.engineCount || 2;
  const engineList = multiEngineSensors ? multiEngineSensors.slice(0, numEngines) : [sensors, sensors];

  // Primary operational flight presets requested by user
  const quickPresets = [
    {
      id: 'idle',
      label: 'IDLE',
      sublabel: 'Ground / Descent',
      value: 20,
      icon: PlaneLanding,
      color: 'hover:border-emerald-500 hover:text-emerald-300',
      activeColor: 'bg-emerald-950/80 border-emerald-500 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
    },
    {
      id: 'taxi',
      label: 'TAXI',
      sublabel: 'Ground Roll (35%)',
      value: 35,
      icon: Navigation,
      color: 'hover:border-sky-500 hover:text-sky-300',
      activeColor: 'bg-sky-950/80 border-sky-500 text-sky-300 shadow-[0_0_12px_rgba(56,189,248,0.3)]'
    },
    {
      id: 'cruise',
      label: 'CRUISE',
      sublabel: 'Flight Level (65%)',
      value: 65,
      icon: Gauge,
      color: 'hover:border-indigo-500 hover:text-indigo-300',
      activeColor: 'bg-indigo-950/80 border-indigo-500 text-indigo-300 shadow-[0_0_12px_rgba(129,140,248,0.3)]'
    },
    {
      id: 'takeoff',
      label: 'TAKEOFF',
      sublabel: 'TOGA Rated (100%)',
      value: 100,
      icon: PlaneTakeoff,
      color: 'hover:border-amber-500 hover:text-amber-300',
      activeColor: 'bg-amber-950/80 border-amber-500 text-amber-300 shadow-[0_0_14px_rgba(245,158,11,0.35)]'
    },
    {
      id: 'max',
      label: profile.hasAfterburner ? 'MAX / REHEAT' : 'MAX POWER',
      sublabel: profile.hasAfterburner ? 'Combat 110%' : 'Emergency 100%',
      value: maxThrottle,
      icon: profile.hasAfterburner ? Rocket : Zap,
      color: 'hover:border-rose-500 hover:text-rose-300',
      activeColor: 'bg-rose-950/80 border-rose-500 text-rose-300 shadow-[0_0_14px_rgba(244,63,94,0.35)]'
    }
  ];

  const detents = [
    { label: 'CUTOFF', value: 0 },
    { label: 'IDLE', value: 20 },
    { label: 'TAXI', value: 35 },
    { label: 'CRZ', value: 65 },
    { label: 'CLB', value: 85 },
    { label: 'TOGA', value: 100 },
    ...(profile.hasAfterburner ? [{ label: 'REHEAT', value: 110 }] : [])
  ];

  const handleTransientThermalBurst = () => {
    soundEngine.init();
    onSetSlewRate(160);
    onSetThrottle(100);
    setTimeout(() => {
      onSetThrottle(20);
    }, 3500);
  };

  return (
    <div className="bg-[#1b1c22] border border-[#2e303d] rounded-sm p-3 text-slate-200 flex flex-col gap-3">
      {/* Header with live command and actual readout */}
      <div className="flex flex-wrap items-center justify-between border-b border-[#2e303d] pb-2 gap-2">
        <div className="flex items-center gap-2">
          <Gauge className="w-4 h-4 text-sky-400" />
          <span className="font-semibold text-xs tracking-wider uppercase">FADEC Throttle & Speed Control</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Gang vs Independent Throttle Mode Toggle */}
          <div className="flex items-center bg-[#111215] p-0.5 rounded border border-[#2e303d] text-xs">
            <button
              onClick={() => {
                soundEngine.playSwitchClick();
                setThrottleMode('gang');
              }}
              className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors ${
                throttleMode === 'gang'
                  ? 'bg-sky-700 text-white font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Master Gang
            </button>
            <button
              onClick={() => {
                soundEngine.playSwitchClick();
                setThrottleMode('split');
              }}
              className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors ${
                throttleMode === 'split'
                  ? 'bg-amber-700 text-white font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Independent Levers ({numEngines}×)
            </button>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-mono">
            <span className="text-slate-400">COMMAND:</span>
            <span className="text-sky-300 font-bold px-2 py-0.5 bg-[#121317] border border-[#2e303d] rounded">
              {sensors.targetThrottle.toFixed(0)}%
            </span>
            <span className="text-slate-400">ACTUAL:</span>
            <span className="text-amber-300 font-bold px-2 py-0.5 bg-[#121317] border border-[#2e303d] rounded">
              {sensors.throttle.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>

      {/* INDEPENDENT THROTTLE LEVERS SECTION (When in 'split' mode) */}
      {throttleMode === 'split' && (
        <div className="bg-[#12141c] border border-[#272a39] rounded p-3 flex flex-col gap-3">
          <div className="flex items-center justify-between text-xs font-mono text-slate-300 border-b border-[#1f2230] pb-1.5">
            <span className="text-amber-400 font-bold flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5" />
              <span>MANUAL INDEPENDENT THROTTLE QUADRANT ({numEngines} ENGINES)</span>
            </span>
            <div className="flex items-center gap-2">
              <span className="text-slate-400 text-[11px]">Control speed of each engine individually</span>
              <button
                onClick={() => {
                  soundEngine.playSwitchClick();
                  onSetThrottle(sensors.targetThrottle);
                  for (let i = 0; i < numEngines; i++) {
                    onSetIndividualThrottle?.(i, sensors.targetThrottle);
                  }
                }}
                className="px-2 py-0.5 bg-[#1c202e] hover:bg-[#272d42] border border-[#3b435f] text-cyan-300 rounded text-[10px]"
              >
                Sync All to Eng 1
              </button>
            </div>
          </div>

          <div className={`grid ${numEngines === 4 ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4' : 'grid-cols-1 sm:grid-cols-2'} gap-3`}>
            {Array.from({ length: numEngines }, (_, idx) => {
              const eng = engineList[idx] || sensors;
              return (
                <div key={idx} className="bg-[#0b0d13] border border-[#1e2230] rounded p-2.5 flex flex-col gap-2">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="font-bold text-white">LEVER {idx + 1}</span>
                    <span className="text-sky-300 font-bold bg-[#141824] px-1.5 py-0.5 rounded border border-[#272e44]">
                      {eng.targetThrottle.toFixed(0)}%
                    </span>
                  </div>

                  {/* Individual Throttle Slider */}
                  <div className="relative py-1">
                    <input
                      type="range"
                      min="0"
                      max={maxThrottle}
                      step="1"
                      value={eng.targetThrottle}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        onSetIndividualThrottle?.(idx, val);
                        if (idx === 0) onSetThrottle(val);
                      }}
                      className="w-full h-3 bg-[#171922] rounded appearance-none cursor-pointer accent-amber-500 border border-[#2f3347]"
                    />
                  </div>

                  {/* Individual Throttle Readouts */}
                  <div className="grid grid-cols-2 gap-1 text-[10px] font-mono text-slate-400 bg-[#12141d] p-1.5 rounded">
                    <div>Actual Speed:</div>
                    <div className="text-right text-amber-300 font-bold">{eng.throttle.toFixed(1)}%</div>
                    <div>Thrust:</div>
                    <div className="text-right text-emerald-400 font-bold">{eng.thrustKN.toFixed(1)} kN</div>
                    <div>N1 RPM:</div>
                    <div className="text-right text-sky-400">{eng.n1.toFixed(1)}%</div>
                    <div>EGT:</div>
                    <div className={`text-right font-bold ${eng.egt > profile.dangerEGT ? 'text-rose-400' : 'text-slate-200'}`}>
                      {Math.round(eng.egt)}°C
                    </div>
                  </div>

                  {/* Quick Detents for this Engine */}
                  <div className="grid grid-cols-4 gap-1 text-[10px] font-mono">
                    {[
                      { l: 'IDL', v: 20 },
                      { l: 'TAX', v: 35 },
                      { l: 'CRZ', v: 65 },
                      { l: 'TOGA', v: 100 }
                    ].map((d) => (
                      <button
                        key={d.l}
                        onClick={() => {
                          onSetIndividualThrottle?.(idx, d.v);
                          if (idx === 0) onSetThrottle(d.v);
                        }}
                        className="py-0.5 bg-[#141724] hover:bg-[#202538] border border-[#2b3248] rounded text-slate-300 text-center"
                      >
                        {d.l}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick-Select Thrust Preset Buttons Row */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
          <span className="flex items-center gap-1 text-sky-400 font-semibold uppercase">
            <Zap className="w-3.5 h-3.5 text-amber-400" /> Quick-Select Thrust Presets
          </span>
          <span>Fast target snapping during test runs</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {quickPresets.map((preset) => {
            const Icon = preset.icon;
            const isActive = Math.abs(sensors.targetThrottle - preset.value) < 1;
            return (
              <button
                key={preset.id}
                onClick={() => {
                  soundEngine.init();
                  onSetThrottle(preset.value);
                }}
                className={`group relative px-3 py-2 rounded border text-left transition-all duration-150 flex items-center justify-between ${
                  isActive
                    ? preset.activeColor
                    : `bg-[#14151b] border-[#2e303d] text-slate-300 ${preset.color} hover:bg-[#1f2029]`
                }`}
                title={`Snap throttle directly to ${preset.label} (${preset.value}%)`}
              >
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5 font-bold font-mono text-xs">
                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-inherit animate-pulse' : 'text-slate-400 group-hover:text-inherit'}`} />
                    <span>{preset.label}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono mt-0.5 truncate">
                    {preset.sublabel}
                  </span>
                </div>
                <span
                  className={`font-mono text-xs font-bold px-1.5 py-0.5 rounded border ${
                    isActive
                      ? 'bg-black/30 border-current'
                      : 'bg-[#1b1c23] border-[#383a4a] text-slate-400 group-hover:text-slate-200'
                  }`}
                >
                  {preset.value}%
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Throttle Lever & Detents */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center pt-1 border-t border-[#272935]">
        {/* Slider quadrant */}
        <div className="md:col-span-8 flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span>0% (CUTOFF)</span>
            <span>20% (IDLE)</span>
            <span>35% (TAXI)</span>
            <span>65% (CRZ)</span>
            <span>85% (CLB)</span>
            <span>100% (TOGA)</span>
            {profile.hasAfterburner && <span className="text-rose-400 font-bold">110% (AB)</span>}
          </div>

          <div className="relative py-2">
            <input
              type="range"
              min="0"
              max={maxThrottle}
              step="0.5"
              value={sensors.targetThrottle}
              onChange={(e) => {
                soundEngine.init();
                onSetThrottle(parseFloat(e.target.value));
              }}
              className="w-full h-3 bg-[#111215] rounded-lg appearance-none cursor-pointer accent-sky-500 border border-[#373949]"
            />

            {/* Visual detent tick lines */}
            <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 flex justify-between pointer-events-none px-1">
              {detents.map((d) => (
                <div
                  key={d.label}
                  className="w-0.5 h-4 bg-slate-600/70"
                  style={{ left: `${(d.value / maxThrottle) * 100}%` }}
                />
              ))}
            </div>
          </div>

          {/* Detent Quick Select Buttons */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {detents.map((d) => (
              <button
                key={d.label}
                onClick={() => {
                  soundEngine.init();
                  onSetThrottle(d.value);
                }}
                className={`px-2 py-0.5 text-xs font-mono font-medium rounded transition-colors border ${
                  Math.abs(sensors.targetThrottle - d.value) < 1
                    ? 'bg-sky-600 border-sky-400 text-white shadow-sm'
                    : 'bg-[#14151b] border-[#2e303d] text-slate-300 hover:bg-[#252733]'
                }`}
              >
                {d.label} ({d.value}%)
              </button>
            ))}
          </div>
        </div>

        {/* Speed Trim Step Buttons */}
        <div className="md:col-span-4 flex flex-col gap-1.5 border-l border-[#2e303d] pl-3">
          <div className="text-[11px] text-slate-400 font-mono">Speed Trim Adjustments</div>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={() => onSetThrottle(sensors.targetThrottle + 5)}
              className="px-2 py-1 bg-[#14151b] hover:bg-[#232530] border border-[#2e303d] text-slate-200 text-xs font-mono rounded flex items-center justify-center gap-1 transition-colors"
            >
              <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" /> +5% Spool
            </button>
            <button
              onClick={() => onSetThrottle(sensors.targetThrottle - 5)}
              className="px-2 py-1 bg-[#14151b] hover:bg-[#232530] border border-[#2e303d] text-slate-200 text-xs font-mono rounded flex items-center justify-center gap-1 transition-colors"
            >
              <ArrowDownRight className="w-3.5 h-3.5 text-amber-400" /> -5% Spool
            </button>
            <button
              onClick={() => onSetThrottle(20)}
              className="px-2 py-1 bg-[#14151b] hover:bg-[#232530] border border-[#2e303d] text-slate-200 text-xs font-mono rounded flex items-center justify-center gap-1 transition-colors"
            >
              <RotateCcw className="w-3 h-3 text-sky-400" /> Snap Idle
            </button>
            <button
              onClick={() => onSetThrottle(100)}
              className="px-2 py-1 bg-[#14151b] hover:bg-[#232530] border border-[#2e303d] text-slate-200 text-xs font-mono rounded flex items-center justify-center gap-1 transition-colors"
            >
              <Zap className="w-3 h-3 text-amber-400" /> Snap TOGA
            </button>
          </div>
        </div>
      </div>

      {/* Slew Rate & Thermal Spike Generator Bar */}
      <div className="flex flex-wrap items-center justify-between pt-2 border-t border-[#2e303d] text-xs">
        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-mono text-[11px]">Slew Rate (Dynamics):</span>
          <div className="flex items-center gap-1 bg-[#121317] p-0.5 rounded border border-[#2e303d]">
            {[
              { label: 'Normal FADEC (25%/s)', rate: 25 },
              { label: 'Instant Bench (160%/s)', rate: 160 },
              { label: 'Heavy Inertia (10%/s)', rate: 10 }
            ].map((sr) => (
              <button
                key={sr.rate}
                onClick={() => onSetSlewRate(sr.rate)}
                className={`px-2 py-0.5 text-[11px] rounded transition-colors ${
                  slewRate === sr.rate ? 'bg-sky-700 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {sr.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Direct Thermal Burst trigger */}
          <button
            onClick={handleTransientThermalBurst}
            className="px-2.5 py-1 bg-gradient-to-r from-amber-700/80 to-rose-700/80 hover:from-amber-600 hover:to-rose-600 border border-amber-500 text-white font-medium text-[11px] rounded flex items-center gap-1.5 transition-all shadow"
            title="Instantaneous 20% -> 100% -> 20% burst to induce EGT thermal spike"
          >
            <Flame className="w-3.5 h-3.5 text-amber-300" />
            <span>Induce Thermal Spike Burst</span>
          </button>

          {/* Reverse Thrust */}
          <button
            onClick={onToggleReverse}
            disabled={sensors.throttle > 25}
            className={`px-2.5 py-1 text-[11px] font-mono rounded border transition-colors ${
              sensors.reverseThrustActive
                ? 'bg-rose-900 border-rose-500 text-white animate-pulse'
                : sensors.throttle <= 25
                ? 'bg-[#14151b] border-[#2e303d] text-slate-300 hover:bg-[#252733]'
                : 'bg-[#14151b] border-[#202127] text-slate-600 cursor-not-allowed'
            }`}
            title={sensors.throttle > 25 ? 'Reverse thrust only deployable at idle (<=25%)' : 'Toggle thrust reverser cascades'}
          >
            Rev Thrust {sensors.reverseThrustActive ? '[DEPLOYED]' : '[STOWED]'}
          </button>
        </div>
      </div>
    </div>
  );
};

