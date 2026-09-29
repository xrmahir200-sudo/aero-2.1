import React, { useState } from 'react';
import { EngineProfile, EngineSensors } from '../types/engine';
import {
  Gauge,
  Flame,
  ShieldAlert,
  Droplet,
  Layers,
  Power,
  RotateCcw,
  Zap,
  Info,
  Sliders,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { soundEngine } from '../services/soundEngine';

interface A380ECAMMonitorProps {
  profile: EngineProfile;
  sensors: EngineSensors;
  multiEngineSensors: EngineSensors[];
  onSetThrottle: (val: number) => void;
  onEmergencyCutoff: () => void;
  onDischargeBottle: (num: 1 | 2) => void;
}

export const A380ECAMMonitor: React.FC<A380ECAMMonitorProps> = ({
  profile,
  sensors,
  multiEngineSensors,
  onSetThrottle,
  onEmergencyCutoff,
  onDischargeBottle
}) => {
  const [ecamPage, setEcamPage] = useState<'split' | 'ewd' | 'sd'>('split');
  const [engineMasterSwitches, setEngineMasterSwitches] = useState<boolean[]>([true, true, true, true]);

  const numEngines = profile.engineCount || 2;
  const engineList = multiEngineSensors.slice(0, numEngines);

  // Toggle individual engine master switch
  const toggleEngineMaster = (index: number) => {
    setEngineMasterSwitches((prev) => {
      const copy = [...prev];
      copy[index] = !copy[index];
      if (!copy[index]) {
        soundEngine.speak(`ENGINE ${index + 1} MASTER SWITCH OFF`);
      } else {
        soundEngine.speak(`ENGINE ${index + 1} MASTER SWITCH ON`);
      }
      return copy;
    });
  };

  // Determine Airbus thrust rating mode based on throttle
  const getThrustMode = () => {
    if (sensors.reverseThrustActive) return { text: 'REV MAX', color: 'text-amber-400' };
    if (sensors.throttle >= 98) return { text: 'MAN TOGA', color: 'text-white' };
    if (sensors.throttle >= 85) return { text: 'MAN FLX 45', color: 'text-cyan-400' };
    if (sensors.throttle >= 60) return { text: 'CLB', color: 'text-cyan-400' };
    if (sensors.throttle <= 22) return { text: 'IDLE', color: 'text-emerald-400' };
    return { text: 'MAN THR', color: 'text-cyan-400' };
  };

  const thrustMode = getThrustMode();

  return (
    <div className="flex flex-col h-full bg-[#0c0d11] text-slate-100 font-mono select-none overflow-y-auto p-2 sm:p-3 gap-3">
      {/* Top Airbus Cockpit Glareshield / ECAM Control Header */}
      <div className="bg-[#15171f] border border-[#272a38] rounded p-2.5 flex flex-wrap items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="px-2.5 py-1 bg-[#092233] border border-cyan-500/60 rounded text-cyan-300 font-bold text-xs tracking-wider flex items-center gap-1.5 shadow-sm">
            <Gauge className="w-3.5 h-3.5 text-cyan-400" />
            <span>{profile.aircraft.toUpperCase()}</span>
          </div>
          <div className="text-xs text-slate-300">
            <span className="text-slate-400">{profile.manufacturer}:</span>{' '}
            <span className="font-semibold text-slate-100">{profile.name}</span>
            <span className="text-slate-500 mx-2">|</span>
            <span className="text-emerald-400 font-bold">{numEngines} × {profile.type.toUpperCase()}</span>
          </div>
        </div>

        {/* ECAM Display Page Selectors */}
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-[11px] text-slate-400">ECAM VIEW:</span>
          <div className="flex items-center bg-[#0e1017] p-0.5 rounded border border-[#272a38]">
            {[
              { id: 'split', label: 'E/WD + SD SPLIT' },
              { id: 'ewd', label: 'UPPER E/WD ONLY' },
              { id: 'sd', label: 'LOWER SD ENGINE' }
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => setEcamPage(p.id as 'split' | 'ewd' | 'sd')}
                className={`px-2.5 py-1 text-[11px] rounded transition-colors ${
                  ecamPage === p.id
                    ? 'bg-cyan-700 text-white font-bold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main ECAM Instrument Housing (Simulated High-Definition CRT/LCD Displays) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 flex-1">
        {/* UPPER ECAM: ENGINE & WARNING DISPLAY (E/WD) */}
        {(ecamPage === 'split' || ecamPage === 'ewd') && (
          <div
            className={`${
              ecamPage === 'split' ? 'lg:col-span-7' : 'lg:col-span-12'
            } bg-[#07080b] border-2 border-[#222533] rounded-md p-3 flex flex-col justify-between shadow-2xl relative min-h-[460px]`}
          >
            {/* Display Bezel Top Bar with Thrust Mode Annunciation */}
            <div className="flex items-center justify-between border-b border-[#252838] pb-1.5 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-400 font-bold">AIRBUS E/WD</span>
                <span className={`px-2 py-0.5 bg-[#0e1724] border border-cyan-800 rounded font-bold ${thrustMode.color}`}>
                  {thrustMode.text}
                </span>
                <span className="text-[10px] text-emerald-400">A/THR: ACTIVE</span>
              </div>
              <div className="flex items-center gap-2 text-[11px]">
                <span className="text-slate-400">TAT:</span> <span className="text-cyan-300 font-bold">+18°C</span>
                <span className="text-slate-500">|</span>
                <span className="text-slate-400">SAT:</span> <span className="text-cyan-300 font-bold">+12°C</span>
                <span className="text-slate-500">|</span>
                <span className="text-slate-400">GW:</span> <span className="text-cyan-300 font-bold">482.5 T</span>
              </div>
            </div>

            {/* Multi-Engine Gauges Columns Container */}
            <div className={`grid ${numEngines === 4 ? 'grid-cols-4' : 'grid-cols-2'} gap-2 my-2 flex-1`}>
              {engineList.map((eng, idx) => {
                const isEngRunning = engineMasterSwitches[idx] && !eng.flameoutActive;
                const engN1 = isEngRunning ? eng.n1 : 4.2;
                const engEgt = isEngRunning ? eng.egt : 45;
                const engEpr = isEngRunning ? eng.epr : 1.0;
                const engFf = isEngRunning ? eng.fuelFlowKgH : 0;
                const engN2 = isEngRunning ? eng.n2 : 8.5;
                const engN3 = isEngRunning ? eng.n3 : 9.0;
                const targetTheta = (sensors.targetThrottle / 100) * 240; // command donut position

                return (
                  <div
                    key={idx}
                    className="flex flex-col items-center bg-[#090b0e] border border-[#1d202d] rounded p-2 text-center relative"
                  >
                    {/* Engine Identifier Label */}
                    <div className="flex items-center justify-between w-full border-b border-[#1c1f2b] pb-1 mb-1 text-[11px]">
                      <span className="font-bold text-white px-1.5 py-0.5 bg-[#171b29] rounded">
                        ENG {idx + 1}
                      </span>
                      {eng.fireActive && (
                        <span className="text-rose-500 font-bold text-[10px] animate-pulse">FIRE</span>
                      )}
                      {eng.reverseThrustActive && (
                        <span className="text-emerald-400 font-bold text-[10px]">REV</span>
                      )}
                    </div>

                    {/* 1. PRIMARY GAUGE: EPR (A380) or N1 % (A320/B787/B737) or TORQUE % (ATR72) */}
                    <div className="flex flex-col items-center my-1 relative">
                      <div className="text-[10px] text-cyan-400 font-bold">
                        {profile.eprRated ? 'E.P.R.' : profile.torqueRated ? 'TORQUE %' : 'N1 %'}
                      </div>

                      {/* Circular Gauge Graphic (SVG) */}
                      <svg width="104" height="104" viewBox="0 0 100 100" className="overflow-visible">
                        {/* Background scale arc */}
                        <circle
                          cx="50"
                          cy="50"
                          r="38"
                          fill="none"
                          stroke="#202538"
                          strokeWidth="4"
                          strokeDasharray="180 360"
                          transform="rotate(135 50 50)"
                        />
                        {/* Redline Limit Arc */}
                        <circle
                          cx="50"
                          cy="50"
                          r="38"
                          fill="none"
                          stroke="#ef4444"
                          strokeWidth="5"
                          strokeDasharray="25 360"
                          strokeDashoffset="-155"
                          transform="rotate(135 50 50)"
                        />
                        {/* Amber Transient Caution Line */}
                        <circle
                          cx="50"
                          cy="50"
                          r="38"
                          fill="none"
                          stroke="#f59e0b"
                          strokeWidth="4"
                          strokeDasharray="15 360"
                          strokeDashoffset="-140"
                          transform="rotate(135 50 50)"
                        />
                        {/* Actual Value Needle (Airbus bright green) */}
                        {(() => {
                          const valFrac = profile.eprRated
                            ? Math.max(0, Math.min(1, (engEpr - 1.0) / 0.65))
                            : profile.torqueRated
                            ? Math.max(0, Math.min(1, eng.torquePercent / 105))
                            : Math.max(0, Math.min(1, engN1 / 105));
                          const deg = 135 + valFrac * 220;
                          const rad = (deg * Math.PI) / 180;
                          const x2 = 50 + Math.cos(rad) * 32;
                          const y2 = 50 + Math.sin(rad) * 32;
                          return (
                            <line
                              x1="50"
                              y1="50"
                              x2={x2}
                              y2={y2}
                              stroke="#22c55e"
                              strokeWidth="3"
                              strokeLinecap="round"
                            />
                          );
                        })()}

                        {/* Transient Command Donut (Airbus Cyan Circle at target) */}
                        {(() => {
                          const cmdFrac = sensors.targetThrottle / 100;
                          const cmdDeg = 135 + cmdFrac * 220;
                          const cmdRad = (cmdDeg * Math.PI) / 180;
                          const cx = 50 + Math.cos(cmdRad) * 38;
                          const cy = 50 + Math.sin(cmdRad) * 38;
                          return (
                            <circle
                              cx={cx}
                              cy={cy}
                              r="4.5"
                              fill="none"
                              stroke="#06b6d4"
                              strokeWidth="2.5"
                            />
                          );
                        })()}

                        {/* Center Hub */}
                        <circle cx="50" cy="50" r="4" fill="#64748b" />
                      </svg>

                      {/* Digital Readout Center Box */}
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 mt-3 bg-[#0a0c10] border border-[#272c3d] px-1.5 py-0.5 rounded text-xs font-bold text-emerald-400">
                        {profile.eprRated
                          ? engEpr.toFixed(2)
                          : profile.torqueRated
                          ? `${eng.torquePercent.toFixed(1)}%`
                          : `${engN1.toFixed(1)}%`}
                      </div>
                    </div>

                    {/* 2. EGT / ITT TEMPERATURE GAUGE */}
                    <div className="flex flex-col items-center my-1 w-full border-t border-[#181a24] pt-1">
                      <div className="flex items-center justify-between w-full px-2 text-[10px]">
                        <span className="text-slate-400 font-bold">
                          {profile.isTurboprop ? 'I.T.T. °C' : 'E.G.T. °C'}
                        </span>
                        <span
                          className={`font-bold ${
                            engEgt >= profile.dangerEGT
                              ? 'text-rose-400 animate-pulse'
                              : engEgt >= profile.maxEGT
                              ? 'text-amber-400'
                              : 'text-emerald-400'
                          }`}
                        >
                          {engEgt}°
                        </span>
                      </div>

                      {/* EGT Horizontal Bar Gauge */}
                      <div className="w-full bg-[#171a25] h-2.5 rounded-sm overflow-hidden my-0.5 relative">
                        <div
                          className={`h-full transition-all duration-100 ${
                            engEgt >= profile.dangerEGT
                              ? 'bg-rose-500'
                              : engEgt >= profile.maxEGT
                              ? 'bg-amber-400'
                              : 'bg-emerald-400'
                          }`}
                          style={{
                            width: `${Math.min(100, Math.max(0, (engEgt / profile.dangerEGT) * 100))}%`
                          }}
                        />
                        {/* Max EGT marker */}
                        <div
                          className="absolute top-0 bottom-0 w-0.5 bg-amber-400"
                          style={{ left: `${(profile.maxEGT / profile.dangerEGT) * 100}%` }}
                        />
                      </div>
                    </div>

                    {/* 3. CORE SPOOL SPEED (N2 % & N3 % for 3-spool Trent 900) */}
                    <div className="w-full bg-[#0a0c10] border border-[#1b1e2a] rounded px-1.5 py-1 text-[11px] my-1 text-left">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 text-[10px]">N2 %:</span>
                        <span className="text-emerald-400 font-bold">{engN2.toFixed(1)}</span>
                      </div>
                      {profile.spools === 3 && (
                        <div className="flex items-center justify-between mt-0.5">
                          <span className="text-cyan-400 text-[10px]">N3 % (HP):</span>
                          <span className="text-cyan-300 font-bold">{engN3.toFixed(1)}</span>
                        </div>
                      )}
                      {profile.isTurboprop && (
                        <div className="flex items-center justify-between mt-0.5">
                          <span className="text-amber-400 text-[10px]">NP RPM:</span>
                          <span className="text-amber-300 font-bold">{eng.propellerRPM}</span>
                        </div>
                      )}
                    </div>

                    {/* 4. FUEL FLOW (F.F. KG/H) */}
                    <div className="w-full flex items-center justify-between px-1.5 text-[10px] text-slate-300 border-t border-[#181a24] pt-1">
                      <span className="text-slate-400">F.F.:</span>
                      <span className="font-bold text-white">{engFf} KG/H</span>
                    </div>

                    {/* Individual Engine Master Switch Button */}
                    <div className="mt-2 w-full pt-1.5 border-t border-[#1b1e2a]">
                      <button
                        onClick={() => toggleEngineMaster(idx)}
                        className={`w-full py-1 text-[10px] font-bold rounded flex items-center justify-center gap-1 border transition-colors ${
                          engineMasterSwitches[idx]
                            ? 'bg-emerald-950/80 border-emerald-600 text-emerald-300 hover:bg-emerald-900'
                            : 'bg-rose-950/80 border-rose-600 text-rose-300 hover:bg-rose-900'
                        }`}
                      >
                        <Power className="w-3 h-3" />
                        <span>ENG {idx + 1} {engineMasterSwitches[idx] ? 'MASTER ON' : 'OFF'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Airbus ECAM Memo & Failure Annunciation Tape */}
            <div className="bg-[#050608] border border-[#1e2230] rounded p-2 text-xs font-mono grid grid-cols-1 sm:grid-cols-2 gap-2 mt-auto">
              {/* Left Column: Failure Alerts & Directives */}
              <div className="flex flex-col gap-0.5">
                {sensors.fireActive && (
                  <div className="text-rose-400 font-bold animate-pulse flex items-center gap-1">
                    <ShieldAlert className="w-3.5 h-3.5" /> ENG 1 FIRE
                  </div>
                )}
                {sensors.fireActive && (
                  <div className="text-amber-300 text-[10px] pl-4">
                    - THR LEVER 1 ... IDLE<br />
                    - ENG 1 MASTER ... OFF<br />
                    - SQUIB 1 ... DISCH
                  </div>
                )}
                {sensors.egt >= profile.dangerEGT && (
                  <div className="text-rose-400 font-bold flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> ENG OVERTEMP DETECTED
                  </div>
                )}
                {sensors.thermalSpikeActive && (
                  <div className="text-amber-400 text-[11px]">
                    CAUTION: TRANSIENT THERMAL SPIKE (+{sensors.thermalSpikeDelta}°C)
                  </div>
                )}
                {sensors.stallMarginPercent < 6 && (
                  <div className="text-rose-400 text-[11px] font-bold">
                    COMPRESSOR STALL SURGE MARGIN CRITICAL
                  </div>
                )}
                {!sensors.fireActive && sensors.egt < profile.maxEGT && sensors.stallMarginPercent >= 6 && (
                  <div className="text-emerald-400 text-[11px] flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> NO ABNORMAL ECAM ACTIONS
                  </div>
                )}
              </div>

              {/* Right Column: Normal Operational Airbus Memos */}
              <div className="text-right text-[11px] text-emerald-400 flex flex-col justify-end gap-0.5">
                <span className="text-slate-400 text-[10px]">ECAM MEMO</span>
                <span>AUTO FLT A/THR</span>
                <span>{numEngines === 4 ? 'ENG 1+2+3+4 RUNNING' : 'ENG 1+2 RUNNING'}</span>
                <span className="text-cyan-300">TCAS STBY</span>
                <span className="text-cyan-300">PRED W/S SYS</span>
                <span className="text-slate-400">APU GEN OFF</span>
              </div>
            </div>
          </div>
        )}

        {/* LOWER ECAM: SYSTEM DISPLAY (SD) - ENGINE PAGE */}
        {(ecamPage === 'split' || ecamPage === 'sd') && (
          <div
            className={`${
              ecamPage === 'split' ? 'lg:col-span-5' : 'lg:col-span-12'
            } bg-[#07080b] border-2 border-[#222533] rounded-md p-3 flex flex-col justify-between shadow-2xl relative min-h-[460px]`}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#252838] pb-1.5 text-xs">
              <span className="font-bold text-white flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                <span>AIRBUS SYSTEM DISPLAY - ENGINE</span>
              </span>
              <span className="text-[10px] text-slate-400">FADEC DUAL BTM</span>
            </div>

            {/* Engine Subsystems Table */}
            <div className="flex flex-col gap-3 my-2 flex-1">
              {/* 1. Oil System Status */}
              <div className="bg-[#090b0e] border border-[#1b1e2a] rounded p-2 text-xs">
                <div className="text-[10px] text-cyan-400 font-bold border-b border-[#181a24] pb-1 mb-1.5 flex items-center justify-between">
                  <span>OIL SYSTEM (QT / PSI / °C)</span>
                  <span className="text-emerald-400 font-normal">SENSORS NOMINAL</span>
                </div>
                <div className="grid grid-cols-4 gap-1 text-[11px] text-center">
                  <div className="text-slate-400 text-left">ENGINE:</div>
                  <div className="text-slate-400">QTY (QT)</div>
                  <div className="text-slate-400">PRESS (PSI)</div>
                  <div className="text-slate-400">TEMP (°C)</div>

                  {engineList.map((eng, idx) => (
                    <React.Fragment key={idx}>
                      <div className="text-left font-bold text-white">ENG {idx + 1}</div>
                      <div className="text-emerald-400 font-bold">{eng.oilQuantityQt}</div>
                      <div className={`font-bold ${eng.oilPressurePSI < 40 ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {Math.round(eng.oilPressurePSI)}
                      </div>
                      <div className={`font-bold ${eng.oilTempC > 105 ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {eng.oilTempC}°
                      </div>
                    </React.Fragment>
                  ))}
                </div>
              </div>

              {/* 2. Vibration Spectrum (VIB N1 / N2 / N3) */}
              <div className="bg-[#090b0e] border border-[#1b1e2a] rounded p-2 text-xs">
                <div className="text-[10px] text-cyan-400 font-bold border-b border-[#181a24] pb-1 mb-1.5 flex items-center justify-between">
                  <span>ROTOR VIBRATION (IPS)</span>
                  <span className="text-slate-400 font-normal">MAX TOLERANCE: 2.5</span>
                </div>
                <div className="grid grid-cols-3 gap-1 text-[11px] text-center">
                  <div className="text-slate-400 text-left">ENGINE</div>
                  <div className="text-slate-400">VIB N1 (FAN)</div>
                  <div className="text-slate-400">VIB N2 (CORE)</div>

                  {engineList.map((eng, idx) => (
                    <React.Fragment key={idx}>
                      <div className="text-left font-bold text-white">ENG {idx + 1}</div>
                      <div className={`font-bold ${eng.vibrationIps > 2.5 ? 'text-rose-400 animate-pulse' : 'text-emerald-400'}`}>
                        {eng.vibrationIps.toFixed(2)}
                      </div>
                      <div className="text-emerald-400 font-bold">
                        {(eng.vibrationIps * 0.85).toFixed(2)}
                      </div>
                    </React.Fragment>
                  ))}
                </div>
              </div>

              {/* 3. Nacelle Compartment Temperature & Fire Squibs */}
              <div className="bg-[#090b0e] border border-[#1b1e2a] rounded p-2 text-xs">
                <div className="text-[10px] text-cyan-400 font-bold border-b border-[#181a24] pb-1 mb-1.5 flex items-center justify-between">
                  <span>NACELLE COMPARTMENT & FIRE PROTECTION</span>
                  <span className="text-slate-400 font-normal">HALON SQUIB STATUS</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-[11px]">
                  {engineList.map((eng, idx) => (
                    <div key={idx} className="p-1.5 bg-[#0e1117] rounded border border-[#222738]">
                      <div className="text-[10px] text-slate-400">ENG {idx + 1} NACELLE</div>
                      <div className={`text-base font-bold my-0.5 ${eng.nacelleTempC > 150 ? 'text-rose-400 animate-pulse' : 'text-emerald-400'}`}>
                        {eng.nacelleTempC}°C
                      </div>
                      <div className="text-[9px] text-slate-400">
                        {sensors.fireBottle1Discharged ? (
                          <span className="text-amber-400 font-bold">BOTTLE 1 DISCH</span>
                        ) : (
                          <span className="text-slate-400">BOTTLES ARMED</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 4. Bleed Air & FADEC Status */}
              <div className="bg-[#090b0e] border border-[#1b1e2a] rounded p-2 text-xs font-mono text-slate-300">
                <div className="flex items-center justify-between text-[11px]">
                  <span>EEC / FADEC CHANNELS:</span>
                  <span className="text-emerald-400 font-bold">CHA / CHB ACTIVE</span>
                </div>
                <div className="flex items-center justify-between text-[11px] mt-1">
                  <span>HIGH-PRESSURE BLEED VALVES:</span>
                  <span className="text-cyan-300 font-bold">STAGE 7 / STAGE 10 CLOSED</span>
                </div>
                <div className="flex items-center justify-between text-[11px] mt-1">
                  <span>AIRBUS THRUST SPECIFIC FUEL CONS:</span>
                  <span className="text-amber-300 font-bold">{sensors.tsfc.toFixed(2)} g/kN·s</span>
                </div>
              </div>
            </div>

            {/* Quick Fire Extinguish Controls for ECAM Page */}
            <div className="pt-2 border-t border-[#1b1e2a] flex items-center justify-between">
              <span className="text-[11px] text-slate-400">HALON SUPPRESSION:</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onDischargeBottle(1)}
                  disabled={sensors.fireBottle1Discharged}
                  className={`px-3 py-1 text-xs rounded border transition-colors ${
                    sensors.fireBottle1Discharged
                      ? 'bg-slate-800 border-slate-700 text-slate-500 cursor-not-allowed line-through'
                      : sensors.fireActive
                      ? 'bg-rose-600 hover:bg-rose-500 text-white font-bold animate-pulse'
                      : 'bg-[#1b1e2b] border-[#343a4e] text-slate-300 hover:bg-[#282d40]'
                  }`}
                >
                  DISCH BOTTLE 1
                </button>
                <button
                  onClick={() => onDischargeBottle(2)}
                  disabled={sensors.fireBottle2Discharged}
                  className={`px-3 py-1 text-xs rounded border transition-colors ${
                    sensors.fireBottle2Discharged
                      ? 'bg-slate-800 border-slate-700 text-slate-500 cursor-not-allowed line-through'
                      : sensors.fireActive
                      ? 'bg-rose-600 hover:bg-rose-500 text-white font-bold animate-pulse'
                      : 'bg-[#1b1e2b] border-[#343a4e] text-slate-300 hover:bg-[#282d40]'
                  }`}
                >
                  DISCH BOTTLE 2
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
