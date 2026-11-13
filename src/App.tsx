/**
 * AIRLOCK STUDIO - MAIN APPLICATION
 * Zero-Trust System Architecture Canvas & Hybrid-AI Prototype Compiler
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Excalidraw } from '@excalidraw/excalidraw';
import type { ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types/types';
import type { ExcalidrawElement } from '@excalidraw/excalidraw/types/element/types';
import { StudioTopbar } from './components/StudioTopbar';
import { LeftPresetAndVaultRail } from './components/LeftPresetAndVaultRail';
import { FloatingCommandDock } from './components/FloatingCommandDock';
import { getAllPresets } from './fixtures/blueprintPresets';
import {
  generateBlueprintMermaid,
  clusterBlueprintNotes,
  auditBlueprintLocally,
  scanCanvasPrivacyAirlock,
} from './services/hybridAiEngine';
import {
  convertMermaidToBlueprintElements,
  extractBlueprintTopology,
  toggleCanvasRedaction,
} from './services/blueprintSceneService';
import { createBlankBoard, scheduleAutoSave } from './services/boardPersistenceService';
import { ai, aiInitError } from './config/firebase';
import type {
  InferenceMode,
  CanvasViewMode,
  AirlockVaultEntry,
  SavedBlueprintBoard,
  ArchitectureAuditFinding,
} from './types/airlock';

export default function App() {
  // Excalidraw API ref
  const [excalidrawAPI, setExcalidrawAPI] = useState<ExcalidrawImperativeAPI | null>(null);

  // Board state
  const [currentBoard, setCurrentBoard] = useState<SavedBlueprintBoard>(
    createBlankBoard('Untitled Architecture', 'Start by loading a preset or describing your system')
  );

  // UI state
  const [inferenceMode, setInferenceMode] = useState<InferenceMode>('PREFER_ON_DEVICE');
  const [canvasViewMode, setCanvasViewMode] = useState<CanvasViewMode>('REAL_LOCAL_TEXT');
  const [vaultEntries, setVaultEntries] = useState<AirlockVaultEntry[]>([]);
  const [auditFindings, setAuditFindings] = useState<ArchitectureAuditFinding[]>([]);

  // Local vault map (browser RAM only - never persisted)
  const localVaultMapRef = useRef<Map<string, AirlockVaultEntry>>(new Map());

  // Check if AI is initialized
  const isAiReady = !aiInitError && !!ai;

  // Auto-save on board changes
  useEffect(() => {
    if (currentBoard.elements.length > 0) {
      scheduleAutoSave(currentBoard);
    }
  }, [currentBoard]);

  /**
   * Load preset
   */
  const handlePresetSelect = useCallback(
    (presetId: string) => {
      const presets = getAllPresets();
      const preset = presets.find((p) => p.id === presetId);

      if (!preset) {
        console.error('Preset not found:', presetId);
        return;
      }

      const board = preset.generator();
      setCurrentBoard(board);

      // Update Excalidraw canvas
      if (excalidrawAPI) {
        excalidrawAPI.updateScene({
          elements: board.elements,
          appState: board.appState,
        });
        excalidrawAPI.scrollToContent(board.elements as ExcalidrawElement[], {
          fitToContent: true,
        });
      }

      console.log(`✅ Loaded preset: ${board.title}`);
    },
    [excalidrawAPI]
  );

  /**
   * Generate diagram from natural language
   */
  const handleGenerateDiagram = useCallback(
    async (description: string) => {
      if (!isAiReady || !excalidrawAPI) {
        console.error('AI not ready or Excalidraw API not initialized');
        return;
      }

      try {
        // Generate Mermaid syntax
        const result = await generateBlueprintMermaid(description, inferenceMode);
        console.log('Generated Mermaid:', result.mermaidSyntax);

        // Convert to crisp Excalidraw elements
        const elements = await convertMermaidToBlueprintElements(result.mermaidSyntax);

        // Update canvas
        excalidrawAPI.updateScene({
          elements,
        });
        excalidrawAPI.scrollToContent(elements as ExcalidrawElement[], {
          fitToContent: true,
        });

        // Update board
        setCurrentBoard((prev) => ({
          ...prev,
          title: result.title,
          description: result.description,
          elements,
          updatedAt: Date.now(),
        }));

        console.log(`✅ Generated diagram: ${result.title}`);
      } catch (error) {
        console.error('Failed to generate diagram:', error);
        alert(`Failed to generate diagram: ${error instanceof Error ? error.message : String(error)}`);
      }
    },
    [isAiReady, excalidrawAPI, inferenceMode]
  );

  /**
   * Cluster messy notes into semantic layers
   */
  const handleClusterNotes = useCallback(async () => {
    if (!isAiReady || !excalidrawAPI) {
      console.error('AI not ready or Excalidraw API not initialized');
      return;
    }

    try {
      const elements = excalidrawAPI.getSceneElements();
      const topology = extractBlueprintTopology(elements);

      if (topology.nodes.length === 0) {
        alert('No nodes found on canvas. Add some architecture components first.');
        return;
      }

      const clusterResult = await clusterBlueprintNotes(topology.nodes, inferenceMode);
      console.log('Clustering result:', clusterResult);

      // Apply suggested layout
      const updatedElements = elements.map((element) => {
        const suggestion = clusterResult.suggestedLayout.find((s) => s.nodeId === element.id);
        if (suggestion) {
          return {
            ...element,
            x: suggestion.x,
            y: suggestion.y,
          };
        }
        return element;
      }) as unknown as ExcalidrawElement[];

      excalidrawAPI.updateScene({
        elements: updatedElements,
      });
      excalidrawAPI.scrollToContent(updatedElements, {
        fitToContent: true,
      });

      alert(`✅ Clustered ${topology.nodes.length} nodes into ${clusterResult.clusters.length} semantic layers.`);
    } catch (error) {
      console.error('Failed to cluster notes:', error);
      alert(`Failed to cluster notes: ${error instanceof Error ? error.message : String(error)}`);
    }
  }, [isAiReady, excalidrawAPI, inferenceMode]);

  /**
   * Run Airlock privacy scan
   */
  const handleRunAirlockScan = useCallback(async () => {
    if (!isAiReady || !excalidrawAPI) {
      console.error('AI not ready or Excalidraw API not initialized');
      return;
    }

    try {
      const elements = excalidrawAPI.getSceneElements();
      const topology = extractBlueprintTopology(elements);

      if (topology.nodes.length === 0) {
        alert('No nodes found on canvas. Add some architecture components first.');
        return;
      }

      const scanResult = await scanCanvasPrivacyAirlock(topology.nodes, inferenceMode);
      console.log('Airlock scan result:', scanResult);

      // Update vault
      setVaultEntries(scanResult.vaultEntries);
      localVaultMapRef.current.clear();
      scanResult.vaultEntries.forEach((entry) => {
        localVaultMapRef.current.set(entry.id, entry);
      });

      // Mark nodes as containing secrets
      const updatedTopology = {
        ...topology,
        nodes: topology.nodes.map((node) => ({
          ...node,
          containsSecret: scanResult.affectedNodeIds.includes(node.id),
        })),
      };

      setCurrentBoard((prev) => ({
        ...prev,
        sanitizedTopology: updatedTopology,
        updatedAt: Date.now(),
      }));

      alert(`✅ ${scanResult.redactionSummary}`);
    } catch (error) {
      console.error('Failed to run Airlock scan:', error);
      alert(`Failed to run Airlock scan: ${error instanceof Error ? error.message : String(error)}`);
    }
  }, [isAiReady, excalidrawAPI, inferenceMode]);

  /**
   * Audit architecture for SPOFs
   */
  const handleAuditArchitecture = useCallback(async () => {
    if (!isAiReady || !excalidrawAPI) {
      console.error('AI not ready or Excalidraw API not initialized');
      return;
    }

    try {
      const elements = excalidrawAPI.getSceneElements();
      const topology = extractBlueprintTopology(elements);

      if (topology.nodes.length === 0) {
        alert('No nodes found on canvas. Add some architecture components first.');
        return;
      }

      const findings = await auditBlueprintLocally(topology, inferenceMode);
      console.log('Audit findings:', findings);

      setAuditFindings(findings);
      setCurrentBoard((prev) => ({
        ...prev,
        auditFindings: findings,
        updatedAt: Date.now(),
      }));

      const critical = findings.filter((f) => f.severity === 'CRITICAL' || f.severity === 'HIGH').length;
      alert(`✅ Security audit complete: ${findings.length} findings (${critical} critical/high severity)`);
    } catch (error) {
      console.error('Failed to audit architecture:', error);
      alert(`Failed to audit architecture: ${error instanceof Error ? error.message : String(error)}`);
    }
  }, [isAiReady, excalidrawAPI, inferenceMode]);

  /**
   * Toggle canvas view mode (real vs redacted)
   */
  const handleCanvasViewModeToggle = useCallback(() => {
    if (!excalidrawAPI) return;

    const newMode: CanvasViewMode = canvasViewMode === 'REAL_LOCAL_TEXT' ? 'REDACTED_PLACEHOLDER_TEXT' : 'REAL_LOCAL_TEXT';
    setCanvasViewMode(newMode);

    const elements = excalidrawAPI.getSceneElements();
    const redactedElements = toggleCanvasRedaction(elements, vaultEntries, newMode);

    excalidrawAPI.updateScene({
      elements: redactedElements,
    });

    console.log(`Canvas view mode: ${newMode}`);
  }, [excalidrawAPI, canvasViewMode, vaultEntries]);

  return (
    <div className="w-full h-full flex flex-col bg-zinc-950">
      {/* Top System & Telemetry Bar */}
      <StudioTopbar
        boardTitle={currentBoard.title}
        inferenceMode={inferenceMode}
        onInferenceModeChange={setInferenceMode}
        canvasViewMode={canvasViewMode}
        onCanvasViewModeToggle={handleCanvasViewModeToggle}
        secretsRedacted={vaultEntries.length}
      />

      {/* Main Workbench */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Preset & Vault Rail */}
        <LeftPresetAndVaultRail onPresetSelect={handlePresetSelect} vaultEntries={vaultEntries} />

        {/* Center Blueprint Canvas */}
        <div className="flex-1 relative">
          <Excalidraw
            excalidrawAPI={(api) => setExcalidrawAPI(api)}
            theme="dark"
            initialData={{
              elements: currentBoard.elements,
              appState: {
                viewBackgroundColor: '#09090b',
                currentItemRoughness: 0,
                currentItemFontFamily: 3,
                currentItemStrokeWidth: 1.5,
                gridSize: 20,
              },
            }}
            UIOptions={{
              canvasActions: {
                changeViewBackgroundColor: false,
                clearCanvas: false,
                loadScene: false,
                saveToActiveFile: false,
                toggleTheme: false,
                saveAsImage: false,
                export: false,
              },
              tools: { image: true },
            }}
            renderTopRightUI={() => null}
            onChange={(elements) => {
              setCurrentBoard((prev) => ({
                ...prev,
                elements,
                updatedAt: Date.now(),
              }));
            }}
          />

          {/* Firebase AI Error Overlay */}
          {!isAiReady && (
            <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm flex items-center justify-center z-50">
              <div className="max-w-md p-6 bg-zinc-900 border border-red-500/50 rounded-xl space-y-4">
                <h2 className="text-lg font-semibold text-red-500">Firebase AI Logic Not Initialized</h2>
                <p className="text-sm text-zinc-400">{aiInitError?.message || 'Failed to initialize AI engine'}</p>
                <div className="text-xs text-zinc-600 space-y-1">
                  <p>1. Copy .env.example to .env.local</p>
                  <p>2. Configure your Firebase project credentials</p>
                  <p>3. Add your Gemini API key from https://aistudio.google.com/app/apikey</p>
                  <p>4. Reload the page</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Floating Command Dock */}
      <FloatingCommandDock
        onGenerateDiagram={handleGenerateDiagram}
        onClusterNotes={handleClusterNotes}
        onRunAirlockScan={handleRunAirlockScan}
        onAuditArchitecture={handleAuditArchitecture}
        disabled={!isAiReady}
      />
    </div>
  );
}
