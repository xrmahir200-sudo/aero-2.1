import React from 'react';
import { EngineSensors, EngineProfile } from '../types/engine';
import { Flame, Bell, VolumeX, ShieldAlert, CheckCircle, Droplet } from 'lucide-react';
import { soundEngine } from '../services/soundEngine';

interface CockpitAnnunciatorProps {
  sensors: EngineSensors;
  profile: EngineProfile;
  onDischargeBottle: (num: 1 | 2) => void;
}

export const CockpitAnnunciator: React.FC<CockpitAnnunciatorProps> = ({
  sensors,
  profile,
  onDischargeBottle
}) => {
  const isOvertemp = sensors.egt >= profile.dangerEGT;
  const isCautionTemp = sensors.egt >= profile.maxEGT && !isOvertemp;
  const isHighVib = sensors.vibrationIps >= 2.5;
  const isCriticalStall = sensors.stallMarginPercent <= 4.0;
  const isOverspeed = sensors.n2 > profile.maxRPM + 3;

  const hasMasterWarning = sensors.fireActive || isOvertemp || isHighVib || isCriticalStall || isOverspeed;
  const hasMasterCaution = isCautionTemp || sensors.thermalSpikeActive || (sensors.stallMarginPercent < 10 && !isCriticalStall);

  const handleAcknowledgeWarning = () => {
    soundEngine.stopMasterWarning();
  };

  return (
    <div className="bg-[#181920] border border-[#2b2d3a] rounded-sm p-2.5 text-slate-100 flex flex-col md:flex-row items-center justify-between gap-3">
      {/* 1. Master Warning & Caution Annunciators */}
      <div className="flex items-center gap-2">
        {/* Master Warning Pushbutton */}
        <button
          onClick={handleAcknowledgeWarning}
          className={`px-3 py-2 rounded-sm border font-mono font-bold text-xs flex items-center gap-1.5 transition-all select-none ${
            hasMasterWarning
              ? 'bg-rose-600 border-rose-300 text-white shadow-[0_0_15px_rgba(239,68,68,0.7)] animate-pulse'
              : 'bg-[#1e1416] border-[#441a1e] text-rose-900/60'
          }`}
          title="Click to acknowledge Master Warning audio"
        >
          <ShieldAlert className="w-4 h-4" />
          <span>MASTER WARNING</span>
        </button>

        {/* Master Caution Pushbutton */}
        <button
          onClick={() => {}}
          className={`px-3 py-2 rounded-sm border font-mono font-bold text-xs flex items-center gap-1.5 transition-all select-none ${
            hasMasterCaution
              ? 'bg-amber-500 border-amber-300 text-slate-950 shadow-[0_0_12px_rgba(245,158,11,0.6)] animate-pulse'
              : 'bg-[#201d14] border-[#4a3f1c] text-amber-900/50'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>MASTER CAUTION</span>
        </button>
      </div>

      {/* 2. Engine Fire T-Handle & Fire Bottles */}
      <div className="flex items-center gap-3 bg-[#121318] p-1.5 rounded border border-[#2b2d3a]">
        {/* Fire T-Handle */}
        <div
          className={`px-3 py-1.5 rounded border flex items-center gap-2 font-mono text-xs font-bold transition-all ${
            sensors.fireActive
              ? 'bg-red-600 border-red-300 text-white shadow-[0_0_20px_rgba(220,38,38,0.9)] animate-pulse'
              : 'bg-[#261618] border-[#4b2226] text-red-700/60'
          }`}
        >
          <Flame className={`w-4 h-4 ${sensors.fireActive ? 'animate-bounce text-amber-200' : ''}`} />
          <div className="flex flex-col text-left leading-tight">
            <span>ENG 1 FIRE</span>
            <span className="text-[9px] font-normal tracking-wide">
              {sensors.fireActive ? 'ALARM ACTIVE' : 'PULL TO ARM'}
            </span>
          </div>
        </div>

        {/* Halon Squib Discharge Buttons */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onDischargeBottle(1)}
            disabled={sensors.fireBottle1Discharged}
            className={`px-2.5 py-1 text-[11px] font-mono rounded border transition-colors flex items-center gap-1 ${
              sensors.fireBottle1Discharged
                ? 'bg-slate-800 border-slate-700 text-slate-500 cursor-not-allowed line-through'
                : sensors.fireActive
                ? 'bg-amber-600 hover:bg-amber-500 border-amber-300 text-slate-950 font-bold animate-pulse'
                : 'bg-[#1b1c22] border-[#373949] text-slate-300 hover:bg-[#282a36]'
            }`}
          >
            <Droplet className="w-3 h-3 text-sky-400" />
            <span>SQUIB 1 {sensors.fireBottle1Discharged ? '[DISCH]' : '[ARM]'}</span>
          </button>

          <button
            onClick={() => onDischargeBottle(2)}
            disabled={sensors.fireBottle2Discharged}
            className={`px-2.5 py-1 text-[11px] font-mono rounded border transition-colors flex items-center gap-1 ${
              sensors.fireBottle2Discharged
                ? 'bg-slate-800 border-slate-700 text-slate-500 cursor-not-allowed line-through'
                : sensors.fireActive
                ? 'bg-amber-600 hover:bg-amber-500 border-amber-300 text-slate-950 font-bold animate-pulse'
                : 'bg-[#1b1c22] border-[#373949] text-slate-300 hover:bg-[#282a36]'
            }`}
          >
            <Droplet className="w-3 h-3 text-sky-400" />
            <span>SQUIB 2 {sensors.fireBottle2Discharged ? '[DISCH]' : '[ARM]'}</span>
          </button>
        </div>
      </div>

      {/* 3. Active Annunciator Messages */}
      <div className="flex-1 flex items-center justify-end gap-2 overflow-x-auto">
        {sensors.fireActive && (
          <span className="px-2 py-0.5 bg-rose-950 border border-rose-600 text-rose-300 font-mono text-[10px] rounded font-bold">
            FIRE ENG 1
          </span>
        )}
        {isOvertemp && (
          <span className="px-2 py-0.5 bg-rose-950 border border-rose-600 text-rose-300 font-mono text-[10px] rounded font-bold">
            OVERTEMP ({Math.round(sensors.egt)}°C)
          </span>
        )}
        {sensors.thermalSpikeActive && (
          <span className="px-2 py-0.5 bg-amber-950 border border-amber-600 text-amber-300 font-mono text-[10px] rounded">
            THERMAL SPIKE (+{sensors.thermalSpikeDelta}°C)
          </span>
        )}
        {isCriticalStall && (
          <span className="px-2 py-0.5 bg-rose-950 border border-rose-600 text-rose-300 font-mono text-[10px] rounded">
            STALL SURGE ({sensors.stallMarginPercent}%)
          </span>
        )}
        {sensors.birdStrikeDamage > 0 && (
          <span className="px-2 py-0.5 bg-amber-950 border border-amber-600 text-amber-300 font-mono text-[10px] rounded">
            FOD DAMAGE (VIB: {sensors.vibrationIps} ips)
          </span>
        )}
        {!hasMasterWarning && !hasMasterCaution && (
          <span className="px-2 py-0.5 bg-emerald-950/60 border border-emerald-700/80 text-emerald-400 font-mono text-[10px] rounded flex items-center gap-1">
            <CheckCircle className="w-3 h-3" /> ALL SYSTEMS NORMAL
          </span>
        )}
      </div>
    </div>
  );
};
