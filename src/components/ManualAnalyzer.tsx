import React, { useState } from 'react';
import { Play, Sparkles, RefreshCw, AlertCircle, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { TrafficPreset } from '../types';

interface ManualAnalyzerProps {
  presets: TrafficPreset[];
  features: Record<string, any>;
  setFeatures: React.Dispatch<React.SetStateAction<Record<string, any>>>;
  onAnalyze: () => void;
  isLoading: boolean;
  error: string | null;
}

export const ManualAnalyzer: React.FC<ManualAnalyzerProps> = ({
  presets,
  features,
  setFeatures,
  onAnalyze,
  isLoading,
  error
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [activePreset, setActivePreset] = useState<string>('normal_http');

  const handlePresetSelect = (preset: TrafficPreset) => {
    setActivePreset(preset.id);
    setFeatures(prev => ({
      ...prev,
      ...preset.data
    }));
  };

  const handleInputChange = (field: string, val: any) => {
    setActivePreset('');
    setFeatures(prev => ({
      ...prev,
      [field]: val
    }));
  };

  return (
    <div className="space-y-8">
      {/* Title & Explainer */}
      <div className="space-y-1.5 border-b border-neutral-800/80 pb-5">
        <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-white">
          Analyze Network Traffic
        </h1>
        <p className="text-sm text-neutral-400">
          Enter network traffic characteristics to detect potential intrusions.
        </p>
      </div>

      {/* Preset Scenarios (Quick Testing) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-neutral-300 font-mono">
            BENCHMARK PRESETS:
          </span>
          <span className="text-neutral-500 font-mono text-[11px]">
            Tested Ground Truth Scenarios
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {presets.map((preset) => {
            const isActive = activePreset === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handlePresetSelect(preset)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  isActive
                    ? 'border-cyan-500/80 bg-cyan-950/30 text-white shadow-[0_0_15px_-3px_rgba(6,182,212,0.3)]'
                    : 'border-neutral-800/80 bg-neutral-900/40 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200'
                }`}
              >
                <div className="text-xs font-semibold leading-tight line-clamp-1">{preset.title}</div>
                <div className="text-[10px] text-cyan-400/90 mt-1 font-mono">{preset.expected}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Logical Feature Groups */}
      <div className="space-y-6">
        {/* GROUP 1: NETWORK FEATURES */}
        <div className="rounded-2xl border border-neutral-800/80 bg-neutral-900/30 backdrop-blur-md p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-800/80 pb-2.5">
            <span className="text-xs font-bold font-mono tracking-wider text-cyan-400 uppercase">
              1. Network Features
            </span>
            <span className="text-[11px] text-neutral-500 font-mono">Layer 3/4 & Application Protocol</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Protocol */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-neutral-300 flex items-center justify-between">
                <span>Protocol Type</span>
                <span className="text-[10px] font-mono text-neutral-500">protocol_type</span>
              </label>
              <select
                value={features.protocol_type || 'tcp'}
                onChange={(e) => handleInputChange('protocol_type', e.target.value)}
                className="w-full rounded-xl border border-neutral-700/80 bg-neutral-950 px-3 py-2 text-xs text-neutral-100 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none transition-all"
              >
                <option value="tcp">TCP (Transmission Control Protocol)</option>
                <option value="udp">UDP (User Datagram Protocol)</option>
                <option value="icmp">ICMP (Internet Control Message Protocol)</option>
              </select>
            </div>

            {/* Service */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-neutral-300 flex items-center justify-between">
                <span>Target Service</span>
                <span className="text-[10px] font-mono text-neutral-500">service</span>
              </label>
              <select
                value={features.service || 'http'}
                onChange={(e) => handleInputChange('service', e.target.value)}
                className="w-full rounded-xl border border-neutral-700/80 bg-neutral-950 px-3 py-2 text-xs text-neutral-100 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none transition-all"
              >
                <option value="http">http - Web Port 80/443</option>
                <option value="private">private - Non-standard ports</option>
                <option value="smtp">smtp - Mail transfer 25</option>
                <option value="domain_u">domain_u - DNS 53</option>
                <option value="ftp">ftp - FTP control 21</option>
                <option value="ftp_data">ftp_data - FTP data transfer</option>
                <option value="telnet">telnet - Remote terminal 23</option>
                <option value="eco_i">eco_i - ICMP Ping Echo</option>
                <option value="ecr_i">ecr_i - ICMP Echo Reply</option>
                <option value="other">other - Unclassified port</option>
              </select>
            </div>

            {/* Flag */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-neutral-300 flex items-center justify-between">
                <span>TCP Connection Flag</span>
                <span className="text-[10px] font-mono text-neutral-500">flag</span>
              </label>
              <select
                value={features.flag || 'SF'}
                onChange={(e) => handleInputChange('flag', e.target.value)}
                className="w-full rounded-xl border border-neutral-700/80 bg-neutral-950 px-3 py-2 text-xs text-neutral-100 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none transition-all"
              >
                <option value="SF">SF (Normal Established / Clean Finish)</option>
                <option value="S0">S0 (SYN Sent, No Ack / SYN Flood)</option>
                <option value="REJ">REJ (Connection Attempt Rejected)</option>
                <option value="RSTO">RSTO (Reset by Originator)</option>
                <option value="RSTR">RSTR (Reset by Responder)</option>
              </select>
            </div>
          </div>
        </div>

        {/* GROUP 2: TRAFFIC FEATURES */}
        <div className="rounded-2xl border border-neutral-800/80 bg-neutral-900/30 backdrop-blur-md p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-800/80 pb-2.5">
            <span className="text-xs font-bold font-mono tracking-wider text-cyan-400 uppercase">
              2. Traffic Features
            </span>
            <span className="text-[11px] text-neutral-500 font-mono">Volumetric Data Exchange</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-neutral-300 flex items-center justify-between">
                <span>Source Transmitted Bytes</span>
                <span className="text-[10px] font-mono text-neutral-500">src_bytes (B)</span>
              </label>
              <input
                type="number"
                min="0"
                value={features.src_bytes ?? 232}
                onChange={(e) => handleInputChange('src_bytes', Number(e.target.value))}
                placeholder="232"
                className="w-full rounded-xl border border-neutral-700/80 bg-neutral-950 px-3 py-2 text-xs text-neutral-100 font-mono focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-neutral-300 flex items-center justify-between">
                <span>Destination Received Bytes</span>
                <span className="text-[10px] font-mono text-neutral-500">dst_bytes (B)</span>
              </label>
              <input
                type="number"
                min="0"
                value={features.dst_bytes ?? 8153}
                onChange={(e) => handleInputChange('dst_bytes', Number(e.target.value))}
                placeholder="8153"
                className="w-full rounded-xl border border-neutral-700/80 bg-neutral-950 px-3 py-2 text-xs text-neutral-100 font-mono focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none transition-all"
              />
            </div>
          </div>
        </div>

        {/* GROUP 3: CONNECTION FEATURES */}
        <div className="rounded-2xl border border-neutral-800/80 bg-neutral-900/30 backdrop-blur-md p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-800/80 pb-2.5">
            <span className="text-xs font-bold font-mono tracking-wider text-cyan-400 uppercase">
              3. Connection Features
            </span>
            <span className="text-[11px] text-neutral-500 font-mono">Time Window Rate Statistics (2s)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Connection Count */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-neutral-300 flex items-center justify-between">
                <span>Connection Count</span>
                <span className="text-[10px] font-mono text-neutral-500">count (0-512)</span>
              </label>
              <input
                type="number"
                min="0"
                max="512"
                value={features.count ?? 3}
                onChange={(e) => handleInputChange('count', Number(e.target.value))}
                className="w-full rounded-xl border border-neutral-700/80 bg-neutral-950 px-3 py-2 text-xs text-neutral-100 font-mono focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none transition-all"
              />
            </div>

            {/* SYN Error Rate */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-neutral-300">
                  SYN Error Rate
                </label>
                <span className="text-xs font-mono text-cyan-400">
                  {Number(features.serror_rate ?? 0).toFixed(2)}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={features.serror_rate ?? 0}
                onChange={(e) => handleInputChange('serror_rate', parseFloat(e.target.value))}
                className="w-full accent-cyan-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-neutral-500 font-mono">
                <span>0.00 (Clean)</span>
                <span>1.00 (SYN Flood)</span>
              </div>
            </div>

            {/* Different Service Rate */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-neutral-300">
                  Different Service Rate
                </label>
                <span className="text-xs font-mono text-cyan-400">
                  {Number(features.diff_srv_rate ?? 0).toFixed(2)}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={features.diff_srv_rate ?? 0}
                onChange={(e) => handleInputChange('diff_srv_rate', parseFloat(e.target.value))}
                className="w-full accent-cyan-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-neutral-500 font-mono">
                <span>0.00 (Single Srv)</span>
                <span>1.00 (Port Sweep)</span>
              </div>
            </div>
          </div>
        </div>

        {/* GROUP 4: SECURITY & AUTHENTICATION FEATURES */}
        <div className="rounded-2xl border border-neutral-800/80 bg-neutral-900/30 backdrop-blur-md p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-800/80 pb-2.5">
            <span className="text-xs font-bold font-mono tracking-wider text-cyan-400 uppercase">
              4. Security Features
            </span>
            <span className="text-[11px] text-neutral-500 font-mono">Authentication & Privilege State</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-neutral-300 flex items-center justify-between">
                <span>Authentication State</span>
                <span className="text-[10px] font-mono text-neutral-500">logged_in</span>
              </label>
              <select
                value={features.logged_in ?? 1}
                onChange={(e) => handleInputChange('logged_in', parseInt(e.target.value, 10))}
                className="w-full rounded-xl border border-neutral-700/80 bg-neutral-950 px-3 py-2 text-xs text-neutral-100 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none transition-all"
              >
                <option value="1">1 - Authenticated Session</option>
                <option value="0">0 - Unauthenticated / Login Failed</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-neutral-300 flex items-center justify-between">
                <span>Failed Authentication Attempts</span>
                <span className="text-[10px] font-mono text-neutral-500">num_failed_logins</span>
              </label>
              <input
                type="number"
                min="0"
                max="10"
                value={features.num_failed_logins ?? 0}
                onChange={(e) => handleInputChange('num_failed_logins', parseInt(e.target.value, 10))}
                className="w-full rounded-xl border border-neutral-700/80 bg-neutral-950 px-3 py-2 text-xs text-neutral-100 font-mono focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none transition-all"
              />
            </div>
          </div>
        </div>

        {/* Collapsible Extended Features (Remaining NSL-KDD parameters) */}
        <div className="pt-2">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-cyan-400 font-mono transition-colors"
          >
            {showAdvanced ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            <span>{showAdvanced ? 'Hide Extended Security Features' : 'Configure Extended Security Fields (Root Shell, Hot Indicators, etc.)'}</span>
          </button>

          {showAdvanced && (
            <div className="mt-3 p-4 rounded-xl border border-neutral-800 bg-neutral-950/60 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div className="space-y-1">
                <label className="text-neutral-400 text-[11px]">Root Shell Created</label>
                <select
                  value={features.root_shell ?? 0}
                  onChange={(e) => handleInputChange('root_shell', parseInt(e.target.value, 10))}
                  className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-2 py-1.5 text-neutral-200"
                >
                  <option value="0">0 - No Root Shell</option>
                  <option value="1">1 - Root Shell Created</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-neutral-400 text-[11px]">Hot Indicators (Sys Dirs)</label>
                <input
                  type="number"
                  min="0"
                  value={features.hot ?? 0}
                  onChange={(e) => handleInputChange('hot', parseInt(e.target.value, 10))}
                  className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-2 py-1.5 text-neutral-200 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-neutral-400 text-[11px]">su Attempted</label>
                <select
                  value={features.su_attempted ?? 0}
                  onChange={(e) => handleInputChange('su_attempted', parseInt(e.target.value, 10))}
                  className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-2 py-1.5 text-neutral-200"
                >
                  <option value="0">0 - No su</option>
                  <option value="1">1 - su attempted</option>
                  <option value="2">2 - su successful</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-neutral-400 text-[11px]">Dst Host Srv Count</label>
                <input
                  type="number"
                  min="0"
                  max="255"
                  value={features.dst_host_srv_count ?? 255}
                  onChange={(e) => handleInputChange('dst_host_srv_count', parseInt(e.target.value, 10))}
                  className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-2 py-1.5 text-neutral-200 font-mono"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Primary Action Button */}
      <div className="pt-4 border-t border-neutral-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-xs font-mono text-neutral-400">
          Ready to inspect flow telemetry with calibrated PyTorch model.
        </div>

        <button
          type="button"
          onClick={onAnalyze}
          disabled={isLoading}
          className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:bg-neutral-800 disabled:text-neutral-500 text-neutral-950 font-bold text-sm tracking-wide shadow-[0_0_20px_-3px_rgba(6,182,212,0.4)] transition-all flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin text-neutral-950" />
              <span>Analyzing Traffic...</span>
            </>
          ) : (
            <>
              <Play className="h-4 w-4 fill-current" />
              <span>Run AI Detection</span>
            </>
          )}
        </button>
      </div>

      {/* Loading feedback overlay text if active */}
      {isLoading && (
        <div className="p-4 rounded-xl border border-cyan-800/60 bg-cyan-950/20 text-cyan-300 text-xs font-mono flex items-center gap-2 animate-pulse">
          <RefreshCw className="h-4 w-4 animate-spin shrink-0" />
          <span>AI model is evaluating the network pattern against calibrated feature distributions...</span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="p-4 rounded-xl border border-rose-800/80 bg-rose-950/30 text-rose-300 text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
            <span>Unable to analyze traffic: {error}</span>
          </div>
          <button
            onClick={onAnalyze}
            className="px-3 py-1 rounded bg-rose-900/50 hover:bg-rose-900 border border-rose-700 text-xs font-semibold"
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
};
