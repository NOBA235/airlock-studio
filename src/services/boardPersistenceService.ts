/**
 * AIRLOCK STUDIO - BOARD PERSISTENCE SERVICE
 * Offline-first Firestore operations + .airlock.json file export/import
 */

import {
  collection,
  doc,
  getDoc,
  setDoc,
  getDocs,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  type Unsubscribe,
} from 'firebase/firestore';
import { db, ensureAuthenticated, auth } from '../config/firebase';
import type { SavedBlueprintBoard } from '../types/airlock';

const BOARDS_COLLECTION = 'airlock_boards';

/**
 * Save blueprint board to Firestore (offline-first with IndexedDB cache)
 */
export async function saveBoardToFirestore(board: SavedBlueprintBoard): Promise<void> {
  await ensureAuthenticated();

  const userId = auth.currentUser?.uid;
  if (!userId) {
    throw new Error('User not authenticated');
  }

  const boardRef = doc(db, BOARDS_COLLECTION, board.id);

  // Prepare board data with sanitized fields (never store secrets)
  const boardData = {
    id: board.id,
    title: board.title,
    description: board.description,
    elements: board.elements,
    appState: board.appState,
    sanitizedTopology: board.sanitizedTopology || null,
    auditFindings: board.auditFindings || null,
    // Never store compiledBundle.interactiveHtmlPreview to Firestore (too large + may contain re-hydrated secrets)
    compiledBundleMetadata: board.compiledBundle
      ? {
          generatedAt: board.compiledBundle.generatedAt,
          modelUsed: board.compiledBundle.modelUsed,
          hasSql: !!board.compiledBundle.backendSchemaSql,
          hasEnvTemplate: !!board.compiledBundle.envTemplate,
        }
      : null,
    createdAt: board.createdAt,
    updatedAt: board.updatedAt,
    serverUpdatedAt: serverTimestamp(),
    userId,
  };

  try {
    await setDoc(boardRef, boardData, { merge: true });
    console.log(`✅ Board "${board.title}" saved to Firestore (offline-first cache)`);
  } catch (error) {
    console.error('❌ Failed to save board to Firestore:', error);
    throw new Error(`Failed to save board: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Load blueprint board from Firestore
 */
export async function loadBoardFromFirestore(boardId: string): Promise<SavedBlueprintBoard | null> {
  await ensureAuthenticated();

  const boardRef = doc(db, BOARDS_COLLECTION, boardId);

  try {
    const snapshot = await getDoc(boardRef);

    if (!snapshot.exists()) {
      console.warn(`⚠️ Board ${boardId} not found in Firestore`);
      return null;
    }

    const data = snapshot.data();
    console.log(`✅ Board "${data.title}" loaded from Firestore`);

    return {
      id: data.id,
      title: data.title,
      description: data.description,
      elements: data.elements,
      appState: data.appState,
      sanitizedTopology: data.sanitizedTopology || undefined,
      auditFindings: data.auditFindings || undefined,
      compiledBundle: undefined, // Not stored in Firestore (too large)
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      userId: data.userId,
    };
  } catch (error) {
    console.error('❌ Failed to load board from Firestore:', error);
    throw new Error(`Failed to load board: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * List all boards for current user (newest first, max 50)
 */
export async function listUserBoards(): Promise<SavedBlueprintBoard[]> {
  await ensureAuthenticated();

  const userId = auth.currentUser?.uid;
  if (!userId) {
    throw new Error('User not authenticated');
  }

  try {
    const q = query(
      collection(db, BOARDS_COLLECTION),
      where('userId', '==', userId),
      orderBy('updatedAt', 'desc'),
      limit(50)
    );

    const snapshot = await getDocs(q);
    const boards: SavedBlueprintBoard[] = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: data.id,
        title: data.title,
        description: data.description,
        elements: data.elements,
        appState: data.appState,
        sanitizedTopology: data.sanitizedTopology || undefined,
        auditFindings: data.auditFindings || undefined,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        userId: data.userId,
      };
    });

    console.log(`✅ Loaded ${boards.length} boards from Firestore`);
    return boards;
  } catch (error) {
    console.error('❌ Failed to list boards from Firestore:', error);
    throw new Error(`Failed to list boards: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Delete board from Firestore
 */
export async function deleteBoardFromFirestore(boardId: string): Promise<void> {
  await ensureAuthenticated();

  const boardRef = doc(db, BOARDS_COLLECTION, boardId);

  try {
    await deleteDoc(boardRef);
    console.log(`✅ Board ${boardId} deleted from Firestore`);
  } catch (error) {
    console.error('❌ Failed to delete board from Firestore:', error);
    throw new Error(`Failed to delete board: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Subscribe to real-time board updates
 */
export function subscribeToBoardUpdates(boardId: string, callback: (board: SavedBlueprintBoard | null) => void): Unsubscribe {
  const boardRef = doc(db, BOARDS_COLLECTION, boardId);

  return onSnapshot(
    boardRef,
    (snapshot) => {
      if (!snapshot.exists()) {
        callback(null);
        return;
      }

      const data = snapshot.data();
      callback({
        id: data.id,
        title: data.title,
        description: data.description,
        elements: data.elements,
        appState: data.appState,
        sanitizedTopology: data.sanitizedTopology || undefined,
        auditFindings: data.auditFindings || undefined,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        userId: data.userId,
      });
    },
    (error) => {
      console.error('❌ Board subscription error:', error);
    }
  );
}

/**
 * Export board to .airlock.json file (local download)
 */
export function exportBoardToFile(board: SavedBlueprintBoard): void {
  const jsonData = JSON.stringify(board, null, 2);
  const blob = new Blob([jsonData], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `${board.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.airlock.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
  console.log(`✅ Board "${board.title}" exported to .airlock.json`);
}

/**
 * Import board from .airlock.json file
 */
export async function importBoardFromFile(file: File): Promise<SavedBlueprintBoard> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const jsonData = event.target?.result as string;
        const board = JSON.parse(jsonData) as SavedBlueprintBoard;

        // Validate required fields
        if (!board.id || !board.title || !board.elements) {
          throw new Error('Invalid .airlock.json file: missing required fields');
        }

        console.log(`✅ Board "${board.title}" imported from .airlock.json`);
        resolve(board);
      } catch (error) {
        reject(new Error(`Failed to parse .airlock.json: ${error instanceof Error ? error.message : String(error)}`));
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read .airlock.json file'));
    };

    reader.readAsText(file);
  });
}

/**
 * Check Firestore online/offline status
 */
export function getFirestoreNetworkStatus(): 'online' | 'offline' | 'unknown' {
  try {
    // Access internal Firestore network status (if available)
    // Note: Firebase SDK doesn't expose official API for this
    // We'll use a heuristic: try to access navigator.onLine
    return navigator.onLine ? 'online' : 'offline';
  } catch {
    return 'unknown';
  }
}

/**
 * Subscribe to network status changes
 */
export function subscribeToNetworkStatus(callback: (status: 'online' | 'offline') => void): () => void {
  const handleOnline = () => callback('online');
  const handleOffline = () => callback('offline');

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  // Return unsubscribe function
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}

/**
 * Create a new blank board
 */
export function createBlankBoard(title: string, description: string = ''): SavedBlueprintBoard {
  return {
    id: `board-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    title,
    description,
    elements: [],
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
 * Auto-save board with debouncing (call this on every canvas change)
 */
let autoSaveTimeout: ReturnType<typeof setTimeout> | null = null;

export function scheduleAutoSave(board: SavedBlueprintBoard, delayMs: number = 3000): void {
  if (autoSaveTimeout) {
    clearTimeout(autoSaveTimeout);
  }

  autoSaveTimeout = setTimeout(async () => {
    try {
      await saveBoardToFirestore({
        ...board,
        updatedAt: Date.now(),
      });
      console.log(`💾 Auto-saved board "${board.title}"`);
    } catch (error) {
      console.error('❌ Auto-save failed:', error);
    }
  }, delayMs);
}

/**
 * Cancel pending auto-save
 */
export function cancelAutoSave(): void {
  if (autoSaveTimeout) {
    clearTimeout(autoSaveTimeout);
    autoSaveTimeout = null;
  }
}
