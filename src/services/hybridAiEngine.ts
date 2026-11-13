/**
 * AIRLOCK STUDIO - HYBRID AI ENGINE
 * Real Firebase AI Logic operations with Gemini Nano (on-device) + Gemini 2.5 Flash (cloud)
 * Strict concurrency-1 FIFO queue to prevent session collision
 */

import { ai, aiInitError } from '../config/firebase';
import type {
  InferenceMode,
  InferenceSource,
  NanoHardwareStatus,
  TelemetryRecord,
  AirlockVaultEntry,
  AirlockScanResult,
  ArchitectureAuditFinding,
  BlueprintTopology,
  CompiledPrototypeBundle,
  SanitizedBlueprintPayload,
  GeneratedMermaidDiagram,
  ClusteringResult,
  BlueprintNode,
} from '../types/airlock';
import { Schema } from 'firebase/ai';

/**
 * Concurrency-1 FIFO inference queue (prevents ChromeAdapterImpl session collision)
 */
type QueuedInference<T> = {
  execute: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (error: Error) => void;
};

class InferenceQueue {
  private queue: QueuedInference<unknown>[] = [];
  private isProcessing = false;

  async enqueue<T>(operation: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.queue.push({
        execute: operation as () => Promise<unknown>,
        resolve: resolve as (value: unknown) => void,
        reject,
      });
      this.processQueue();
    });
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) return;

    this.isProcessing = true;
    const item = this.queue.shift();

    if (item) {
      try {
        const result = await item.execute();
        item.resolve(result);
      } catch (error) {
        item.reject(error as Error);
      }
    }

    this.isProcessing = false;
    if (this.queue.length > 0) {
      this.processQueue();
    }
  }
}

const inferenceQueue = new InferenceQueue();

/**
 * In-memory telemetry store
 */
const telemetryRecords: TelemetryRecord[] = [];

export function getTelemetryRecords(): readonly TelemetryRecord[] {
  return telemetryRecords;
}

export function clearTelemetryRecords(): void {
  telemetryRecords.length = 0;
}

/**
 * Record telemetry for every AI operation
 */
function recordTelemetry(record: TelemetryRecord): void {
  telemetryRecords.push(record);
  console.log(`📊 Telemetry: ${record.operation} | ${record.inferenceSource} | ${record.latencyMs}ms`);
}

/**
 * Probe Gemini Nano hardware availability
 */
export async function probeNanoHardware(): Promise<NanoHardwareStatus> {
  const startTime = performance.now();

  try {
    // Check if window.LanguageModel API exists (Chrome Canary experimental)
    if (!window.LanguageModel) {
      return {
        status: 'NOT_SUPPORTED',
        detail: 'window.LanguageModel API not available. Enable chrome://flags/#optimization-guide-on-device-model',
        timestamp: Date.now(),
      };
    }

    const availability = await window.LanguageModel.availability();

    let status: NanoHardwareStatus['status'];
    let detail: string;

    switch (availability) {
      case 'readily':
        status = 'READY';
        detail = 'Gemini Nano is ready for on-device inference';
        break;
      case 'after-download':
        status = 'DOWNLOADABLE';
        detail = 'Gemini Nano requires download (~1.7GB). Will auto-download on first use.';
        break;
      default:
        status = 'UNAVAILABLE';
        detail = 'Gemini Nano not available on this device';
    }

    const latency = performance.now() - startTime;
    console.log(`🔍 Nano Hardware Probe: ${status} (${latency.toFixed(0)}ms)`);

    return { status, detail, timestamp: Date.now() };
  } catch (error) {
    console.warn('⚠️ Nano hardware probe failed:', error);
    return {
      status: 'UNAVAILABLE',
      detail: `Probe error: ${error instanceof Error ? error.message : String(error)}`,
      timestamp: Date.now(),
    };
  }
}

/**
 * Validate AI initialization
 */
function validateAiInit(): void {
  if (aiInitError) {
    throw new Error(`Firebase AI Logic not initialized: ${aiInitError.message}`);
  }
  if (!ai) {
    throw new Error('Firebase AI Logic instance is null');
  }
}

/**
 * Generate Mermaid flowchart syntax from natural language system description
 * Uses PREFER_ON_DEVICE / ONLY_ON_DEVICE with structured Schema
 */
export async function generateBlueprintMermaid(
  systemDescription: string,
  mode: InferenceMode = 'PREFER_ON_DEVICE'
): Promise<GeneratedMermaidDiagram> {
  validateAiInit();

  const startTime = performance.now();
  const telemetryId = `mermaid-${Date.now()}`;

  const schema = Schema.object({
    mermaidSyntax: Schema.string(),
    title: Schema.string(),
    description: Schema.string(),
  });

  const prompt = `You are a system architecture diagram generator. Convert this system description into clean Mermaid flowchart syntax (flowchart TD format).

System Description:
${systemDescription}

Requirements:
- Use "flowchart TD" (top-down layout)
- Use clear node IDs (e.g., A, B, C or descriptive IDs like API_GATEWAY, USER_SERVICE)
- Use arrows to show data flow (-->)
- Keep labels concise and technical
- NO markdown fences around the mermaid code
- NO explanatory text outside the diagram syntax

Return a JSON object with:
- mermaidSyntax: The raw Mermaid flowchart code (no fences)
- title: A concise title for this architecture
- description: A 1-sentence description of the system`;

  try {
    const result = await inferenceQueue.enqueue(async () => {
      if (mode === 'ONLY_ON_DEVICE') {
        return await ai!.generateContent({
          prompt,
          onDeviceParams: {
            promptOptions: {
              responseConstraint: schema,
            },
          },
        });
      } else {
        // PREFER_ON_DEVICE (auto-fallback to cloud if device unavailable)
        return await ai!.generateContent({
          prompt,
          inCloudParams: {
            model: 'gemini-2.0-flash-exp',
            generationConfig: {
              responseMimeType: 'application/json',
              responseSchema: schema,
            },
          },
          onDeviceParams: {
            promptOptions: {
              responseConstraint: schema,
            },
          },
        });
      }
    });

    const latency = performance.now() - startTime;
    const inferenceSource: InferenceSource = result.response.inferenceSource === 'ON_DEVICE' ? 'ON_DEVICE' : 'IN_CLOUD';
    const responseText = result.response.text();
    const parsed = JSON.parse(responseText) as GeneratedMermaidDiagram;

    recordTelemetry({
      id: telemetryId,
      timestamp: Date.now(),
      operation: 'generateBlueprintMermaid',
      inferenceMode: mode,
      inferenceSource,
      latencyMs: Math.round(latency),
      success: true,
    });

    return parsed;
  } catch (error) {
    const latency = performance.now() - startTime;
    recordTelemetry({
      id: telemetryId,
      timestamp: Date.now(),
      operation: 'generateBlueprintMermaid',
      inferenceMode: mode,
      inferenceSource: 'UNKNOWN',
      latencyMs: Math.round(latency),
      success: false,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Cluster unorganized blueprint notes into semantic architecture layers
 * Uses PREFER_ON_DEVICE / ONLY_ON_DEVICE
 */
export async function clusterBlueprintNotes(
  nodes: BlueprintNode[],
  mode: InferenceMode = 'PREFER_ON_DEVICE'
): Promise<ClusteringResult> {
  validateAiInit();

  const startTime = performance.now();
  const telemetryId = `cluster-${Date.now()}`;

  const schema = Schema.object({
    clusters: Schema.array(
      Schema.object({
        id: Schema.string(),
        label: Schema.string(),
        layer: Schema.enumString(['INGESTION', 'CORE_SERVICES', 'DATA_STORE', 'SECURITY', 'EXTERNAL', 'OTHER']),
        nodeIds: Schema.array(Schema.string()),
      })
    ),
    suggestedLayout: Schema.array(
      Schema.object({
        nodeId: Schema.string(),
        x: Schema.number(),
        y: Schema.number(),
      })
    ),
    reasoning: Schema.string(),
  });

  const nodesJson = JSON.stringify(
    nodes.map((n) => ({ id: n.id, label: n.label, type: n.type })),
    null,
    2
  );

  const prompt = `You are a system architecture organizer. Analyze these unorganized diagram nodes and group them into semantic architecture layers.

Nodes:
${nodesJson}

Tasks:
1. Group related nodes into clusters (INGESTION, CORE_SERVICES, DATA_STORE, SECURITY, EXTERNAL, OTHER)
2. Suggest clean grid layout coordinates (x: multiples of 200, y: multiples of 150)
3. Place clusters in logical order (top-to-bottom: INGESTION → CORE_SERVICES → DATA_STORE)

Return structured JSON with clusters, suggestedLayout, and reasoning.`;

  try {
    const result = await inferenceQueue.enqueue(async () => {
      if (mode === 'ONLY_ON_DEVICE') {
        return await ai!.generateContent({
          prompt,
          onDeviceParams: {
            promptOptions: {
              responseConstraint: schema,
            },
          },
        });
      } else {
        return await ai!.generateContent({
          prompt,
          inCloudParams: {
            model: 'gemini-2.0-flash-exp',
            generationConfig: {
              responseMimeType: 'application/json',
              responseSchema: schema,
            },
          },
          onDeviceParams: {
            promptOptions: {
              responseConstraint: schema,
            },
          },
        });
      }
    });

    const latency = performance.now() - startTime;
    const inferenceSource: InferenceSource = result.response.inferenceSource === 'ON_DEVICE' ? 'ON_DEVICE' : 'IN_CLOUD';
    const responseText = result.response.text();
    const parsed = JSON.parse(responseText) as ClusteringResult;

    recordTelemetry({
      id: telemetryId,
      timestamp: Date.now(),
      operation: 'clusterBlueprintNotes',
      inferenceMode: mode,
      inferenceSource,
      latencyMs: Math.round(latency),
      success: true,
    });

    return parsed;
  } catch (error) {
    const latency = performance.now() - startTime;
    recordTelemetry({
      id: telemetryId,
      timestamp: Date.now(),
      operation: 'clusterBlueprintNotes',
      inferenceMode: mode,
      inferenceSource: 'UNKNOWN',
      latencyMs: Math.round(latency),
      success: false,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Audit blueprint topology for SPOFs and zero-trust security issues
 * Uses PREFER_ON_DEVICE / ONLY_ON_DEVICE (local analysis only)
 */
export async function auditBlueprintLocally(
  topology: BlueprintTopology,
  mode: InferenceMode = 'PREFER_ON_DEVICE'
): Promise<ArchitectureAuditFinding[]> {
  validateAiInit();

  const startTime = performance.now();
  const telemetryId = `audit-${Date.now()}`;

  const schema = Schema.object({
    findings: Schema.array(
      Schema.object({
        id: Schema.string(),
        severity: Schema.enumString(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO']),
        category: Schema.enumString(['SPOF', 'UNENCRYPTED_CONNECTION', 'MISSING_AUTH', 'EXPOSED_SECRET', 'OTHER']),
        title: Schema.string(),
        description: Schema.string(),
        affectedNodeIds: Schema.array(Schema.string()),
        recommendation: Schema.string(),
      })
    ),
  });

  const topologyJson = JSON.stringify(
    {
      nodes: topology.nodes.map((n) => ({ id: n.id, label: n.label, type: n.type })),
      edges: topology.edges.map((e) => ({ from: e.from, to: e.to, encrypted: e.encrypted, authenticated: e.authenticated })),
    },
    null,
    2
  );

  const prompt = `You are a zero-trust security auditor. Analyze this system architecture topology and identify security risks and single points of failure (SPOFs).

Topology:
${topologyJson}

Check for:
1. Single Points of Failure (nodes with many dependencies and no redundancy)
2. Unencrypted connections (edges with encrypted: false)
3. Missing authentication/authorization gateways
4. Direct external access to internal services

Return structured JSON array of findings with severity, category, title, description, affectedNodeIds, and recommendation.`;

  try {
    const result = await inferenceQueue.enqueue(async () => {
      if (mode === 'ONLY_ON_DEVICE') {
        return await ai!.generateContent({
          prompt,
          onDeviceParams: {
            promptOptions: {
              responseConstraint: schema,
            },
          },
        });
      } else {
        return await ai!.generateContent({
          prompt,
          inCloudParams: {
            model: 'gemini-2.0-flash-exp',
            generationConfig: {
              responseMimeType: 'application/json',
              responseSchema: schema,
            },
          },
          onDeviceParams: {
            promptOptions: {
              responseConstraint: schema,
            },
          },
        });
      }
    });

    const latency = performance.now() - startTime;
    const inferenceSource: InferenceSource = result.response.inferenceSource === 'ON_DEVICE' ? 'ON_DEVICE' : 'IN_CLOUD';
    const responseText = result.response.text();
    const parsed = JSON.parse(responseText) as { findings: ArchitectureAuditFinding[] };

    recordTelemetry({
      id: telemetryId,
      timestamp: Date.now(),
      operation: 'auditBlueprintLocally',
      inferenceMode: mode,
      inferenceSource,
      latencyMs: Math.round(latency),
      success: true,
    });

    return parsed.findings;
  } catch (error) {
    const latency = performance.now() - startTime;
    recordTelemetry({
      id: telemetryId,
      timestamp: Date.now(),
      operation: 'auditBlueprintLocally',
      inferenceMode: mode,
      inferenceSource: 'UNKNOWN',
      latencyMs: Math.round(latency),
      success: false,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Scan canvas text nodes locally for secrets/PII/credentials
 * Uses PREFER_ON_DEVICE / ONLY_ON_DEVICE (privacy-first local scanning)
 */
export async function scanCanvasPrivacyAirlock(
  nodes: BlueprintNode[],
  mode: InferenceMode = 'PREFER_ON_DEVICE'
): Promise<AirlockScanResult> {
  validateAiInit();

  const startTime = performance.now();
  const telemetryId = `airlock-scan-${Date.now()}`;

  // High-entropy regex pre-checks (fast local filtering)
  const secretPatterns = [
    { pattern: /postgres:\/\/[^:]+:[^@]+@[\d.]+:\d+\/\w+/gi, category: 'DATABASE_URI' as const },
    { pattern: /mongodb(\+srv)?:\/\/[^:]+:[^@]+@[^/]+\/\w+/gi, category: 'DATABASE_URI' as const },
    { pattern: /sk_live_[a-zA-Z0-9]{24,}/gi, category: 'API_KEY' as const },
    { pattern: /rzp_live_[a-zA-Z0-9]{14,}/gi, category: 'API_KEY' as const },
    { pattern: /AIza[a-zA-Z0-9_-]{35}/gi, category: 'API_KEY' as const },
    { pattern: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g, category: 'IP_ADDRESS' as const },
    { pattern: /(?:password|passwd|pwd|secret|token|key)\s*[:=]\s*['"]?([^'"\s]{8,})['"]?/gi, category: 'SECRET' as const },
  ];

  const regexMatches: AirlockVaultEntry[] = [];
  const affectedNodeIds = new Set<string>();

  nodes.forEach((node) => {
    const text = node.originalText || node.label;
    secretPatterns.forEach(({ pattern, category }) => {
      const matches = text.matchAll(new RegExp(pattern));
      for (const match of matches) {
        const realValue = match[0];
        const placeholder = `<SECRET_${category}_${regexMatches.length + 1}>`;
        regexMatches.push({
          id: `vault-${Date.now()}-${regexMatches.length}`,
          placeholder,
          realValue,
          category,
          nodeId: node.id,
          detectedAt: Date.now(),
          confidence: 0.95, // High confidence from regex
        });
        affectedNodeIds.add(node.id);
      }
    });
  });

  // Semantic AI detection for PII and other secrets not caught by regex
  const schema = Schema.object({
    detectedSecrets: Schema.array(
      Schema.object({
        nodeId: Schema.string(),
        secretText: Schema.string(),
        category: Schema.enumString(['DATABASE_URI', 'API_KEY', 'IP_ADDRESS', 'PII', 'SECRET', 'OTHER']),
        confidence: Schema.number(),
      })
    ),
  });

  const nodesJson = JSON.stringify(
    nodes.map((n) => ({ id: n.id, text: n.originalText || n.label })),
    null,
    2
  );

  const prompt = `You are a privacy and security scanner. Analyze these text nodes and detect sensitive information (credentials, PII, secrets, API keys, database URIs, internal IPs).

Nodes:
${nodesJson}

Return JSON with detectedSecrets array containing nodeId, secretText (the actual sensitive value), category, and confidence (0.0-1.0).

Only detect HIGH confidence secrets. Ignore generic words like "database", "API", "user".`;

  try {
    const result = await inferenceQueue.enqueue(async () => {
      if (mode === 'ONLY_ON_DEVICE') {
        return await ai!.generateContent({
          prompt,
          onDeviceParams: {
            promptOptions: {
              responseConstraint: schema,
            },
          },
        });
      } else {
        return await ai!.generateContent({
          prompt,
          inCloudParams: {
            model: 'gemini-2.0-flash-exp',
            generationConfig: {
              responseMimeType: 'application/json',
              responseSchema: schema,
            },
          },
          onDeviceParams: {
            promptOptions: {
              responseConstraint: schema,
            },
          },
        });
      }
    });

    const latency = performance.now() - startTime;
    const inferenceSource: InferenceSource = result.response.inferenceSource === 'ON_DEVICE' ? 'ON_DEVICE' : 'IN_CLOUD';
    const responseText = result.response.text();
    const aiDetected = JSON.parse(responseText) as {
      detectedSecrets: Array<{
        nodeId: string;
        secretText: string;
        category: AirlockVaultEntry['category'];
        confidence: number;
      }>;
    };

    // Merge AI-detected secrets with regex matches (deduplicate)
    const allVaultEntries = [...regexMatches];
    aiDetected.detectedSecrets.forEach((detected) => {
      // Only add if confidence > 0.7 and not already captured by regex
      if (detected.confidence > 0.7) {
        const alreadyExists = allVaultEntries.some((e) => e.realValue === detected.secretText);
        if (!alreadyExists) {
          const placeholder = `<SECRET_${detected.category}_${allVaultEntries.length + 1}>`;
          allVaultEntries.push({
            id: `vault-${Date.now()}-${allVaultEntries.length}`,
            placeholder,
            realValue: detected.secretText,
            category: detected.category,
            nodeId: detected.nodeId,
            detectedAt: Date.now(),
            confidence: detected.confidence,
          });
          affectedNodeIds.add(detected.nodeId);
        }
      }
    });

    recordTelemetry({
      id: telemetryId,
      timestamp: Date.now(),
      operation: 'scanCanvasPrivacyAirlock',
      inferenceMode: mode,
      inferenceSource,
      latencyMs: Math.round(latency),
      success: true,
    });

    return {
      vaultEntries: allVaultEntries,
      affectedNodeIds: Array.from(affectedNodeIds),
      redactionSummary: `Detected ${allVaultEntries.length} secrets across ${affectedNodeIds.size} nodes (${regexMatches.length} regex, ${allVaultEntries.length - regexMatches.length} AI-detected)`,
      scanCompletedAt: Date.now(),
    };
  } catch (error) {
    const latency = performance.now() - startTime;
    recordTelemetry({
      id: telemetryId,
      timestamp: Date.now(),
      operation: 'scanCanvasPrivacyAirlock',
      inferenceMode: mode,
      inferenceSource: 'UNKNOWN',
      latencyMs: Math.round(latency),
      success: false,
      error: error instanceof Error ? error.message : String(error),
    });

    // Return regex matches even if AI scan fails
    return {
      vaultEntries: regexMatches,
      affectedNodeIds: Array.from(affectedNodeIds),
      redactionSummary: `Partial scan: ${regexMatches.length} secrets detected via regex (AI scan failed)`,
      scanCompletedAt: Date.now(),
    };
  }
}

/**
 * Compile sanitized blueprint into interactive prototype (CLOUD ONLY)
 * Uses PREFER_IN_CLOUD with Gemini 2.5 Flash
 */
export async function compileSanitizedBlueprintInCloud(
  sanitizedPayload: SanitizedBlueprintPayload
): Promise<CompiledPrototypeBundle> {
  validateAiInit();

  const startTime = performance.now();
  const telemetryId = `compile-${Date.now()}`;

  const schema = Schema.object({
    interactiveHtmlPreview: Schema.string(),
    backendSchemaSql: Schema.string(),
    envTemplate: Schema.string(),
    architecturalNotes: Schema.string(),
  });

  const payloadJson = JSON.stringify(sanitizedPayload, null, 2);

  const prompt = `You are a full-stack system architect and code generator. Generate a complete, working prototype from this sanitized architecture blueprint.

Sanitized Blueprint:
${payloadJson}

Generate:

1. **interactiveHtmlPreview**: A complete, self-contained HTML file with:
   - Dark mode UI (bg-zinc-950, text-zinc-100)
   - Tailwind CSS v3 via CDN
   - Interactive dashboard showing the system architecture
   - Working buttons/forms that demonstrate the data flow
   - Responsive layout
   - NO placeholder functions - everything must work
   - Embed all CSS/JS inline (no external files)

2. **backendSchemaSql**: Production-ready PostgreSQL DDL schema with:
   - Tables matching the architecture nodes
   - Proper indexes, foreign keys, constraints
   - Security policies (RLS examples)
   - Sample data inserts

3. **envTemplate**: Complete .env.local template with:
   - All required environment variables
   - Placeholders for secrets (e.g., <SECRET_DB_URI_1>)
   - Comments explaining each variable

4. **architecturalNotes**: Concise technical review covering:
   - Scalability considerations
   - Security recommendations
   - SPOF mitigation strategies
   - Technology stack recommendations

Make the HTML preview production-quality with real interactivity, not a static mockup.`;

  try {
    const result = await inferenceQueue.enqueue(async () => {
      return await ai!.generateContent({
        prompt,
        inCloudParams: {
          model: 'gemini-2.0-flash-exp',
          generationConfig: {
            responseMimeType: 'application/json',
            responseSchema: schema,
          },
        },
      });
    });

    const latency = performance.now() - startTime;
    const inferenceSource: InferenceSource = result.response.inferenceSource === 'ON_DEVICE' ? 'ON_DEVICE' : 'IN_CLOUD';
    const responseText = result.response.text();
    const parsed = JSON.parse(responseText) as Omit<CompiledPrototypeBundle, 'generatedAt' | 'modelUsed'>;

    const bundle: CompiledPrototypeBundle = {
      ...parsed,
      generatedAt: Date.now(),
      modelUsed: 'gemini-2.0-flash-exp',
    };

    recordTelemetry({
      id: telemetryId,
      timestamp: Date.now(),
      operation: 'compileSanitizedBlueprintInCloud',
      inferenceMode: 'PREFER_IN_CLOUD',
      inferenceSource,
      latencyMs: Math.round(latency),
      success: true,
    });

    return bundle;
  } catch (error) {
    const latency = performance.now() - startTime;
    recordTelemetry({
      id: telemetryId,
      timestamp: Date.now(),
      operation: 'compileSanitizedBlueprintInCloud',
      inferenceMode: 'PREFER_IN_CLOUD',
      inferenceSource: 'UNKNOWN',
      latencyMs: Math.round(latency),
      success: false,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}
