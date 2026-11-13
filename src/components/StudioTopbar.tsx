/**
 * AIRLOCK STUDIO - TOP SYSTEM & TELEMETRY BAR
 * Brand badge, board title, network status, Nano hardware probe, inference mode toggle, live counters
 */

import { useEffect, useState } from 'react';
import { Lock, Wifi, WifiOff, Cpu, Cloud, Shield, Zap, Clock } from 'lucide-react';
import type { InferenceMode, NanoHardwareStatus } from '../types/airlock';
import { probeNanoHardware, getTelemetryRecords } from '../services/hybridAiEngine';
import { getFirestoreNetworkStatus, subscribeToNetworkStatus } from '../services/boardPersistenceService';

interface StudioTopbarProps {
  boardTitle: string;
  inferenceMode: InferenceMode;
  onInferenceModeChange: (mode: InferenceMode) => void;
  canvasViewMode: 'REAL_LOCAL_TEXT' | 'REDACTED_PLACEHOLDER_TEXT';
  onCanvasViewModeToggle: () => void;
  secretsRedacted: number;
}

export function StudioTopbar({
  boardTitle,
  inferenceMode,
  onInferenceModeChange,
  canvasViewMode,
  onCanvasViewModeToggle,
  secretsRedacted,
}: StudioTopbarProps) {
  const [networkStatus, setNetworkStatus] = useState<'online' | 'offline'>(getFirestoreNetworkStatus() === 'offline' ? 'offline' : 'online');
  const [nanoStatus, setNanoStatus] = useState<NanoHardwareStatus | null>(null);
  const [telemetryStats, setTelemetryStats] = useState({ onDevice: 0, inCloud: 0, avgLatency: 0 });

  // Probe Gemini Nano hardware on mount
  useEffect(() => {
    probeNanoHardware()
      .then(setNanoStatus)
      .catch((error) => {
        console.error('Nano probe failed:', error);
        setNanoStatus({
          status: 'UNAVAILABLE',
          detail: 'Probe failed',
          timestamp: Date.now(),
        });
      });
  }, []);

  // Subscribe to network status changes
  useEffect(() => {
    const unsubscribe = subscribeToNetworkStatus(setNetworkStatus);
    return unsubscribe;
  }, []);

  // Update telemetry stats every 2 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      const records = getTelemetryRecords();
      const onDevice = records.filter((r) => r.inferenceSource === 'ON_DEVICE').length;
      const inCloud = records.filter((r) => r.inferenceSource === 'IN_CLOUD').length;
      const avgLatency = records.length > 0 ? Math.round(records.reduce((sum, r) => sum + r.latencyMs, 0) / records.length) : 0;
      setTelemetryStats({ onDevice, inCloud, avgLatency });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-12 flex items-center justify-between px-4 bg-zinc-900 border-b border-zinc-800">
      {/* Left: Brand Badge + Board Title */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Lock className="w-5 h-5 text-emerald-500" />
          <span className="text-sm font-semibold text-zinc-100">Airlock Studio</span>
        </div>
        <div className="h-4 w-px bg-zinc-700" />
        <span className="text-sm text-zinc-400 max-w-xs truncate">{boardTitle}</span>
      </div>

      {/* Right: System Telemetry & Controls */}
      <div className="flex items-center gap-3 text-xs">
        {/* Firestore Network Status */}
        <div className="flex items-center gap-1.5">
          {networkStatus === 'online' ? (
            <>
              <Wifi className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-zinc-400">Firestore Online</span>
            </>
          ) : (
            <>
              <WifiOff className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-amber-500">Offline Mode</span>
            </>
          )}
        </div>

        <div className="h-4 w-px bg-zinc-700" />

        {/* Gemini Nano Hardware Status */}
        <div className="flex items-center gap-1.5">
          <Cpu className="w-3.5 h-3.5 text-blue-500" />
          <span className="text-zinc-400">
            Nano:{' '}
            {nanoStatus ? (
              <span
                className={
                  nanoStatus.status === 'READY'
                    ? 'text-emerald-500'
                    : nanoStatus.status === 'DOWNLOADABLE'
                    ? 'text-amber-500'
                    : 'text-red-500'
                }
              >
                {nanoStatus.status}
              </span>
            ) : (
              <span className="text-zinc-500">Probing...</span>
            )}
          </span>
        </div>

        <div className="h-4 w-px bg-zinc-700" />

        {/* Inference Mode Toggle */}
        <div className="flex items-center gap-2">
          <label className="text-zinc-400">Inference:</label>
          <select
            value={inferenceMode}
            onChange={(e) => onInferenceModeChange(e.target.value as InferenceMode)}
            className="bg-zinc-800 border border-zinc-700 rounded px-2 py-0.5 text-zinc-100 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="PREFER_ON_DEVICE">Prefer On-Device</option>
            <option value="ONLY_ON_DEVICE">Only On-Device</option>
          </select>
        </div>

        <div className="h-4 w-px bg-zinc-700" />

        {/* Canvas View Mode Toggle */}
        <button
          onClick={onCanvasViewModeToggle}
          className="flex items-center gap-1.5 px-2 py-1 rounded bg-zinc-800 border border-zinc-700 hover:border-zinc-600 transition-colors"
          title={canvasViewMode === 'REAL_LOCAL_TEXT' ? 'Switch to Redacted View' : 'Switch to Real Text View'}
        >
          <Shield className="w-3.5 h-3.5 text-amber-500" />
          <span className="text-zinc-400">{canvasViewMode === 'REAL_LOCAL_TEXT' ? 'Real Text' : 'Redacted'}</span>
        </button>

        <div className="h-4 w-px bg-zinc-700" />

        {/* Live Telemetry Counters */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5" title="On-Device Inference Count">
            <Cpu className="w-3.5 h-3.5 text-emerald-500" />
            <span className="text-emerald-500 font-mono">{telemetryStats.onDevice}</span>
          </div>

          <div className="flex items-center gap-1.5" title="In-Cloud Inference Count">
            <Cloud className="w-3.5 h-3.5 text-blue-500" />
            <span className="text-blue-500 font-mono">{telemetryStats.inCloud}</span>
          </div>

          <div className="flex items-center gap-1.5" title="Secrets Redacted Locally">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-amber-500 font-mono">{secretsRedacted}</span>
          </div>

          <div className="flex items-center gap-1.5" title="Average Latency">
            <Clock className="w-3.5 h-3.5 text-zinc-500" />
            <span className="text-zinc-400 font-mono">{telemetryStats.avgLatency}ms</span>
          </div>
        </div>
      </div>
    </div>
  );
}
