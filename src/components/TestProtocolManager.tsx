import React from 'react';
import { TestProtocol, TestProtocolId, EngineSensors, EngineProfile } from '../types/engine';
import {
  Flame,
  Zap,
  Wind,
  ShieldAlert,
  Droplets,
  RotateCcw,
  Compass,
  Play,
  Square,
  CheckCircle2,
  AlertTriangle,
  FileCheck
} from 'lucide-react';
import { soundEngine } from '../services/soundEngine';

interface TestProtocolManagerProps {
  activeTest: TestProtocolId;
  isTestRunning: boolean;
  testElapsedTime: number;
  sensors: EngineSensors;
  profile: EngineProfile;
  onStartTest: (id: TestProtocolId) => void;
  onStopTest: () => void;
}

export const TEST_PROTOCOLS: TestProtocol[] = [
  {
    id: 'thermal_spike',
    name: 'Thermal Spike & Transient Shock Test',
    category: 'Stress Testing',
    standardRef: 'FAA FAR § 33.73 / EASA CS-E 740',
    description:
      'Evaluates dynamic temperature overshoot (thermal spike) and turbine blade creep during rapid, violent throttle transients (Idle -> TOGA 100% -> Idle cycles). Measures peak transient fuel-air ratio and thermocouple response rate.',
    steps: [
      'Stabilize at Ground Idle (20% N1) for baseline EGT telemetry',
      'Step command 100% TOGA with high slew rate (160%/s)',
      'Record peak transient EGT overshoot and thermal spike rate (°C/s)',
      'Rapid deceleration throttle snap to evaluate combustor sub-cooling',
      'Cyclic secondary burst to test thermal barrier coating fatigue'
    ],
    parametersTested: ['EGT Peak Overshoot', 'Thermal Spike Rate (°C/s)', 'TIT Combustor Gradient', 'Core Spool Lag']
  },
  {
    id: 'compressor_stall',
    name: 'Compressor Stall & Surge Induction Test',
    category: 'Stress Testing',
    standardRef: 'FAA FAR § 33.65 / EASA CS-E 500',
    description:
      'Induces severe inlet distortion and backpressure shock to drive the engine beyond the aerodynamic surge line. Tests FADEC auto-recovery, transient bleed valve actuation, and mechanical buffeting endurance.',
    steps: [
      'Accelerate engine to high pressure ratio (85% N2)',
      'Inject inlet pressure distortion and adverse flow gradient',
      'Trigger compressor surge acoustic bang and reverse mass flow',
      'Verify FADEC emergency fuel metering rollback and bleed valve opening',
      'Confirm aerodynamic stabilization within 3.0 seconds'
    ],
    parametersTested: ['Stall Margin %', 'Acoustic Shock Intensity', 'Compressor Vibration Spike', 'Recovery Latency']
  },
  {
    id: 'bird_strike',
    name: 'Bird Ingestion & FOD Damage Test',
    category: 'Certification',
    standardRef: 'FAA FAR § 33.76 (Foreign Object Ingestion)',
    description:
      'Simulates high-velocity impact of large flock foreign object debris into the titanium fan assembly at takeoff thrust. Verifies blade containment, rotor balance, and that extreme vibration does not cause structural detachment.',
    steps: [
      'Spool engine to 95% Takeoff Thrust at simulated 160 knots',
      'Inject 2.5 kg FOD impact mass into Station 1.0 inlet',
      'Observe titanium fan blade deformation and acoustic shudder',
      'Measure peak N1 rotor vibration amplitude (>3.5 ips)',
      'Verify continuous containment and minimum 75% sustained thrust'
    ],
    parametersTested: ['N1 Rotor Vibration (ips)', 'Fan Blade Structural Integrity', 'Containment Casing Strain', 'Residual Thrust']
  },
  {
    id: 'overtemp_rupture',
    name: 'Overtemp Rupture & Hot Section Limit Test',
    category: 'Stress Testing',
    standardRef: 'FAA FAR § 33.27 / EASA CS-E 840',
    description:
      'Artificially disables turbine blade internal bleed cooling air at maximum continuous throttle. Pushes EGT past the redline threshold (>1050°C) to verify thermal shutdown triggers and single-crystal nickel alloy creep resistance.',
    steps: [
      'Command maximum continuous engine thrust (100% N2)',
      'Close turbine blade internal cooling bleed air valves',
      'Allow EGT to climb unchecked past amber caution into redline',
      'Observe Master Warning alarm trip and high-temperature telemetry spike',
      'Initiate automated thermal protection fuel rollback'
    ],
    parametersTested: ['Maximum Peak EGT (°C)', 'Turbine Blade Creep Rate', 'Master Warning Alert Trigger', 'Thermal Dissipation Time']
  },
  {
    id: 'water_ingestion',
    name: 'Severe Weather Torrential Water Ingestion Test',
    category: 'Certification',
    standardRef: 'FAA FAR § 33.77 (Ingestion of Rain and Hail)',
    description:
      'Sprays high-density water (10% water-to-air mass ratio) into the engine intake to simulate flying through extreme convective thunderstorms. Verifies flameout resistance and automatic continuous ignition operation.',
    steps: [
      'Set engine to approach cruise throttle (80% N2)',
      'Activate high-volume water injection manifold (45 liters/sec)',
      'Monitor combustor flame core temperature depression',
      'Verify automatic FADEC high-energy dual ignition activation',
      'Confirm thrust stability without uncommanded flameout'
    ],
    parametersTested: ['Combustor Flame Stability', 'Water-to-Air Mass Ratio', 'EGT Quench Rate', 'Auto-Ignition Response']
  },
  {
    id: 'flameout_restart',
    name: 'Flameout & Windmilling In-Flight Relight Test',
    category: 'Safety & Emergency',
    standardRef: 'FAA FAR § 33.73 (Restart Capability)',
    description:
      'Cuts fuel injection instantaneously to trigger complete combustor flameout, allowing the engine to spool down to aerodynamic windmilling RPM (~18-22% N2). Evaluates altitude windmill relight envelopes and lightoff temperature spike.',
    steps: [
      'Operate at stabilized high-altitude cruise (75% N2)',
      'Trigger instantaneous fuel cutoff to extinguish combustion flame',
      'Engine spools down to aerodynamic windmill equilibrium',
      'Initiate automated APU air assist and spark igniters at 22% N2',
      'Detect flame lightoff EGT spike and verify smooth acceleration to idle'
    ],
    parametersTested: ['Windmill Equilibrium N2 %', 'Relight Time (seconds)', 'Ignition EGT Surge', 'Start Valve Timing']
  },
  {
    id: 'engine_fire',
    name: 'Engine Nacelle Fire & Halon Extinguisher Protocol',
    category: 'Safety & Emergency',
    standardRef: 'FAA FAR § 33.17 (Fire Protection)',
    description:
      'Simulates a catastrophic high-pressure fuel line rupture inside the nacelle casing. Triggers dual-loop thermal detectors, activates continuous piercing Fire Bell alarm, illuminates cockpit Fire T-Handle, and executes Halon Bottle 1 & 2 discharge.',
    steps: [
      'Simulate high-pressure fuel leak in core compartment',
      'Thermal detector exceeds 350°C, triggering Nacelle Fire Alarm Bell',
      'Cockpit Fire T-Handle flashes bright red with audio warnings',
      'Discharge Squib Bottle 1 (Halon 1301 rapid purge)',
      'Discharge Squib Bottle 2 backup if secondary rekindling occurs',
      'Confirm flame extinguishment and system thermal decay'
    ],
    parametersTested: ['Nacelle Compartment Temp', 'Fire Alarm Trigger Latency', 'Halon Cloud Density', 'Extinguishment Duration']
  },
  {
    id: 'manual_sweep',
    name: 'Manual Speed Envelope & Throttle Sweep',
    category: 'Performance',
    standardRef: 'FAR Part 33 Appendix A (Steady-State Calibration)',
    description:
      'Complete operator manual control. Freely adjust throttle lever, set slew rates, test detents (Idle, Cruise, Climb, TOGA, Afterburner), and observe speed-dependent variations, vibration harmonics, and thermal spikes at user discretion.',
    steps: [
      'Interactive control with user throttle quadrant',
      'Explore speed-dependent fuel flow and thrust curves',
      'Experiment with instantaneous vs damped slew rates',
      'Observe real-time compressor operating line displacement'
    ],
    parametersTested: ['All Real-Time Sensors', 'Dynamic Slew Response', 'Fuel Efficiency TSFC', 'Manual Speed Modulation']
  }
];

export const TestProtocolManager: React.FC<TestProtocolManagerProps> = ({
  activeTest,
  isTestRunning,
  testElapsedTime,
  sensors,
  profile,
  onStartTest,
  onStopTest
}) => {
  const currentProtocol = TEST_PROTOCOLS.find((p) => p.id === activeTest) || TEST_PROTOCOLS[0];

  return (
    <div className="flex flex-col h-full bg-[#111215] text-slate-200 overflow-y-auto p-4 gap-4">
      {/* Header Banner */}
      <div className="bg-[#1b1c22] border border-[#2e303d] rounded p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-sky-950 border border-sky-700 text-sky-300 font-mono text-[10px] rounded uppercase font-semibold">
              {currentProtocol.category}
            </span>
            <span className="text-slate-400 font-mono text-xs">{currentProtocol.standardRef}</span>
          </div>
          <h2 className="text-lg font-bold text-slate-100 mt-1">{currentProtocol.name}</h2>
          <p className="text-xs text-slate-300 mt-1 max-w-3xl leading-relaxed">{currentProtocol.description}</p>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-3">
          {isTestRunning ? (
            <div className="flex items-center gap-3">
              <div className="text-right font-mono text-xs">
                <div className="text-amber-400 font-bold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping inline-block" /> TEST IN PROGRESS
                </div>
                <div className="text-slate-400">Elapsed: {testElapsedTime.toFixed(1)}s</div>
              </div>
              <button
                onClick={onStopTest}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-medium text-xs rounded flex items-center gap-1.5 shadow-lg transition-all"
              >
                <Square className="w-3.5 h-3.5 fill-current" /> Terminate Test
              </button>
            </div>
          ) : (
            <button
              onClick={() => onStartTest(activeTest)}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs rounded flex items-center gap-2 shadow-lg transition-all"
            >
              <Play className="w-4 h-4 fill-current" /> Execute Test Protocol
            </button>
          )}
        </div>
      </div>

      {/* Protocol Steps & Live Sensor Monitors */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Left: Protocol Steps & Procedure */}
        <div className="md:col-span-7 bg-[#16171d] border border-[#272935] rounded p-4 flex flex-col gap-3">
          <div className="flex items-center gap-2 border-b border-[#272935] pb-2 text-xs font-semibold text-sky-400">
            <FileCheck className="w-4 h-4" /> TEST PROCEDURE PHASES & TOLERANCES
          </div>

          <div className="flex flex-col gap-2">
            {currentProtocol.steps.map((step, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2.5 p-2 rounded bg-[#121317] border border-[#22242e] text-xs text-slate-300"
              >
                <span className="w-5 h-5 rounded-full bg-slate-800 text-sky-400 flex items-center justify-center font-mono text-[11px] font-bold flex-shrink-0">
                  {idx + 1}
                </span>
                <span className="leading-snug">{step}</span>
              </div>
            ))}
          </div>

          <div className="mt-2 pt-2 border-t border-[#272935]">
            <span className="text-[11px] font-mono text-slate-400">CRITICAL PARAMETERS MONITORED:</span>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {currentProtocol.parametersTested.map((param) => (
                <span
                  key={param}
                  className="px-2 py-0.5 bg-[#1b1c24] border border-[#313444] text-slate-300 text-[11px] font-mono rounded"
                >
                  {param}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Live Telemetry Gauges for Current Test */}
        <div className="md:col-span-5 bg-[#16171d] border border-[#272935] rounded p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-[#272935] pb-2 text-xs font-semibold text-amber-400">
            <span>LIVE COMPLIANCE GAUGES</span>
            <span className="font-mono text-emerald-400 text-[11px]">DAQ SYNC OK</span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-[#121317] p-2.5 rounded border border-[#22242e]">
              <div className="text-[10px] text-slate-400 font-mono">EGT TEMPERATURE</div>
              <div className={`text-xl font-bold font-mono ${sensors.egt > profile.dangerEGT ? 'text-rose-400' : sensors.egt > profile.maxEGT ? 'text-amber-400' : 'text-emerald-400'}`}>
                {Math.round(sensors.egt)}°C
              </div>
              <div className="text-[10px] text-slate-500 font-mono">Limit: {profile.dangerEGT}°C</div>
            </div>

            <div className="bg-[#121317] p-2.5 rounded border border-[#22242e]">
              <div className="text-[10px] text-slate-400 font-mono">THERMAL SPIKE ΔT</div>
              <div className="text-xl font-bold font-mono text-amber-300">
                +{sensors.thermalSpikeDelta}°C
              </div>
              <div className="text-[10px] text-slate-500 font-mono">Transient Fuel Burn</div>
            </div>

            <div className="bg-[#121317] p-2.5 rounded border border-[#22242e]">
              <div className="text-[10px] text-slate-400 font-mono">STALL MARGIN</div>
              <div className={`text-xl font-bold font-mono ${sensors.stallMarginPercent < 6 ? 'text-rose-400' : 'text-sky-300'}`}>
                +{sensors.stallMarginPercent}%
              </div>
              <div className="text-[10px] text-slate-500 font-mono">Surge Limit: 0.0%</div>
            </div>

            <div className="bg-[#121317] p-2.5 rounded border border-[#22242e]">
              <div className="text-[10px] text-slate-400 font-mono">N1 ROTOR VIBRATION</div>
              <div className={`text-xl font-bold font-mono ${sensors.vibrationIps > 2.5 ? 'text-rose-400' : 'text-slate-200'}`}>
                {sensors.vibrationIps.toFixed(2)} ips
              </div>
              <div className="text-[10px] text-slate-500 font-mono">Alert: 2.5 ips</div>
            </div>
          </div>

          <div className="p-2.5 rounded bg-[#121317] border border-[#22242e] text-xs font-mono text-slate-300 flex items-center justify-between">
            <span className="text-slate-400">FADEC Channel Status:</span>
            <span className="text-emerald-400 font-bold">CHA / CHB SYNCHRONIZED</span>
          </div>
        </div>
      </div>

      {/* Test Protocol Selector Grid (All 8 Tests) */}
      <div className="flex flex-col gap-2 mt-2">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">All Certification & Stress Test Protocols</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {TEST_PROTOCOLS.map((protocol) => {
            const isSelected = activeTest === protocol.id;
            return (
              <div
                key={protocol.id}
                onClick={() => onStartTest(protocol.id)}
                className={`p-3 rounded border text-left cursor-pointer transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'bg-[#1e2330] border-sky-500 shadow-md ring-1 ring-sky-500'
                    : 'bg-[#15161c] border-[#272935] hover:bg-[#1b1c24] hover:border-slate-600'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-slate-400 uppercase">{protocol.category}</span>
                    {isSelected && <span className="w-2 h-2 rounded-full bg-sky-400" />}
                  </div>
                  <div className="font-bold text-xs text-slate-100 mt-1">{protocol.name}</div>
                  <div className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">{protocol.description}</div>
                </div>

                <div className="mt-3 pt-2 border-t border-[#272935] flex items-center justify-between text-[11px] font-mono">
                  <span className="text-slate-500">{protocol.standardRef.split('/')[0]}</span>
                  <span className="text-sky-400 font-medium">Select & Run →</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
