/**
 * Physics and thermodynamic engine simulation for AeroTest Pro
 * High-fidelity calculations of turbofan thermodynamics, spool inertia,
 * transient fuel enrichment, thermal spikes, compressor stall margins,
 * and test condition injections.
 */

import { EngineProfile, EngineSensors, EngineType, TestProtocolId, TestRunStatistics } from '../types/engine';
import { soundEngine } from './soundEngine';

export const ENGINE_PROFILES: Record<EngineType, EngineProfile> = {
  a380_trent900: {
    id: 'a380_trent900',
    name: 'Rolls-Royce Trent 900',
    aircraft: 'Airbus A380-800 Superjumbo',
    manufacturer: 'Rolls-Royce',
    designation: 'Quad-Turbofan (Triple-Spool BPR 8.7:1)',
    type: 'Three-Shaft High-Bypass Turbofan',
    engineCount: 4,
    spools: 3,
    eprRated: true,
    bypassRatio: 8.7,
    maxDryThrustKN: 356.0,
    maxWetThrustKN: 356.0,
    hasAfterburner: false,
    maxEGT: 955,
    dangerEGT: 1040,
    idleRPM: 20.2,
    maxRPM: 101.5,
    pressureRatioMax: 39.0,
    description: 'Three-shaft high-bypass turbofan powering the Airbus A380 double-decker with swept wide-chord hollow titanium fan blades, triple-spool (N1/N2/N3) architecture, and full ECAM EPR thrust management.'
  },
  a320_leap1a: {
    id: 'a320_leap1a',
    name: 'CFM LEAP-1A-26',
    aircraft: 'Airbus A320neo Family',
    manufacturer: 'CFM International',
    designation: 'Twin-Spool High-Bypass (BPR 11:1)',
    type: 'Dual-Spool High-Bypass Turbofan',
    engineCount: 2,
    spools: 2,
    eprRated: false,
    bypassRatio: 11.0,
    maxDryThrustKN: 143.0,
    maxWetThrustKN: 143.0,
    hasAfterburner: false,
    maxEGT: 920,
    dangerEGT: 1010,
    idleRPM: 19.5,
    maxRPM: 102.0,
    pressureRatioMax: 40.0,
    description: 'Next-generation engine powering the Airbus A320neo with 3D woven RTM carbon-fiber composite fan blades, ceramic matrix composites (CMC), and twin-annular pre-swirl (TAPS II) combustor.'
  },
  b787_genx: {
    id: 'b787_genx',
    name: 'General Electric GEnx-1B70',
    aircraft: 'Boeing 787-9 Dreamliner',
    manufacturer: 'GE Aerospace',
    designation: 'High-Bypass Bleedless (BPR 9.6:1)',
    type: 'Dual-Spool High-Bypass Turbofan',
    engineCount: 2,
    spools: 2,
    eprRated: false,
    bypassRatio: 9.6,
    maxDryThrustKN: 338.0,
    maxWetThrustKN: 338.0,
    hasAfterburner: false,
    maxEGT: 940,
    dangerEGT: 1025,
    idleRPM: 21.0,
    maxRPM: 103.0,
    pressureRatioMax: 44.0,
    description: 'Next-generation high-thrust engine for the Boeing 787 Dreamliner featuring composite fan case, titanium aluminide turbine blades, acoustic serrated chevrons on the nacelle exhaust, and bleedless all-electric architecture.'
  },
  b737_leap1b: {
    id: 'b737_leap1b',
    name: 'CFM LEAP-1B28',
    aircraft: 'Boeing 737 MAX 8/9/10',
    manufacturer: 'CFM International',
    designation: 'High-Bypass Flat-Bottom Nacelle (BPR 9.0:1)',
    type: 'Dual-Spool High-Bypass Turbofan',
    engineCount: 2,
    spools: 2,
    eprRated: false,
    bypassRatio: 9.0,
    maxDryThrustKN: 130.4,
    maxWetThrustKN: 130.4,
    hasAfterburner: false,
    maxEGT: 935,
    dangerEGT: 1015,
    idleRPM: 19.8,
    maxRPM: 102.5,
    pressureRatioMax: 41.0,
    description: 'Custom-designed for ground clearance on the Boeing 737 MAX with 69-inch fan diameter, flat-bottom nacelle, chevron exhaust nozzles, and dual-channel digital FADEC.'
  },
  atr72_pw127: {
    id: 'atr72_pw127',
    name: 'Pratt & Whitney Canada PW127M',
    aircraft: 'ATR 72-600 Regional Turboprop',
    manufacturer: 'Pratt & Whitney Canada',
    designation: 'Twin-Spool Free-Turbine Turboprop',
    type: 'Free-Turbine Turboprop with Reduction Gearbox',
    engineCount: 2,
    isTurboprop: true,
    spools: 2,
    torqueRated: true,
    bypassRatio: 0.0,
    maxDryThrustKN: 24.5,
    maxWetThrustKN: 27.5,
    hasAfterburner: false,
    maxEGT: 816, // ITT Inter-Turbine Temp
    dangerEGT: 860,
    idleRPM: 18.0,
    maxRPM: 100.0,
    pressureRatioMax: 15.8,
    description: 'Advanced regional turboprop engine with modular design, electronic engine control (EEC), driving 6-bladed Hamilton Sundstrand 568F composite propeller at 1200 RPM NP, developing 2750 SHP.'
  },
  cfm_leap: {
    id: 'cfm_leap',
    name: 'LEAP-1B Generic Test Bench',
    aircraft: 'Commercial Jet Platform',
    manufacturer: 'CFM International',
    designation: 'Commercial High-Bypass (BPR 11:1)',
    type: 'Dual-Spool High-Bypass Turbofan',
    engineCount: 2,
    spools: 2,
    bypassRatio: 11.0,
    maxDryThrustKN: 145.0,
    maxWetThrustKN: 145.0,
    hasAfterburner: false,
    maxEGT: 920,
    dangerEGT: 1010,
    idleRPM: 19.5,
    maxRPM: 102.5,
    pressureRatioMax: 41.0,
    description: 'Modern high-efficiency commercial engine test cell bench with composite fan blades and 3D woven titanium-aluminide turbine blades.'
  },
  f119_military: {
    id: 'f119_military',
    name: 'F119-PW Augmented Turbofan',
    aircraft: 'F-22 Raptor Air Dominance Fighter',
    manufacturer: 'Pratt & Whitney',
    designation: 'Military Low-Bypass Supersonic (BPR 0.3:1)',
    type: 'Twin-Spool Augmented Afterburning Turbofan',
    engineCount: 2,
    spools: 2,
    bypassRatio: 0.3,
    maxDryThrustKN: 116.0,
    maxWetThrustKN: 175.0,
    hasAfterburner: true,
    maxEGT: 1040,
    dangerEGT: 1150,
    idleRPM: 22.0,
    maxRPM: 106.0,
    pressureRatioMax: 35.0,
    description: 'High-thrust military engine with afterburner augmentor, convergent-divergent 2D pitch-vectoring exhaust nozzle, and Mach 1.8+ supercruise capability.'
  },
  gtf_nextgen: {
    id: 'gtf_nextgen',
    name: 'GTF-Adv Geared Turbofan Prototype',
    aircraft: 'Ultra-Efficient NextGen Airliner',
    manufacturer: 'Pratt & Whitney',
    designation: 'Geared Ultra-High Bypass (BPR 12.5:1)',
    type: 'Geared Architecture Turbofan',
    engineCount: 2,
    spools: 2,
    bypassRatio: 12.5,
    maxDryThrustKN: 160.0,
    maxWetThrustKN: 160.0,
    hasAfterburner: false,
    maxEGT: 890,
    dangerEGT: 980,
    idleRPM: 18.0,
    maxRPM: 101.0,
    pressureRatioMax: 45.0,
    description: 'Reduction gearbox separates high-speed core turbine from slower high-diameter fan for revolutionary acoustic and thermal efficiency.'
  }
};

export class EngineSimulation {
  public profile: EngineProfile;
  public sensors: EngineSensors;
  public multiEngineSensors: EngineSensors[] = [];
  public activeTest: TestProtocolId = 'manual_sweep';
  public testRunning: boolean = false;
  public testElapsedTime: number = 0;
  public testStepIndex: number = 0;

  // Internal dynamics state
  private throttleRate: number = 0; // % per sec
  private prevThrottle: number = 0;
  private thermalLagEGT: number = 420;
  private transientSpikeFuel: number = 0;
  private responseSlewRate: number = 25; // % throttle per sec
  private fireExtinguishProgress: number = 0;
  private flameoutSpoolingDown: boolean = false;
  private restartTimer: number = 0;

  // Test statistics
  public stats: TestRunStatistics = {
    testId: 'manual_sweep',
    startTime: Date.now(),
    durationSec: 0,
    peakEGT: 420,
    peakEGTOverTimeSec: 0,
    maxThermalSpikeRate: 0,
    peakThrustKN: 0,
    peakVibrationIps: 0.35,
    totalFuelUsedKg: 0,
    maxN1: 20,
    maxN2: 58,
    minStallMargin: 25,
    passedFARStandards: true,
    findings: []
  };

  constructor(profileType: EngineType = 'a380_trent900') {
    this.profile = ENGINE_PROFILES[profileType];
    this.sensors = this.getInitialSensors();
    this.initMultiEngineSensors();
    this.prevThrottle = this.sensors.throttle;
  }

  private initMultiEngineSensors() {
    const count = this.profile.engineCount || 2;
    this.multiEngineSensors = Array.from({ length: count }, (_, idx) => {
      const s = this.getInitialSensors();
      // Apply slight thermodynamic calibration variance per engine
      const varFactor = (idx - (count - 1) / 2) * 0.4;
      s.n1 = Number((s.n1 + varFactor * 0.3).toFixed(1));
      s.n2 = Number((s.n2 - varFactor * 0.2).toFixed(1));
      s.n3 = Number((s.n3 + varFactor * 0.2).toFixed(1));
      s.egt = Math.round(s.egt + varFactor * 3.5);
      return s;
    });
  }

  private getInitialSensors(): EngineSensors {
    return {
      throttle: 20, // Ground idle
      targetThrottle: 20,
      n1: 20.4,
      n2: 59.2,
      n3: 64.8,
      epr: 1.02,
      propellerRPM: 820,
      torquePercent: 19.5,
      itt: 525,
      egt: 445,
      tit: 780,
      thrustKN: 8.5,
      thrustLbf: 1910,
      fuelFlowKgH: 480,
      fuelFlowPPH: 1058,
      tsfc: 15.6,
      oilPressurePSI: 58.2,
      oilTempC: 74.5,
      oilQuantityQt: 21.4,
      nacelleTempC: 82.0,
      vibrationIps: 0.32,
      corePressureRatio: 3.8,
      airMassFlowKgS: 145,
      bypassRatio: this.profile.bypassRatio,
      nozzlePositionPercent: 82,
      thermalSpikeActive: false,
      thermalSpikeDelta: 0,
      stallMarginPercent: 28.5,
      afterburnerActive: false,
      reverseThrustActive: false,
      flameoutActive: false,
      fireActive: false,
      birdStrikeDamage: 0,
      waterIngestionLevel: 0,
      coolingBleedAirFailed: false,
      fireBottle1Discharged: false,
      fireBottle2Discharged: false
    };
  }

  public setEngineProfile(profileType: EngineType) {
    this.profile = ENGINE_PROFILES[profileType];
    this.initMultiEngineSensors();
    this.resetSimulation();
  }

  public setThrottle(val: number) {
    const clamped = Math.max(0, Math.min(this.profile.hasAfterburner ? 110 : 100, val));
    this.sensors.targetThrottle = clamped;
    // Also gang to all individual engines
    for (const eng of this.multiEngineSensors) {
      eng.targetThrottle = clamped;
    }
  }

  public setIndividualThrottle(index: number, val: number) {
    if (this.multiEngineSensors[index]) {
      const clamped = Math.max(0, Math.min(this.profile.hasAfterburner ? 110 : 100, val));
      this.multiEngineSensors[index].targetThrottle = clamped;
    }
  }

  public setIndividualMaster(index: number, state: boolean) {
    if (this.multiEngineSensors[index]) {
      this.multiEngineSensors[index].flameoutActive = !state;
      if (!state) {
        this.multiEngineSensors[index].targetThrottle = 0;
      } else {
        this.multiEngineSensors[index].targetThrottle = 20;
      }
    }
    if (index === 0) {
      this.sensors.flameoutActive = !state;
      if (!state) this.sensors.targetThrottle = 0;
    }
  }

  public setAllColdAndDark() {
    this.sensors.targetThrottle = 0;
    this.sensors.throttle = 0;
    this.sensors.flameoutActive = true;
    this.sensors.n1 = 0;
    this.sensors.n2 = 0;
    this.sensors.n3 = 0;
    this.sensors.egt = 20; // ambient
    this.sensors.thrustKN = 0;
    this.sensors.fuelFlowKgH = 0;
    for (const eng of this.multiEngineSensors) {
      eng.targetThrottle = 0;
      eng.throttle = 0;
      eng.flameoutActive = true;
      eng.n1 = 0;
      eng.n2 = 0;
      eng.n3 = 0;
      eng.egt = 20;
      eng.thrustKN = 0;
      eng.fuelFlowKgH = 0;
    }
  }

  public setAllAutoStart() {
    this.sensors.flameoutActive = false;
    this.sensors.targetThrottle = 20;
    this.sensors.throttle = 20;
    this.sensors.n1 = this.profile.idleRPM;
    this.sensors.n2 = 58.5;
    this.sensors.n3 = 64.0;
    this.sensors.egt = 445;
    for (const eng of this.multiEngineSensors) {
      eng.flameoutActive = false;
      eng.targetThrottle = 20;
      eng.throttle = 20;
      eng.n1 = this.profile.idleRPM;
      eng.n2 = 58.5;
      eng.n3 = 64.0;
      eng.egt = 445;
    }
  }

  public setSlewRate(rate: number) {
    this.responseSlewRate = Math.max(5, Math.min(200, rate));
  }

  public getSlewRate(): number {
    return this.responseSlewRate;
  }

  public toggleReverseThrust() {
    if (this.sensors.throttle <= 25) {
      this.sensors.reverseThrustActive = !this.sensors.reverseThrustActive;
    }
  }

  public triggerEmergencyCutoff() {
    this.sensors.targetThrottle = 0;
    this.sensors.throttle = 0;
    this.sensors.flameoutActive = true;
    soundEngine.speak('EMERGENCY ENGINE CUTOFF EXECUTED');
  }

  public dischargeFireBottle(bottleNum: 1 | 2) {
    if (bottleNum === 1) this.sensors.fireBottle1Discharged = true;
    if (bottleNum === 2) this.sensors.fireBottle2Discharged = true;

    soundEngine.playFireBottleDischarge();

    if (this.sensors.fireActive) {
      this.fireExtinguishProgress += bottleNum === 1 ? 0.7 : 0.45;
      if (this.fireExtinguishProgress >= 1.0) {
        this.sensors.fireActive = false;
        soundEngine.stopFireAlarm();
        soundEngine.speak('FIRE EXTINGUISHED. ALL FIRE SYSTEMS NORMALIZED.');
      }
    }
  }

  public resetSimulation() {
    this.sensors = this.getInitialSensors();
    this.prevThrottle = this.sensors.throttle;
    this.flameoutSpoolingDown = false;
    this.restartTimer = 0;
    this.testRunning = false;
    this.testElapsedTime = 0;
    this.fireExtinguishProgress = 0;
    soundEngine.stopFireAlarm();
    soundEngine.stopMasterWarning();

    this.stats = {
      testId: this.activeTest,
      startTime: Date.now(),
      durationSec: 0,
      peakEGT: 445,
      peakEGTOverTimeSec: 0,
      maxThermalSpikeRate: 0,
      peakThrustKN: 0,
      peakVibrationIps: 0.32,
      totalFuelUsedKg: 0,
      maxN1: 21.4,
      maxN2: 59.2,
      minStallMargin: 28.5,
      passedFARStandards: true,
      findings: []
    };
  }

  /**
   * Main Physics Tick (called at 30-60Hz)
   * dt: elapsed time in seconds
   */
  public update(dt: number) {
    if (dt > 0.2) dt = 0.05; // clamp tab background pause

    // 1. Throttle Slew & Rate of Change
    const deltaThrottle = this.sensors.targetThrottle - this.sensors.throttle;
    const maxChange = this.responseSlewRate * dt;
    if (Math.abs(deltaThrottle) <= maxChange) {
      this.sensors.throttle = this.sensors.targetThrottle;
    } else {
      this.sensors.throttle += Math.sign(deltaThrottle) * maxChange;
    }

    this.throttleRate = (this.sensors.throttle - this.prevThrottle) / dt;
    this.prevThrottle = this.sensors.throttle;

    // 2. Active Test Automation Step Logic
    if (this.testRunning) {
      this.updateTestProtocol(dt);
    }

    // 3. Flameout / Cutoff Handling
    if (this.sensors.flameoutActive) {
      this.sensors.n2 = Math.max(12, this.sensors.n2 - dt * 9.5); // windmilling at ~12-15%
      this.sensors.n1 = Math.max(8, this.sensors.n1 - dt * 6.5);
      this.sensors.egt = Math.max(45, this.sensors.egt - dt * 55);
      this.sensors.thrustKN = Math.max(0, this.sensors.thrustKN - dt * 35);
      this.sensors.fuelFlowKgH = 0;
      this.sensors.thermalSpikeActive = false;
      this.sensors.thermalSpikeDelta = 0;
      this.sensors.afterburnerActive = false;
      this.updateDerivedSensors(dt);
      soundEngine.updateEngineSound(this.sensors.n1, this.sensors.n2, 0, false, true);
      return;
    }

    // 4. Normal Spool Dynamics (Rotor Inertia & Spool Lag)
    // N2 (high pressure core spool) reacts first
    const idleN2 = 58.0;
    const maxN2 = this.profile.maxRPM;
    const targetN2 = idleN2 + (this.sensors.throttle / 100) * (maxN2 - idleN2);
    // Spool time constant: accelerating takes more time than decelerating
    const n2InertiaRate = this.sensors.throttle > this.prevThrottle ? 0.95 : 1.35;
    this.sensors.n2 += (targetN2 - this.sensors.n2) * Math.min(1, dt * n2InertiaRate * 1.8);

    // N1 (large low pressure fan) has more inertia and follows N2
    const idleN1 = this.profile.idleRPM;
    const maxN1 = 100.0;
    const targetN1 = idleN1 + (Math.pow(this.sensors.n2 / maxN2, 1.45)) * (maxN1 - idleN1);
    this.sensors.n1 += (targetN1 - this.sensors.n1) * Math.min(1, dt * 1.4);

    // 5. Thermal Spike Dynamics on Speed Variations
    // When throttle increases rapidly, fuel flow surges ahead of compressor mass flow, causing sudden EGT spike!
    if (this.throttleRate > 8) {
      // Rapid acceleration: transient rich fuel burn
      const spikeMagnitude = (this.throttleRate / 100) * 240;
      this.transientSpikeFuel = Math.min(280, this.transientSpikeFuel + spikeMagnitude * dt * 3.5);
      this.sensors.thermalSpikeActive = true;
    } else {
      // Decay thermal spike as airflow matches fuel flow
      this.transientSpikeFuel = Math.max(0, this.transientSpikeFuel - dt * 95);
      if (this.transientSpikeFuel < 5) {
        this.sensors.thermalSpikeActive = false;
      }
    }
    this.sensors.thermalSpikeDelta = Math.round(this.transientSpikeFuel);

    // Track peak thermal spike rate
    const currentSpikeRate = this.sensors.thermalSpikeDelta / (dt || 0.05);
    if (currentSpikeRate > this.stats.maxThermalSpikeRate) {
      this.stats.maxThermalSpikeRate = Math.round(currentSpikeRate);
    }

    // Steady-state EGT based on core RPM & throttle
    const baseEGT = 400 + Math.pow(this.sensors.n2 / 100, 2.1) * 380;
    let targetEGT = baseEGT + this.sensors.thermalSpikeDelta;

    // Afterburner boost EGT
    if (this.profile.hasAfterburner && this.sensors.throttle > 100) {
      this.sensors.afterburnerActive = true;
      targetEGT += (this.sensors.throttle - 100) * 18.5; // up to +185°C
    } else {
      this.sensors.afterburnerActive = false;
    }

    // Injections / Malfunctions impact on EGT
    if (this.sensors.coolingBleedAirFailed) {
      targetEGT += 190; // Turbine blade cooling failure
    }
    if (this.sensors.waterIngestionLevel > 0) {
      targetEGT -= this.sensors.waterIngestionLevel * 80; // Water quenches combustion flame
    }

    // Thermocouple probe lag
    this.sensors.egt += (targetEGT - this.sensors.egt) * Math.min(1, dt * 3.2);
    this.sensors.tit = this.sensors.egt * 1.48; // TIT is typically ~1.4 - 1.5x EGT

    // 6. Thrust Calculation
    const n1Frac = Math.max(0, (this.sensors.n1 - this.profile.idleRPM) / (100 - this.profile.idleRPM));
    let baseThrust = Math.pow(n1Frac, 2.25) * this.profile.maxDryThrustKN;

    if (this.sensors.afterburnerActive) {
      const abFactor = (this.sensors.throttle - 100) / 10;
      baseThrust += abFactor * (this.profile.maxWetThrustKN - this.profile.maxDryThrustKN);
    }
    if (this.sensors.birdStrikeDamage > 0) {
      baseThrust *= (1 - this.sensors.birdStrikeDamage * 0.28);
    }
    if (this.sensors.reverseThrustActive) {
      baseThrust = -baseThrust * 0.42; // 42% reverse thrust deflection
    }

    this.sensors.thrustKN = Math.max(0, baseThrust);
    this.sensors.thrustLbf = Math.round(this.sensors.thrustKN * 224.809);

    // 7. Fuel Flow & Specific Fuel Consumption
    const baseFuelRate = 380 + Math.pow(this.sensors.n2 / 100, 3.1) * 3200;
    const transientFuel = this.sensors.thermalSpikeDelta * 4.5;
    const afterburnerFuel = this.sensors.afterburnerActive ? 4200 * ((this.sensors.throttle - 100) / 10) : 0;
    this.sensors.fuelFlowKgH = Math.round(baseFuelRate + transientFuel + afterburnerFuel);
    this.sensors.fuelFlowPPH = Math.round(this.sensors.fuelFlowKgH * 2.20462);

    if (this.sensors.thrustKN > 1) {
      this.sensors.tsfc = Number(((this.sensors.fuelFlowKgH / 3600) / (this.sensors.thrustKN) * 1000).toFixed(2));
    } else {
      this.sensors.tsfc = 0;
    }

    // Cumulative fuel used
    this.stats.totalFuelUsedKg += (this.sensors.fuelFlowKgH / 3600) * dt;

    // 8. Derived Aerodynamic and Mechanical Parameters
    this.updateDerivedSensors(dt);

    // 9. Sound update
    soundEngine.updateEngineSound(
      this.sensors.n1,
      this.sensors.n2,
      this.sensors.throttle,
      this.sensors.afterburnerActive,
      false
    );

    // 10. Alarm Threshold Checks
    this.evaluateAlarms();

    // 11. Statistics tracking
    if (this.sensors.egt > this.stats.peakEGT) {
      this.stats.peakEGT = Math.round(this.sensors.egt);
      this.stats.peakEGTOverTimeSec = Math.round(this.testElapsedTime);
    }
    if (this.sensors.thrustKN > this.stats.peakThrustKN) {
      this.stats.peakThrustKN = Math.round(this.sensors.thrustKN);
    }
    if (this.sensors.vibrationIps > this.stats.peakVibrationIps) {
      this.stats.peakVibrationIps = Number(this.sensors.vibrationIps.toFixed(2));
    }
    if (this.sensors.n1 > this.stats.maxN1) this.stats.maxN1 = Math.round(this.sensors.n1);
    if (this.sensors.n2 > this.stats.maxN2) this.stats.maxN2 = Math.round(this.sensors.n2);
    if (this.sensors.stallMarginPercent < this.stats.minStallMargin) {
      this.stats.minStallMargin = Number(this.sensors.stallMarginPercent.toFixed(1));
    }
  }

  private updateDerivedSensors(dt: number) {
    const n2Norm = this.sensors.n2 / 100;
    const n1Norm = this.sensors.n1 / 100;

    // Core Pressure Ratio (follows exponential curve with N2)
    this.sensors.corePressureRatio = Number((1.2 + Math.pow(n2Norm, 2.8) * (this.profile.pressureRatioMax - 1.2)).toFixed(1));

    // Air Mass Flow (kg/s)
    this.sensors.airMassFlowKgS = Math.round(120 + Math.pow(n1Norm, 1.8) * 480);

    // Dynamic bypass ratio
    this.sensors.bypassRatio = Number((this.profile.bypassRatio * (1.15 - n1Norm * 0.2)).toFixed(1));

    // Oil Pressure & Temp
    const targetOilPSI = 40 + n2Norm * 38;
    this.sensors.oilPressurePSI += (targetOilPSI - this.sensors.oilPressurePSI) * dt * 1.5;
    const targetOilTemp = 60 + n2Norm * 42 + (this.sensors.coolingBleedAirFailed ? 25 : 0);
    this.sensors.oilTempC += (targetOilTemp - this.sensors.oilTempC) * dt * 0.4;

    // Vibration: normal background rumble (0.2 - 0.4 ips) + blade damage + stall surge
    let vib = 0.25 + (n2Norm * 0.2) + (Math.sin(Date.now() / 80) * 0.04);
    if (this.sensors.birdStrikeDamage > 0) {
      vib += this.sensors.birdStrikeDamage * 3.8; // severe imbalance
    }
    if (this.sensors.stallMarginPercent < 8) {
      vib += (8 - this.sensors.stallMarginPercent) * 0.35; // stall buffeting
    }
    this.sensors.vibrationIps = Number(Math.max(0.1, vib).toFixed(2));

    // Compressor Stall Margin (% distance to surge boundary)
    // Faster throttle transients or high backpressure reduce stall margin
    const dynamicTransientPenalty = Math.max(0, this.throttleRate * 0.45);
    const waterPenalty = this.sensors.waterIngestionLevel * 12;
    let baseMargin = 32 - (n2Norm * 10) - dynamicTransientPenalty - waterPenalty;
    if (this.activeTest === 'compressor_stall' && this.testRunning) {
      baseMargin = Math.max(1.2, 5 - Math.sin(this.testElapsedTime * 2) * 4);
    }
    this.sensors.stallMarginPercent = Number(Math.max(0.5, Math.min(40, baseMargin)).toFixed(1));

    // 3-Shaft Core N3 (High-pressure spool on Rolls-Royce Trent 900)
    if (this.profile.spools === 3) {
      this.sensors.n3 = Number((62.0 + (n2Norm * 38.5)).toFixed(1));
    } else {
      this.sensors.n3 = this.sensors.n2;
    }

    // Engine Pressure Ratio (EPR) rating for A380 Rolls-Royce Trent 900
    if (this.profile.eprRated) {
      this.sensors.epr = Number((1.01 + Math.pow(n1Norm, 2.15) * 0.58).toFixed(2));
    } else {
      this.sensors.epr = Number((1.00 + (n1Norm * 0.52)).toFixed(2));
    }

    // Turboprop Parameters for ATR 72-600 (PW127M)
    if (this.profile.isTurboprop) {
      this.sensors.torquePercent = Number((Math.min(105, 18.0 + (this.sensors.throttle / 100) * 84)).toFixed(1));
      this.sensors.propellerRPM = Math.round(750 + (n1Norm * 450)); // Up to 1200 RPM NP
      this.sensors.itt = Math.round(510 + Math.pow(n2Norm, 2.0) * 310 + this.sensors.thermalSpikeDelta);
    } else {
      this.sensors.torquePercent = 0;
      this.sensors.propellerRPM = 0;
      this.sensors.itt = this.sensors.egt;
    }

    // Oil Quantity & Nacelle Compartment Temperature
    this.sensors.oilQuantityQt = Number((21.5 - (this.stats.totalFuelUsedKg * 0.001)).toFixed(1));
    const targetNacelleTemp = 75 + (n2Norm * 42) + (this.sensors.fireActive ? 295 : 0);
    this.sensors.nacelleTempC += (targetNacelleTemp - this.sensors.nacelleTempC) * dt * 0.8;

    // Synchronize multi-engine array with individual realistic variances
    const count = this.profile.engineCount || 2;
    if (this.multiEngineSensors.length !== count) {
      this.initMultiEngineSensors();
    }
    for (let i = 0; i < this.multiEngineSensors.length; i++) {
      const offset = (i - (count - 1) / 2) * 0.4;
      const eng = this.multiEngineSensors[i];
      eng.throttle = this.sensors.throttle;
      eng.targetThrottle = this.sensors.targetThrottle;
      eng.n1 = Number((this.sensors.n1 + offset * 0.25).toFixed(1));
      eng.n2 = Number((this.sensors.n2 - offset * 0.2).toFixed(1));
      eng.n3 = Number((this.sensors.n3 + offset * 0.15).toFixed(1));
      eng.epr = Number((this.sensors.epr + offset * 0.008).toFixed(2));
      eng.egt = Math.round(this.sensors.egt + offset * 3);
      eng.itt = Math.round(this.sensors.itt + offset * 2.5);
      eng.thrustKN = Number((this.sensors.thrustKN * (1 + offset * 0.01)).toFixed(1));
      eng.fuelFlowKgH = Math.round(this.sensors.fuelFlowKgH + offset * 12);
      eng.oilPressurePSI = Number((this.sensors.oilPressurePSI + offset * 0.8).toFixed(1));
      eng.oilTempC = Math.round(this.sensors.oilTempC + offset * 0.6);
      eng.oilQuantityQt = Number((this.sensors.oilQuantityQt + offset * 0.2).toFixed(1));
      eng.nacelleTempC = Math.round(this.sensors.nacelleTempC + offset * 1.5);
      eng.vibrationIps = Number((this.sensors.vibrationIps + (Math.sin(Date.now() / 150 + i) * 0.04)).toFixed(2));
      eng.stallMarginPercent = Number((this.sensors.stallMarginPercent + offset * 0.3).toFixed(1));
      eng.torquePercent = Number((this.sensors.torquePercent + offset * 0.4).toFixed(1));
      eng.propellerRPM = Math.round(this.sensors.propellerRPM + offset * 6);
      eng.thermalSpikeActive = this.sensors.thermalSpikeActive;
      eng.thermalSpikeDelta = this.sensors.thermalSpikeDelta;
      eng.reverseThrustActive = this.sensors.reverseThrustActive;
      // If fire is active on eng 1 (or all in test)
      eng.fireActive = (i === 0 && this.sensors.fireActive);
      eng.flameoutActive = this.sensors.flameoutActive;
    }
  }

  private evaluateAlarms() {
    // Fire Alarm Check
    if (this.sensors.fireActive) {
      if (!soundEngine.isFireActive()) {
        soundEngine.startFireAlarm();
      }
    } else {
      if (soundEngine.isFireActive()) {
        soundEngine.stopFireAlarm();
      }
    }

    // Master Warning: Overtemp, Overspeed, Severe Vibration
    const isOvertemp = this.sensors.egt >= this.profile.dangerEGT;
    const isOverspeed = this.sensors.n2 >= this.profile.maxRPM + 4;
    const isSevereVibration = this.sensors.vibrationIps >= 3.0;
    const isCriticalStall = this.sensors.stallMarginPercent <= 3.0;

    if (isOvertemp || isOverspeed || isSevereVibration || isCriticalStall) {
      if (!soundEngine.isWarningActive()) {
        soundEngine.startMasterWarning();
        if (isOvertemp) soundEngine.speak('MASTER WARNING: ENGINE OVERTEMP');
        else if (isOverspeed) soundEngine.speak('MASTER WARNING: OVERSPEED');
        else if (isSevereVibration) soundEngine.speak('MASTER WARNING: HIGH VIBRATION');
        else if (isCriticalStall) soundEngine.speak('MASTER WARNING: COMPRESSOR STALL');
      }
    } else {
      if (soundEngine.isWarningActive() && !this.sensors.fireActive) {
        soundEngine.stopMasterWarning();
      }
    }
  }

  /**
   * Automated Test Protocol Execution Engine
   */
  public startTestProtocol(testId: TestProtocolId) {
    this.activeTest = testId;
    this.testRunning = true;
    this.testElapsedTime = 0;
    this.testStepIndex = 0;
    this.resetSimulation();
    this.testRunning = true; // reset clears it, set true again

    soundEngine.playMasterCaution();
    soundEngine.speak(`INITIALIZING ${testId.toUpperCase().replace('_', ' ')} PROTOCOL`);
  }

  public stopTestProtocol() {
    this.testRunning = false;
    soundEngine.stopMasterWarning();
    soundEngine.stopFireAlarm();
    soundEngine.speak('TEST PROTOCOL TERMINATED');
  }

  private updateTestProtocol(dt: number) {
    this.testElapsedTime += dt;
    this.stats.durationSec = Math.round(this.testElapsedTime);

    switch (this.activeTest) {
      case 'thermal_spike':
        // Test Rapid Accel/Decel Thermal Shock Cycles
        if (this.testElapsedTime < 3) {
          this.sensors.targetThrottle = 20; // stabilized idle
          this.setSlewRate(150); // fast test bench response
        } else if (this.testElapsedTime < 7) {
          this.sensors.targetThrottle = 100; // slam throttle to 100% -> causes massive thermal spike!
        } else if (this.testElapsedTime < 11) {
          this.sensors.targetThrottle = 20; // rapid decel
        } else if (this.testElapsedTime < 15) {
          this.sensors.targetThrottle = 105; // slam to max
        } else if (this.testElapsedTime < 18) {
          this.sensors.targetThrottle = 65; // settle cruise
        } else {
          this.testRunning = false;
          soundEngine.speak('THERMAL SPIKE TEST COMPLETED. DATA RECORDED.');
          this.stats.findings.push(`Peak transient EGT overshoot: +${this.stats.maxThermalSpikeRate}°C/s`);
        }
        break;

      case 'compressor_stall':
        // Induce inlet distortion and stall surge
        if (this.testElapsedTime < 3) {
          this.sensors.targetThrottle = 85;
        } else if (this.testElapsedTime < 6) {
          // Trigger stall
          if (this.sensors.stallMarginPercent > 5) {
            soundEngine.playCompressorStallBang();
          }
          this.sensors.vibrationIps = 3.6;
        } else if (this.testElapsedTime < 9) {
          // FADEC auto-recovery: cut fuel slightly and open bleed valves
          this.sensors.targetThrottle = 40;
        } else {
          this.testRunning = false;
          soundEngine.speak('COMPRESSOR STALL RECOVERY COMPLETED');
        }
        break;

      case 'bird_strike':
        // Medium flock / bird ingestion at high speed
        if (this.testElapsedTime < 3) {
          this.sensors.targetThrottle = 95; // Takeoff thrust
        } else if (this.testElapsedTime >= 3 && this.sensors.birdStrikeDamage === 0) {
          this.sensors.birdStrikeDamage = 0.85; // Heavy blade deformation
          soundEngine.playFODImpact();
        } else if (this.testElapsedTime > 12) {
          this.testRunning = false;
          soundEngine.speak('FOD INGESTION TEST CONCLUDED');
          this.stats.findings.push('N1 Fan blade 4 & 5 bent. Core vibration elevated to 3.8 ips. Containment verified.');
        }
        break;

      case 'overtemp_rupture':
        // Disable turbine cooling bleed air
        this.sensors.targetThrottle = 100;
        if (this.testElapsedTime >= 3) {
          this.sensors.coolingBleedAirFailed = true;
        }
        if (this.testElapsedTime > 14) {
          this.testRunning = false;
          this.sensors.coolingBleedAirFailed = false;
          soundEngine.speak('OVERTEMP LIMIT TEST COMPLETED');
          this.stats.findings.push(`Turbine blade thermal endurance verified up to ${Math.round(this.sensors.egt)}°C`);
        }
        break;

      case 'water_ingestion':
        // Torrential precipitation ingestion test
        this.sensors.targetThrottle = 80;
        if (this.testElapsedTime >= 2 && this.testElapsedTime <= 10) {
          this.sensors.waterIngestionLevel = 0.8;
        } else {
          this.sensors.waterIngestionLevel = 0.0;
        }
        if (this.testElapsedTime > 12) {
          this.testRunning = false;
          soundEngine.speak('WATER INGESTION FLAME STABILITY TEST PASSED');
          this.stats.findings.push('Combustor flame maintained continuous ignition under 10% water-to-air mass ratio.');
        }
        break;

      case 'flameout_restart':
        // In-flight flameout and auto-windmill relight
        if (this.testElapsedTime < 3) {
          this.sensors.targetThrottle = 75;
        } else if (this.testElapsedTime < 7) {
          this.sensors.flameoutActive = true;
        } else if (this.testElapsedTime >= 7 && this.sensors.flameoutActive) {
          // Relight igniters
          this.restartTimer += dt;
          if (this.restartTimer > 2.0) {
            this.sensors.flameoutActive = false;
            this.sensors.egt = 680; // lightoff temperature spike
            soundEngine.speak('ENGINE IGNITION DETECTED. SPOOLING UP.');
          }
        } else if (this.testElapsedTime > 15) {
          this.testRunning = false;
          soundEngine.speak('IN-FLIGHT RELIGHT TEST VERIFIED');
          this.stats.findings.push('Windmilling relight achieved within 3.2 seconds at 22% N2.');
        }
        break;

      case 'engine_fire':
        // Nacelle fuel leak fire
        if (this.testElapsedTime >= 2 && !this.sensors.fireBottle1Discharged && !this.sensors.fireBottle2Discharged) {
          this.sensors.fireActive = true;
        }
        break;

      case 'manual_sweep':
      default:
        // Free user control
        break;
    }
  }
}
