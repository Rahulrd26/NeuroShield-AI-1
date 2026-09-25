import React from 'react';
import { Activity, Eye, TrendingUp, TrendingDown, ArrowRight, ShieldCheck, ShieldAlert } from 'lucide-react';
import { PredictionResult } from '../types';

interface ExplainabilityViewProps {
  lastPrediction: PredictionResult | null;
  onNavigateToAnalyze: () => void;
}

export const ExplainabilityView: React.FC<ExplainabilityViewProps> = ({
  lastPrediction,
  onNavigateToAnalyze
}) => {
  // Global benchmark feature importance (ranked over NSL-KDD test corpus)
  const globalFeatures = [
    { rank: 1, feature: 'src_bytes', importance: 0.384, impact: 'High Payload', desc: 'Number of data bytes from source to destination. Spikes indicate DoS floods, shellcode payloads, or exfiltration.' },
    { rank: 2, feature: 'dst_bytes', importance: 0.312, impact: 'Asymmetric Return', desc: 'Number of data bytes from destination to source. Near zero during SYN flood attacks.' },
    { rank: 3, feature: 'count', importance: 0.289, impact: 'Burst Rate', desc: 'Number of connections to the same destination host in past 2 seconds. Elevated in DoS and scans.' },
    { rank: 4, feature: 'serror_rate', importance: 0.271, impact: 'SYN State', desc: 'Percentage of connections activating SYN error flags. High values signal SYN flooding.' },
    { rank: 5, feature: 'same_srv_rate', importance: 0.245, impact: 'Service Distribution', desc: 'Percentage of connections targeting identical service. Differentiates single DoS from multi-port probes.' },
    { rank: 6, feature: 'diff_srv_rate', importance: 0.218, impact: 'Port Sweep', desc: 'Percentage of connections targeting different services. Primary indicator for horizontal port scans.' },
    { rank: 7, feature: 'dst_host_srv_count', importance: 0.194, impact: 'Host History', desc: 'Cumulative connection history to target service in the past 100 connections.' },
    { rank: 8, feature: 'logged_in', importance: 0.165, impact: 'Authentication', desc: 'Binary flag indicating whether session successfully authenticated.' }
  ];

  return (
    <div className="space-y-8">
      {/* Title */}
      <div className="space-y-1.5 border-b border-neutral-800/80 pb-5">
        <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-white">
          Explainable AI Intelligence
        </h1>
        <p className="text-sm text-neutral-400">
          Transparent mathematical attribution explaining why network connections are classified as threats or benign.
        </p>
      </div>

      {/* 1. LOCAL CONNECTION ATTRIBUTION (If last prediction exists) */}
      {lastPrediction ? (
        <div className="rounded-2xl border border-cyan-800/60 bg-gradient-to-br from-cyan-950/20 via-neutral-900/40 to-neutral-950 p-6 backdrop-blur-md space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800/80 pb-4">
            <div className="space-y-1">
              <span className="text-[11px] font-mono text-cyan-400 font-bold uppercase tracking-wider">
                ACTIVE TELEMETRY ATTRIBUTION
              </span>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>Prediction:</span>
                <span className={lastPrediction.is_intrusion ? 'text-rose-400 font-mono' : 'text-emerald-400 font-mono'}>
                  {lastPrediction.prediction} ({(lastPrediction.confidence * 100).toFixed(1)}% Confidence)
                </span>
              </h2>
            </div>

            <div className="flex items-center gap-3 text-xs font-mono text-neutral-400">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-rose-500" />
                <span>Increases Threat Risk</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span>Decreases Threat Risk</span>
              </span>
            </div>
          </div>

          <div className="space-y-3">
            {lastPrediction.top_contributing_features.map((feat, idx) => {
              const isRisk = feat.direction === 'increases_risk';
              const barWidth = Math.min(100, Math.max(12, (feat.importance / 0.5) * 100));

              return (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl border border-neutral-800/80 bg-neutral-950/60 space-y-2 hover:border-neutral-700 transition-colors"
                >
                  <div className="flex items-center justify-between text-xs font-mono">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">{feat.feature}</span>
                      <span className="text-neutral-500">= {String(feat.value)}</span>
                    </div>
                    <div className="flex items-center gap-1 font-bold">
                      {isRisk ? (
                        <span className="text-rose-400 flex items-center gap-0.5">
                          <TrendingUp className="h-3 w-3" />
                          +{feat.attribution.toFixed(4)}
                        </span>
                      ) : (
                        <span className="text-emerald-400 flex items-center gap-0.5">
                          <TrendingDown className="h-3 w-3" />
                          {feat.attribution.toFixed(4)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="w-full bg-neutral-900 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${isRisk ? 'bg-rose-500' : 'bg-emerald-500'}`}
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>

                  <p className="text-[11px] text-neutral-400 leading-normal">
                    {feat.explanation}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="p-6 rounded-2xl border border-neutral-800 bg-neutral-900/30 text-center space-y-3">
          <Eye className="h-8 w-8 text-neutral-500 mx-auto" />
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-white">No Active Connection Attribution</h3>
            <p className="text-xs text-neutral-400 max-w-sm mx-auto">
              Run an individual flow analysis in the manual inspector to view exact per-flow attribution weights.
            </p>
          </div>
          <button
            onClick={onNavigateToAnalyze}
            className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-neutral-950 text-xs font-bold transition-all"
          >
            Go to Analyze
          </button>
        </div>
      )}

      {/* 2. GLOBAL FEATURE IMPORTANCE */}
      <div className="rounded-2xl border border-neutral-800/80 bg-neutral-900/30 backdrop-blur-md p-6 space-y-5">
        <div className="border-b border-neutral-800/80 pb-3">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Activity className="h-4 w-4 text-cyan-400" />
            <span>Global Feature Importance Ranking</span>
          </h3>
          <p className="text-xs text-neutral-400 mt-0.5">
            Mean absolute attribution impact across benchmark dataset.
          </p>
        </div>

        <div className="space-y-3">
          {globalFeatures.map((f) => {
            const barWidth = Math.min(100, (f.importance / 0.40) * 100);
            return (
              <div
                key={f.rank}
                className="p-3 rounded-xl border border-neutral-800/80 bg-neutral-950/40 space-y-2"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs font-mono gap-1">
                  <div className="flex items-center gap-2">
                    <span className="text-neutral-500 font-bold w-6">#{f.rank}</span>
                    <span className="font-bold text-white">{f.feature}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-neutral-900 text-cyan-400 border border-neutral-800">
                      {f.impact}
                    </span>
                  </div>
                  <span className="text-neutral-400 font-bold tabular-nums">
                    {f.importance.toFixed(3)} E[|SHAP|]
                  </span>
                </div>

                <div className="w-full bg-neutral-900 h-1 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-cyan-500 rounded-full"
                    style={{ width: `${barWidth}%` }}
                  />
                </div>

                <p className="text-[11px] text-neutral-400 leading-relaxed font-sans">
                  {f.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
