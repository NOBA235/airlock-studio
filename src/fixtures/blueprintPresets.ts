/**
 * AIRLOCK STUDIO - BLUEPRINT PRESETS
 * Programmatic generation of 3 crisp architecture boards with real sensitive data
 */

import type { ExcalidrawElement } from '@excalidraw/excalidraw/types/element/types';
import type { SavedBlueprintBoard } from '../types/airlock';

/**
 * Crisp blueprint geometry defaults
 */
const CRISP = {
  roughness: 0,
  strokeWidth: 1.5,
  fontFamily: 3, // Monospace
  roundness: { type: 3 as const }, // Sharp corners
  strokeColor: '#71717a',
  backgroundColor: '#18181b',
  fillStyle: 'solid' as const,
  strokeStyle: 'solid' as const,
  opacity: 100,
};

/**
 * Generate unique element ID
 */
function genId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
}

/**
 * Create crisp rectangle with bound text
 */
function createNode(
  x: number,
  y: number,
  width: number,
  height: number,
  label: string,
  color: string = '#71717a'
): ExcalidrawElement[] {
  const rectId = genId('rect');
  const textId = genId('text');

  const rectangle = {
    id: rectId,
    type: 'rectangle' as const,
    x,
    y,
    width,
    height,
    angle: 0,
    ...CRISP,
    strokeColor: color,
    boundElements: [{ id: textId, type: 'text' as const }],
    updated: Date.now(),
    link: null,
    locked: false,
    isDeleted: false,
    groupIds: [],
    frameId: null,
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
    height: 24,
    angle: 0,
    text: label,
    fontSize: 14,
    fontFamily: 3,
    textAlign: 'center' as const,
    verticalAlign: 'middle' as const,
    containerId: rectId,
    originalText: label,
    ...CRISP,
    backgroundColor: 'transparent',
    updated: Date.now(),
    link: null,
    locked: false,
    isDeleted: false,
    groupIds: [],
    frameId: null,
    seed: Math.floor(Math.random() * 1000000),
    version: 1,
    versionNonce: Math.floor(Math.random() * 1000000),
  };

  return [rectangle, text] as unknown as ExcalidrawElement[];
}

/**
 * Create crisp arrow
 */
function createArrow(
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  startBinding: { elementId: string; focus: number; gap: number } | null,
  endBinding: { elementId: string; focus: number; gap: number } | null,
  label?: string
): ExcalidrawElement[] {
  const arrowId = genId('arrow');

  const arrow = {
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
    startBinding,
    endBinding,
    startArrowhead: null,
    endArrowhead: 'arrow' as const,
    ...CRISP,
    updated: Date.now(),
    link: null,
    locked: false,
    isDeleted: false,
    groupIds: [],
    frameId: null,
    seed: Math.floor(Math.random() * 1000000),
    version: 1,
    versionNonce: Math.floor(Math.random() * 1000000),
  } as unknown as ExcalidrawElement;

  const elements: ExcalidrawElement[] = [arrow];

  // Add label if provided
  if (label) {
    const labelId = genId('text');
    const midX = startX + (endX - startX) / 2;
    const midY = startY + (endY - startY) / 2;

    const labelText = {
      id: labelId,
      type: 'text' as const,
      x: midX - 40,
      y: midY - 12,
      width: 80,
      height: 24,
      angle: 0,
      text: label,
      fontSize: 12,
      fontFamily: 3,
      textAlign: 'center' as const,
      verticalAlign: 'middle' as const,
      containerId: arrowId,
      originalText: label,
      ...CRISP,
      backgroundColor: '#09090b',
      updated: Date.now(),
      link: null,
      locked: false,
      isDeleted: false,
      groupIds: [],
      frameId: null,
      seed: Math.floor(Math.random() * 1000000),
      version: 1,
      versionNonce: Math.floor(Math.random() * 1000000),
    } as unknown as ExcalidrawElement;

    elements.push(labelText);
  }

  return elements;
}

/**
 * Create sticky note (standalone text)
 */
function createSticky(x: number, y: number, text: string, color: string = '#f59e0b'): ExcalidrawElement {
  const textId = genId('sticky');

  return {
    id: textId,
    type: 'text' as const,
    x,
    y,
    width: 280,
    height: 80,
    angle: 0,
    text,
    fontSize: 13,
    fontFamily: 3,
    textAlign: 'left' as const,
    verticalAlign: 'top' as const,
    ...CRISP,
    strokeColor: color,
    backgroundColor: '#18181b',
    updated: Date.now(),
    link: null,
    locked: false,
    isDeleted: false,
    groupIds: [],
    frameId: null,
    seed: Math.floor(Math.random() * 1000000),
    version: 1,
    versionNonce: Math.floor(Math.random() * 1000000),
  } as unknown as ExcalidrawElement;
}

/**
 * PRESET 1: FinTech UPI & Ledger Settlement Architecture
 * Contains connected service blocks AND 3 sensitive sticky notes with real credentials
 */
export function generateFinTechUPIPreset(): SavedBlueprintBoard {
  const elements: ExcalidrawElement[] = [];

  // Row 1: Client Layer
  const mobileApp = createNode(100, 100, 160, 80, 'Mobile App\n(React Native)', '#3b82f6');
  elements.push(...mobileApp);

  // Row 2: API Gateway Layer
  const apiGateway = createNode(100, 250, 160, 80, 'API Gateway\n(Kong)', '#10b981');
  elements.push(...apiGateway);

  // Row 3: Core Services
  const upiService = createNode(50, 400, 140, 80, 'UPI Service\n(Node.js)', '#8b5cf6');
  const ledgerService = createNode(220, 400, 140, 80, 'Ledger Service\n(Go)', '#8b5cf6');
  elements.push(...upiService, ...ledgerService);

  // Row 4: Data Layer
  const postgres = createNode(100, 550, 160, 80, 'PostgreSQL\n(Primary DB)', '#ef4444');
  elements.push(...postgres);

  // Arrows with bindings
  elements.push(
    ...createArrow(180, 180, 180, 250, { elementId: mobileApp[0].id, focus: 0, gap: 4 }, { elementId: apiGateway[0].id, focus: 0, gap: 4 }, 'HTTPS')
  );
  elements.push(
    ...createArrow(120, 330, 120, 400, { elementId: apiGateway[0].id, focus: -0.3, gap: 4 }, { elementId: upiService[0].id, focus: 0, gap: 4 }, 'REST')
  );
  elements.push(
    ...createArrow(240, 330, 290, 400, { elementId: apiGateway[0].id, focus: 0.3, gap: 4 }, { elementId: ledgerService[0].id, focus: 0, gap: 4 }, 'gRPC')
  );
  elements.push(
    ...createArrow(120, 480, 140, 550, { elementId: upiService[0].id, focus: 0, gap: 4 }, { elementId: postgres[0].id, focus: -0.2, gap: 4 })
  );
  elements.push(
    ...createArrow(290, 480, 220, 550, { elementId: ledgerService[0].id, focus: 0, gap: 4 }, { elementId: postgres[0].id, focus: 0.2, gap: 4 })
  );

  // SENSITIVE STICKY NOTES (will be detected by Airlock scanner)
  elements.push(
    createSticky(
      420,
      100,
      '🔐 Production DB Credentials:\npostgres://admin:ProdPass99@10.24.8.12:5432/upi_ledger\n\nHost: 10.24.8.12\nUser: admin\nPassword: ProdPass99',
      '#f59e0b'
    )
  );

  elements.push(
    createSticky(
      420,
      240,
      '💳 Payment Gateway Keys:\nRazorpay Live Key: rzp_live_8849201a3c5f7b2e\nRazorpay Secret: XyZ9#mK$2pLq8vN3\n\nWebhook: https://api.acme.com/webhooks/rzp',
      '#f59e0b'
    )
  );

  elements.push(
    createSticky(
      420,
      380,
      '🏦 Partner Bank Integration:\nHDFC Corporate Settlement Account\nDaily Volume: ₹4.2Cr/day\nSettlement Window: T+1\n\nAPI Endpoint: https://hdfc-corp.internal/settle',
      '#f59e0b'
    )
  );

  return {
    id: `preset-fintech-${Date.now()}`,
    title: 'FinTech UPI & Ledger Settlement',
    description: 'Real-time payment processing with UPI integration and ledger settlement (contains production credentials)',
    elements,
    appState: {
      viewBackgroundColor: '#09090b',
      currentItemRoughness: 0,
      currentItemFontFamily: 3,
      currentItemStrokeWidth: 1.5,
      gridSize: 20,
    },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

/**
 * PRESET 2: Unstructured Microservice Brainstorm (10 Messy Notes)
 * Designed for 1-click offline Nano auto-clustering into clean architecture columns
 */
export function generateUnstructuredBrainstormPreset(): SavedBlueprintBoard {
  const elements: ExcalidrawElement[] = [];

  const notes = [
    { x: 120, y: 80, text: 'User Authentication\nJWT tokens\nOAuth 2.0 flow' },
    { x: 450, y: 120, text: 'Product Catalog Service\nElasticsearch for search\nRedis cache layer' },
    { x: 200, y: 280, text: 'Order Processing\nKafka event stream\nSaga pattern for distributed tx' },
    { x: 520, y: 340, text: 'PostgreSQL\nMaster-replica setup\nWrite: master, Read: replicas' },
    { x: 80, y: 450, text: 'Payment Gateway\nStripe integration\nPCI DSS compliance' },
    { x: 380, y: 480, text: 'Inventory Management\nReal-time stock updates\nWarehouse sync' },
    { x: 650, y: 200, text: 'Notification Service\nSMS, Email, Push\nTwilio + SendGrid' },
    { x: 280, y: 580, text: 'Analytics Pipeline\nClickhouse for OLAP\nMetabase dashboards' },
    { x: 600, y: 520, text: 'API Gateway\nRate limiting\nKong + Redis' },
    { x: 100, y: 620, text: 'Monitoring Stack\nPrometheus + Grafana\nAlertManager' },
  ];

  notes.forEach(({ x, y, text }) => {
    elements.push(createSticky(x, y, text, '#71717a'));
  });

  return {
    id: `preset-brainstorm-${Date.now()}`,
    title: 'Unstructured Microservice Brainstorm',
    description: '10 messy architecture notes ready for AI-powered auto-clustering into semantic layers',
    elements,
    appState: {
      viewBackgroundColor: '#09090b',
      currentItemRoughness: 0,
      currentItemFontFamily: 3,
      currentItemStrokeWidth: 1.5,
      gridSize: 20,
    },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

/**
 * PRESET 3: Multi-Region Healthcare EHR Pipeline
 * Contains an unencrypted cache SPOF and a patient PHI sticky note
 */
export function generateHealthcareEHRPreset(): SavedBlueprintBoard {
  const elements: ExcalidrawElement[] = [];

  // Client Layer
  const webApp = createNode(100, 80, 140, 70, 'EHR Web App\n(React)', '#3b82f6');
  const mobileApp = createNode(270, 80, 140, 70, 'Mobile App\n(Flutter)', '#3b82f6');
  elements.push(...webApp, ...mobileApp);

  // Load Balancer
  const lb = createNode(170, 200, 160, 70, 'Load Balancer\n(Nginx)', '#10b981');
  elements.push(...lb);

  // App Servers (Multi-Region)
  const appUS = createNode(50, 320, 130, 70, 'App Server\n(US-East)', '#8b5cf6');
  const appEU = createNode(210, 320, 130, 70, 'App Server\n(EU-West)', '#8b5cf6');
  elements.push(...appUS, ...appEU);

  // SPOF: Single Redis Cache (unencrypted, no redundancy)
  const redis = createNode(370, 320, 130, 70, '⚠️ Redis Cache\n(No Replica)', '#ef4444');
  elements.push(...redis);

  // Database
  const db = createNode(170, 460, 160, 70, 'PostgreSQL\n(HIPAA Compliant)', '#ef4444');
  elements.push(...db);

  // Arrows
  elements.push(...createArrow(140, 150, 210, 200, { elementId: webApp[0].id, focus: 0, gap: 4 }, { elementId: lb[0].id, focus: -0.3, gap: 4 }, 'HTTPS'));
  elements.push(...createArrow(310, 150, 280, 200, { elementId: mobileApp[0].id, focus: 0, gap: 4 }, { elementId: lb[0].id, focus: 0.3, gap: 4 }, 'HTTPS'));
  elements.push(...createArrow(200, 270, 115, 320, { elementId: lb[0].id, focus: -0.3, gap: 4 }, { elementId: appUS[0].id, focus: 0, gap: 4 }));
  elements.push(...createArrow(280, 270, 275, 320, { elementId: lb[0].id, focus: 0.3, gap: 4 }, { elementId: appEU[0].id, focus: 0, gap: 4 }));
  elements.push(...createArrow(180, 360, 435, 360, { elementId: appUS[0].id, focus: 0, gap: 4 }, { elementId: redis[0].id, focus: 0, gap: 4 }, 'Unencrypted'));
  elements.push(...createArrow(115, 390, 210, 460, { elementId: appUS[0].id, focus: 0, gap: 4 }, { elementId: db[0].id, focus: -0.3, gap: 4 }, 'TLS 1.3'));
  elements.push(...createArrow(275, 390, 280, 460, { elementId: appEU[0].id, focus: 0, gap: 4 }, { elementId: db[0].id, focus: 0.3, gap: 4 }, 'TLS 1.3'));

  // SENSITIVE STICKY: Patient PHI
  elements.push(
    createSticky(
      540,
      180,
      '🏥 Test Patient Record (DEMO):\n\nPatient: John Smith (DOB: 1982-03-15)\nMRN: EHR-2024-8821\nDiagnosis: Type 2 Diabetes\nPrescription: Metformin 500mg BID\n\nLast Visit: 2024-11-10\nProvider: Dr. Sarah Chen',
      '#f59e0b'
    )
  );

  // Architecture Notes
  elements.push(
    createSticky(
      540,
      400,
      '⚠️ SPOF Identified:\n\n1. Single Redis cache (no replica)\n2. Unencrypted Redis connection\n3. No failover mechanism\n\nRecommendation:\n- Deploy Redis Cluster (3+ nodes)\n- Enable TLS encryption\n- Add circuit breaker pattern',
      '#ef4444'
    )
  );

  return {
    id: `preset-healthcare-${Date.now()}`,
    title: 'Multi-Region Healthcare EHR Pipeline',
    description: 'Electronic Health Records system with identified SPOF and unencrypted cache (contains PHI)',
    elements,
    appState: {
      viewBackgroundColor: '#09090b',
      currentItemRoughness: 0,
      currentItemFontFamily: 3,
      currentItemStrokeWidth: 1.5,
      gridSize: 20,
    },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

/**
 * Get all available presets
 */
export function getAllPresets(): Array<{
  id: string;
  name: string;
  description: string;
  category: string;
  generator: () => SavedBlueprintBoard;
}> {
  return [
    {
      id: 'fintech-upi',
      name: 'FinTech UPI & Ledger',
      description: 'Payment processing with sensitive credentials',
      category: 'Financial Services',
      generator: generateFinTechUPIPreset,
    },
    {
      id: 'unstructured-brainstorm',
      name: 'Unstructured Brainstorm',
      description: '10 messy notes for AI clustering',
      category: 'Productivity',
      generator: generateUnstructuredBrainstormPreset,
    },
    {
      id: 'healthcare-ehr',
      name: 'Healthcare EHR Pipeline',
      description: 'Multi-region EHR with SPOF and PHI',
      category: 'Healthcare',
      generator: generateHealthcareEHRPreset,
    },
  ];
}
