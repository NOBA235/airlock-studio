/**
 * AIRLOCK STUDIO - LEFT PRESET & SECRET VAULT RAIL
 * 3 architecture presets + local secret vault browser
 */

import { useState } from 'react';
import { Layout, FolderKanban, Shield, ChevronDown, ChevronRight, Eye, EyeOff } from 'lucide-react';
import { getAllPresets } from '../fixtures/blueprintPresets';
import type { AirlockVaultEntry } from '../types/airlock';

interface LeftPresetAndVaultRailProps {
  onPresetSelect: (presetId: string) => void;
  vaultEntries: AirlockVaultEntry[];
}

export function LeftPresetAndVaultRail({ onPresetSelect, vaultEntries }: LeftPresetAndVaultRailProps) {
  const [expandedVault, setExpandedVault] = useState(false);
  const [revealedSecrets, setRevealedSecrets] = useState<Set<string>>(new Set());

  const presets = getAllPresets();

  const toggleSecretReveal = (vaultId: string) => {
    setRevealedSecrets((prev) => {
      const next = new Set(prev);
      if (next.has(vaultId)) {
        next.delete(vaultId);
      } else {
        next.add(vaultId);
      }
      return next;
    });
  };

  return (
    <div className="w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col overflow-hidden">
      {/* Presets Section */}
      <div className="p-3 border-b border-zinc-800">
        <div className="flex items-center gap-2 mb-3">
          <Layout className="w-4 h-4 text-zinc-400" />
          <h2 className="text-xs font-semibold text-zinc-100 uppercase tracking-wide">Architecture Presets</h2>
        </div>

        <div className="space-y-2">
          {presets.map((preset) => (
            <button
              key={preset.id}
              onClick={() => onPresetSelect(preset.id)}
              className="w-full text-left p-3 rounded-lg bg-zinc-800 border border-zinc-700 hover:border-emerald-500 hover:bg-zinc-800/80 transition-all group"
            >
              <div className="flex items-start gap-2">
                <FolderKanban className="w-4 h-4 text-zinc-400 group-hover:text-emerald-500 transition-colors mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-zinc-100 group-hover:text-emerald-500 transition-colors">
                    {preset.name}
                  </div>
                  <div className="text-xs text-zinc-500 mt-1 line-clamp-2">{preset.description}</div>
                  <div className="text-xs text-zinc-600 mt-1.5 font-mono">{preset.category}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Local Secret Vault Section */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-3">
          <button
            onClick={() => setExpandedVault(!expandedVault)}
            className="w-full flex items-center gap-2 mb-2 text-left hover:bg-zinc-800/50 rounded px-2 py-1.5 transition-colors"
          >
            {expandedVault ? (
              <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
            )}
            <Shield className="w-4 h-4 text-amber-500" />
            <h2 className="text-xs font-semibold text-zinc-100 uppercase tracking-wide">Local Vault</h2>
            <span className="ml-auto text-xs text-zinc-500 font-mono">{vaultEntries.length}</span>
          </button>

          {expandedVault && (
            <div className="space-y-2 mt-2">
              {vaultEntries.length === 0 ? (
                <div className="text-xs text-zinc-500 px-2 py-4 text-center">
                  No secrets detected yet.
                  <br />
                  Run Airlock Scan to detect credentials.
                </div>
              ) : (
                vaultEntries.map((vault) => {
                  const isRevealed = revealedSecrets.has(vault.id);

                  return (
                    <div
                      key={vault.id}
                      className="p-2.5 rounded-lg bg-zinc-800 border border-zinc-700 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-2 h-2 rounded-full ${
                              vault.category === 'DATABASE_URI'
                                ? 'bg-red-500'
                                : vault.category === 'API_KEY'
                                ? 'bg-amber-500'
                                : vault.category === 'PII'
                                ? 'bg-pink-500'
                                : 'bg-zinc-500'
                            }`}
                          />
                          <span className="text-xs font-medium text-zinc-400">{vault.category.replace('_', ' ')}</span>
                        </div>
                        <button
                          onClick={() => toggleSecretReveal(vault.id)}
                          className="p-1 rounded hover:bg-zinc-700 transition-colors"
                          title={isRevealed ? 'Hide real value' : 'Reveal real value'}
                        >
                          {isRevealed ? (
                            <EyeOff className="w-3.5 h-3.5 text-zinc-500" />
                          ) : (
                            <Eye className="w-3.5 h-3.5 text-zinc-500" />
                          )}
                        </button>
                      </div>

                      <div className="space-y-1">
                        <div className="text-xs text-zinc-600">Placeholder:</div>
                        <code className="block text-xs font-mono text-amber-500 bg-zinc-900 px-2 py-1 rounded border border-zinc-700 truncate">
                          {vault.placeholder}
                        </code>
                      </div>

                      {isRevealed && (
                        <div className="space-y-1">
                          <div className="text-xs text-zinc-600">Real Value (Browser RAM Only):</div>
                          <code className="block text-xs font-mono text-red-400 bg-zinc-900 px-2 py-1 rounded border border-red-900/50 break-all">
                            {vault.realValue}
                          </code>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-1 border-t border-zinc-700">
                        <span className="text-xs text-zinc-600">Confidence</span>
                        <span className="text-xs font-mono text-emerald-500">{Math.round(vault.confidence * 100)}%</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-zinc-800 bg-zinc-900/50">
        <div className="text-xs text-zinc-600">
          <Shield className="w-3.5 h-3.5 inline-block mr-1 text-amber-500" />
          Secrets stored in browser RAM only
        </div>
        <div className="text-xs text-zinc-700 mt-1">Never transmitted or persisted</div>
      </div>
    </div>
  );
}
