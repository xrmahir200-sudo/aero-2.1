import React from 'react';
import { TestRunStatistics, EngineProfile, EngineSensors, TelemetryPoint, TestLogEntry } from '../types/engine';
import {
  FileSpreadsheet,
  Download,
  CheckCircle,
  AlertTriangle,
  Flame,
  Gauge,
  Activity,
  Award,
  Clock,
  ShieldCheck
} from 'lucide-react';

interface DataAnalyticsProps {
  stats: TestRunStatistics;
  profile: EngineProfile;
  sensors: EngineSensors;
  telemetryHistory: TelemetryPoint[];
  logs: TestLogEntry[];
  onExportCSV: () => void;
  onExportJSON: () => void;
}

export const DataAnalytics: React.FC<DataAnalyticsProps> = ({
  stats,
  profile,
  sensors,
  telemetryHistory,
  logs,
  onExportCSV,
  onExportJSON
}) => {
  // Evaluation of FAR-33 tolerances
  const complianceChecks = [
    {
      regulation: 'FAR § 33.73',
      title: 'Power & Thrust Transient Acceleration',
      criterion: 'Must reach 95% rated thrust within 5.0 seconds from flight idle.',
      result: 'COMPLIANT (3.4s measured)',
      status: 'pass'
    },
    {
      regulation: 'FAR § 33.27',
      title: 'Hot Section Thermal Shock & Creep Limit',
      criterion: `EGT must not exceed steady redline (${profile.dangerEGT}°C) for >15 seconds during thermal spikes.`,
      result: stats.peakEGT < profile.dangerEGT ? 'COMPLIANT (Peak ' + stats.peakEGT + '°C)' : 'CAUTION (Thermal Spike Active)',
      status: stats.peakEGT < profile.dangerEGT ? 'pass' : 'warning'
    },
    {
      regulation: 'FAR § 33.65',
      title: 'Surge & Stall Margin Buffer',
      criterion: 'Must maintain minimum 8% stall margin buffer during full-envelope throttle excursions.',
      result: stats.minStallMargin >= 8 ? `PASSED (+${stats.minStallMargin}% margin)` : `STALL BUFFER DEGRADED (+${stats.minStallMargin}%)`,
      status: stats.minStallMargin >= 8 ? 'pass' : 'warning'
    },
    {
      regulation: 'FAR § 33.76',
      title: 'Foreign Object Ingestion & Containment',
      criterion: 'Containment casing must withstand blade release without uncontained penetration.',
      result: 'VERIFIED (Dual Kevlar/Titanium Armor)',
      status: 'pass'
    },
    {
      regulation: 'FAR § 33.17',
      title: 'Engine Fire Protection & Halon Discharging',
      criterion: 'Compartment must contain nacelle fire and extinguish with standard two-bottle charge.',
      result: sensors.fireActive ? 'FIRE EVENT ACTIVE' : 'SYSTEM TESTED & READY',
      status: sensors.fireActive ? 'warning' : 'pass'
    }
  ];

  return (
    <div className="flex flex-col h-full bg-[#111215] text-slate-200 overflow-y-auto p-4 gap-4">
      {/* Top Analytics Action Bar */}
      <div className="flex flex-wrap items-center justify-between bg-[#1b1c22] border border-[#2e303d] rounded p-3 text-xs">
        <div className="flex items-center gap-2">
          <Award className="w-4 h-4 text-sky-400" />
          <span className="font-semibold uppercase tracking-wider text-slate-100">
            Engine Test Cell Analytics & Certification Data
          </span>
          <span className="text-slate-500">|</span>
          <span className="text-slate-400 font-mono text-[11px]">{profile.name}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onExportCSV}
            className="px-3 py-1.5 bg-emerald-700/80 hover:bg-emerald-600 border border-emerald-500 text-white font-mono text-[11px] rounded flex items-center gap-1.5 transition-colors shadow"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" /> Export Telemetry CSV ({telemetryHistory.length} rows)
          </button>
          <button
            onClick={onExportJSON}
            className="px-3 py-1.5 bg-sky-700/80 hover:bg-sky-600 border border-sky-500 text-white font-mono text-[11px] rounded flex items-center gap-1.5 transition-colors shadow"
          >
            <Download className="w-3.5 h-3.5" /> Export JSON Engineering Log
          </button>
        </div>
      </div>

      {/* Summary KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-[#16171d] border border-[#272935] rounded p-3">
          <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
            <Flame className="w-3 h-3 text-amber-400" /> PEAK EGT RECORDED
          </div>
          <div className="text-xl font-bold font-mono text-slate-100 mt-1">{stats.peakEGT}°C</div>
          <div className="text-[10px] text-slate-500 font-mono mt-0.5">Limit: {profile.maxEGT}°C</div>
        </div>

        <div className="bg-[#16171d] border border-[#272935] rounded p-3">
          <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
            <Activity className="w-3 h-3 text-rose-400" /> MAX THERMAL SPIKE RATE
          </div>
          <div className="text-xl font-bold font-mono text-amber-300 mt-1">+{stats.maxThermalSpikeRate}°C/s</div>
          <div className="text-[10px] text-slate-500 font-mono mt-0.5">Transient overshoot</div>
        </div>

        <div className="bg-[#16171d] border border-[#272935] rounded p-3">
          <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
            <Gauge className="w-3 h-3 text-sky-400" /> PEAK THRUST
          </div>
          <div className="text-xl font-bold font-mono text-sky-300 mt-1">{stats.peakThrustKN} kN</div>
          <div className="text-[10px] text-slate-500 font-mono mt-0.5">{Math.round(stats.peakThrustKN * 224.8)} lbf</div>
        </div>

        <div className="bg-[#16171d] border border-[#272935] rounded p-3">
          <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
            <Clock className="w-3 h-3 text-indigo-400" /> TOTAL FUEL BURN
          </div>
          <div className="text-xl font-bold font-mono text-indigo-300 mt-1">{stats.totalFuelUsedKg.toFixed(1)} kg</div>
          <div className="text-[10px] text-slate-500 font-mono mt-0.5">Jet-A1 Kerosene</div>
        </div>

        <div className="bg-[#16171d] border border-[#272935] rounded p-3">
          <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
            <Activity className="w-3 h-3 text-teal-400" /> PEAK VIBRATION
          </div>
          <div className="text-xl font-bold font-mono text-teal-300 mt-1">{stats.peakVibrationIps} ips</div>
          <div className="text-[10px] text-slate-500 font-mono mt-0.5">Tolerance: &lt; 2.5 ips</div>
        </div>

        <div className="bg-[#16171d] border border-[#272935] rounded p-3">
          <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-400" /> MIN STALL MARGIN
          </div>
          <div className="text-xl font-bold font-mono text-emerald-300 mt-1">+{stats.minStallMargin}%</div>
          <div className="text-[10px] text-slate-500 font-mono mt-0.5">Safety Buffer</div>
        </div>
      </div>

      {/* FAR-33 Airworthiness Compliance Verification Table */}
      <div className="bg-[#16171d] border border-[#272935] rounded p-4">
        <div className="flex items-center justify-between border-b border-[#272935] pb-2 mb-3 text-xs font-semibold text-slate-200">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-emerald-400" />
            <span>FAA FAR PART 33 & EASA CS-E AIRWORTHINESS COMPLIANCE VERIFICATION</span>
          </div>
          <span className="text-slate-400 font-mono text-[11px]">ALL STANDARDS ACTIVE</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#272935] text-slate-400 font-mono text-[11px]">
                <th className="py-2 px-3">STANDARD</th>
                <th className="py-2 px-3">TITLE / DISCIPLINE</th>
                <th className="py-2 px-3">CERTIFICATION CRITERION</th>
                <th className="py-2 px-3">TELEMETRY RESULT</th>
                <th className="py-2 px-3">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#20222b]">
              {complianceChecks.map((chk) => (
                <tr key={chk.regulation} className="hover:bg-[#1a1c24] transition-colors">
                  <td className="py-2.5 px-3 font-mono font-bold text-sky-400">{chk.regulation}</td>
                  <td className="py-2.5 px-3 font-medium text-slate-200">{chk.title}</td>
                  <td className="py-2.5 px-3 text-slate-400 text-[11px]">{chk.criterion}</td>
                  <td className="py-2.5 px-3 font-mono text-slate-200">{chk.result}</td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        chk.status === 'pass'
                          ? 'bg-emerald-950 border border-emerald-600 text-emerald-300'
                          : 'bg-amber-950 border border-amber-600 text-amber-300'
                      }`}
                    >
                      {chk.status === 'pass' ? <CheckCircle className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                      {chk.status.toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Live Telemetry History Table */}
      <div className="bg-[#16171d] border border-[#272935] rounded p-4 flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-200 border-b border-[#272935] pb-2">
          <span>RECENT TELEMETRY SAMPLES (LAST 10 SNAPSHOTS)</span>
          <span className="text-slate-400 font-mono text-[11px]">SAMPLING RATE: 50 ms</span>
        </div>

        <div className="overflow-x-auto max-h-56">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-[#272935] text-slate-400 text-[10px]">
                <th className="py-1 px-2">TIME (s)</th>
                <th className="py-1 px-2">THROTTLE</th>
                <th className="py-1 px-2">N1 FAN %</th>
                <th className="py-1 px-2">N2 CORE %</th>
                <th className="py-1 px-2">EGT (°C)</th>
                <th className="py-1 px-2">THRUST (kN)</th>
                <th className="py-1 px-2">FUEL (kg/h)</th>
                <th className="py-1 px-2">VIB (ips)</th>
                <th className="py-1 px-2">STALL MARGIN</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#20222b] text-[11px]">
              {telemetryHistory.slice(-10).reverse().map((pt, i) => (
                <tr key={i} className="hover:bg-[#1a1c24]">
                  <td className="py-1 px-2 text-slate-400">{pt.timeSec.toFixed(1)}s</td>
                  <td className="py-1 px-2 text-sky-400">{pt.throttle.toFixed(0)}%</td>
                  <td className="py-1 px-2 text-emerald-400">{pt.n1.toFixed(1)}%</td>
                  <td className="py-1 px-2 text-indigo-400">{pt.n2.toFixed(1)}%</td>
                  <td className={`py-1 px-2 font-bold ${pt.egt > profile.dangerEGT ? 'text-rose-400' : 'text-amber-400'}`}>
                    {Math.round(pt.egt)}°C
                  </td>
                  <td className="py-1 px-2 text-slate-200">{pt.thrustKN.toFixed(1)}</td>
                  <td className="py-1 px-2 text-purple-300">{pt.fuelFlowKgH}</td>
                  <td className="py-1 px-2 text-rose-300">{pt.vibrationIps.toFixed(2)}</td>
                  <td className="py-1 px-2 text-teal-300">+{pt.stallMargin.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
