import React, { useState, useRef } from 'react';
import {
  Upload, FileText, Download, Play, RefreshCw, AlertCircle,
  CheckCircle2, ShieldAlert, Search, RotateCcw, ArrowRight, Database
} from 'lucide-react';
import { BatchPredictionResponse, BatchRecordResult } from '../types';
import { useAuth } from '../context/AuthContext';

interface BatchAnalyzerProps {
  sampleBatch: any[];
  onAnalyzeBatch: (records: any[]) => Promise<void>;
  batchResults: BatchPredictionResponse | null;
  onResetBatch: () => void;
  isLoading: boolean;
  error: string | null;
}

export const BatchAnalyzer: React.FC<BatchAnalyzerProps> = ({
  sampleBatch,
  onAnalyzeBatch,
  batchResults,
  onResetBatch,
  isLoading,
  error
}) => {
  const { user, signInWithGoogle, saveBatchRunRecord } = useAuth();
  const [stagedRecords, setStagedRecords] = useState<any[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [filterType, setFilterType] = useState<'all' | 'threats' | 'normal'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSavingBatch, setIsSavingBatch] = useState<boolean>(false);
  const [savedBatchId, setSavedBatchId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSaveToCloud = async () => {
    if (!batchResults) return;
    if (!user) {
      await signInWithGoogle();
      return;
    }
    setIsSavingBatch(true);
    const id = await saveBatchRunRecord({
      title: fileName || 'Production Telemetry Batch Audit',
      total_samples: batchResults.summary.total_records,
      total_intrusions: batchResults.summary.total_intrusions_flagged,
      total_normal: batchResults.summary.total_normal_flows,
      avg_latency_ms: batchResults.summary.avg_latency_per_sample_ms,
      summary: batchResults.summary,
      sample_results: batchResults.records.slice(0, 50)
    });
    setIsSavingBatch(false);
    if (id) {
      setSavedBatchId(id);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split('\n').filter(l => l.trim().length > 0);
        if (lines.length <= 1) {
          alert('CSV file appears empty or lacks data rows.');
          return;
        }

        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        const parsedRows = [];

        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(',');
          if (cols.length < headers.length) continue;
          const rowObj: Record<string, any> = {};
          headers.forEach((h, idx) => {
            const rawVal = cols[idx]?.trim().replace(/^"|"$/g, '');
            const numVal = Number(rawVal);
            rowObj[h] = isNaN(numVal) ? rawVal : numVal;
          });
          parsedRows.push(rowObj);
        }

        setStagedRecords(parsedRows);
      } catch (err: any) {
        alert('Failed to parse CSV file: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  const handleLoadSampleBatch = () => {
    setFileName('production_telemetry_sample.csv');
    setStagedRecords(sampleBatch);
  };

  const handleDownloadResults = () => {
    if (!batchResults) return;
    const headers = 'record_id,prediction,is_intrusion,confidence,risk_level,protocol,service,flag,src_bytes,dst_bytes,count,serror_rate\n';
    const rows = batchResults.records.map(r => 
      `${r.record_id},${r.prediction},${r.is_intrusion},${r.confidence},${r.risk_level},${r.protocol},${r.service},${r.flag},${r.src_bytes},${r.dst_bytes},${r.count},${r.serror_rate}`
    ).join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'nids_batch_detection_report.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const filteredRecords = (batchResults?.records || []).filter(r => {
    if (filterType === 'threats' && !r.is_intrusion) return false;
    if (filterType === 'normal' && r.is_intrusion) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        r.prediction.toLowerCase().includes(q) ||
        r.protocol.toLowerCase().includes(q) ||
        r.service.toLowerCase().includes(q) ||
        (r.ground_truth && r.ground_truth.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="space-y-8">
      {/* Title */}
      <div className="space-y-1.5 border-b border-neutral-800/80 pb-5">
        <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-white">
          Batch Traffic Analysis
        </h1>
        <p className="text-sm text-neutral-400">
          Upload bulk network traffic connection records to analyze threats at scale.
        </p>
      </div>

      {!batchResults ? (
        <div className="space-y-6">
          {/* Upload Dropzone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-neutral-800 hover:border-cyan-500/60 bg-neutral-900/30 hover:bg-neutral-900/50 rounded-2xl p-10 text-center cursor-pointer transition-all space-y-3 group"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleFileUpload}
            />
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-800 border border-neutral-700/60 text-cyan-400 group-hover:scale-105 group-hover:border-cyan-500/50 transition-all shadow-lg">
              <Upload className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-white">
                Upload Traffic Data
              </p>
              <p className="text-xs text-neutral-400">
                Drag & drop CSV file here, or click to browse files
              </p>
            </div>
          </div>

          {/* Quick Action Sample */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-xl border border-neutral-800 bg-neutral-900/40">
            <span className="text-xs text-neutral-400 font-mono">
              Need sample data to evaluate detection engine?
            </span>
            <button
              type="button"
              onClick={handleLoadSampleBatch}
              className="px-4 py-1.5 rounded-lg border border-cyan-800/80 bg-cyan-950/40 hover:bg-cyan-900/50 text-cyan-300 text-xs font-semibold font-mono transition-colors"
            >
              Load Sample Telemetry Batch (15 Records)
            </button>
          </div>

          {/* Staged Data Preview */}
          {stagedRecords.length > 0 && (
            <div className="rounded-2xl border border-neutral-800/80 bg-neutral-900/30 backdrop-blur-md p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-neutral-800/80 pb-3">
                <span className="text-xs font-mono font-bold text-white">
                  STAGED: {fileName} ({stagedRecords.length} records)
                </span>
                <button
                  type="button"
                  onClick={() => { setStagedRecords([]); setFileName(''); }}
                  className="text-xs text-neutral-500 hover:text-neutral-300"
                >
                  Clear File
                </button>
              </div>

              {/* Table preview */}
              <div className="overflow-x-auto max-h-56 overflow-y-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="sticky top-0 bg-neutral-900 text-neutral-400 border-b border-neutral-800">
                    <tr>
                      <th className="py-2 px-3">#</th>
                      <th className="py-2 px-3">Protocol</th>
                      <th className="py-2 px-3">Service</th>
                      <th className="py-2 px-3">Flag</th>
                      <th className="py-2 px-3 text-right">Src Bytes</th>
                      <th className="py-2 px-3 text-right">Count</th>
                      <th className="py-2 px-3 text-right">serror_rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800/60 text-neutral-300">
                    {stagedRecords.slice(0, 8).map((row, idx) => (
                      <tr key={idx} className="hover:bg-neutral-800/20">
                        <td className="py-2 px-3 text-neutral-500">{idx + 1}</td>
                        <td className="py-2 px-3">{row.protocol_type}</td>
                        <td className="py-2 px-3">{row.service}</td>
                        <td className="py-2 px-3">{row.flag}</td>
                        <td className="py-2 px-3 text-right tabular-nums">{row.src_bytes}</td>
                        <td className="py-2 px-3 text-right tabular-nums">{row.count}</td>
                        <td className="py-2 px-3 text-right tabular-nums">{Number(row.serror_rate || 0).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="pt-3 border-t border-neutral-800/80 flex justify-end">
                <button
                  type="button"
                  onClick={() => onAnalyzeBatch(stagedRecords)}
                  disabled={isLoading}
                  className="px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-neutral-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-cyan-950/50 transition-all"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin text-neutral-950" />
                      <span>Processing Batch...</span>
                    </>
                  ) : (
                    <>
                      <Play className="h-3.5 w-3.5 fill-current" />
                      <span>Start Batch Inference</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-xl border border-rose-800/80 bg-rose-950/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>
      ) : (
        /* Results View */
        <div className="space-y-6">
          {/* Summary KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl border border-neutral-800/80 bg-neutral-900/40 space-y-1">
              <span className="text-xs text-neutral-400 font-medium">Records Analyzed</span>
              <div className="font-mono text-2xl font-bold text-white tabular-nums">
                {batchResults.summary.total_records}
              </div>
              <span className="text-[11px] text-neutral-500 font-mono">
                {batchResults.summary.total_batch_latency_ms} ms total
              </span>
            </div>

            <div className="p-4 rounded-xl border border-rose-800/60 bg-rose-950/20 space-y-1">
              <span className="text-xs text-rose-400 font-medium flex items-center gap-1.5">
                <ShieldAlert className="h-3.5 w-3.5" />
                <span>Threats Detected</span>
              </span>
              <div className="font-mono text-2xl font-bold text-rose-400 tabular-nums">
                {batchResults.summary.total_intrusions_flagged}
              </div>
              <span className="text-[11px] text-rose-400/80 font-mono">
                {batchResults.summary.intrusion_rate_percent}% threat rate
              </span>
            </div>

            <div className="p-4 rounded-xl border border-emerald-800/60 bg-emerald-950/20 space-y-1">
              <span className="text-xs text-emerald-400 font-medium flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Normal Traffic</span>
              </span>
              <div className="font-mono text-2xl font-bold text-emerald-400 tabular-nums">
                {batchResults.summary.total_normal_flows}
              </div>
              <span className="text-[11px] text-emerald-400/80 font-mono">
                {(100 - batchResults.summary.intrusion_rate_percent).toFixed(1)}% benign
              </span>
            </div>

            <div className="p-4 rounded-xl border border-neutral-800/80 bg-neutral-900/40 space-y-1">
              <span className="text-xs text-neutral-400 font-medium">Average Latency</span>
              <div className="font-mono text-2xl font-bold text-cyan-400 tabular-nums">
                {batchResults.summary.avg_latency_per_sample_ms} ms
              </div>
              <span className="text-[11px] text-neutral-500 font-mono">
                Line-rate throughput
              </span>
            </div>
          </div>

          {/* Interactive Results Table */}
          <div className="rounded-2xl border border-neutral-800/80 bg-neutral-900/30 backdrop-blur-md p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-800/80 pb-3">
              {/* Segmented Filter */}
              <div className="flex items-center gap-1 p-1 bg-neutral-950 rounded-xl border border-neutral-800">
                <button
                  type="button"
                  onClick={() => setFilterType('all')}
                  className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                    filterType === 'all' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  All ({batchResults.records.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterType('threats')}
                  className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                    filterType === 'threats' ? 'bg-rose-950/80 text-rose-300 font-semibold' : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Threats Only ({batchResults.summary.total_intrusions_flagged})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterType('normal')}
                  className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                    filterType === 'normal' ? 'bg-emerald-950/80 text-emerald-300 font-semibold' : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Normal ({batchResults.summary.total_normal_flows})
                </button>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="h-3.5 w-3.5 absolute left-3 top-2.5 text-neutral-500" />
                  <input
                    type="text"
                    placeholder="Search records..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="rounded-xl border border-neutral-800 bg-neutral-950 pl-8 pr-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:border-cyan-500 focus:outline-none"
                  />
                </div>
                <button
                  onClick={handleSaveToCloud}
                  disabled={isSavingBatch || !!savedBatchId}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-colors ${
                    savedBatchId
                      ? 'border-cyan-800 bg-cyan-950/60 text-cyan-300'
                      : 'border-neutral-800 hover:border-neutral-700 bg-neutral-900 text-neutral-300 hover:text-white'
                  }`}
                  title={user ? 'Persist this batch audit report to Firestore' : 'Sign in with Google to persist batch audit'}
                >
                  {savedBatchId ? (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5 text-cyan-400" />
                      <span>Saved to Cloud</span>
                    </>
                  ) : isSavingBatch ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Database className="h-3.5 w-3.5 text-cyan-400" />
                      <span>{user ? 'Save to Cloud' : 'Sign in & Save'}</span>
                    </>
                  )}
                </button>
                <button
                  onClick={handleDownloadResults}
                  className="px-3 py-1.5 rounded-xl border border-neutral-800 hover:border-neutral-700 bg-neutral-900 text-neutral-300 hover:text-white text-xs font-medium flex items-center gap-1.5 transition-colors"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Export</span>
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="sticky top-0 bg-neutral-900 text-neutral-400 border-b border-neutral-800">
                  <tr>
                    <th className="py-2.5 px-3">Flow ID</th>
                    <th className="py-2.5 px-3">Prediction</th>
                    <th className="py-2.5 px-3">Confidence</th>
                    <th className="py-2.5 px-3">Risk</th>
                    <th className="py-2.5 px-3">Protocol</th>
                    <th className="py-2.5 px-3">Service</th>
                    <th className="py-2.5 px-3">Flag</th>
                    <th className="py-2.5 px-3 text-right">Src Bytes</th>
                    <th className="py-2.5 px-3 text-right">Count</th>
                    <th className="py-2.5 px-3 text-right">serror</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/60 text-neutral-300">
                  {filteredRecords.map((r) => {
                    const isThreat = r.is_intrusion;
                    return (
                      <tr key={r.record_id} className="hover:bg-neutral-800/30 transition-colors">
                        <td className="py-2 px-3 text-neutral-500">#{r.record_id}</td>
                        <td className="py-2 px-3 font-semibold">
                          <span className={isThreat ? 'text-rose-400' : 'text-emerald-400'}>
                            {r.prediction}
                          </span>
                        </td>
                        <td className="py-2 px-3 tabular-nums">
                          {(r.confidence * 100).toFixed(1)}%
                        </td>
                        <td className="py-2 px-3">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                            r.risk_level === 'Critical' ? 'bg-rose-950 text-rose-300 border border-rose-800' :
                            r.risk_level === 'High' ? 'bg-orange-950 text-orange-300 border border-orange-800' :
                            r.risk_level === 'Medium' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                            'bg-neutral-900 text-neutral-400 border border-neutral-800'
                          }`}>
                            {r.risk_level}
                          </span>
                        </td>
                        <td className="py-2 px-3">{r.protocol}</td>
                        <td className="py-2 px-3">{r.service}</td>
                        <td className="py-2 px-3">{r.flag}</td>
                        <td className="py-2 px-3 text-right tabular-nums">{r.src_bytes}</td>
                        <td className="py-2 px-3 text-right tabular-nums">{r.count}</td>
                        <td className="py-2 px-3 text-right tabular-nums">{Number(r.serror_rate).toFixed(2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="pt-3 border-t border-neutral-800/80 flex items-center justify-between">
              <span className="text-xs text-neutral-500 font-mono">
                Showing {filteredRecords.length} of {batchResults.records.length} records
              </span>

              <button
                type="button"
                onClick={onResetBatch}
                className="px-4 py-2 rounded-xl border border-neutral-800 hover:border-neutral-700 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 text-xs font-semibold flex items-center gap-2 transition-colors"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Upload New Batch</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
