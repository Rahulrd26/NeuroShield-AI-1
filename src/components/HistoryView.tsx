import React, { useState } from 'react';
import {
  ShieldAlert, ShieldCheck, Database, Search, Filter, Trash2,
  Bookmark, BookmarkCheck, ExternalLink, Download, FileText,
  Clock, AlertTriangle, CheckCircle2, RefreshCw, LogIn, ChevronDown, Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserScanRecord, UserBatchRunRecord } from '../types';

interface HistoryViewProps {
  onLoadScanToAnalyzer: (features: Record<string, any>) => void;
  onNavigateToBatch: () => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  onLoadScanToAnalyzer,
  onNavigateToBatch
}) => {
  const {
    user,
    signInWithGoogle,
    userScans,
    userBatchRuns,
    updateScanStatus,
    updateScanNotes,
    toggleBookmarkScan,
    deleteScanRecord,
    deleteBatchRunRecord,
    isSyncing
  } = useAuth();

  const [activeTab, setActiveTab] = useState<'scans' | 'batches'>('scans');
  const [filterType, setFilterType] = useState<'all' | 'intrusions' | 'normal' | 'bookmarked'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
  const [tempNotes, setTempNotes] = useState('');

  // If user is not authenticated, show sign-in prompt
  if (!user) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 space-y-8">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-800/60 text-cyan-300 text-xs font-mono">
            <Database className="h-3.5 w-3.5 text-cyan-400" />
            <span>CLOUD PERSISTENCE & SEC-OPS REGISTRY</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Persistent Network Threat Registry
          </h2>
          <p className="text-sm text-neutral-400 max-w-xl mx-auto">
            Sign in with Google to securely store, triage, and audit all intrusion detections, batch telemetry logs, and forensic incident notes directly in Firestore.
          </p>
        </div>

        <div className="rounded-2xl border border-neutral-800/80 bg-neutral-900/60 backdrop-blur-md p-8 text-center space-y-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-rose-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
            <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-950/50 space-y-2">
              <div className="h-8 w-8 rounded-lg bg-cyan-950/60 border border-cyan-800/80 flex items-center justify-center text-cyan-400">
                <Database className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-semibold text-white">Firestore Persistence</h3>
              <p className="text-xs text-neutral-400">
                All model predictions, flow vectors, and latency metrics are synced in real-time to your secure Firestore cloud profile.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-950/50 space-y-2">
              <div className="h-8 w-8 rounded-lg bg-amber-950/60 border border-amber-800/80 flex items-center justify-center text-amber-400">
                <ShieldAlert className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-semibold text-white">Incident Forensics & Triage</h3>
              <p className="text-xs text-neutral-400">
                Tag flagged packets as Investigating, Mitigated, or False Positive with editable forensic analyst notes.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-950/50 space-y-2">
              <div className="h-8 w-8 rounded-lg bg-emerald-950/60 border border-emerald-800/80 flex items-center justify-center text-emerald-400">
                <FileText className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-semibold text-white">Batch Audit Archive</h3>
              <p className="text-xs text-neutral-400">
                Retain high-volume packet audit history and export compliance records in JSON/CSV formats anytime.
              </p>
            </div>
          </div>

          <div className="pt-4 flex flex-col items-center justify-center gap-3">
            <button
              onClick={() => signInWithGoogle()}
              className="px-6 py-3 rounded-xl bg-white hover:bg-neutral-100 text-neutral-900 font-medium text-sm flex items-center gap-3 shadow-lg shadow-cyan-950/50 hover:shadow-cyan-500/20 transition-all border border-neutral-200"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.17 0 9.99 0 12s.45 3.83 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <span>Sign in with Google to Connect</span>
            </button>
            <span className="text-[11px] text-neutral-400 font-mono">
              Secured with Firebase Authentication & Firestore Security Rules
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Filter scans
  const filteredScans = userScans.filter((scan) => {
    // Filter status
    if (filterType === 'intrusions' && !scan.is_intrusion) return false;
    if (filterType === 'normal' && scan.is_intrusion) return false;
    if (filterType === 'bookmarked' && !scan.isBookmarked) return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchClass = scan.predicted_class?.toLowerCase().includes(q);
      const matchProto = scan.flowData?.protocol_type?.toLowerCase().includes(q);
      const matchService = scan.flowData?.service?.toLowerCase().includes(q);
      const matchFlag = scan.flowData?.flag?.toLowerCase().includes(q);
      const matchNotes = scan.notes?.toLowerCase().includes(q);
      const matchStatus = scan.incidentStatus?.toLowerCase().includes(q);
      return matchClass || matchProto || matchService || matchFlag || matchNotes || matchStatus;
    }

    return true;
  });

  const totalThreats = userScans.filter((s) => s.is_intrusion).length;
  const totalBookmarked = userScans.filter((s) => s.isBookmarked).length;

  const handleStartEditNotes = (scan: UserScanRecord) => {
    setEditingNotesId(scan.id);
    setTempNotes(scan.notes || '');
  };

  const handleSaveNotes = async (scanId: string) => {
    await updateScanNotes(scanId, tempNotes);
    setEditingNotesId(null);
  };

  // Export records to JSON
  const handleExportJSON = () => {
    const exportData = {
      user: user.email,
      exportedAt: new Date().toISOString(),
      scans: userScans,
      batchRuns: userBatchRuns
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nids_audit_history_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header & Stats Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <Database className="h-5 w-5 text-cyan-400" />
              <span>Cloud Security History</span>
            </h2>
            {isSyncing && (
              <span className="flex items-center gap-1 text-[11px] font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/50">
                <RefreshCw className="h-3 w-3 animate-spin" />
                Syncing
              </span>
            )}
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            Real-time Firestore persistence for user{' '}
            <span className="text-neutral-200 font-mono font-medium">{user.email}</span>
          </p>
        </div>

        {/* Quick Stats Pill Box */}
        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-xs font-mono">
            <span className="text-neutral-400 block text-[10px]">TOTAL SCANS</span>
            <span className="text-white font-bold">{userScans.length}</span>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-xs font-mono">
            <span className="text-neutral-400 block text-[10px]">THREATS</span>
            <span className="text-rose-400 font-bold">{totalThreats}</span>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-xs font-mono">
            <span className="text-neutral-400 block text-[10px]">BATCH AUDITS</span>
            <span className="text-cyan-400 font-bold">{userBatchRuns.length}</span>
          </div>

          <button
            onClick={handleExportJSON}
            disabled={userScans.length === 0 && userBatchRuns.length === 0}
            className="px-3 py-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-700/70 text-xs font-medium text-neutral-200 flex items-center gap-1.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            title="Export forensic logs to JSON"
          >
            <Download className="h-3.5 w-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Export Log</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between border-b border-neutral-800">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setActiveTab('scans')}
            className={`pb-3 text-xs font-semibold tracking-wide border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'scans'
                ? 'border-cyan-500 text-cyan-300'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <span>Network Scans & Incidents</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-neutral-800 text-neutral-300 font-mono">
              {userScans.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('batches')}
            className={`pb-3 text-xs font-semibold tracking-wide border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'batches'
                ? 'border-cyan-500 text-cyan-300'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <span>Batch Audits</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-neutral-800 text-neutral-300 font-mono">
              {userBatchRuns.length}
            </span>
          </button>
        </div>
      </div>

      {/* Tab 1: Individual Scans */}
      {activeTab === 'scans' && (
        <div className="space-y-4">
          {/* Controls: Search & Filters */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
              <input
                type="text"
                placeholder="Search protocol, service, class, status, or notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-neutral-900 border border-neutral-800 rounded-lg text-white placeholder-neutral-400 focus:outline-none focus:border-cyan-500/60"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
              <button
                onClick={() => setFilterType('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  filterType === 'all'
                    ? 'bg-neutral-800 text-white border border-neutral-700'
                    : 'bg-neutral-900 text-neutral-400 hover:text-neutral-200 border border-neutral-800'
                }`}
              >
                All ({userScans.length})
              </button>

              <button
                onClick={() => setFilterType('intrusions')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                  filterType === 'intrusions'
                    ? 'bg-rose-950/80 text-rose-300 border border-rose-800'
                    : 'bg-neutral-900 text-neutral-400 hover:text-rose-300 border border-neutral-800'
                }`}
              >
                <ShieldAlert className="h-3 w-3" />
                <span>Threats ({totalThreats})</span>
              </button>

              <button
                onClick={() => setFilterType('normal')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                  filterType === 'normal'
                    ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                    : 'bg-neutral-900 text-neutral-400 hover:text-emerald-300 border border-neutral-800'
                }`}
              >
                <ShieldCheck className="h-3 w-3" />
                <span>Normal ({userScans.length - totalThreats})</span>
              </button>

              <button
                onClick={() => setFilterType('bookmarked')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                  filterType === 'bookmarked'
                    ? 'bg-amber-950/80 text-amber-300 border border-amber-800'
                    : 'bg-neutral-900 text-neutral-400 hover:text-amber-300 border border-neutral-800'
                }`}
              >
                <Bookmark className="h-3 w-3" />
                <span>Starred ({totalBookmarked})</span>
              </button>
            </div>
          </div>

          {/* Scans List */}
          {filteredScans.length === 0 ? (
            <div className="p-12 text-center rounded-xl border border-neutral-800/80 bg-neutral-900/30 space-y-3">
              <Database className="h-8 w-8 text-neutral-400 mx-auto" />
              <h3 className="text-sm font-semibold text-neutral-300">
                {userScans.length === 0 ? 'No Scans Saved Yet' : 'No Scans Match Your Filter'}
              </h3>
              <p className="text-xs text-neutral-400 max-w-md mx-auto">
                {userScans.length === 0
                  ? 'Run a network flow analysis in the Analyze tab. Scans will automatically be saved to your Firestore database for forensic review.'
                  : 'Try adjusting your search criteria or clearing filters to view other saved records.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredScans.map((scan) => {
                const isThreat = scan.is_intrusion;
                const isEditing = editingNotesId === scan.id;

                return (
                  <div
                    key={scan.id}
                    className={`p-4 rounded-xl border transition-all ${
                      isThreat
                        ? 'border-rose-900/40 bg-rose-950/10 hover:border-rose-800/60'
                        : 'border-neutral-800/80 bg-neutral-900/40 hover:border-neutral-700/80'
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      {/* Left: Classification & Flow Summary */}
                      <div className="space-y-2 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          {/* Threat Badge */}
                          <span
                            className={`px-2.5 py-0.5 rounded text-xs font-mono font-bold flex items-center gap-1.5 ${
                              isThreat
                                ? 'bg-rose-950/90 text-rose-300 border border-rose-800/80'
                                : 'bg-emerald-950/90 text-emerald-300 border border-emerald-800/80'
                            }`}
                          >
                            {isThreat ? (
                              <ShieldAlert className="h-3.5 w-3.5" />
                            ) : (
                              <ShieldCheck className="h-3.5 w-3.5" />
                            )}
                            <span>{scan.predicted_class}</span>
                          </span>

                          {/* Confidence */}
                          <span className="text-xs font-mono font-semibold text-cyan-400">
                            {(scan.confidence * 100).toFixed(1)}% conf
                          </span>

                          {/* Latency */}
                          <span className="text-[11px] font-mono text-neutral-400">
                            {scan.inference_time_ms ? `${scan.inference_time_ms.toFixed(1)} ms` : '< 1 ms'}
                          </span>

                          {/* Timestamp */}
                          <span className="text-[11px] font-mono text-neutral-400 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(scan.timestamp).toLocaleString()}
                          </span>
                        </div>

                        {/* Flow Parameters */}
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-mono text-neutral-300">
                          <span>
                            <strong className="text-neutral-400 font-normal">proto:</strong> {scan.flowData?.protocol_type || 'tcp'}
                          </span>
                          <span>
                            <strong className="text-neutral-400 font-normal">svc:</strong> {scan.flowData?.service || 'http'}
                          </span>
                          <span>
                            <strong className="text-neutral-400 font-normal">flag:</strong> {scan.flowData?.flag || 'SF'}
                          </span>
                          <span>
                            <strong className="text-neutral-400 font-normal">src_bytes:</strong> {scan.flowData?.src_bytes ?? 0}
                          </span>
                          <span>
                            <strong className="text-neutral-400 font-normal">dst_bytes:</strong> {scan.flowData?.dst_bytes ?? 0}
                          </span>
                          <span>
                            <strong className="text-neutral-400 font-normal">serror:</strong> {scan.flowData?.serror_rate ?? 0}
                          </span>
                        </div>
                      </div>

                      {/* Right: Triage Status & Actions */}
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Status Dropdown */}
                        <select
                          value={scan.incidentStatus}
                          onChange={(e) =>
                            updateScanStatus(
                              scan.id,
                              e.target.value as UserScanRecord['incidentStatus']
                            )
                          }
                          className={`text-xs font-mono rounded-lg px-2.5 py-1.5 border focus:outline-none cursor-pointer ${
                            scan.incidentStatus === 'Mitigated'
                              ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800'
                              : scan.incidentStatus === 'Under Investigation'
                              ? 'bg-rose-950/60 text-rose-300 border-rose-800'
                              : scan.incidentStatus === 'False Positive'
                              ? 'bg-neutral-800 text-neutral-300 border-neutral-700'
                              : 'bg-neutral-900 text-neutral-400 border-neutral-800'
                          }`}
                        >
                          <option value="Unreviewed">Unreviewed</option>
                          <option value="Under Investigation">Under Investigation</option>
                          <option value="Mitigated">Mitigated</option>
                          <option value="False Positive">False Positive</option>
                        </select>

                        {/* Star / Bookmark */}
                        <button
                          onClick={() => toggleBookmarkScan(scan.id, !!scan.isBookmarked)}
                          className={`p-2 rounded-lg border transition-colors ${
                            scan.isBookmarked
                              ? 'bg-amber-950/60 border-amber-700 text-amber-300'
                              : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-amber-400'
                          }`}
                          title={scan.isBookmarked ? 'Starred incident' : 'Star this incident'}
                        >
                          {scan.isBookmarked ? (
                            <BookmarkCheck className="h-4 w-4" />
                          ) : (
                            <Bookmark className="h-4 w-4" />
                          )}
                        </button>

                        {/* Load into Manual Analyzer */}
                        <button
                          onClick={() => scan.flowData && onLoadScanToAnalyzer(scan.flowData)}
                          className="px-2.5 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs font-mono text-neutral-300 hover:text-cyan-300 flex items-center gap-1.5 transition-colors"
                          title="Load this packet into Analyzer"
                        >
                          <ExternalLink className="h-3.5 w-3.5 text-cyan-400" />
                          <span>Inspect</span>
                        </button>

                        {/* Delete from Firestore */}
                        <button
                          onClick={() => {
                            if (window.confirm('Delete this scan record from Firestore?')) {
                              deleteScanRecord(scan.id);
                            }
                          }}
                          className="p-2 rounded-lg bg-neutral-900 hover:bg-rose-950/40 border border-neutral-800 hover:border-rose-800/60 text-neutral-400 hover:text-rose-400 transition-colors"
                          title="Delete scan record"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Forensic Notes Section */}
                    <div className="mt-3 pt-3 border-t border-neutral-800/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
                      {isEditing ? (
                        <div className="flex-1 w-full flex items-center gap-2">
                          <input
                            type="text"
                            value={tempNotes}
                            onChange={(e) => setTempNotes(e.target.value)}
                            placeholder="Add forensic notes, attacker IP, or mitigation actions..."
                            className="flex-1 bg-neutral-950 border border-neutral-700 rounded px-2.5 py-1 text-white text-xs focus:outline-none focus:border-cyan-500"
                            autoFocus
                          />
                          <button
                            onClick={() => handleSaveNotes(scan.id)}
                            className="px-3 py-1 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingNotesId(null)}
                            className="px-2 py-1 text-neutral-400 hover:text-white text-xs"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-neutral-400 flex-1">
                          <FileText className="h-3.5 w-3.5 text-neutral-400 shrink-0" />
                          <span className="text-neutral-300">
                            {scan.notes ? (
                              scan.notes
                            ) : (
                              <span className="text-neutral-400 italic">No notes attached. Click edit to add forensics.</span>
                            )}
                          </span>
                          <button
                            onClick={() => handleStartEditNotes(scan)}
                            className="text-[11px] text-cyan-400 hover:text-cyan-300 underline ml-2"
                          >
                            Edit
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Batch Audits */}
      {activeTab === 'batches' && (
        <div className="space-y-4">
          {userBatchRuns.length === 0 ? (
            <div className="p-12 text-center rounded-xl border border-neutral-800/80 bg-neutral-900/30 space-y-3">
              <Database className="h-8 w-8 text-neutral-400 mx-auto" />
              <h3 className="text-sm font-semibold text-neutral-300">No Batch Audits Archived</h3>
              <p className="text-xs text-neutral-400 max-w-md mx-auto">
                Navigate to the Batch Analysis view, run high-volume traffic classification, and click "Save Batch Audit to Cloud" to store audit history.
              </p>
              <button
                onClick={onNavigateToBatch}
                className="mt-2 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold"
              >
                Go to Batch Analyzer
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {userBatchRuns.map((batch) => {
                const intrusionRate =
                  batch.total_samples > 0
                    ? ((batch.total_intrusions / batch.total_samples) * 100).toFixed(1)
                    : '0.0';

                return (
                  <div
                    key={batch.id}
                    className="p-5 rounded-xl border border-neutral-800/80 bg-neutral-900/40 space-y-3 relative group hover:border-neutral-700 transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-sm font-bold text-white flex items-center gap-2">
                          <span>{batch.title || 'Batch Audit Run'}</span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/60">
                            {batch.total_samples} samples
                          </span>
                        </h4>
                        <span className="text-[11px] font-mono text-neutral-400 flex items-center gap-1 mt-0.5">
                          <Clock className="h-3 w-3" />
                          {new Date(batch.timestamp).toLocaleString()}
                        </span>
                      </div>

                      <button
                        onClick={() => {
                          if (window.confirm('Delete this batch audit run from Firestore?')) {
                            deleteBatchRunRecord(batch.id);
                          }
                        }}
                        className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-400 hover:bg-neutral-800"
                        title="Delete batch audit"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Metric Breakdown */}
                    <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                      <div className="p-2 rounded bg-neutral-950/60 border border-neutral-800">
                        <span className="text-neutral-400 block text-[10px]">THREATS</span>
                        <span className="text-rose-400 font-bold">{batch.total_intrusions}</span>
                      </div>
                      <div className="p-2 rounded bg-neutral-950/60 border border-neutral-800">
                        <span className="text-neutral-400 block text-[10px]">NORMAL</span>
                        <span className="text-emerald-400 font-bold">{batch.total_normal}</span>
                      </div>
                      <div className="p-2 rounded bg-neutral-950/60 border border-neutral-800">
                        <span className="text-neutral-400 block text-[10px]">INTRUSION RATE</span>
                        <span className="text-cyan-400 font-bold">{intrusionRate}%</span>
                      </div>
                    </div>

                    {/* Breakdown by class if available */}
                    {batch.summary?.breakdown && (
                      <div className="pt-2 border-t border-neutral-800/60 flex flex-wrap gap-2 text-[11px] font-mono">
                        {Object.entries(batch.summary.breakdown).map(([cls, cnt]) => (
                          <span
                            key={cls}
                            className={`px-2 py-0.5 rounded ${
                              cls === 'Normal'
                                ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/50'
                                : 'bg-rose-950/40 text-rose-400 border border-rose-900/50'
                            }`}
                          >
                            {cls}: {cnt}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
