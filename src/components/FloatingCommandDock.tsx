/**
 * AIRLOCK STUDIO - FLOATING HYBRID COMMAND DOCK
 * Raycast-style command input + 1-click local Gemini Nano actions
 */

import { useState } from 'react';
import { Terminal, Wand2, Layers, Shield, Sparkles, Loader2 } from 'lucide-react';

interface FloatingCommandDockProps {
  onGenerateDiagram: (description: string) => Promise<void>;
  onClusterNotes: () => Promise<void>;
  onRunAirlockScan: () => Promise<void>;
  onAuditArchitecture: () => Promise<void>;
  disabled?: boolean;
}

export function FloatingCommandDock({
  onGenerateDiagram,
  onClusterNotes,
  onRunAirlockScan,
  onAuditArchitecture,
  disabled = false,
}: FloatingCommandDockProps) {
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeCommand, setActiveCommand] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!input.trim() || isProcessing || disabled) return;

    setIsProcessing(true);
    setActiveCommand('generate');
    try {
      await onGenerateDiagram(input);
      setInput('');
    } catch (error) {
      console.error('Generate diagram failed:', error);
    } finally {
      setIsProcessing(false);
      setActiveCommand(null);
    }
  };

  const handleQuickAction = async (action: () => Promise<void>, commandName: string) => {
    if (isProcessing || disabled) return;

    setIsProcessing(true);
    setActiveCommand(commandName);
    try {
      await action();
    } catch (error) {
      console.error(`${commandName} failed:`, error);
    } finally {
      setIsProcessing(false);
      setActiveCommand(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleGenerate();
    }
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      <div className="airlock-command-dock-shadow rounded-xl bg-zinc-900/95 backdrop-blur-xl border border-zinc-800">
        {/* Command Input */}
        <div className="flex items-center gap-3 p-3 border-b border-zinc-800">
          <Terminal className="w-4 h-4 text-zinc-400 flex-shrink-0" />
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe system architecture (e.g., 'e-commerce platform with microservices')..."
            disabled={isProcessing || disabled}
            className="flex-1 bg-transparent border-none outline-none text-sm text-zinc-100 placeholder-zinc-600 min-w-[400px]"
          />
          <button
            onClick={handleGenerate}
            disabled={!input.trim() || isProcessing || disabled}
            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white text-sm font-medium transition-colors flex items-center gap-1.5"
          >
            {isProcessing && activeCommand === 'generate' ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <Wand2 className="w-3.5 h-3.5" />
                <span>Generate</span>
              </>
            )}
          </button>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2 p-2">
          <span className="text-xs text-zinc-600 px-2">Quick Actions:</span>

          <button
            onClick={() => handleQuickAction(onClusterNotes, 'cluster')}
            disabled={isProcessing || disabled}
            className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:bg-zinc-900 disabled:text-zinc-700 border border-zinc-700 hover:border-blue-500/50 text-zinc-300 text-xs font-medium transition-all flex items-center gap-1.5"
            title="AI-powered semantic clustering of messy notes into architecture layers"
          >
            {isProcessing && activeCommand === 'cluster' ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Layers className="w-3.5 h-3.5" />
            )}
            <span>Cluster Notes</span>
          </button>

          <button
            onClick={() => handleQuickAction(onRunAirlockScan, 'airlock')}
            disabled={isProcessing || disabled}
            className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:bg-zinc-900 disabled:text-zinc-700 border border-zinc-700 hover:border-amber-500/50 text-zinc-300 text-xs font-medium transition-all flex items-center gap-1.5"
            title="Scan canvas locally for secrets, credentials, and PII"
          >
            {isProcessing && activeCommand === 'airlock' ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Shield className="w-3.5 h-3.5 text-amber-500" />
            )}
            <span>Airlock Scan</span>
          </button>

          <button
            onClick={() => handleQuickAction(onAuditArchitecture, 'audit')}
            disabled={isProcessing || disabled}
            className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:bg-zinc-900 disabled:text-zinc-700 border border-zinc-700 hover:border-red-500/50 text-zinc-300 text-xs font-medium transition-all flex items-center gap-1.5"
            title="Detect SPOFs and zero-trust security issues"
          >
            {isProcessing && activeCommand === 'audit' ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 text-red-500" />
            )}
            <span>Audit Security</span>
          </button>
        </div>

        {/* Status Hint */}
        {isProcessing && (
          <div className="px-3 pb-2">
            <div className="text-xs text-emerald-500 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>
                {activeCommand === 'generate'
                  ? 'Generating Mermaid diagram with Gemini Nano...'
                  : activeCommand === 'cluster'
                  ? 'Clustering notes into semantic layers...'
                  : activeCommand === 'airlock'
                  ? 'Scanning canvas for secrets locally...'
                  : 'Analyzing architecture for SPOFs...'}
              </span>
            </div>
          </div>
        )}

        {disabled && (
          <div className="px-3 pb-2">
            <div className="text-xs text-amber-500 flex items-center gap-2">
              <Shield className="w-3.5 h-3.5" />
              <span>Initialize Firebase AI Logic to enable commands</span>
            </div>
          </div>
        )}
      </div>

      {/* Keyboard Hint */}
      <div className="text-center mt-2">
        <span className="text-xs text-zinc-600">
          Press <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 font-mono">Enter</kbd> to generate
        </span>
      </div>
    </div>
  );
}
