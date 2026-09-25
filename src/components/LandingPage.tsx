import React from 'react';
import {
  ShieldAlert, ShieldCheck, ArrowRight, Activity, Cpu,
  Database, Network, Zap, CheckCircle2, ChevronRight, Lock, Eye
} from 'lucide-react';
import { SystemHealth } from '../types';

interface LandingPageProps {
  onStartAnalysis: () => void;
  onExploreDetection: () => void;
  systemHealth: SystemHealth | null;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onStartAnalysis,
  onExploreDetection,
  systemHealth
}) => {
  const isOnline = systemHealth?.status === 'healthy';

  return (
    <div className="relative z-10 space-y-24 pb-20">
      {/* 1. HERO SECTION */}
      <section className="pt-8 sm:pt-16 pb-12 flex flex-col items-center text-center space-y-8 max-w-5xl mx-auto px-4">
        {/* Security Status Pill */}
        <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full border border-cyan-800/60 bg-cyan-950/40 text-cyan-300 text-xs font-mono backdrop-blur-md shadow-[0_0_15px_-3px_rgba(6,182,212,0.3)]">
          <span className="relative flex h-2 w-2">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isOnline ? 'bg-cyan-400' : 'bg-amber-400'}`} />
            <span className={`relative inline-flex rounded-full h-2 w-2 ${isOnline ? 'bg-cyan-500' : 'bg-amber-500'}`} />
          </span>
          <span className="text-neutral-400 uppercase tracking-wider text-[10px]">SYSTEM STATUS:</span>
          <span className="font-semibold">{isOnline ? 'AI DETECTION ENGINE ONLINE' : 'ENGINE CONNECTING'}</span>
        </div>

        {/* Large Headline */}
        <div className="space-y-4">
          <h1 className="font-display text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.08]">
            Detect Network Threats <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-400">
              Before They Become Breaches.
            </span>
          </h1>
          <p className="max-w-2xl mx-auto text-base sm:text-lg text-neutral-300 leading-relaxed font-sans font-normal">
            AI-powered network intrusion detection that analyzes traffic patterns, identifies malicious activity in sub-millisecond latency, and explains every prediction with mathematical attribution.
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2 w-full sm:w-auto">
          <button
            onClick={onStartAnalysis}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-neutral-950 font-bold text-sm tracking-wide shadow-[0_0_30px_-5px_rgba(6,182,212,0.5)] hover:shadow-[0_0_35px_-2px_rgba(6,182,212,0.7)] transition-all flex items-center justify-center gap-2 group"
          >
            <span>Analyze Network Traffic</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </button>

          <button
            onClick={onExploreDetection}
            className="w-full sm:w-auto px-7 py-3.5 rounded-xl border border-neutral-800 hover:border-neutral-700 bg-neutral-900/60 hover:bg-neutral-800/80 text-neutral-200 font-medium text-sm backdrop-blur-sm transition-all"
          >
            Explore Detection
          </button>
        </div>

        {/* Live Network Security Mock Display with Dynamic Visual Nodes */}
        <div className="w-full max-w-4xl pt-8">
          <div className="relative rounded-2xl border border-neutral-800/90 bg-neutral-950/70 p-4 sm:p-6 backdrop-blur-xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3 mb-4 text-xs font-mono">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                <span className="text-neutral-500 ml-2">nids-engine-active // traffic-telemetry</span>
              </div>
              <span className="text-cyan-400">LATENCY: 0.42ms</span>
            </div>

            {/* Visual Node Diagram */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-left">
              <div className="p-3.5 rounded-xl border border-emerald-900/40 bg-emerald-950/20 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-emerald-400 flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    <span>Normal Traffic</span>
                  </span>
                  <span className="font-mono text-emerald-300 text-[11px]">99.8% Conf</span>
                </div>
                <div className="text-[11px] font-mono text-neutral-400">
                  TCP / HTTP GET · SF Handshake · Zero Error Rate
                </div>
                <div className="w-full bg-neutral-900 h-1 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 w-full" />
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-amber-900/40 bg-amber-950/20 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-amber-400 flex items-center gap-1.5">
                    <Activity className="h-3.5 w-3.5" />
                    <span>Suspicious Traffic</span>
                  </span>
                  <span className="font-mono text-amber-300 text-[11px]">Warning</span>
                </div>
                <div className="text-[11px] font-mono text-neutral-400">
                  Port Reconnaissance · Elevated diff_srv_rate
                </div>
                <div className="w-full bg-neutral-900 h-1 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 w-[65%]" />
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-rose-900/40 bg-rose-950/20 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-rose-400 flex items-center gap-1.5">
                    <ShieldAlert className="h-3.5 w-3.5" />
                    <span>Malicious Traffic</span>
                  </span>
                  <span className="font-mono text-rose-300 text-[11px]">98.2% Conf</span>
                </div>
                <div className="text-[11px] font-mono text-neutral-400">
                  Neptune SYN Flood · serror: 1.00 · Flag S0
                </div>
                <div className="w-full bg-neutral-900 h-1 rounded-full overflow-hidden">
                  <div className="h-full bg-rose-500 w-[98%]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. TRUST / CAPABILITY STRIP */}
      <section className="border-y border-neutral-800/80 bg-neutral-950/50 backdrop-blur-sm py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6 text-center">
            {[
              { title: 'AI-Powered Detection', icon: Cpu },
              { title: 'Real-Time Analysis', icon: Zap },
              { title: 'Explainable Predictions', icon: Eye },
              { title: 'Batch Processing', icon: Database },
              { title: 'Threat Classification', icon: ShieldAlert }
            ].map((cap, i) => {
              const Icon = cap.icon;
              return (
                <div key={i} className="flex flex-col items-center gap-2 group">
                  <div className="h-8 w-8 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center text-cyan-400 group-hover:border-cyan-500/50 transition-colors">
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-semibold text-neutral-300 group-hover:text-white transition-colors">
                    {cap.title}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3. HOW IT WORKS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center space-y-3">
          <span className="text-xs font-mono font-semibold uppercase tracking-wider text-cyan-400">
            Intrusion Detection Lifecycle
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-white">
            How It Works
          </h2>
          <p className="text-sm text-neutral-400 max-w-xl mx-auto">
            Sub-millisecond packet telemetry analysis powered by calibrated deep neural networks.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          {/* Step 1 */}
          <div className="relative p-6 rounded-2xl border border-neutral-800/80 bg-neutral-900/30 backdrop-blur-sm space-y-4 hover:border-neutral-700 transition-colors">
            <span className="text-3xl font-extrabold font-mono text-neutral-600">01</span>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white">Capture</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Provide network connection flow features including protocol, service, flags, transfer bytes, and error rates.
              </p>
            </div>
            <div className="pt-2 text-[11px] font-mono text-cyan-400/80">
              &gt; Ingests packet telemetry parameters
            </div>
          </div>

          {/* Step 2 */}
          <div className="relative p-6 rounded-2xl border border-cyan-800/60 bg-gradient-to-b from-cyan-950/20 to-neutral-900/30 backdrop-blur-sm space-y-4 hover:border-cyan-700 transition-colors">
            <span className="text-3xl font-extrabold font-mono text-cyan-500/80">02</span>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white">Analyze</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Deep-learning neural model runs feature normalization and forwards connection data through calibrated hidden layers.
              </p>
            </div>
            <div className="pt-2 text-[11px] font-mono text-cyan-400/80">
              &gt; Deep Feedforward MLP inference
            </div>
          </div>

          {/* Step 3 */}
          <div className="relative p-6 rounded-2xl border border-neutral-800/80 bg-neutral-900/30 backdrop-blur-sm space-y-4 hover:border-neutral-700 transition-colors">
            <span className="text-3xl font-extrabold font-mono text-neutral-600">03</span>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white">Detect</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Receive threat classification, confidence rating, risk scoring, and exact feature attributions explaining the verdict.
              </p>
            </div>
            <div className="pt-2 text-[11px] font-mono text-cyan-400/80">
              &gt; Explainable outcome with confidence
            </div>
          </div>
        </div>
      </section>

      {/* 4. PRODUCT FEATURES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="text-center space-y-3">
          <span className="text-xs font-mono font-semibold uppercase tracking-wider text-cyan-400">
            SaaS Capabilities
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-white">
            Engineered for Modern Security Teams
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              title: 'AI Intrusion Detection',
              desc: 'High-precision deep neural network optimized for Attack Recall to prevent malicious evasion.',
              icon: ShieldCheck
            },
            {
              title: 'Real-Time Prediction',
              desc: 'Sub-millisecond inference latency capable of inspecting high-throughput continuous network flows.',
              icon: Zap
            },
            {
              title: 'Batch Traffic Analysis',
              desc: 'Upload CSV logs with hundreds of records to instantly extract aggregate threat distributions.',
              icon: Database
            },
            {
              title: 'Threat Classification',
              desc: 'Categorizes attacks into DoS, Probe, Remote-to-Local (R2L), and User-to-Root (U2R) profiles.',
              icon: ShieldAlert
            },
            {
              title: 'Confidence & Risk Scoring',
              desc: 'Multi-class probability vectors paired with calculated threat severity levels (Nominal to Critical).',
              icon: Activity
            },
            {
              title: 'Explainable AI Attributions',
              desc: 'Transparent SHAP-style feature impact bars reveal precisely which network parameters triggered an alert.',
              icon: Eye
            }
          ].map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <div
                key={idx}
                className="p-6 rounded-2xl border border-neutral-800/80 bg-neutral-900/30 backdrop-blur-sm space-y-3 hover:border-neutral-700 transition-colors"
              >
                <div className="h-10 w-10 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-cyan-400">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-white">{feat.title}</h3>
                <p className="text-xs text-neutral-400 leading-relaxed">{feat.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* 5. FINAL CTA SECTION */}
      <section className="max-w-5xl mx-auto px-4">
        <div className="relative rounded-3xl border border-cyan-800/60 bg-gradient-to-br from-cyan-950/40 via-neutral-900/80 to-neutral-950 p-8 sm:p-12 text-center space-y-6 shadow-2xl overflow-hidden">
          <div className="space-y-2">
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-white">
              Secure Your Network With AI
            </h2>
            <p className="text-sm text-neutral-300 max-w-xl mx-auto leading-relaxed">
              Launch the deep learning inspection platform and evaluate live network traffic connection parameters in real time.
            </p>
          </div>

          <div className="pt-2">
            <button
              onClick={onStartAnalysis}
              className="px-8 py-3.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-neutral-950 font-bold text-sm tracking-wide shadow-[0_0_25px_-5px_rgba(6,182,212,0.5)] transition-all inline-flex items-center gap-2"
            >
              <span>Start Analysis</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
