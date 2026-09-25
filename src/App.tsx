import React, { useState, useEffect } from 'react';
import { CyberBackground } from './components/CyberBackground';
import { Navbar } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { DashboardOverview } from './components/DashboardOverview';
import { ManualAnalyzer } from './components/ManualAnalyzer';
import { PredictionResultView } from './components/PredictionResultView';
import { BatchAnalyzer } from './components/BatchAnalyzer';
import { ExplainabilityView } from './components/ExplainabilityView';
import { HistoryView } from './components/HistoryView';
import { AuthProvider } from './context/AuthContext';
import {
  PredictionResult, BatchPredictionResponse, TrafficPreset, SystemHealth
} from './types';

// Fallback initial presets if API is mounting
const DEFAULT_PRESETS: TrafficPreset[] = [
  {
    id: 'normal_http',
    title: 'Normal Web Traffic',
    description: 'Standard HTTP GET web request with clean SF flag, normal bytes, and authenticated session.',
    expected: 'Normal',
    data: {
      protocol_type: 'tcp',
      service: 'http',
      flag: 'SF',
      src_bytes: 232,
      dst_bytes: 8153,
      duration: 0,
      count: 3,
      srv_count: 3,
      serror_rate: 0.0,
      same_srv_rate: 1.0,
      diff_srv_rate: 0.0,
      logged_in: 1,
      num_failed_logins: 0,
      dst_host_srv_count: 255
    }
  },
  {
    id: 'dos_neptune',
    title: 'DoS Attack (Neptune)',
    description: 'Massive SYN flood surge on port 80 with 100% serror_rate, zero return bytes, and flag S0.',
    expected: 'DoS',
    data: {
      protocol_type: 'tcp',
      service: 'http',
      flag: 'S0',
      src_bytes: 0,
      dst_bytes: 0,
      duration: 0,
      count: 240,
      srv_count: 240,
      serror_rate: 1.0,
      same_srv_rate: 1.0,
      diff_srv_rate: 0.0,
      logged_in: 0,
      num_failed_logins: 0,
      dst_host_srv_count: 12
    }
  },
  {
    id: 'probe_portsweep',
    title: 'Probe (Portsweep)',
    description: 'Automated horizontal port reconnaissance hitting diverse services with high diff_srv_rate.',
    expected: 'Probe',
    data: {
      protocol_type: 'tcp',
      service: 'private',
      flag: 'REJ',
      src_bytes: 0,
      dst_bytes: 0,
      duration: 0,
      count: 65,
      srv_count: 4,
      serror_rate: 0.0,
      same_srv_rate: 0.06,
      diff_srv_rate: 0.85,
      logged_in: 0,
      num_failed_logins: 0,
      dst_host_srv_count: 4
    }
  },
  {
    id: 'r2l_ftp_brute',
    title: 'R2L (FTP Guess)',
    description: 'Unauthorized remote access attempt with repeated failed credentials on FTP control port 21.',
    expected: 'R2L',
    data: {
      protocol_type: 'tcp',
      service: 'ftp',
      flag: 'SF',
      src_bytes: 145,
      dst_bytes: 382,
      duration: 1,
      count: 8,
      srv_count: 8,
      serror_rate: 0.0,
      same_srv_rate: 1.0,
      diff_srv_rate: 0.0,
      logged_in: 0,
      num_failed_logins: 4,
      dst_host_srv_count: 15
    }
  },
  {
    id: 'u2r_buffer_overflow',
    title: 'U2R (Buffer Overflow)',
    description: 'Privilege escalation exploiting local daemon memory corruption to spawn an unauthorized root shell.',
    expected: 'U2R',
    data: {
      protocol_type: 'tcp',
      service: 'telnet',
      flag: 'SF',
      src_bytes: 2840,
      dst_bytes: 14200,
      duration: 12,
      count: 1,
      srv_count: 1,
      serror_rate: 0.0,
      same_srv_rate: 1.0,
      diff_srv_rate: 0.0,
      logged_in: 1,
      root_shell: 1,
      hot: 4,
      su_attempted: 1,
      num_failed_logins: 0,
      dst_host_srv_count: 8
    }
  },
  {
    id: 'unseen_apache2_dos',
    title: 'Zero-Day (Apache2 Flood)',
    description: 'Novel DoS exploit from KDDTest+ that was completely held out during training to test generalization.',
    expected: 'DoS',
    data: {
      protocol_type: 'tcp',
      service: 'http',
      flag: 'SF',
      src_bytes: 180,
      dst_bytes: 0,
      duration: 0,
      count: 185,
      srv_count: 185,
      serror_rate: 0.02,
      same_srv_rate: 1.0,
      diff_srv_rate: 0.0,
      logged_in: 0,
      num_failed_logins: 0,
      dst_host_srv_count: 22
    }
  }
];

function AppContent() {
  const [currentView, setCurrentView] = useState<'landing' | 'dashboard' | 'manual' | 'batch' | 'explainability' | 'history'>('landing');
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [presets, setPresets] = useState<TrafficPreset[]>(DEFAULT_PRESETS);
  const [sampleBatch, setSampleBatch] = useState<any[]>([]);

  // Form State
  const [features, setFeatures] = useState<Record<string, any>>({
    protocol_type: 'tcp',
    service: 'http',
    flag: 'SF',
    src_bytes: 232,
    dst_bytes: 8153,
    duration: 0,
    count: 3,
    srv_count: 3,
    serror_rate: 0.0,
    same_srv_rate: 1.0,
    diff_srv_rate: 0.0,
    logged_in: 1,
    num_failed_logins: 0,
    root_shell: 0,
    hot: 0,
    su_attempted: 0,
    dst_host_srv_count: 255
  });

  // Inference state
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [lastPrediction, setLastPrediction] = useState<PredictionResult | null>(null);
  const [showResultView, setShowResultView] = useState<boolean>(false);
  const [manualError, setManualError] = useState<string | null>(null);

  // Batch state
  const [batchLoading, setBatchLoading] = useState<boolean>(false);
  const [batchResults, setBatchResults] = useState<BatchPredictionResponse | null>(null);
  const [batchError, setBatchError] = useState<string | null>(null);

  // Initial Health & Preset fetch
  useEffect(() => {
    // 1. Fetch real health status from backend
    fetch('/api/health')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setSystemHealth(data);
      })
      .catch((err) => console.warn('Health check issue:', err));

    // 2. Fetch presets & sample batch from server
    fetch('/api/sample-data')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.presets && Array.isArray(data.presets)) {
          setPresets(data.presets);
        }
        if (data?.sample_batch && Array.isArray(data.sample_batch)) {
          setSampleBatch(data.sample_batch);
        }
      })
      .catch((err) => console.warn('Using local fallback sample data:', err));
  }, []);

  const handleAnalyzeManual = async () => {
    setIsLoading(true);
    setManualError(null);
    try {
      const res = await fetch('/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(features)
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.detail || 'Inference failed');
      }

      const data: PredictionResult = await res.json();
      setLastPrediction(data);
      setShowResultView(true);
    } catch (err: any) {
      setManualError(err.message || 'Failed to communicate with classification model.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnalyzeBatch = async (records: any[]) => {
    setBatchLoading(true);
    setBatchError(null);
    try {
      const res = await fetch('/api/batch-predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ records })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.detail || 'Batch analysis failed');
      }

      const data: BatchPredictionResponse = await res.json();
      setBatchResults(data);
    } catch (err: any) {
      setBatchError(err.message || 'Failed to process batch traffic.');
    } finally {
      setBatchLoading(false);
    }
  };

  const handleResetManual = () => {
    setShowResultView(false);
    setManualError(null);
    setFeatures({
      protocol_type: 'tcp',
      service: 'http',
      flag: 'SF',
      src_bytes: 232,
      dst_bytes: 8153,
      duration: 0,
      count: 3,
      srv_count: 3,
      serror_rate: 0.0,
      same_srv_rate: 1.0,
      diff_srv_rate: 0.0,
      logged_in: 1,
      num_failed_logins: 0,
      root_shell: 0,
      hot: 0,
      su_attempted: 0,
      dst_host_srv_count: 255
    });
  };

  const handleResetBatch = () => {
    setBatchResults(null);
    setBatchError(null);
  };

  return (
    <div className="relative min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans selection:bg-cyan-500/20 selection:text-cyan-200">
      {/* Dynamic Futuristic Animated Cyber Background */}
      <CyberBackground />

      {/* Top Navigation */}
      <Navbar
        currentView={currentView}
        onNavigate={(view) => {
          setCurrentView(view);
          if (view === 'manual') setShowResultView(false);
        }}
        systemHealth={systemHealth}
      />

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {currentView === 'landing' && (
          <LandingPage
            onStartAnalysis={() => {
              setCurrentView('manual');
              setShowResultView(false);
            }}
            onExploreDetection={() => setCurrentView('dashboard')}
            systemHealth={systemHealth}
          />
        )}

        {currentView === 'dashboard' && (
          <DashboardOverview
            systemHealth={systemHealth}
            lastPrediction={lastPrediction}
            batchResults={batchResults}
            onNavigate={(view) => {
              setCurrentView(view);
              if (view === 'manual') setShowResultView(false);
            }}
          />
        )}

        {currentView === 'manual' && (
          showResultView && lastPrediction ? (
            <PredictionResultView
              result={lastPrediction}
              flowFeatures={features}
              onReset={handleResetManual}
              onViewExplainability={() => setCurrentView('explainability')}
              onViewHistory={() => setCurrentView('history')}
            />
          ) : (
            <ManualAnalyzer
              presets={presets}
              features={features}
              setFeatures={setFeatures}
              onAnalyze={handleAnalyzeManual}
              isLoading={isLoading}
              error={manualError}
            />
          )
        )}

        {currentView === 'batch' && (
          <BatchAnalyzer
            sampleBatch={sampleBatch}
            onAnalyzeBatch={handleAnalyzeBatch}
            batchResults={batchResults}
            onResetBatch={handleResetBatch}
            isLoading={batchLoading}
            error={batchError}
          />
        )}

        {currentView === 'explainability' && (
          <ExplainabilityView
            lastPrediction={lastPrediction}
            onNavigateToAnalyze={() => {
              setCurrentView('manual');
              setShowResultView(false);
            }}
          />
        )}

        {currentView === 'history' && (
          <HistoryView
            onLoadScanToAnalyzer={(loadedFeatures) => {
              setFeatures(loadedFeatures);
              setCurrentView('manual');
              setShowResultView(false);
            }}
            onNavigateToBatch={() => setCurrentView('batch')}
          />
        )}
      </main>

      {/* Clean, Minimal Production Footer */}
      <footer className="relative z-10 border-t border-neutral-900 bg-neutral-950/80 backdrop-blur-md py-6 text-xs text-neutral-500">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-neutral-300">NIDS Platform</span>
            <span>·</span>
            <span className="text-neutral-500">AI-Powered Network Security Intelligence</span>
          </div>

          <div className="flex items-center gap-3 font-mono text-[11px] text-neutral-500">
            <span>PyTorch 2.2</span>
            <span>·</span>
            <span>Firebase Firestore & Auth</span>
            <span>·</span>
            <span>SHAP Engine</span>
            <span>·</span>
            <span className="text-emerald-500/80">Operational</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
