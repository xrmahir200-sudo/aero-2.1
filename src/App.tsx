/**
 * AeroTest Pro - Jet Engine Simulation & Test Bench [Windows 10 Workstation]
 * Comprehensive flight test cell for aerospace turbofan engines.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { EngineSimulation } from './services/engineSimulation';
import { soundEngine } from './services/soundEngine';
import { EngineType, TestProtocolId, ViewTab, TelemetryPoint, TestLogEntry } from './types/engine';
import { Windows10Window } from './components/Windows10Window';
import { EngineVisualizer } from './components/EngineVisualizer';
import { ThrottleControl } from './components/ThrottleControl';
import { CockpitAnnunciator } from './components/CockpitAnnunciator';
import { CockpitStartupPanel } from './components/CockpitStartupPanel';
import { A380ECAMMonitor } from './components/A380ECAMMonitor';
import { TelemetryGraphs } from './components/TelemetryGraphs';
import { CompressorMap } from './components/CompressorMap';
import { TestProtocolManager } from './components/TestProtocolManager';
import { DataAnalytics } from './components/DataAnalytics';

export default function App() {
  // Engine simulation instance (defaulting to A380 Trent 900 Quad)
  const simRef = useRef<EngineSimulation>(new EngineSimulation('a380_trent900'));
  const [sensors, setSensors] = useState(simRef.current.sensors);
  const [activeEngine, setActiveEngine] = useState<EngineType>('a380_trent900');
  const [activeTest, setActiveTest] = useState<TestProtocolId>('manual_sweep');
  const [activeView, setActiveView] = useState<ViewTab>('test_cell');
  const [showStartupPanel, setShowStartupPanel] = useState<boolean>(true);
  const [isTestRunning, setIsTestRunning] = useState(false);
  const [testElapsedTime, setTestElapsedTime] = useState(0);
  const [slewRate, setSlewRate] = useState(25);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.65);
  const [isGraphPaused, setIsGraphPaused] = useState(false);

  // Telemetry buffer & event logs
  const [telemetryHistory, setTelemetryHistory] = useState<TelemetryPoint[]>([]);
  const [logs, setLogs] = useState<TestLogEntry[]>([]);
  const lastSampleTimeRef = useRef(0);
  const startTimeRef = useRef(Date.now());

  // Handle engine profile change
  const handleEngineChange = (type: EngineType) => {
    setActiveEngine(type);
    simRef.current.setEngineProfile(type);
    setSensors({ ...simRef.current.sensors });
    setTelemetryHistory([]);
    addLog('info', `Switched engine model to ${simRef.current.profile.name}`);
  };

  const addLog = (type: TestLogEntry['type'], message: string, source: string = 'FADEC') => {
    const offset = (Date.now() - startTimeRef.current) / 1000;
    const entry: TestLogEntry = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toLocaleTimeString(),
      timeOffsetSec: Number(offset.toFixed(1)),
      type,
      message,
      source
    };
    setLogs((prev) => [entry, ...prev.slice(0, 49)]);
  };

  // Main simulation tick loop
  useEffect(() => {
    let animId: number;
    let prevTime = performance.now();

    const loop = (time: number) => {
      const dt = Math.min(0.1, (time - prevTime) / 1000);
      prevTime = time;

      const sim = simRef.current;
      sim.update(dt);
      setSensors({ ...sim.sensors });
      setIsTestRunning(sim.testRunning);
      setTestElapsedTime(sim.testElapsedTime);

      // Collect telemetry at 15 Hz
      if (!isGraphPaused && time - lastSampleTimeRef.current > 66) {
        lastSampleTimeRef.current = time;
        const pt: TelemetryPoint = {
          timestamp: Date.now(),
          timeSec: Number(((Date.now() - startTimeRef.current) / 1000).toFixed(1)),
          throttle: sim.sensors.throttle,
          n1: sim.sensors.n1,
          n2: sim.sensors.n2,
          egt: sim.sensors.egt,
          thrustKN: sim.sensors.thrustKN,
          fuelFlowKgH: sim.sensors.fuelFlowKgH,
          vibrationIps: sim.sensors.vibrationIps,
          pressureRatio: sim.sensors.corePressureRatio,
          massFlow: sim.sensors.airMassFlowKgS,
          stallMargin: sim.sensors.stallMarginPercent
        };

        setTelemetryHistory((prev) => {
          const updated = [...prev, pt];
          return updated.length > 250 ? updated.slice(updated.length - 250) : updated;
        });
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isGraphPaused]);

  // Audio initialize on first user gesture
  useEffect(() => {
    const handleGesture = () => {
      soundEngine.init();
      window.removeEventListener('pointerdown', handleGesture);
      window.removeEventListener('keydown', handleGesture);
    };
    window.addEventListener('pointerdown', handleGesture);
    window.addEventListener('keydown', handleGesture);
    return () => {
      window.removeEventListener('pointerdown', handleGesture);
      window.removeEventListener('keydown', handleGesture);
    };
  }, []);

  // Throttle handlers
  const handleSetThrottle = useCallback((val: number) => {
    simRef.current.setThrottle(val);
  }, []);

  const handleSetIndividualThrottle = useCallback((index: number, val: number) => {
    simRef.current.setIndividualThrottle(index, val);
  }, []);

  const handleSetEngineMaster = useCallback((index: number, state: boolean) => {
    simRef.current.setIndividualMaster(index, state);
    addLog(state ? 'info' : 'warning', `Engine ${index + 1} Master switch: ${state ? 'ON' : 'OFF'}`);
  }, []);

  const handleColdAndDark = useCallback(() => {
    simRef.current.setAllColdAndDark();
    addLog('warning', 'Configured Cold & Dark state (All engines & systems shutdown)');
  }, []);

  const handleAutoStartAll = useCallback(() => {
    simRef.current.setAllAutoStart();
    addLog('info', 'Autostart sequence completed. All engines stabilized at ground idle.');
  }, []);

  const handleSetSlewRate = useCallback((rate: number) => {
    setSlewRate(rate);
    simRef.current.setSlewRate(rate);
    addLog('info', `FADEC response slew rate set to ${rate}%/s`);
  }, []);

  const handleToggleReverse = useCallback(() => {
    simRef.current.toggleReverseThrust();
    addLog('action', `Thrust reverser toggled: ${simRef.current.sensors.reverseThrustActive ? 'DEPLOYED' : 'STOWED'}`);
  }, []);

  const handleEmergencyCutoff = useCallback(() => {
    simRef.current.triggerEmergencyCutoff();
    addLog('critical', 'EMERGENCY ENGINE CUTOFF INITIATED BY OPERATOR');
  }, []);

  const handleDischargeBottle = useCallback((num: 1 | 2) => {
    simRef.current.dischargeFireBottle(num);
    addLog('action', `Squib Bottle ${num} (Halon 1301) Discharged`);
  }, []);

  const handleReset = useCallback(() => {
    simRef.current.resetSimulation();
    setTelemetryHistory([]);
    startTimeRef.current = Date.now();
    addLog('info', 'Simulation test cell reset to initial ground idle condition');
  }, []);

  // Test Protocol control
  const handleStartTest = (testId: TestProtocolId) => {
    setActiveTest(testId);
    simRef.current.startTestProtocol(testId);
    addLog('warning', `Started automated test protocol: ${testId.toUpperCase()}`);
  };

  const handleStopTest = () => {
    simRef.current.stopTestProtocol();
    addLog('info', 'Test protocol terminated by operator');
  };

  // Audio toggles
  const handleToggleMute = () => {
    const muted = soundEngine.toggleMute();
    setIsMuted(muted);
  };

  const handleVolumeChange = (v: number) => {
    setVolume(v);
    soundEngine.setVolume(v);
  };

  // Export functions
  const handleExportCSV = () => {
    if (telemetryHistory.length === 0) {
      alert('No telemetry data collected yet.');
      return;
    }

    const headers = ['Time_s', 'Throttle_pct', 'N1_Fan_pct', 'N2_Core_pct', 'EGT_degC', 'Thrust_kN', 'FuelFlow_kgh', 'Vibration_ips', 'PressureRatio', 'MassFlow_kgs', 'StallMargin_pct'];
    const rows = telemetryHistory.map((p) => [
      p.timeSec,
      p.throttle.toFixed(1),
      p.n1.toFixed(1),
      p.n2.toFixed(1),
      p.egt.toFixed(1),
      p.thrustKN.toFixed(1),
      p.fuelFlowKgH,
      p.vibrationIps.toFixed(2),
      p.pressureRatio.toFixed(1),
      p.massFlow,
      p.stallMargin.toFixed(1)
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `AeroTest_Telemetry_${simRef.current.profile.id}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addLog('info', 'Exported telemetry dataset to CSV');
  };

  const handleExportJSON = () => {
    const report = {
      app: 'AeroTest Pro Windows 10 Workstation',
      engine: simRef.current.profile,
      activeTest,
      statistics: simRef.current.stats,
      currentSensors: sensors,
      telemetrySnapshotCount: telemetryHistory.length,
      sampleHistory: telemetryHistory.slice(-50),
      eventLogs: logs
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(report, null, 2));
    const link = document.createElement('a');
    link.setAttribute('href', dataStr);
    link.setAttribute('download', `AeroTest_Report_${simRef.current.profile.id}_${Date.now()}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addLog('info', 'Exported full test cell report to JSON');
  };

  return (
    <div className="min-h-screen bg-[#14151a] flex items-center justify-center p-0 md:p-3 overflow-hidden select-none">
      <Windows10Window
        title={`AeroTest Pro - Turbofan Engine Test Cell Workstation [WIN10-x64]`}
        activeView={activeView}
        setActiveView={setActiveView}
        activeEngine={activeEngine}
        setActiveEngine={handleEngineChange}
        activeTest={activeTest}
        setActiveTest={handleStartTest}
        onReset={handleReset}
        onEmergencyCutoff={handleEmergencyCutoff}
        onExportCSV={handleExportCSV}
        onExportJSON={handleExportJSON}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        volume={volume}
        onVolumeChange={handleVolumeChange}
      >
        {/* Cockpit Alert & Fire Annunciator Bar (Always visible at top of test bench) */}
        <CockpitAnnunciator
          sensors={sensors}
          profile={simRef.current.profile}
          onDischargeBottle={handleDischargeBottle}
        />

        {/* Cockpit Overhead Panel Toggle Bar */}
        <div className="bg-[#12141a] px-3 py-1 border-b border-[#252837] flex items-center justify-between text-xs font-mono">
          <button
            onClick={() => {
              soundEngine.playSwitchClick();
              setShowStartupPanel(!showStartupPanel);
            }}
            className={`px-3 py-1 rounded text-xs font-bold border transition-colors flex items-center gap-1.5 ${
              showStartupPanel
                ? 'bg-amber-950/80 border-amber-500 text-amber-300'
                : 'bg-[#1a1d27] border-slate-700 text-slate-300 hover:text-white'
            }`}
          >
            <span>OVERHEAD STARTUP PANEL (BAT / APU / STARTER)</span>
            <span className="text-[10px] px-1 py-0.2 rounded bg-black/40">
              {showStartupPanel ? '[HIDE ▲]' : '[SHOW ▼]'}
            </span>
          </button>

          <div className="hidden sm:flex items-center gap-3 text-[11px] text-slate-400">
            <span>Electrical: {sensors.n2 > 10 || showStartupPanel ? 'BUS ONLINE' : 'COLD & DARK'}</span>
            <span>|</span>
            <span>Startup: Manual Pneumatic & Master Switches</span>
          </div>
        </div>

        {/* Collapsible Overhead Cockpit Panel */}
        {showStartupPanel && (
          <div className="p-2 bg-[#0e1015] border-b border-[#252837] max-h-80 overflow-y-auto">
            <CockpitStartupPanel
              profile={simRef.current.profile}
              sensors={sensors}
              multiEngineSensors={simRef.current.multiEngineSensors}
              onSetEngineMaster={handleSetEngineMaster}
              onSetEngineThrottle={handleSetIndividualThrottle}
              onColdAndDark={handleColdAndDark}
              onAutoStartAll={handleAutoStartAll}
            />
          </div>
        )}

        {/* View Selection Content */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          {activeView === 'test_cell' && (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Top: Engine Visualizer */}
              <div className="flex-1 min-h-[340px]">
                <EngineVisualizer sensors={sensors} profile={simRef.current.profile} />
              </div>

              {/* Bottom: Throttle & Speed Control Quadrant */}
              <div className="p-3 bg-[#15161c] border-t border-[#2e303d]">
                <ThrottleControl
                  sensors={sensors}
                  profile={simRef.current.profile}
                  slewRate={slewRate}
                  multiEngineSensors={simRef.current.multiEngineSensors}
                  onSetThrottle={handleSetThrottle}
                  onSetIndividualThrottle={handleSetIndividualThrottle}
                  onSetSlewRate={handleSetSlewRate}
                  onToggleReverse={handleToggleReverse}
                  onEmergencyCutoff={handleEmergencyCutoff}
                />
              </div>
            </div>
          )}

          {activeView === 'a380_ecam' && (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto">
                <A380ECAMMonitor
                  profile={simRef.current.profile}
                  sensors={sensors}
                  multiEngineSensors={simRef.current.multiEngineSensors}
                  onSetThrottle={handleSetThrottle}
                  onEmergencyCutoff={handleEmergencyCutoff}
                  onDischargeBottle={handleDischargeBottle}
                />
              </div>

              {/* Bottom persistent throttle bar for live ECAM thrust modulation */}
              <div className="p-3 bg-[#15161c] border-t border-[#2e303d]">
                <ThrottleControl
                  sensors={sensors}
                  profile={simRef.current.profile}
                  slewRate={slewRate}
                  multiEngineSensors={simRef.current.multiEngineSensors}
                  onSetThrottle={handleSetThrottle}
                  onSetIndividualThrottle={handleSetIndividualThrottle}
                  onSetSlewRate={handleSetSlewRate}
                  onToggleReverse={handleToggleReverse}
                  onEmergencyCutoff={handleEmergencyCutoff}
                />
              </div>
            </div>
          )}

          {activeView === 'telemetry' && (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1">
                <TelemetryGraphs
                  telemetryHistory={telemetryHistory}
                  profile={simRef.current.profile}
                  isPaused={isGraphPaused}
                  onTogglePause={() => setIsGraphPaused(!isGraphPaused)}
                  onClearHistory={() => setTelemetryHistory([])}
                />
              </div>

              {/* Bottom persistent throttle bar for easy testing while monitoring strip charts */}
              <div className="p-3 bg-[#15161c] border-t border-[#2e303d]">
                <ThrottleControl
                  sensors={sensors}
                  profile={simRef.current.profile}
                  slewRate={slewRate}
                  onSetThrottle={handleSetThrottle}
                  onSetSlewRate={handleSetSlewRate}
                  onToggleReverse={handleToggleReverse}
                  onEmergencyCutoff={handleEmergencyCutoff}
                />
              </div>
            </div>
          )}

          {activeView === 'compressor_map' && (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1">
                <CompressorMap
                  sensors={sensors}
                  profile={simRef.current.profile}
                  telemetryHistory={telemetryHistory}
                />
              </div>
              <div className="p-3 bg-[#15161c] border-t border-[#2e303d]">
                <ThrottleControl
                  sensors={sensors}
                  profile={simRef.current.profile}
                  slewRate={slewRate}
                  onSetThrottle={handleSetThrottle}
                  onSetSlewRate={handleSetSlewRate}
                  onToggleReverse={handleToggleReverse}
                  onEmergencyCutoff={handleEmergencyCutoff}
                />
              </div>
            </div>
          )}

          {activeView === 'protocols' && (
            <div className="flex-1 overflow-y-auto">
              <TestProtocolManager
                activeTest={activeTest}
                isTestRunning={isTestRunning}
                testElapsedTime={testElapsedTime}
                sensors={sensors}
                profile={simRef.current.profile}
                onStartTest={handleStartTest}
                onStopTest={handleStopTest}
              />
            </div>
          )}

          {activeView === 'analytics' && (
            <div className="flex-1 overflow-y-auto">
              <DataAnalytics
                stats={simRef.current.stats}
                profile={simRef.current.profile}
                sensors={sensors}
                telemetryHistory={telemetryHistory}
                logs={logs}
                onExportCSV={handleExportCSV}
                onExportJSON={handleExportJSON}
              />
            </div>
          )}
        </div>
      </Windows10Window>
    </div>
  );
}
