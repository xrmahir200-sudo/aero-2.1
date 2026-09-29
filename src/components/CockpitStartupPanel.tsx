import React, { useState, useEffect } from 'react';
import { EngineProfile, EngineSensors } from '../types/engine';
import {
  Power,
  Zap,
  Wind,
  Droplet,
  ShieldAlert,
  Bell,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Gauge,
  Flame,
  Activity
} from 'lucide-react';
import { soundEngine } from '../services/soundEngine';

interface CockpitStartupPanelProps {
  profile: EngineProfile;
  sensors: EngineSensors;
  multiEngineSensors: EngineSensors[];
  onSetEngineMaster: (engineIndex: number, state: boolean) => void;
  onSetEngineThrottle: (engineIndex: number, val: number) => void;
  onColdAndDark: () => void;
  onAutoStartAll: () => void;
}

export const CockpitStartupPanel: React.FC<CockpitStartupPanelProps> = ({
  profile,
  sensors,
  multiEngineSensors,
  onSetEngineMaster,
  onSetEngineThrottle,
  onColdAndDark,
  onAutoStartAll
}) => {
  // Overhead switch states
  const [bat1, setBat1] = useState(true);
  const [bat2, setBat2] = useState(true);
  const [extPwr, setExtPwr] = useState(false);

  // APU states
  const [apuMaster, setApuMaster] = useState(true);
  const [apuStarting, setApuStarting] = useState(false);
  const [apuAvail, setApuAvail] = useState(true);
  const [apuBleed, setApuBleed] = useState(true);
  const [apuRPM, setApuRPM] = useState(100);

  // Fuel pumps
  const [fuelPumpL, setFuelPumpL] = useState(true);
  const [fuelPumpR, setFuelPumpR] = useState(true);

  // Engine start selector: 'crank' | 'norm' | 'ign_start'
  const [startSelector, setStartSelector] = useState<'crank' | 'norm' | 'ign_start'>('norm');

  // Starter valves engaged
  const [starterEngaged, setStarterEngaged] = useState<boolean[]>([false, false, false, false]);

  const numEngines = profile.engineCount || 2;

  // Battery toggle
  const toggleBattery = (num: 1 | 2) => {
    soundEngine.playSwitchClick();
    if (num === 1) {
      setBat1((prev) => !prev);
      soundEngine.speak(bat1 ? 'BATTERY ONE DISCONNECTED' : 'BATTERY ONE CONNECTED');
    } else {
      setBat2((prev) => !prev);
      soundEngine.speak(bat2 ? 'BATTERY TWO DISCONNECTED' : 'BATTERY TWO CONNECTED');
    }
  };

  // APU Master toggle
  const toggleApuMaster = () => {
    soundEngine.playSwitchClick();
    if (apuMaster) {
      setApuMaster(false);
      setApuStarting(false);
      setApuAvail(false);
      setApuBleed(false);
      setApuRPM(0);
      soundEngine.speak('APU SHUTDOWN');
    } else {
      setApuMaster(true);
      soundEngine.speak('APU MASTER ON. FLAP OPEN.');
    }
  };

  // APU Start Pushbutton
  const triggerApuStart = () => {
    if (!apuMaster || apuAvail || apuStarting) return;
    soundEngine.playSwitchClick();
    soundEngine.playAPUSpool();
    setApuStarting(true);
    soundEngine.speak('APU STARTER ENGAGED');

    // Simulate APU spooling up to 100%
    let rpm = 0;
    const interval = setInterval(() => {
      rpm += 12;
      setApuRPM(Math.min(100, rpm));
      if (rpm >= 100) {
        clearInterval(interval);
        setApuStarting(false);
        setApuAvail(true);
        soundEngine.speak('APU AVAILABLE. PNEUMATICS ONLINE.');
      }
    }, 450);
  };

  // APU Bleed Air toggle
  const toggleApuBleed = () => {
    if (!apuAvail) return;
    soundEngine.playSwitchClick();
    setApuBleed((prev) => !prev);
    soundEngine.speak(apuBleed ? 'APU BLEED AIR CLOSED' : 'APU BLEED AIR OPEN 45 PSI');
  };

  // Manual Engine Air Starter Push
  const handleEngStartPush = (index: number) => {
    if (!bat1 && !bat2) {
      soundEngine.speak('NO ELECTRICAL POWER. CHECK BATTERIES.');
      return;
    }
    if (!apuBleed) {
      soundEngine.speak('NO PNEUMATIC AIR PRESSURE. OPEN APU BLEED.');
      return;
    }
    if (startSelector !== 'ign_start') {
      soundEngine.speak('SET ENGINE MODE SELECTOR TO IGNITION START');
      return;
    }

    soundEngine.playSwitchClick();
    soundEngine.playStarterAirHiss();
    soundEngine.speak(`ENGINE ${index + 1} STARTER VALVE OPEN`);

    setStarterEngaged((prev) => {
      const copy = [...prev];
      copy[index] = true;
      return copy;
    });

    // Spool core N2 to 22%
    setTimeout(() => {
      setStarterEngaged((prev) => {
        const copy = [...prev];
        copy[index] = false;
        return copy;
      });
    }, 4000);
  };

  // Engine Master Switch flip
  const handleEngMasterToggle = (index: number) => {
    soundEngine.playSwitchClick();
    const currentEng = multiEngineSensors[index] || sensors;
    const isCurrentlyRunning = currentEng.n2 > 30 && !currentEng.flameoutActive;

    if (!isCurrentlyRunning) {
      // Starting up
      if (!bat1 && !bat2) {
        soundEngine.speak('CANNOT START. NO DC POWER.');
        return;
      }
      if (!fuelPumpL && !fuelPumpR) {
        soundEngine.speak('CANNOT START. FUEL BOOST PUMPS OFF.');
        return;
      }

      soundEngine.playIgnitionSparks();
      soundEngine.speak(`ENGINE ${index + 1} FUEL VALVE OPEN. IGNITION LIGHTOFF.`);
      onSetEngineMaster(index, true);
    } else {
      // Shutdown
      soundEngine.speak(`ENGINE ${index + 1} FUEL CUTOFF`);
      onSetEngineMaster(index, false);
    }
  };

  // Master Warning / Caution tests
  const handleTestMasterCaution = () => {
    soundEngine.init();
    soundEngine.playMasterCaution();
    soundEngine.speak('MASTER CAUTION CHECK');
  };

  const handleTestMasterWarning = () => {
    soundEngine.init();
    soundEngine.startMasterWarning();
    setTimeout(() => soundEngine.stopMasterWarning(), 1800);
  };

  const handleColdAndDarkClick = () => {
    soundEngine.playSwitchClick();
    setBat1(false);
    setBat2(false);
    setApuMaster(false);
    setApuAvail(false);
    setApuBleed(false);
    setApuRPM(0);
    setFuelPumpL(false);
    setFuelPumpR(false);
    setStartSelector('norm');
    onColdAndDark();
    soundEngine.speak('COLD AND DARK COCKPIT CONFIGURED');
  };

  const handleAutoStartClick = () => {
    soundEngine.playSwitchClick();
    setBat1(true);
    setBat2(true);
    setApuMaster(true);
    setApuAvail(true);
    setApuBleed(true);
    setApuRPM(100);
    setFuelPumpL(true);
    setFuelPumpR(true);
    setStartSelector('ign_start');
    onAutoStartAll();
    soundEngine.speak('AUTOSTART SEQUENCE INITIATED. ALL ENGINES RUNNING.');
  };

  return (
    <div className="bg-[#12141a] border border-[#262938] rounded p-3 text-slate-100 flex flex-col gap-3 font-mono shadow-xl">
      {/* Header bar with quick cold & dark vs autostart */}
      <div className="flex flex-wrap items-center justify-between border-b border-[#262938] pb-2 text-xs">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-400" />
          <span className="font-bold tracking-wider text-slate-200 uppercase">
            Aviation Overhead Startup & Systems Control Panel
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleColdAndDarkClick}
            className="px-2.5 py-1 bg-[#1e202b] hover:bg-[#282a39] border border-[#3b3e52] text-slate-300 hover:text-white rounded text-[11px] font-medium transition-colors flex items-center gap-1.5"
            title="Shut down all electrical and fuel systems for cold & dark manual startup"
          >
            <Power className="w-3 h-3 text-slate-400" />
            <span>Cold & Dark</span>
          </button>
          <button
            onClick={handleAutoStartClick}
            className="px-2.5 py-1 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-600 text-emerald-200 rounded text-[11px] font-medium transition-colors flex items-center gap-1.5 shadow"
            title="Fast autostart sequence across all systems"
          >
            <Sparkles className="w-3 h-3 text-emerald-400" />
            <span>Auto Start All</span>
          </button>
        </div>
      </div>

      {/* Main Overhead Switchboard Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
        {/* SECTION 1: ELECTRICAL BATTERIES */}
        <div className="bg-[#0b0c10] border border-[#202330] rounded p-2.5 flex flex-col justify-between">
          <div className="text-[10px] text-slate-400 font-bold border-b border-[#1b1d28] pb-1 mb-2 flex items-center justify-between">
            <span>ELECTRICAL (ELEC)</span>
            <span className="text-cyan-400">DC 28V</span>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-300">BAT 1 (28.4V):</span>
              <button
                onClick={() => toggleBattery(1)}
                className={`px-3 py-1 text-[11px] font-bold rounded border transition-all ${
                  bat1
                    ? 'bg-emerald-950/90 border-emerald-500 text-emerald-300 shadow-[0_0_8px_rgba(16,185,129,0.3)]'
                    : 'bg-[#181a24] border-slate-700 text-slate-500'
                }`}
              >
                {bat1 ? 'ON' : 'OFF'}
              </button>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-300">BAT 2 (28.2V):</span>
              <button
                onClick={() => toggleBattery(2)}
                className={`px-3 py-1 text-[11px] font-bold rounded border transition-all ${
                  bat2
                    ? 'bg-emerald-950/90 border-emerald-500 text-emerald-300 shadow-[0_0_8px_rgba(16,185,129,0.3)]'
                    : 'bg-[#181a24] border-slate-700 text-slate-500'
                }`}
              >
                {bat2 ? 'ON' : 'OFF'}
              </button>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-[#1b1d28]">
              <span className="text-[10px] text-slate-400">EXT GPU PWR:</span>
              <button
                onClick={() => {
                  soundEngine.playSwitchClick();
                  setExtPwr(!extPwr);
                }}
                className={`px-2 py-0.5 text-[10px] font-bold rounded border ${
                  extPwr ? 'bg-cyan-950 border-cyan-500 text-cyan-300' : 'bg-[#181a24] border-slate-700 text-slate-500'
                }`}
              >
                {extPwr ? 'AVAIL' : 'OFF'}
              </button>
            </div>
          </div>

          <div className="text-[9px] text-slate-500 font-mono mt-2 pt-1 border-t border-[#1b1d28]">
            Main Bus: {bat1 || bat2 || extPwr ? 'POWERED' : 'COLD & DARK'}
          </div>
        </div>

        {/* SECTION 2: APU (AUXILIARY POWER UNIT) */}
        <div className="bg-[#0b0c10] border border-[#202330] rounded p-2.5 flex flex-col justify-between">
          <div className="text-[10px] text-slate-400 font-bold border-b border-[#1b1d28] pb-1 mb-2 flex items-center justify-between">
            <span>APU CONTROLS</span>
            <span className={apuAvail ? 'text-emerald-400' : apuStarting ? 'text-amber-400 animate-pulse' : 'text-slate-500'}>
              {apuAvail ? 'AVAIL' : apuStarting ? 'STARTING' : 'OFF'}
            </span>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-300">MASTER SW:</span>
              <button
                onClick={toggleApuMaster}
                className={`px-3 py-1 text-[11px] font-bold rounded border ${
                  apuMaster
                    ? 'bg-cyan-950/90 border-cyan-500 text-cyan-300'
                    : 'bg-[#181a24] border-slate-700 text-slate-500'
                }`}
              >
                {apuMaster ? 'ON' : 'OFF'}
              </button>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-300">START PUSH:</span>
              <button
                onClick={triggerApuStart}
                disabled={!apuMaster || apuAvail || apuStarting}
                className={`px-3 py-1 text-[11px] font-bold rounded border ${
                  apuAvail
                    ? 'bg-emerald-950 border-emerald-600 text-emerald-400'
                    : apuStarting
                    ? 'bg-amber-950 border-amber-500 text-amber-300 animate-pulse'
                    : apuMaster
                    ? 'bg-sky-900 hover:bg-sky-800 border-sky-400 text-white'
                    : 'bg-[#181a24] border-slate-800 text-slate-600 cursor-not-allowed'
                }`}
              >
                {apuAvail ? 'AVAIL' : apuStarting ? `${apuRPM}%` : 'START'}
              </button>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-[#1b1d28]">
              <span className="text-[10px] text-slate-400">APU BLEED (AIR):</span>
              <button
                onClick={toggleApuBleed}
                disabled={!apuAvail}
                className={`px-2 py-0.5 text-[10px] font-bold rounded border ${
                  apuBleed && apuAvail
                    ? 'bg-emerald-950 border-emerald-500 text-emerald-300 shadow-[0_0_8px_rgba(16,185,129,0.3)]'
                    : 'bg-[#181a24] border-slate-700 text-slate-500'
                }`}
              >
                {apuBleed && apuAvail ? 'OPEN (45 PSI)' : 'OFF'}
              </button>
            </div>
          </div>

          <div className="text-[9px] text-slate-500 font-mono mt-2 pt-1 border-t border-[#1b1d28]">
            Starter Pneumatics: {apuBleed && apuAvail ? 'PRESSURIZED' : 'DEPLETED'}
          </div>
        </div>

        {/* SECTION 3: FUEL BOOST PUMPS */}
        <div className="bg-[#0b0c10] border border-[#202330] rounded p-2.5 flex flex-col justify-between">
          <div className="text-[10px] text-slate-400 font-bold border-b border-[#1b1d28] pb-1 mb-2 flex items-center justify-between">
            <span>FUEL BOOST PUMPS</span>
            <span className="text-cyan-400">JET-A1</span>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-300">L TK PUMP:</span>
              <button
                onClick={() => {
                  soundEngine.playSwitchClick();
                  setFuelPumpL(!fuelPumpL);
                }}
                className={`px-3 py-1 text-[11px] font-bold rounded border ${
                  fuelPumpL ? 'bg-emerald-950 border-emerald-500 text-emerald-300' : 'bg-[#181a24] border-slate-700 text-slate-500'
                }`}
              >
                {fuelPumpL ? 'ON' : 'OFF'}
              </button>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-300">R TK PUMP:</span>
              <button
                onClick={() => {
                  soundEngine.playSwitchClick();
                  setFuelPumpR(!fuelPumpR);
                }}
                className={`px-3 py-1 text-[11px] font-bold rounded border ${
                  fuelPumpR ? 'bg-emerald-950 border-emerald-500 text-emerald-300' : 'bg-[#181a24] border-slate-700 text-slate-500'
                }`}
              >
                {fuelPumpR ? 'ON' : 'OFF'}
              </button>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-[#1b1d28]">
              <span className="text-[10px] text-slate-400">CROSS FEED:</span>
              <span className="text-[10px] font-mono text-emerald-400">AUTO</span>
            </div>
          </div>

          <div className="text-[9px] text-slate-500 font-mono mt-2 pt-1 border-t border-[#1b1d28]">
            Fuel Line Press: {fuelPumpL || fuelPumpR ? '52 PSI' : '0 PSI'}
          </div>
        </div>

        {/* SECTION 4: ENGINE IGNITION & START ROTARY */}
        <div className="bg-[#0b0c10] border border-[#202330] rounded p-2.5 flex flex-col justify-between">
          <div className="text-[10px] text-slate-400 font-bold border-b border-[#1b1d28] pb-1 mb-2">
            <span>ENG START SELECTOR</span>
          </div>

          <div className="flex flex-col gap-1.5">
            {[
              { id: 'crank', label: 'CRANK (Dry Spin)', desc: 'Pneumatic motoring without fuel' },
              { id: 'norm', label: 'NORM (Flight)', desc: 'Standard operating position' },
              { id: 'ign_start', label: 'IGN / START', desc: 'Continuous spark & starter valve armed' }
            ].map((sel) => (
              <button
                key={sel.id}
                onClick={() => {
                  soundEngine.playSwitchClick();
                  setStartSelector(sel.id as 'crank' | 'norm' | 'ign_start');
                }}
                className={`px-2 py-1 text-[11px] rounded text-left border transition-all ${
                  startSelector === sel.id
                    ? 'bg-amber-950/90 border-amber-500 text-amber-300 font-bold shadow-sm'
                    : 'bg-[#14151e] border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div>{sel.label}</div>
              </button>
            ))}
          </div>

          <div className="text-[9px] text-slate-500 font-mono mt-2 pt-1 border-t border-[#1b1d28]">
            Mode: {startSelector.toUpperCase()}
          </div>
        </div>

        {/* SECTION 5: MASTER CAUTION & WARNING ALARMS */}
        <div className="bg-[#0b0c10] border border-[#202330] rounded p-2.5 flex flex-col justify-between">
          <div className="text-[10px] text-slate-400 font-bold border-b border-[#1b1d28] pb-1 mb-2 flex items-center justify-between">
            <span>ANNUNCIATORS</span>
            <span className="text-slate-500">TEST & ACK</span>
          </div>

          <div className="flex flex-col gap-2">
            <button
              onClick={handleTestMasterCaution}
              className="w-full py-1.5 px-2 bg-amber-950/80 hover:bg-amber-900 border border-amber-600 text-amber-300 rounded font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all"
            >
              <Bell className="w-3.5 h-3.5 text-amber-400" />
              <span>MASTER CAUTION</span>
            </button>

            <button
              onClick={handleTestMasterWarning}
              className="w-full py-1.5 px-2 bg-rose-950/80 hover:bg-rose-900 border border-rose-600 text-rose-300 rounded font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
              <span>MASTER WARNING</span>
            </button>
          </div>

          <div className="text-[9px] text-slate-400 font-mono mt-2 pt-1 border-t border-[#1b1d28]">
            Audio: {soundEngine.getIsMuted() ? 'MUTED' : 'ARMED (48kHz)'}
          </div>
        </div>
      </div>

      {/* Manual Engine Starters & Master Switches Row */}
      <div className="bg-[#090a0e] border border-[#1e212d] rounded p-2.5">
        <div className="text-xs font-bold text-slate-300 mb-2 flex items-center justify-between border-b border-[#1a1c27] pb-1">
          <span className="flex items-center gap-1.5 text-sky-400">
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>MANUAL ENGINE STARTER & MASTER CONTROL PANELS ({numEngines} ENGINES)</span>
          </span>
          <span className="text-[11px] text-slate-400">
            PNEUMATIC START SEQUENCE: 1. APU BLEED ON → 2. IGN/START → 3. MAN START PUSH → 4. MASTER ON
          </span>
        </div>

        <div className={`grid ${numEngines === 4 ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-2'} gap-2.5`}>
          {Array.from({ length: numEngines }, (_, i) => {
            const eng = multiEngineSensors[i] || sensors;
            const isRunning = eng.n2 > 35 && !eng.flameoutActive;
            const isStarting = starterEngaged[i] || (eng.n2 > 5 && eng.n2 < 35);

            return (
              <div key={i} className="bg-[#12141c] border border-[#272a39] rounded p-2.5 flex flex-col justify-between">
                <div className="flex items-center justify-between border-b border-[#1f2230] pb-1 mb-2">
                  <span className="font-bold text-white text-xs">ENGINE {i + 1}</span>
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${
                      isRunning
                        ? 'bg-emerald-950 border-emerald-600 text-emerald-400'
                        : isStarting
                        ? 'bg-amber-950 border-amber-600 text-amber-400 animate-pulse'
                        : 'bg-slate-900 border-slate-700 text-slate-500'
                    }`}
                  >
                    {isRunning ? 'AVAIL' : isStarting ? 'STARTING' : 'OFF'}
                  </span>
                </div>

                {/* Live Core Readouts for this engine */}
                <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[10px] text-slate-400 mb-2 bg-[#090b0f] p-1.5 rounded">
                  <div>N1 Fan:</div>
                  <div className="text-right text-emerald-400 font-bold">{eng.n1.toFixed(1)}%</div>
                  <div>N2 Core:</div>
                  <div className="text-right text-sky-400 font-bold">{eng.n2.toFixed(1)}%</div>
                  <div>EGT:</div>
                  <div className="text-right text-amber-400 font-bold">{Math.round(eng.egt)}°C</div>
                  <div>Thrust:</div>
                  <div className="text-right text-white font-bold">{eng.thrustKN.toFixed(1)} kN</div>
                </div>

                {/* Actions: Pneumatic Starter Push + Engine Master Switch */}
                <div className="flex flex-col gap-1.5">
                  <button
                    onClick={() => handleEngStartPush(i)}
                    disabled={isRunning}
                    className={`w-full py-1 text-[11px] font-bold rounded border transition-all ${
                      starterEngaged[i]
                        ? 'bg-amber-950 border-amber-500 text-amber-300 animate-pulse'
                        : isRunning
                        ? 'bg-[#161822] border-[#252838] text-slate-600 cursor-not-allowed'
                        : 'bg-[#1e2232] hover:bg-[#282d42] border-[#3e445f] text-slate-200'
                    }`}
                  >
                    {starterEngaged[i] ? 'STARTER ENGAGED' : `MAN START ${i + 1}`}
                  </button>

                  <button
                    onClick={() => handleEngMasterToggle(i)}
                    className={`w-full py-1.5 text-xs font-bold rounded border transition-all flex items-center justify-center gap-1.5 ${
                      isRunning
                        ? 'bg-emerald-950/90 border-emerald-500 text-emerald-300 hover:bg-emerald-900 shadow-[0_0_8px_rgba(16,185,129,0.25)]'
                        : 'bg-rose-950/80 border-rose-600 text-rose-300 hover:bg-rose-900'
                    }`}
                  >
                    <Power className="w-3.5 h-3.5" />
                    <span>ENG {i + 1} MASTER {isRunning ? 'ON' : 'OFF'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
