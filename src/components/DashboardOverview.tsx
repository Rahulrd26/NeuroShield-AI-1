import React from 'react';
import { motion } from 'framer-motion';
import {
  ShieldAlert, ShieldCheck, Activity, Cpu, ArrowUpRight,
  Database, RefreshCw, BarChart2, Layers, Bookmark, CheckCircle2,
  ExternalLink, LogIn, Clock
} from 'lucide-react';
import { SystemHealth, PredictionResult, BatchPredictionResponse } from '../types';
import { CountUp } from './CountUp';
import { useAuth } from '../context/AuthContext';

interface DashboardOverviewProps {
  systemHealth: SystemHealth | null;
  lastPrediction: PredictionResult | null;
  batchResults: BatchPredictionResponse | null;
  onNavigate: (view: 'landing' | 'dashboard' | 'manual' | 'batch' | 'explainability' | 'history') => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  systemHealth,
  lastPrediction,
  batchResults,
  onNavigate
}) => {
  const { user, userScans, userBatchRuns, signInWithGoogle } = useAuth();
  const isOnline = systemHealth?.status === 'healthy';

  // Aggregate stats combining session activity and persistent cloud records
  const sessionAnalyzed = (lastPrediction ? 1 : 0) + (batchResults?.summary.total_records || 0);
  const sessionThreats = (lastPrediction?.is_intrusion ? 1 : 0) + (batchResults?.summary.total_intrusions_flagged || 0);

  const cloudScansCount = userScans.length;
  const cloudThreatsCount = userScans.filter((s) => s.is_intrusion).length;

  const totalAnalyzed = Math.max(sessionAnalyzed, cloudScansCount > 0 ? cloudScansCount : sessionAnalyzed);
  const totalThreats = Math.max(sessionThreats, cloudThreatsCount > 0 ? cloudThreatsCount : sessionThreats);

  // Recent 3 cloud incidents
  const recentCloudIncidents = userScans.slice(0, 3);

  return (
    <div className="space-y-8">
      {/* Top Header Area */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800/80 pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Network Security Overview
            </h1>
            <span className="text-xs px-2 py-0.5 rounded-full border border-cyan-800/60 bg-cyan-950/40 text-cyan-400 font-mono">
              SOC LIVE
            </span>
          </div>
          <p className="text-sm text-neutral-400">
            Monitor AI-powered intrusion detection, live inference telemetry, and persistent audit logs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('manual')}
            className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-neutral-950 font-bold text-xs tracking-wide shadow-lg shadow-cyan-950/50 transition-all flex items-center gap-2"
          >
            <span>Analyze Traffic</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => onNavigate('batch')}
            className="px-4 py-2 rounded-xl border border-neutral-800 hover:border-neutral-700 bg-neutral-900/60 text-neutral-300 hover:text-white font-medium text-xs transition-colors"
          >
            Batch CSV
          </button>
          <button
            onClick={() => onNavigate('history')}
            className="px-4 py-2 rounded-xl border border-neutral-800 hover:border-neutral-700 bg-neutral-900/60 text-cyan-300 hover:text-cyan-200 font-medium text-xs flex items-center gap-1.5 transition-colors"
          >
            <Database className="h-3.5 w-3.5" />
            <span>Cloud Registry</span>
          </button>
        </div>
      </div>

      {/* Cloud Persistence Status Banner */}
      {user ? (
        <div className="p-3.5 rounded-xl border border-cyan-900/40 bg-gradient-to-r from-cyan-950/30 via-neutral-900/40 to-neutral-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-cyan-950/80 border border-cyan-800/60 flex items-center justify-center text-cyan-400 shrink-0">
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <div>
              <p className="text-white font-medium">
                Cloud Sync Active · <span className="font-mono text-cyan-300">{user.email}</span>
              </p>
              <p className="text-[11px] text-neutral-400">
                All packet inferences, batch runs, and forensics are securely synchronized to Firestore.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-neutral-300 font-mono text-[11px]">
            <span>
              Persisted Scans: <strong className="text-white font-bold">{userScans.length}</strong>
            </span>
            <span>
              Batch Audits: <strong className="text-white font-bold">{userBatchRuns.length}</strong>
            </span>
            <button
              onClick={() => onNavigate('history')}
              className="text-cyan-400 hover:text-cyan-300 underline"
            >
              Open History →
            </button>
          </div>
        </div>
      ) : (
        <div className="p-3.5 rounded-xl border border-neutral-800 bg-neutral-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-neutral-800 border border-neutral-700 flex items-center justify-center text-neutral-300 shrink-0">
              <Database className="h-4 w-4 text-cyan-400" />
            </div>
            <div>
              <p className="text-white font-medium">Connect Firebase Cloud Storage</p>
              <p className="text-[11px] text-neutral-400">
                Sign in with Google to persistently store your intrusion triage history and audit logs.
              </p>
            </div>
          </div>
          <button
            onClick={() => signInWithGoogle()}
            className="px-3 py-1.5 rounded-lg bg-white hover:bg-neutral-100 text-neutral-900 font-medium text-xs flex items-center gap-2 transition-all self-start sm:self-auto shrink-0 shadow-sm"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
              <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.17 0 9.99 0 12s.45 3.83 1.25 5.42l4.03-3.15z"/>
              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
            </svg>
            <span>Sign in with Google</span>
          </button>
        </div>
      )}

      {/* KPI Cards (Compact, Premium, Real Values with count-up) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Threats Detected */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="p-4 rounded-xl border border-neutral-800/80 bg-neutral-900/40 backdrop-blur-md space-y-2 relative overflow-hidden group hover:border-neutral-700/80 transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-400">Threats Detected</span>
            <div className="h-7 w-7 rounded-lg bg-rose-950/40 border border-rose-800/60 flex items-center justify-center text-rose-400">
              <ShieldAlert className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="space-y-0.5">
            <div className="font-mono text-2xl font-bold text-white tabular-nums">
              <CountUp value={totalThreats} duration={1.2} delay={0.05} />
            </div>
            <div className="text-[11px] text-neutral-400 font-mono">
              {totalAnalyzed > 0 ? (
                <span>
                  <CountUp value={(totalThreats / totalAnalyzed) * 100} decimals={1} suffix="%" duration={1.2} delay={0.1} /> threat rate
                </span>
              ) : (
                'No threat activity'
              )}
            </div>
          </div>
        </motion.div>

        {/* Card 2: Traffic Analyzed */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.12 }}
          className="p-4 rounded-xl border border-neutral-800/80 bg-neutral-900/40 backdrop-blur-md space-y-2 relative overflow-hidden group hover:border-neutral-700/80 transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-400">Traffic Analyzed</span>
            <div className="h-7 w-7 rounded-lg bg-neutral-800 border border-neutral-700/60 flex items-center justify-center text-cyan-400">
              <Activity className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="space-y-0.5">
            <div className="font-mono text-2xl font-bold text-white tabular-nums">
              <CountUp value={totalAnalyzed} suffix=" flows" duration={1.3} delay={0.12} />
            </div>
            <div className="text-[11px] text-neutral-400 font-mono">
              {totalAnalyzed > 0 ? 'Active telemetry sessions' : 'Awaiting traffic input'}
            </div>
          </div>
        </motion.div>

        {/* Card 3: Detection Accuracy */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="p-4 rounded-xl border border-neutral-800/80 bg-neutral-900/40 backdrop-blur-md space-y-2 relative overflow-hidden group hover:border-neutral-700/80 transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-400">Detection Accuracy</span>
            <div className="h-7 w-7 rounded-lg bg-emerald-950/40 border border-emerald-800/60 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="space-y-0.5">
            <div className="font-mono text-2xl font-bold text-white tabular-nums">
              <CountUp value={93.8} decimals={1} suffix="%" duration={1.5} delay={0.2} />
            </div>
            <div className="text-[11px] text-emerald-400/90 font-mono">
              Attack Recall Priority
            </div>
          </div>
        </motion.div>

        {/* Card 4: System Status */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.28 }}
          className="p-4 rounded-xl border border-neutral-800/80 bg-neutral-900/40 backdrop-blur-md space-y-2 relative overflow-hidden group hover:border-neutral-700/80 transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-400">System Status</span>
            <div className="h-7 w-7 rounded-lg bg-neutral-800 border border-neutral-700/60 flex items-center justify-center text-neutral-300">
              <Cpu className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              <span className="font-mono text-lg font-bold text-white">
                {isOnline ? 'Online' : 'Standby'}
              </span>
            </div>
            <div className="text-[11px] text-neutral-400 font-mono flex items-center justify-between">
              <span>{systemHealth ? `${systemHealth.model}` : 'PyTorch MLP Engine'}</span>
              <span className="text-cyan-400/90 font-semibold">
                <CountUp value={0.4} decimals={1} prefix="< " suffix=" ms" duration={1.4} delay={0.3} />
              </span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Main Threat Analysis Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Live Detection Feed & Recent Cloud Incidents */}
        <div className="lg:col-span-2 rounded-2xl border border-neutral-800/80 bg-neutral-900/30 backdrop-blur-md p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-neutral-800/80 pb-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <BarChart2 className="h-4 w-4 text-cyan-400" />
                <span>Active Threat Analysis Feed</span>
              </h2>
              <p className="text-xs text-neutral-400">
                Latest packet classification and cloud persistence records.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onNavigate('manual')}
                className="px-3 py-1.5 text-xs font-mono bg-cyan-950/60 text-cyan-300 border border-cyan-800/60 rounded-lg hover:bg-cyan-900/60 transition-colors"
              >
                + New Analysis
              </button>
            </div>
          </div>

          {/* If there's an active session prediction */}
          {lastPrediction ? (
            <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-950/60 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-1 rounded text-xs font-mono font-bold ${
                      lastPrediction.is_intrusion
                        ? 'bg-rose-950 text-rose-300 border border-rose-800'
                        : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    }`}
                  >
                    {lastPrediction.prediction}
                  </span>
                  <span className="text-xs text-neutral-400 font-mono">
                    {lastPrediction.is_intrusion ? 'Malicious Attack Pattern' : 'Benign Connection'}
                  </span>
                </div>
                <span className="text-xs font-mono font-bold text-cyan-400">
                  <CountUp value={lastPrediction.confidence * 100} decimals={1} suffix="% Conf" duration={1} />
                </span>
              </div>

              {/* Class Probability Distribution */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px] font-mono text-neutral-400">
                  <span>Classification Confidence Distribution</span>
                  <span>{lastPrediction.risk_level} Risk</span>
                </div>
                <div className="grid grid-cols-5 gap-1.5">
                  {Object.entries(lastPrediction.probabilities || {}).map(([cls, prob]) => (
                    <div key={cls} className="space-y-1">
                      <div className="h-1.5 w-full bg-neutral-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${
                            cls === 'Normal' ? 'bg-emerald-500' : 'bg-rose-500'
                          }`}
                          style={{ width: `${Math.round(prob * 100)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] font-mono text-neutral-400">
                        <span>{cls}</span>
                        <span>{Math.round(prob * 100)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-neutral-900 text-xs font-mono">
                <span className="text-neutral-400">Inference Latency: {lastPrediction.inference_latency_ms} ms</span>
                <button
                  onClick={() => onNavigate('explainability')}
                  className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-medium"
                >
                  <span>View SHAP Explainability</span>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ) : batchResults ? (
            <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-950/60 space-y-3">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="font-semibold text-white">Batch Telemetry Loaded</span>
                <span className="text-cyan-400">{batchResults.summary.total_records} records processed</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                <div className="p-2 rounded bg-neutral-900 border border-neutral-800">
                  <span className="text-neutral-400 block text-[10px]">THREATS</span>
                  <span className="text-rose-400 font-bold">
                    <CountUp value={batchResults.summary.total_intrusions_flagged} duration={1} />
                  </span>
                </div>
                <div className="p-2 rounded bg-neutral-900 border border-neutral-800">
                  <span className="text-neutral-400 block text-[10px]">NORMAL</span>
                  <span className="text-emerald-400 font-bold">
                    <CountUp value={batchResults.summary.total_normal_flows} duration={1} />
                  </span>
                </div>
                <div className="p-2 rounded bg-neutral-900 border border-neutral-800">
                  <span className="text-neutral-400 block text-[10px]">AVG LATENCY</span>
                  <span className="text-neutral-200 font-bold">
                    <CountUp value={batchResults.summary.avg_latency_per_sample_ms} decimals={2} suffix=" ms" duration={1} />
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center space-y-2 border border-dashed border-neutral-800 rounded-xl bg-neutral-950/30">
              <p className="text-xs text-neutral-400 font-mono">No live session active</p>
              <p className="text-[11px] text-neutral-400 max-w-sm mx-auto">
                Submit a connection flow through the manual analyzer or upload a batch CSV to populate live detection analytics.
              </p>
            </div>
          )}

          {/* Saved Cloud Threat Incidents section */}
          {recentCloudIncidents.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-neutral-300 font-mono flex items-center gap-1.5">
                  <Database className="h-3.5 w-3.5 text-cyan-400" />
                  <span>Recent Cloud Incidents (Firestore)</span>
                </span>
                <button
                  onClick={() => onNavigate('history')}
                  className="text-cyan-400 hover:text-cyan-300 font-mono text-[11px]"
                >
                  View all ({userScans.length}) →
                </button>
              </div>

              <div className="space-y-2">
                {recentCloudIncidents.map((incident) => (
                  <div
                    key={incident.id}
                    className="p-3 rounded-xl border border-neutral-800/80 bg-neutral-950/50 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold ${
                          incident.is_intrusion
                            ? 'bg-rose-950/90 text-rose-300 border border-rose-800/70'
                            : 'bg-emerald-950/90 text-emerald-300 border border-emerald-800/70'
                        }`}
                      >
                        {incident.predicted_class}
                      </span>
                      <span className="font-mono text-neutral-400 text-[11px]">
                        {incident.flowData?.protocol_type}/{incident.flowData?.service}
                      </span>
                      <span className="font-mono text-cyan-400/90 text-[11px]">
                        {(incident.confidence * 100).toFixed(1)}%
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                          incident.incidentStatus === 'Mitigated'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-900'
                            : incident.incidentStatus === 'Under Investigation'
                            ? 'bg-rose-950 text-rose-400 border border-rose-900'
                            : 'bg-neutral-800 text-neutral-300'
                        }`}
                      >
                        {incident.incidentStatus}
                      </span>
                      <span className="text-[10px] font-mono text-neutral-400 hidden sm:inline">
                        {new Date(incident.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Attack Taxonomy & Threat Categories */}
        <div className="rounded-2xl border border-neutral-800/80 bg-neutral-900/30 backdrop-blur-md p-6 space-y-4">
          <div className="border-b border-neutral-800/80 pb-3">
            <h2 className="text-base font-bold text-white">
              Attack Taxonomy
            </h2>
            <p className="text-xs text-neutral-400">
              Supported intrusion classes in deep-learning model.
            </p>
          </div>

          <div className="space-y-2.5 text-xs font-mono">
            {[
              { label: 'Normal Traffic', color: 'text-emerald-400', desc: 'Benign RFC-compliant packet transmission' },
              { label: 'DoS (Denial of Service)', color: 'text-rose-400', desc: 'SYN flood (Neptune), Smurf broadcast, Teardrop' },
              { label: 'Probe (Surveillance)', color: 'text-amber-400', desc: 'Port scanning, host sweeps, vulnerability probing' },
              { label: 'R2L (Remote to Local)', color: 'text-purple-400', desc: 'Unauthorized remote access, password guessing' },
              { label: 'U2R (User to Root)', color: 'text-pink-400', desc: 'Privilege escalation, local buffer overflow' }
            ].map((cat, idx) => (
              <div key={idx} className="p-2.5 rounded-lg border border-neutral-800/60 bg-neutral-950/40 space-y-1">
                <span className={`font-semibold ${cat.color}`}>{cat.label}</span>
                <p className="text-[11px] text-neutral-400 font-sans">{cat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
export default DashboardOverview;
