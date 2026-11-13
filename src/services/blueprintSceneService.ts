/**
 * AIRLOCK STUDIO - BLUEPRINT SCENE SERVICE
 * Excalidraw element manipulation with forced crisp geometry (roughness: 0)
 * Graph topology extraction and real/redacted text toggling
 */

import type { ExcalidrawElement } from '@excalidraw/excalidraw/types/element/types';
import { parseMermaidToExcalidraw } from '@excalidraw/mermaid-to-excalidraw';
import type { BlueprintNode, BlueprintEdge, BlueprintTopology, CanvasViewMode, AirlockVaultEntry } from '../types/airlock';

/**
 * Crisp blueprint geometry defaults (zero hand-drawn roughness)
 */
const BLUEPRINT_GEOMETRY_DEFAULTS = {
  roughness: 0,
  strokeWidth: 1.5,
  fontFamily: 3, // Monospace/code font
  roundness: { type: 3 as const }, // Sharp corners
  strokeColor: '#71717a', // zinc-500
  backgroundColor: '#18181b', // zinc-900
  fillStyle: 'solid' as const,
  strokeStyle: 'solid' as const,
};

/**
 * Convert Mermaid diagram syntax into crisp Excalidraw elements
 * Strips markdown fences, parses Mermaid, and enforces blueprint geometry
 */
export async function convertMermaidToBlueprintElements(
  mermaidSyntax: string
): Promise<readonly ExcalidrawElement[]> {
  // Strip markdown code fences if present
  const cleanedSyntax = mermaidSyntax
    .replace(/^```mermaid\s*/i, '')
    .replace(/```\s*$/, '')
    .trim();

  console.log('🔄 Parsing Mermaid syntax:', cleanedSyntax.substring(0, 100) + '...');

  try {
    // Parse Mermaid to Excalidraw format
    const { elements } = await parseMermaidToExcalidraw(cleanedSyntax, {
      fontSize: 16,
    });

    // Force crisp blueprint geometry on all elements
    const blueprintElements = elements.map((element) => ({
      ...element,
      ...BLUEPRINT_GEOMETRY_DEFAULTS,
      // Preserve essential element properties
      id: element.id,
      type: element.type,
      x: element.x,
      y: element.y,
      width: element.width,
      height: element.height,
      angle: element.angle,
      // Text elements
      ...(element.type === 'text' && {
        text: (element as Extract<typeof element, { type: 'text' }>).text,
        fontSize: 14,
        textAlign: 'center' as const,
        verticalAlign: 'middle' as const,
      }),
      // Arrow elements
      ...(element.type === 'arrow' && {
        startBinding: (element as Extract<typeof element, { type: 'arrow' }>).startBinding,
        endBinding: (element as Extract<typeof element, { type: 'arrow' }>).endBinding,
        points: (element as Extract<typeof element, { type: 'arrow' }>).points,
        startArrowhead: null,
        endArrowhead: 'arrow' as const,
      }),
    })) as unknown as ExcalidrawElement[];

    console.log(`✅ Converted ${blueprintElements.length} crisp blueprint elements`);
    return blueprintElements;
  } catch (error) {
    console.error('❌ Mermaid parsing failed:', error);
    throw new Error(`Failed to parse Mermaid syntax: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Extract human-readable graph topology from Excalidraw scene elements
 */
export function extractBlueprintTopology(elements: readonly ExcalidrawElement[]): BlueprintTopology {
  const nodes: BlueprintNode[] = [];
  const edges: BlueprintEdge[] = [];

  // Extract nodes from rectangles, ellipses, diamonds, and text elements
  elements.forEach((element) => {
    if (element.type === 'rectangle' || element.type === 'ellipse' || element.type === 'diamond') {
      const boundText = elements.find(
        (e) => e.type === 'text' && 'boundElements' in element && element.boundElements?.some((b) => b.id === e.id)
      ) as Extract<ExcalidrawElement, { type: 'text' }> | undefined;

      const label = boundText?.text || `Node_${element.id.substring(0, 6)}`;

      nodes.push({
        id: element.id,
        label,
        type: inferNodeType(label),
        x: element.x,
        y: element.y,
        width: element.width,
        height: element.height,
        containsSecret: false, // Will be updated by airlock scan
        originalText: label,
      });
    }

    // Standalone text nodes (sticky notes)
    if (element.type === 'text' && !('containerId' in element && element.containerId)) {
      nodes.push({
        id: element.id,
        label: element.text,
        type: 'NOTE',
        x: element.x,
        y: element.y,
        width: element.width,
        height: element.height,
        containsSecret: false,
        originalText: element.text,
      });
    }

    // Extract edges from arrows
    if (element.type === 'arrow') {
      const startNodeId = element.startBinding?.elementId;
      const endNodeId = element.endBinding?.elementId;

      if (startNodeId && endNodeId) {
        // Find arrow label if exists
        const arrowLabel = elements.find(
          (e) => e.type === 'text' && 'containerId' in e && e.containerId === element.id
        ) as Extract<ExcalidrawElement, { type: 'text' }> | undefined;

        edges.push({
          id: element.id,
          from: startNodeId,
          to: endNodeId,
          label: arrowLabel?.text,
          encrypted: inferEncryption(arrowLabel?.text || ''),
          authenticated: inferAuthentication(arrowLabel?.text || ''),
        });
      }
    }
  });

  console.log(`📊 Extracted topology: ${nodes.length} nodes, ${edges.length} edges`);

  return {
    nodes,
    edges,
    clusters: [], // Will be populated by AI clustering
  };
}

/**
 * Infer node type from label text
 */
function inferNodeType(label: string): BlueprintNode['type'] {
  const lower = label.toLowerCase();
  if (lower.includes('database') || lower.includes('db') || lower.includes('postgres') || lower.includes('mongo')) {
    return 'DATABASE';
  }
  if (lower.includes('gateway') || lower.includes('api') || lower.includes('proxy') || lower.includes('load balancer')) {
    return 'GATEWAY';
  }
  if (lower.includes('client') || lower.includes('user') || lower.includes('frontend') || lower.includes('mobile')) {
    return 'CLIENT';
  }
  if (lower.includes('external') || lower.includes('third-party') || lower.includes('partner')) {
    return 'EXTERNAL';
  }
  if (lower.includes('service') || lower.includes('worker') || lower.includes('processor')) {
    return 'SERVICE';
  }
  return 'OTHER';
}

/**
 * Infer if connection is encrypted based on label keywords
 */
function inferEncryption(label: string): boolean {
  const lower = label.toLowerCase();
  return lower.includes('https') || lower.includes('tls') || lower.includes('ssl') || lower.includes('encrypted');
}

/**
 * Infer if connection has authentication based on label keywords
 */
function inferAuthentication(label: string): boolean {
  const lower = label.toLowerCase();
  return lower.includes('auth') || lower.includes('jwt') || lower.includes('oauth') || lower.includes('api key');
}

/**
 * Toggle canvas elements between real and redacted text
 */
export function toggleCanvasRedaction(
  elements: readonly ExcalidrawElement[],
  vaultEntries: AirlockVaultEntry[],
  mode: CanvasViewMode
): readonly ExcalidrawElement[] {
  if (vaultEntries.length === 0) {
    return elements; // No redaction needed
  }

  const affectedNodeIds = new Set(vaultEntries.map((v) => v.nodeId));

  return elements.map((element) => {
    // Only modify text elements that contain secrets
    if (element.type === 'text' && affectedNodeIds.has(element.id)) {
      let newText = element.text;

      // Apply redaction or restoration based on mode
      if (mode === 'REDACTED_PLACEHOLDER_TEXT') {
        // Replace real values with placeholders
        vaultEntries.forEach((vault) => {
          if (vault.nodeId === element.id) {
            newText = newText.replace(vault.realValue, vault.placeholder);
          }
        });
      } else {
        // Restore real values from placeholders
        vaultEntries.forEach((vault) => {
          if (vault.nodeId === element.id) {
            newText = newText.replace(vault.placeholder, vault.realValue);
          }
        });
      }

      return {
        ...element,
        text: newText,
        // Amber border for redacted nodes
        strokeColor: mode === 'REDACTED_PLACEHOLDER_TEXT' ? '#f59e0b' : BLUEPRINT_GEOMETRY_DEFAULTS.strokeColor,
        strokeWidth: mode === 'REDACTED_PLACEHOLDER_TEXT' ? 2 : BLUEPRINT_GEOMETRY_DEFAULTS.strokeWidth,
      };
    }

    // Also handle shape-bound text elements
    if (
      (element.type === 'rectangle' || element.type === 'ellipse' || element.type === 'diamond') &&
      affectedNodeIds.has(element.id)
    ) {
      return {
        ...element,
        strokeColor: mode === 'REDACTED_PLACEHOLDER_TEXT' ? '#f59e0b' : BLUEPRINT_GEOMETRY_DEFAULTS.strokeColor,
        strokeWidth: mode === 'REDACTED_PLACEHOLDER_TEXT' ? 2 : BLUEPRINT_GEOMETRY_DEFAULTS.strokeWidth,
      };
    }

    return element;
  }) as unknown as readonly ExcalidrawElement[];
}

/**
 * Create a crisp blueprint rectangle element
 */
export function createBlueprintRectangle(
  x: number,
  y: number,
  width: number,
  height: number,
  label: string
): ExcalidrawElement[] {
  const rectangleId = `rect-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  const textId = `text-${Date.now()}-${Math.random().toString(36).substring(7)}`;

  const rectangle = {
    id: rectangleId,
    type: 'rectangle' as const,
    x,
    y,
    width,
    height,
    angle: 0,
    ...BLUEPRINT_GEOMETRY_DEFAULTS,
    boundElements: [{ id: textId, type: 'text' as const }],
    updated: Date.now(),
    link: null,
    locked: false,
    isDeleted: false,
    groupIds: [],
    frameId: null,
    opacity: 100,
    seed: Math.floor(Math.random() * 1000000),
    version: 1,
    versionNonce: Math.floor(Math.random() * 1000000),
  };

  const text = {
    id: textId,
    type: 'text' as const,
    x: x + width / 2,
    y: y + height / 2,
    width: width - 20,
    height: 20,
    angle: 0,
    text: label,
    fontSize: 14,
    fontFamily: 3,
    textAlign: 'center' as const,
    verticalAlign: 'middle' as const,
    containerId: rectangleId,
    originalText: label,
    ...BLUEPRINT_GEOMETRY_DEFAULTS,
    backgroundColor: 'transparent',
    updated: Date.now(),
    link: null,
    locked: false,
    isDeleted: false,
    groupIds: [],
    frameId: null,
    opacity: 100,
    seed: Math.floor(Math.random() * 1000000),
    version: 1,
    versionNonce: Math.floor(Math.random() * 1000000),
  };

  return [rectangle, text] as unknown as ExcalidrawElement[];
}

/**
 * Create a crisp blueprint arrow element
 */
export function createBlueprintArrow(
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  startBinding?: { elementId: string; focus: number; gap: number },
  endBinding?: { elementId: string; focus: number; gap: number }
): ExcalidrawElement {
  const arrowId = `arrow-${Date.now()}-${Math.random().toString(36).substring(7)}`;

  return {
    id: arrowId,
    type: 'arrow' as const,
    x: startX,
    y: startY,
    width: endX - startX,
    height: endY - startY,
    angle: 0,
    points: [
      [0, 0],
      [endX - startX, endY - startY],
    ],
    startBinding: startBinding || null,
    endBinding: endBinding || null,
    startArrowhead: null,
    endArrowhead: 'arrow' as const,
    ...BLUEPRINT_GEOMETRY_DEFAULTS,
    updated: Date.now(),
    link: null,
    locked: false,
    isDeleted: false,
    groupIds: [],
    frameId: null,
    opacity: 100,
    seed: Math.floor(Math.random() * 1000000),
    version: 1,
    versionNonce: Math.floor(Math.random() * 1000000),
  } as unknown as ExcalidrawElement;
}

/**
 * Export canvas as PNG (for sanitized snapshot)
 */
export async function exportCanvasAsPNG(
  excalidrawAPI: { getSceneElements: () => readonly ExcalidrawElement[]; getAppState: () => Record<string, unknown> } | null
): Promise<string> {
  if (!excalidrawAPI) {
    throw new Error('Excalidraw API not initialized');
  }

  // Use exportToBlob from @excalidraw/excalidraw
  const { exportToBlob } = await import('@excalidraw/excalidraw');

  const elements = excalidrawAPI.getSceneElements();
  const appState = excalidrawAPI.getAppState();

  const blob = await exportToBlob({
    elements,
    appState: appState as Parameters<typeof exportToBlob>[0]['appState'],
    files: null,
    exportPadding: 20,
  });

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
