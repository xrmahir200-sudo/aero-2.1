import React, { useState, useEffect } from 'react';
import {
  Minus,
  Square,
  Copy,
  X,
  Plane,
  Volume2,
  VolumeX,
  ShieldAlert,
  FileSpreadsheet,
  Download,
  Flame,
  Radio,
  Clock,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { EngineType, TestProtocolId, ViewTab } from '../types/engine';
import { soundEngine } from '../services/soundEngine';

interface Windows10WindowProps {
  title?: string;
  activeView: ViewTab;
  setActiveView: (tab: ViewTab) => void;
  activeEngine: EngineType;
  setActiveEngine: (engine: EngineType) => void;
  activeTest: TestProtocolId;
  setActiveTest: (test: TestProtocolId) => void;
  onReset: () => void;
  onEmergencyCutoff: () => void;
  onExportCSV: () => void;
  onExportJSON: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  volume: number;
  onVolumeChange: (v: number) => void;
  children: React.ReactNode;
}

export const Windows10Window: React.FC<Windows10WindowProps> = ({
  title = 'AeroTest Pro - Jet Engine Simulation & Test Bench [WIN10-x64]',
  activeView,
  setActiveView,
  activeEngine,
  setActiveEngine,
  activeTest,
  setActiveTest,
  onReset,
  onEmergencyCutoff,
  onExportCSV,
  onExportJSON,
  isMuted,
  onToggleMute,
  volume,
  onVolumeChange,
  children
}) => {
  const [isMaximized, setIsMaximized] = useState(true);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-US', {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown menu when clicking outside
  useEffect(() => {
    const handleClick = () => setActiveMenu(null);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  const handleMenuClick = (e: React.MouseEvent, menuName: string) => {
    e.stopPropagation();
    setActiveMenu(activeMenu === menuName ? null : menuName);
  };

  return (
    <div
      className={`flex flex-col bg-[#1e1e1e] text-slate-100 font-sans select-none overflow-hidden border border-[#333333] shadow-2xl transition-all duration-150 ${
        isMaximized
          ? 'fixed inset-0 w-screen h-screen rounded-none'
          : 'relative w-[96vw] max-w-[1580px] h-[92vh] max-h-[1000px] mx-auto my-3 rounded-md'
      }`}
      style={{ fontFamily: "'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif" }}
    >
      {/* 1. Classic Windows 10 Title Bar */}
      <div className="flex items-center justify-between h-8 bg-[#1f1f1f] text-slate-300 border-b border-[#2d2d2d] px-2 text-xs select-none">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-sm bg-gradient-to-br from-amber-500 to-sky-600 flex items-center justify-center text-slate-950 font-bold text-[10px]">
            <Plane className="w-3 h-3 text-white" />
          </div>
          <span className="font-medium tracking-wide text-slate-200 truncate">{title}</span>
          <span className="hidden sm:inline text-slate-500">|</span>
          <span className="hidden sm:inline text-[11px] text-emerald-400 font-mono">
            {activeEngine === 'a380_trent900'
              ? 'Airbus A380-800 [RR Trent 900 Quad]'
              : activeEngine === 'a320_leap1a'
              ? 'Airbus A320neo [CFM LEAP-1A]'
              : activeEngine === 'b787_genx'
              ? 'Boeing 787-9 [GE GEnx-1B Bleedless]'
              : activeEngine === 'b737_leap1b'
              ? 'Boeing 737 MAX [CFM LEAP-1B]'
              : activeEngine === 'atr72_pw127'
              ? 'ATR 72-600 [P&WC PW127M Turboprop]'
              : activeEngine === 'f119_military'
              ? 'F-22 Raptor [PW-F119 Afterburner]'
              : 'Turbofan Test Bench [Dual-Spool]'}
          </span>
        </div>

        {/* Windows 10 Window Control Buttons */}
        <div className="flex items-center h-full -mr-2">
          <button
            onClick={() => {}}
            title="Minimize"
            className="w-11 h-8 flex items-center justify-center hover:bg-[#333333] active:bg-[#444444] transition-colors"
          >
            <Minus className="w-3.5 h-3.5 text-slate-300" />
          </button>
          <button
            onClick={() => setIsMaximized(!isMaximized)}
            title={isMaximized ? 'Restore Down' : 'Maximize'}
            className="w-11 h-8 flex items-center justify-center hover:bg-[#333333] active:bg-[#444444] transition-colors"
          >
            {isMaximized ? (
              <Copy className="w-3 h-3 text-slate-300 transform rotate-180" />
            ) : (
              <Square className="w-3 h-3 text-slate-300" />
            )}
          </button>
          <button
            onClick={() => {
              if (window.confirm('Close AeroTest Pro test bench simulation?')) {
                onReset();
              }
            }}
            title="Close"
            className="w-11 h-8 flex items-center justify-center hover:bg-[#e81123] hover:text-white active:bg-[#c90d1d] transition-colors"
          >
            <X className="w-4 h-4 text-slate-300" />
          </button>
        </div>
      </div>

      {/* 2. Classic Windows 10 Menu Bar */}
      <div className="flex items-center justify-between bg-[#252526] border-b border-[#333333] px-2 py-0.5 text-xs text-slate-300 relative z-40">
        <div className="flex items-center gap-0.5">
          {/* File Menu */}
          <div className="relative">
            <button
              onClick={(e) => handleMenuClick(e, 'file')}
              className={`px-2.5 py-1 rounded-sm hover:bg-[#37373d] transition-colors ${
                activeMenu === 'file' ? 'bg-[#37373d]' : ''
              }`}
            >
              File
            </button>
            {activeMenu === 'file' && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute left-0 top-full mt-0.5 w-56 bg-[#252526] border border-[#3e3e42] shadow-xl py-1 rounded-sm text-xs"
              >
                <button
                  onClick={() => {
                    onExportCSV();
                    setActiveMenu(null);
                  }}
                  className="w-full text-left px-4 py-1.5 hover:bg-[#094771] flex items-center justify-between"
                >
                  <span className="flex items-center gap-2">
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" /> Export Telemetry CSV
                  </span>
                  <span className="text-[10px] text-slate-400">Ctrl+E</span>
                </button>
                <button
                  onClick={() => {
                    onExportJSON();
                    setActiveMenu(null);
                  }}
                  className="w-full text-left px-4 py-1.5 hover:bg-[#094771] flex items-center justify-between"
                >
                  <span className="flex items-center gap-2">
                    <Download className="w-3.5 h-3.5 text-sky-400" /> Export JSON Report
                  </span>
                  <span className="text-[10px] text-slate-400">Ctrl+J</span>
                </button>
                <div className="my-1 border-t border-[#3e3e42]" />
                <button
                  onClick={() => {
                    onReset();
                    setActiveMenu(null);
                  }}
                  className="w-full text-left px-4 py-1.5 hover:bg-[#094771] flex items-center gap-2"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-amber-400" /> Reset Simulation State
                </button>
              </div>
            )}
          </div>

          {/* Test Protocols Menu */}
          <div className="relative">
            <button
              onClick={(e) => handleMenuClick(e, 'protocols')}
              className={`px-2.5 py-1 rounded-sm hover:bg-[#37373d] transition-colors ${
                activeMenu === 'protocols' ? 'bg-[#37373d]' : ''
              }`}
            >
              Test Protocols
            </button>
            {activeMenu === 'protocols' && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute left-0 top-full mt-0.5 w-64 bg-[#252526] border border-[#3e3e42] shadow-xl py-1 rounded-sm text-xs"
              >
                {[
                  { id: 'manual_sweep', name: 'Manual Throttle & Speed Sweep' },
                  { id: 'thermal_spike', name: 'Thermal Spike & Transient Shock' },
                  { id: 'compressor_stall', name: 'Compressor Stall & Surge Test' },
                  { id: 'bird_strike', name: 'Bird Ingestion & FOD Damage' },
                  { id: 'overtemp_rupture', name: 'Overtemp Rupture Limit' },
                  { id: 'water_ingestion', name: 'Severe Weather Water Ingestion' },
                  { id: 'flameout_restart', name: 'Flameout & Windmill Relight' },
                  { id: 'engine_fire', name: 'Engine Nacelle Fire & Halon' }
                ].map((test) => (
                  <button
                    key={test.id}
                    onClick={() => {
                      setActiveTest(test.id as TestProtocolId);
                      setActiveMenu(null);
                    }}
                    className={`w-full text-left px-4 py-1.5 hover:bg-[#094771] flex items-center justify-between ${
                      activeTest === test.id ? 'text-amber-400 font-medium' : ''
                    }`}
                  >
                    <span>{test.name}</span>
                    {activeTest === test.id && <span className="text-[10px]">●</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Engine Models Menu */}
          <div className="relative">
            <button
              onClick={(e) => handleMenuClick(e, 'engines')}
              className={`px-2.5 py-1 rounded-sm hover:bg-[#37373d] transition-colors ${
                activeMenu === 'engines' ? 'bg-[#37373d]' : ''
              }`}
            >
              Aircraft & Engines
            </button>
            {activeMenu === 'engines' && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute left-0 top-full mt-0.5 w-72 bg-[#252526] border border-[#3e3e42] shadow-xl py-1 rounded-sm text-xs max-h-96 overflow-y-auto"
              >
                <div className="px-3 py-1 text-[10px] text-slate-400 font-mono border-b border-[#333542] uppercase">
                  Airliners & Commercial Fleets
                </div>
                <button
                  onClick={() => {
                    setActiveEngine('a380_trent900');
                    setActiveMenu(null);
                  }}
                  className={`w-full text-left px-4 py-1.5 hover:bg-[#094771] flex items-center justify-between ${
                    activeEngine === 'a380_trent900' ? 'text-cyan-400 font-bold' : ''
                  }`}
                >
                  <div>
                    <div className="font-semibold">Airbus A380-800</div>
                    <div className="text-[10px] text-slate-400">RR Trent 900 (Quad 4×, Triple-Spool)</div>
                  </div>
                  {activeEngine === 'a380_trent900' && <span className="text-[10px]">●</span>}
                </button>
                <button
                  onClick={() => {
                    setActiveEngine('a320_leap1a');
                    setActiveMenu(null);
                  }}
                  className={`w-full text-left px-4 py-1.5 hover:bg-[#094771] flex items-center justify-between ${
                    activeEngine === 'a320_leap1a' ? 'text-emerald-400 font-bold' : ''
                  }`}
                >
                  <div>
                    <div className="font-semibold">Airbus A320neo</div>
                    <div className="text-[10px] text-slate-400">CFM LEAP-1A-26 (BPR 11:1)</div>
                  </div>
                  {activeEngine === 'a320_leap1a' && <span className="text-[10px]">●</span>}
                </button>
                <button
                  onClick={() => {
                    setActiveEngine('b787_genx');
                    setActiveMenu(null);
                  }}
                  className={`w-full text-left px-4 py-1.5 hover:bg-[#094771] flex items-center justify-between ${
                    activeEngine === 'b787_genx' ? 'text-sky-400 font-bold' : ''
                  }`}
                >
                  <div>
                    <div className="font-semibold">Boeing 787-9 Dreamliner</div>
                    <div className="text-[10px] text-slate-400">GE GEnx-1B70 (Bleedless Chevrons)</div>
                  </div>
                  {activeEngine === 'b787_genx' && <span className="text-[10px]">●</span>}
                </button>
                <button
                  onClick={() => {
                    setActiveEngine('b737_leap1b');
                    setActiveMenu(null);
                  }}
                  className={`w-full text-left px-4 py-1.5 hover:bg-[#094771] flex items-center justify-between ${
                    activeEngine === 'b737_leap1b' ? 'text-amber-400 font-bold' : ''
                  }`}
                >
                  <div>
                    <div className="font-semibold">Boeing 737 MAX</div>
                    <div className="text-[10px] text-slate-400">CFM LEAP-1B28 (Flat-Bottom Nacelle)</div>
                  </div>
                  {activeEngine === 'b737_leap1b' && <span className="text-[10px]">●</span>}
                </button>
                <button
                  onClick={() => {
                    setActiveEngine('atr72_pw127');
                    setActiveMenu(null);
                  }}
                  className={`w-full text-left px-4 py-1.5 hover:bg-[#094771] flex items-center justify-between ${
                    activeEngine === 'atr72_pw127' ? 'text-indigo-400 font-bold' : ''
                  }`}
                >
                  <div>
                    <div className="font-semibold">ATR 72-600 Turboprop</div>
                    <div className="text-[10px] text-slate-400">P&WC PW127M (2750 SHP / 1200 NP)</div>
                  </div>
                  {activeEngine === 'atr72_pw127' && <span className="text-[10px]">●</span>}
                </button>

                <div className="px-3 py-1 text-[10px] text-slate-400 font-mono border-y border-[#333542] uppercase mt-1">
                  Military & Experimental
                </div>
                <button
                  onClick={() => {
                    setActiveEngine('f119_military');
                    setActiveMenu(null);
                  }}
                  className={`w-full text-left px-4 py-1.5 hover:bg-[#094771] flex items-center justify-between ${
                    activeEngine === 'f119_military' ? 'text-rose-400 font-bold' : ''
                  }`}
                >
                  <div>
                    <div className="font-semibold">F-22 Raptor (PW-F119)</div>
                    <div className="text-[10px] text-slate-400">Augmented Reheat Supersonic</div>
                  </div>
                  {activeEngine === 'f119_military' && <span className="text-[10px]">●</span>}
                </button>
              </div>
            )}
          </div>

          {/* Audio Diagnostics Menu */}
          <div className="relative">
            <button
              onClick={(e) => handleMenuClick(e, 'audio')}
              className={`px-2.5 py-1 rounded-sm hover:bg-[#37373d] transition-colors ${
                activeMenu === 'audio' ? 'bg-[#37373d]' : ''
              }`}
            >
              Acoustics & Alarms
            </button>
            {activeMenu === 'audio' && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute left-0 top-full mt-0.5 w-60 bg-[#252526] border border-[#3e3e42] shadow-xl py-1 rounded-sm text-xs"
              >
                <button
                  onClick={() => {
                    onToggleMute();
                    setActiveMenu(null);
                  }}
                  className="w-full text-left px-4 py-1.5 hover:bg-[#094771] flex items-center justify-between"
                >
                  <span>Master Audio {isMuted ? 'Muted' : 'Enabled'}</span>
                  {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
                </button>
                <button
                  onClick={() => {
                    soundEngine.init();
                    soundEngine.playMasterCaution();
                    setActiveMenu(null);
                  }}
                  className="w-full text-left px-4 py-1.5 hover:bg-[#094771] flex items-center gap-2"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Test Master Caution Chime
                </button>
                <button
                  onClick={() => {
                    soundEngine.init();
                    soundEngine.startMasterWarning();
                    setTimeout(() => soundEngine.stopMasterWarning(), 1800);
                    setActiveMenu(null);
                  }}
                  className="w-full text-left px-4 py-1.5 hover:bg-[#094771] flex items-center gap-2"
                >
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-400" /> Test Warning Klaxon (2s)
                </button>
                <button
                  onClick={() => {
                    soundEngine.init();
                    soundEngine.startFireAlarm();
                    setTimeout(() => soundEngine.stopFireAlarm(), 2000);
                    setActiveMenu(null);
                  }}
                  className="w-full text-left px-4 py-1.5 hover:bg-[#094771] flex items-center gap-2 text-rose-400"
                >
                  <Flame className="w-3.5 h-3.5" /> Test Nacelle Fire Alarm Bell
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Audio Volume Slider & Quick Indicators */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-[#1b1b1c] px-2 py-0.5 rounded border border-[#333333]">
            <button
              onClick={onToggleMute}
              className="text-slate-400 hover:text-slate-200 transition-colors"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? (
                <VolumeX className="w-3.5 h-3.5 text-rose-400" />
              ) : (
                <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
              className="w-16 h-1 accent-sky-500 bg-slate-700 cursor-pointer"
              title={`Acoustic Master Volume: ${Math.round(volume * 100)}%`}
            />
            <span className="text-[10px] font-mono text-slate-400 w-7">{Math.round(volume * 100)}%</span>
          </div>

          <button
            onClick={onEmergencyCutoff}
            className="px-2.5 py-0.5 bg-rose-950/80 hover:bg-rose-900 border border-rose-700 text-rose-200 rounded text-[11px] font-medium flex items-center gap-1 transition-colors"
          >
            <ShieldAlert className="w-3 h-3 text-rose-400" /> Emergency Cutoff
          </button>
        </div>
      </div>

      {/* 3. Navigation View Bar */}
      <div className="flex items-center justify-between bg-[#2d2d30] border-b border-[#3e3e42] px-3 py-1">
        <div className="flex items-center gap-1">
          {[
            { id: 'test_cell', label: 'Engine Test Cell & Cutaway' },
            { id: 'a380_ecam', label: 'A380 ECAM Engine Monitor' },
            { id: 'telemetry', label: 'Real-Time Oscilloscope' },
            { id: 'compressor_map', label: 'Compressor Performance Map' },
            { id: 'protocols', label: 'Test Protocol Suite' },
            { id: 'analytics', label: 'Data Analytics & FAR-33' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveView(tab.id as ViewTab)}
              className={`px-3 py-1 text-xs font-medium rounded-t transition-colors ${
                activeView === tab.id
                  ? 'bg-[#1e1e1e] text-sky-400 border-t-2 border-sky-400 shadow-inner'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#38383c]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400 font-mono text-[11px]">ACTIVE TEST:</span>
          <span className="px-2 py-0.5 bg-amber-950/40 border border-amber-800/80 text-amber-300 font-mono text-[11px] rounded">
            {activeTest.toUpperCase().replace('_', ' ')}
          </span>
        </div>
      </div>

      {/* 4. Main Application Workspace Area */}
      <div className="flex-1 overflow-auto bg-[#18181a] relative flex flex-col">{children}</div>

      {/* 5. Classic Windows 10 Status Bar */}
      <div className="h-6 bg-[#007acc] text-white flex items-center justify-between px-3 text-[11px] font-mono select-none">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1 font-semibold">
            <Radio className="w-3 h-3 text-sky-200 animate-pulse" /> CELL #4B - EDWARDS AFB
          </span>
          <span className="text-sky-200">|</span>
          <span className="hidden md:inline">FADEC: DUAL CHANNEL ACTIVE</span>
          <span className="text-sky-200 hidden md:inline">|</span>
          <span className="hidden lg:inline">DAQ: 1000 Hz / SYNCHRONIZED</span>
          <span className="text-sky-200 hidden lg:inline">|</span>
          <span className="text-sky-100">MIL-STD-1553B OK</span>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden sm:inline text-sky-100">Standard Atm: 15°C / 101.3 kPa</span>
          <span className="text-sky-200 hidden sm:inline">|</span>
          <span className="flex items-center gap-1 font-medium">
            <Clock className="w-3 h-3 text-sky-200" /> {currentTime}
          </span>
        </div>
      </div>
    </div>
  );
};
