import React, { useState, useEffect } from 'react';
import {
  ShieldAlert, ShieldCheck, Activity, ArrowRight, RotateCcw,
  TrendingUp, TrendingDown, Eye, AlertTriangle, Database,
  Bookmark, BookmarkCheck, CheckCircle2, FileText, Sparkles, LogIn
} from 'lucide-react';
import { PredictionResult, UserScanRecord } from '../types';
import { useAuth } from '../context/AuthContext';

interface PredictionResultViewProps {
  result: PredictionResult;
  flowFeatures?: Record<string, any>;
  onReset: () => void;
  onViewExplainability: () => void;
  onViewHistory?: () => void;
}

export const PredictionResultView: React.FC<PredictionResultViewProps> = ({
  result,
  flowFeatures,
  onReset,
  onViewExplainability,
  onViewHistory
}) => {
  const isAttack = result.is_intrusion;
  const { user, signInWithGoogle, saveScanRecord, updateScanNotes, updateScanStatus, toggleBookmarkScan } = useAuth();

  const [savedScanId, setSavedScanId] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [isBookmarked, setIsBookmarked] = useState<boolean>(false);
  const [incidentStatus, setIncidentStatus] = useState<UserScanRecord['incidentStatus']>(
    isAttack ? 'Under Investigation' : 'Unreviewed'
  );
  const [notes, setNotes] = useState<string>('');
  const [isSavingNotes, setIsSavingNotes] = useState<boolean>(false);
  const [notesSavedSuccess, setNotesSavedSuccess] = useState<boolean>(false);

  // Auto-save to Firestore if user is authenticated
  useEffect(() => {
    let isMounted = true;
    if (user && !savedScanId) {
      const autoSave = async () => {
        const id = await saveScanRecord({
          predicted_class: result.prediction,
          is_intrusion: result.is_intrusion,
          confidence: result.confidence,
          risk_level: result.risk_level,
          inference_time_ms: result.inference_latency_ms,
          flowData: flowFeatures || {},
          class_probabilities: result.probabilities,
          notes: '',
          incidentStatus: isAttack ? 'Under Investigation' : 'Unreviewed',
          isBookmarked: false
        });
        if (isMounted && id) {
          setSavedScanId(id);
          setIsSaved(true);
        }
      };
      autoSave();
    }
    return () => {
      isMounted = false;
    };
  }, [user, result, flowFeatures, isAttack, saveScanRecord, savedScanId]);

  const handleManualSave = async () => {
    if (!user) {
      await signInWithGoogle();
      return;
    }
    if (!savedScanId) {
      const id = await saveScanRecord({
        predicted_class: result.prediction,
        is_intrusion: result.is_intrusion,
        confidence: result.confidence,
        risk_level: result.risk_level,
        inference_time_ms: result.inference_latency_ms,
        flowData: flowFeatures || {},
        class_probabilities: result.probabilities,
        notes,
        incidentStatus,
        isBookmarked
      });
      if (id) {
        setSavedScanId(id);
        setIsSaved(true);
      }
    }
  };

  const handleToggleBookmark = async () => {
    if (!user) {
      await signInWithGoogle();
      return;
    }
    const nextBookmark = !isBookmarked;
    setIsBookmarked(nextBookmark);
    if (savedScanId) {
      await toggleBookmarkScan(savedScanId, isBookmarked);
    } else {
      await handleManualSave();
    }
  };

  const handleStatusChange = async (newStatus: UserScanRecord['incidentStatus']) => {
    setIncidentStatus(newStatus);
    if (savedScanId) {
      await updateScanStatus(savedScanId, newStatus);
    }
  };

  const handleSaveNotes = async () => {
    if (!savedScanId) {
      await handleManualSave();
    } else {
      setIsSavingNotes(true);
      await updateScanNotes(savedScanId, notes);
      setIsSavingNotes(false);
      setNotesSavedSuccess(true);
      setTimeout(() => setNotesSavedSuccess(false), 2500);
    }
  };

  // Determine top status badge & styling based on actual model prediction
  let statusTitle = 'NORMAL TRAFFIC';
  let badgeColor = 'border-emerald-800 bg-emerald-950/40 text-emerald-400';
  let bannerBorder = 'border-emerald-800/80 bg-gradient-to-br from-emerald-950/30 via-neutral-900/60 to-neutral-950';

  if (isAttack) {
    if (result.risk_level === 'Medium') {
      statusTitle = 'SUSPICIOUS ACTIVITY';
      badgeColor = 'border-amber-800 bg-amber-950/40 text-amber-400';
      bannerBorder = 'border-amber-800/80 bg-gradient-to-br from-amber-950/30 via-neutral-900/60 to-neutral-950';
    } else {
      statusTitle = 'THREAT DETECTED';
      badgeColor = 'border-rose-800 bg-rose-950/40 text-rose-400';
      bannerBorder = 'border-rose-800/80 bg-gradient-to-br from-rose-950/30 via-neutral-900/60 to-neutral-950';
    }
  }

  return (
    <div className="space-y-6">
      {/* 1. PRIMARY RESULT BANNER */}
      <div className={`rounded-2xl border p-6 sm:p-8 backdrop-blur-xl transition-all shadow-2xl ${bannerBorder}`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-5">
            <div
              className={`p-3.5 rounded-2xl border ${
                isAttack
                  ? 'border-rose-700/80 bg-rose-950/50 text-rose-400 shadow-[0_0_25px_-5px_rgba(244,63,94,0.4)]'
                  : 'border-emerald-700/80 bg-emerald-950/50 text-emerald-400 shadow-[0_0_25px_-5px_rgba(16,185,129,0.4)]'
              }`}
            >
              {isAttack ? (
                <ShieldAlert className="h-9 w-9" />
              ) : (
                <ShieldCheck className="h-9 w-9" />
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5">
                <span className={`text-[11px] font-mono px-2.5 py-0.5 rounded-full border font-bold uppercase ${badgeColor}`}>
                  {statusTitle}
                </span>
                <span className="text-xs text-neutral-400 font-mono">
                  {result.risk_level} RISK
                </span>
                {isSaved && (
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-800/60 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3 text-cyan-400" />
                    <span>Synced to Cloud</span>
                  </span>
                )}
              </div>

              <h2 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                {isAttack ? `Attack Type: ${result.prediction}` : 'Benign Connection Verified'}
              </h2>

              <p className="text-xs sm:text-sm text-neutral-300 max-w-xl font-sans">
                {isAttack
                  ? `Identified malicious traffic pattern corresponding to ${result.attack_category} exploitation signature.`
                  : 'Network traffic parameters match baseline normal host communication parameters with nominal error rates.'}
              </p>
            </div>
          </div>

          {/* Metric Stats Panel */}
          <div className="flex flex-row md:flex-col items-center md:items-end justify-between border-t md:border-t-0 md:border-l border-neutral-800 pt-4 md:pt-0 md:pl-8 gap-4 min-w-[170px]">
            <div className="text-left md:text-right">
              <span className="text-[11px] font-mono text-neutral-400 uppercase block">Prediction Confidence</span>
              <span className="font-mono text-3xl font-bold text-white tabular-nums tracking-tight">
                {(result.confidence * 100).toFixed(1)}%
              </span>
            </div>

            <div className="text-left md:text-right text-[11px] font-mono text-neutral-400">
              <span className="text-neutral-500">Latency: </span>
              <span className="text-cyan-400 font-bold">{result.inference_latency_ms} ms</span>
            </div>
          </div>
        </div>

        {/* 5-Class Softmax Output Probability Strip */}
        <div className="mt-8 pt-6 border-t border-neutral-800/80 space-y-2.5">
          <div className="flex items-center justify-between text-xs font-mono text-neutral-400">
            <span>MODEL PREDICTION PROBABILITIES</span>
            <span className="text-neutral-500">Softmax Normalized</span>
          </div>

          <div className="grid grid-cols-5 gap-2">
            {(['Normal', 'DoS', 'Probe', 'R2L', 'U2R'] as const).map((cls) => {
              const prob = result.probabilities[cls] || 0;
              const isSelected = result.prediction === cls;
              return (
                <div
                  key={cls}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    isSelected
                      ? isAttack
                        ? 'border-rose-500 bg-rose-950/40 text-white'
                        : 'border-emerald-500 bg-emerald-950/40 text-white'
                      : 'border-neutral-800 bg-neutral-900/40 text-neutral-400'
                  }`}
                >
                  <div className="text-[11px] font-mono font-semibold">{cls}</div>
                  <div className="text-xs font-mono font-bold mt-1 tabular-nums">
                    {(prob * 100).toFixed(1)}%
                  </div>
                  <div className="w-full bg-neutral-800 h-1 rounded-full mt-2 overflow-hidden">
                    <div
                      className={`h-full ${isSelected ? (isAttack ? 'bg-rose-500' : 'bg-emerald-500') : 'bg-neutral-600'}`}
                      style={{ width: `${Math.max(4, prob * 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* CLOUD PERSISTENCE & INCIDENT TRIAGE PANEL */}
      <div className="rounded-2xl border border-neutral-800/80 bg-neutral-900/40 backdrop-blur-md p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-800/80 pb-3">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-cyan-400" />
            <h3 className="text-xs font-bold text-white font-mono uppercase tracking-wider">
              Cloud Incident Triage & Forensic Audit
            </h3>
            {user && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-800 text-neutral-300">
                Firestore Connected
              </span>
            )}
          </div>

          {user ? (
            <div className="flex items-center gap-2">
              <button
                onClick={handleToggleBookmark}
                className={`px-3 py-1.5 rounded-lg border text-xs font-mono flex items-center gap-1.5 transition-colors ${
                  isBookmarked
                    ? 'bg-amber-950/80 border-amber-700 text-amber-300'
                    : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-amber-300'
                }`}
              >
                {isBookmarked ? (
                  <BookmarkCheck className="h-3.5 w-3.5" />
                ) : (
                  <Bookmark className="h-3.5 w-3.5" />
                )}
                <span>{isBookmarked ? 'Starred Incident' : 'Star Incident'}</span>
              </button>

              <div className="flex items-center gap-1.5 text-xs font-mono">
                <span className="text-neutral-400">Status:</span>
                <select
                  value={incidentStatus}
                  onChange={(e) => handleStatusChange(e.target.value as UserScanRecord['incidentStatus'])}
                  className="bg-neutral-950 border border-neutral-800 text-white rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-cyan-500"
                >
                  <option value="Unreviewed">Unreviewed</option>
                  <option value="Under Investigation">Under Investigation</option>
                  <option value="Mitigated">Mitigated</option>
                  <option value="False Positive">False Positive</option>
                </select>
              </div>
            </div>
          ) : (
            <button
              onClick={() => signInWithGoogle()}
              className="px-3 py-1.5 rounded-lg bg-white text-neutral-950 font-semibold text-xs flex items-center gap-2 hover:bg-neutral-100 transition-colors shadow-sm"
            >
              <LogIn className="h-3.5 w-3.5" />
              <span>Sign in with Google to Persist Scan</span>
            </button>
          )}
        </div>

        {/* Forensic Notes Editor */}
        {user ? (
          <div className="space-y-2">
            <label className="text-[11px] font-mono text-neutral-400 block">
              Analyst Investigation Notes (Stored in Firestore):
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Enter forensic investigation details, root-cause notes, or mitigation instructions..."
                className="flex-1 bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-cyan-500"
              />
              <button
                onClick={handleSaveNotes}
                disabled={isSavingNotes}
                className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium font-mono shrink-0 transition-colors"
              >
                {isSavingNotes ? 'Saving...' : notesSavedSuccess ? 'Saved ✓' : 'Update Notes'}
              </button>
            </div>
          </div>
        ) : (
          <p className="text-xs text-neutral-400">
            Sign in with Google to save this flow vector to your private cloud registry and record triage notes across devices.
          </p>
        )}
      </div>

      {/* 2. EXPLAINABILITY HIGHLIGHT SECTION */}
      <div className="rounded-2xl border border-neutral-800/80 bg-neutral-900/30 backdrop-blur-md p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-neutral-800/80 pb-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Activity className="h-4 w-4 text-cyan-400" />
              <span>Why Did The AI Make This Prediction?</span>
            </h3>
            <p className="text-xs text-neutral-400 mt-0.5">
              Mathematical attribution of network features influencing this specific detection.
            </p>
          </div>

          <button
            onClick={onViewExplainability}
            className="text-xs text-cyan-400 hover:text-cyan-300 font-mono font-medium flex items-center gap-1"
          >
            <span>Full Attribution Studio</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="space-y-3">
          {result.top_contributing_features.slice(0, 4).map((feat, idx) => {
            const isRisk = feat.direction === 'increases_risk';
            const barWidth = Math.min(100, Math.max(15, (feat.importance / 0.5) * 100));

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
                  <div className="flex items-center gap-1 tabular-nums font-bold">
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

      {/* 3. ACTION BAR */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={onReset}
          className="px-6 py-2.5 rounded-xl border border-neutral-700 hover:border-neutral-600 bg-neutral-900 hover:bg-neutral-800 text-neutral-200 text-xs font-semibold flex items-center gap-2 transition-colors"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span>Analyze Another</span>
        </button>

        <span className="text-xs text-neutral-500 font-mono">
          Detection Timestamp: {new Date(result.timestamp).toLocaleTimeString()} UTC
        </span>
      </div>
    </div>
  );
};
export default PredictionResultView;
