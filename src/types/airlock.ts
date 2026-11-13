/**
 * AIRLOCK STUDIO - CORE TYPE CONTRACTS
 * Zero-Trust System Architecture Canvas & Hybrid-AI Prototype Compiler
 */

import type { ExcalidrawElement } from '@excalidraw/excalidraw/types/element/types';
import type { AppState } from '@excalidraw/excalidraw/types/types';

/**
 * Firebase AI Logic Inference Mode
 */
export type InferenceMode = 'PREFER_ON_DEVICE' | 'ONLY_ON_DEVICE' | 'PREFER_IN_CLOUD';

/**
 * Inference execution location reported by Firebase AI Logic
 */
export type InferenceSource = 'ON_DEVICE' | 'IN_CLOUD' | 'UNKNOWN';

/**
 * On-device Gemini Nano hardware availability status
 */
export interface NanoHardwareStatus {
  status: 'READY' | 'DOWNLOADABLE' | 'UNAVAILABLE' | 'NOT_SUPPORTED';
  detail: string;
  timestamp: number;
}

/**
 * Routing policy for hybrid AI operations
 */
export interface RoutingPolicy {
  mode: InferenceMode;
  strictOnDevice: boolean;
  allowCloudFallback: boolean;
}

/**
 * Real-time telemetry record for every AI operation
 */
export interface TelemetryRecord {
  id: string;
  timestamp: number;
  operation: string;
  inferenceMode: InferenceMode;
  inferenceSource: InferenceSource;
  latencyMs: number;
  tokensUsed?: number;
  success: boolean;
  error?: string;
}

/**
 * Sensitive data vault entry (browser RAM only - never transmitted)
 */
export interface AirlockVaultEntry {
  id: string;
  placeholder: string;
  realValue: string;
  category: 'DATABASE_URI' | 'API_KEY' | 'IP_ADDRESS' | 'PII' | 'SECRET' | 'OTHER';
  nodeId: string;
  detectedAt: number;
  confidence: number;
}

/**
 * Extracted graph node from canvas
 */
export interface BlueprintNode {
  id: string;
  label: string;
  type: 'SERVICE' | 'DATABASE' | 'GATEWAY' | 'CLIENT' | 'EXTERNAL' | 'NOTE' | 'OTHER';
  x: number;
  y: number;
  width: number;
  height: number;
  containsSecret: boolean;
  originalText?: string;
  redactedText?: string;
}

/**
 * Extracted directed edge/arrow from canvas
 */
export interface BlueprintEdge {
  id: string;
  from: string;
  to: string;
  label?: string;
  encrypted: boolean;
  authenticated: boolean;
}

/**
 * Extracted blueprint topology for AI analysis
 */
export interface BlueprintTopology {
  nodes: BlueprintNode[];
  edges: BlueprintEdge[];
  clusters: NodeClusterGroup[];
}

/**
 * Semantic node grouping/layer (e.g., INGESTION, CORE_SERVICES, DATA_STORE)
 */
export interface NodeClusterGroup {
  id: string;
  label: string;
  layer: 'INGESTION' | 'CORE_SERVICES' | 'DATA_STORE' | 'SECURITY' | 'EXTERNAL' | 'OTHER';
  nodeIds: string[];
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Zero-trust security or SPOF audit finding
 */
export interface ArchitectureAuditFinding {
  id: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
  category: 'SPOF' | 'UNENCRYPTED_CONNECTION' | 'MISSING_AUTH' | 'EXPOSED_SECRET' | 'OTHER';
  title: string;
  description: string;
  affectedNodeIds: string[];
  recommendation: string;
}

/**
 * Complete compiled prototype bundle from cloud Gemini
 */
export interface CompiledPrototypeBundle {
  interactiveHtmlPreview: string;
  backendSchemaSql: string;
  envTemplate: string;
  architecturalNotes: string;
  generatedAt: number;
  modelUsed: string;
}

/**
 * Sanitized payload sent to cloud (zero secrets)
 */
export interface SanitizedBlueprintPayload {
  topology: BlueprintTopology;
  redactedCanvasSnapshot: string;
  auditFindings: ArchitectureAuditFinding[];
  metadata: {
    nodeCount: number;
    edgeCount: number;
    secretsRedacted: number;
    timestamp: number;
  };
}

/**
 * Saved blueprint board (persisted to Firestore + local export)
 */
export interface SavedBlueprintBoard {
  id: string;
  title: string;
  description: string;
  elements: readonly ExcalidrawElement[];
  appState: Partial<AppState>;
  sanitizedTopology?: BlueprintTopology;
  auditFindings?: ArchitectureAuditFinding[];
  compiledBundle?: CompiledPrototypeBundle;
  createdAt: number;
  updatedAt: number;
  userId?: string;
}

/**
 * Canvas view mode toggle
 */
export type CanvasViewMode = 'REAL_LOCAL_TEXT' | 'REDACTED_PLACEHOLDER_TEXT';

/**
 * Mermaid diagram generation schema
 */
export interface GeneratedMermaidDiagram {
  mermaidSyntax: string;
  title: string;
  description: string;
}

/**
 * Auto-clustering result
 */
export interface ClusteringResult {
  clusters: NodeClusterGroup[];
  suggestedLayout: Array<{
    nodeId: string;
    x: number;
    y: number;
  }>;
  reasoning: string;
}

/**
 * Local privacy airlock scan result
 */
export interface AirlockScanResult {
  vaultEntries: AirlockVaultEntry[];
  affectedNodeIds: string[];
  redactionSummary: string;
  scanCompletedAt: number;
}

/**
 * Benchmark test execution result
 */
export interface BenchmarkResult {
  taskId: string;
  taskName: string;
  inferenceMode: InferenceMode;
  inferenceSource: InferenceSource;
  latencyMs: number;
  success: boolean;
  error?: string;
  timestamp: number;
}

/**
 * Complete benchmark report
 */
export interface BenchmarkReport {
  runId: string;
  startedAt: number;
  completedAt: number;
  totalDurationMs: number;
  results: BenchmarkResult[];
  summary: {
    onDeviceCount: number;
    inCloudCount: number;
    avgOnDeviceLatency: number;
    avgInCloudLatency: number;
    successRate: number;
  };
}
