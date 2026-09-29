/**
 * Types and interfaces for the AeroTest Pro Jet Engine Simulation Workstation
 */

export type EngineType =
  | 'a380_trent900'
  | 'a320_leap1a'
  | 'b787_genx'
  | 'b737_leap1b'
  | 'atr72_pw127'
  | 'cfm_leap'
  | 'f119_military'
  | 'gtf_nextgen';

export interface EngineProfile {
  id: EngineType;
  name: string;
  aircraft: string;
  manufacturer: string;
  designation: string;
  type: string;
  engineCount: 2 | 4;
  isTurboprop?: boolean;
  spools: 2 | 3;
  eprRated?: boolean;
  torqueRated?: boolean;
  bypassRatio: number;
  maxDryThrustKN: number;
  maxWetThrustKN: number; // with afterburner
  hasAfterburner: boolean;
  maxEGT: number; // °C caution threshold
  dangerEGT: number; // °C critical threshold
  idleRPM: number; // % N1
  maxRPM: number; // % N1 (100% normal, 108% limit)
  pressureRatioMax: number;
  description: string;
}

export interface EngineSensors {
  throttle: number; // 0 to 110%
  targetThrottle: number; // setpoint
  n1: number; // Fan RPM %
  n2: number; // Intermediate/High Core compressor RPM %
  n3: number; // High Pressure Core spool for triple-spool (Trent 900)
  epr: number; // Engine Pressure Ratio (1.00 to 1.65)
  propellerRPM: number; // For ATR72 Turboprop (0 to 1200 NP)
  torquePercent: number; // For ATR72 Turboprop (0 to 105%)
  itt: number; // Inter-Turbine Temp °C (turboprop)
  egt: number; // Exhaust Gas Temp in °C
  tit: number; // Turbine Inlet Temp in °C
  thrustKN: number; // Thrust in kN
  thrustLbf: number; // Thrust in lbf
  fuelFlowKgH: number; // Fuel Flow in kg/hour
  fuelFlowPPH: number; // Fuel Flow in pounds/hr
  tsfc: number; // Thrust Specific Fuel Consumption g/kN·s
  oilPressurePSI: number; // Oil Pressure PSI (normal 45-75)
  oilTempC: number; // Oil Temperature °C (normal 70-110)
  oilQuantityQt: number; // Oil quantity quarts (normal 16-24)
  nacelleTempC: number; // Nacelle compartment temp °C (normal 60-120)
  vibrationIps: number; // Vibration in/sec (normal < 1.2, alert > 2.5)
  corePressureRatio: number; // Compressor pressure ratio
  airMassFlowKgS: number; // Air mass flow kg/s
  bypassRatio: number; // dynamic bypass ratio
  nozzlePositionPercent: number; // 0 (closed) to 100% (fully open)
  thermalSpikeActive: boolean;
  thermalSpikeDelta: number; // transient temperature overshoot in °C
  stallMarginPercent: number; // % margin to compressor surge line
  afterburnerActive: boolean;
  reverseThrustActive: boolean;
  flameoutActive: boolean;
  fireActive: boolean;
  birdStrikeDamage: number; // 0 to 1
  waterIngestionLevel: number; // 0 to 1
  coolingBleedAirFailed: boolean;
  fireBottle1Discharged: boolean;
  fireBottle2Discharged: boolean;
}

export type TestProtocolId =
  | 'manual_sweep'
  | 'thermal_spike'
  | 'compressor_stall'
  | 'bird_strike'
  | 'overtemp_rupture'
  | 'water_ingestion'
  | 'flameout_restart'
  | 'engine_fire';

export interface TestProtocol {
  id: TestProtocolId;
  name: string;
  category: 'Certification' | 'Stress Testing' | 'Safety & Emergency' | 'Performance';
  standardRef: string; // e.g. "FAA FAR § 33.73", "EASA CS-E 740"
  description: string;
  steps: string[];
  parametersTested: string[];
}

export interface TelemetryPoint {
  timestamp: number; // ms
  timeSec: number;
  throttle: number;
  n1: number;
  n2: number;
  egt: number;
  thrustKN: number;
  fuelFlowKgH: number;
  vibrationIps: number;
  pressureRatio: number;
  massFlow: number;
  stallMargin: number;
}

export interface TestLogEntry {
  id: string;
  timestamp: string;
  timeOffsetSec: number;
  type: 'info' | 'caution' | 'warning' | 'critical' | 'action';
  message: string;
  source: string;
  value?: string;
}

export interface TestRunStatistics {
  testId: TestProtocolId;
  startTime: number;
  durationSec: number;
  peakEGT: number;
  peakEGTOverTimeSec: number;
  maxThermalSpikeRate: number; // °C/s
  peakThrustKN: number;
  peakVibrationIps: number;
  totalFuelUsedKg: number;
  maxN1: number;
  maxN2: number;
  minStallMargin: number;
  passedFARStandards: boolean;
  findings: string[];
}

export type ViewTab = 'test_cell' | 'a380_ecam' | 'telemetry' | 'compressor_map' | 'analytics' | 'protocols';
