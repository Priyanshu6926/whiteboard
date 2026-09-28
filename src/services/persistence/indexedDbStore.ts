import { openDB, IDBPDatabase } from "idb";
import { Editor } from "@tldraw/tldraw";

const DB_NAME = "voxcanvas_db";
const DB_VERSION = 1;
const STORE_NAME = "canvas_snapshots";

interface StoredSnapshot {
  roomId: string;
  updatedAt: number;
  records: Record<string, unknown>[];
}

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDb(): Promise<IDBPDatabase> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("IndexedDB is only accessible in browser."));
  }

  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: "roomId" });
        }
      },
    });
  }

  return dbPromise;
}

/**
 * Saves canvas snapshot to IndexedDB (SYNC-03).
 */
export async function saveCanvasSnapshot(
  roomId: string,
  records: Record<string, unknown>[]
): Promise<void> {
  try {
    const db = await getDb();
    const data: StoredSnapshot = {
      roomId,
      updatedAt: Date.now(),
      records,
    };
    await db.put(STORE_NAME, data);
  } catch (err) {
    console.warn(`[IndexedDB] Failed to save snapshot for room ${roomId}:`, err);
  }
}

/**
 * Loads canvas snapshot from IndexedDB for state reconstitution on reload (SYNC-03).
 */
export async function loadCanvasSnapshot(
  roomId: string
): Promise<Record<string, unknown>[] | null> {
  try {
    const db = await getDb();
    const data = (await db.get(STORE_NAME, roomId)) as StoredSnapshot | undefined;
    return data?.records || null;
  } catch (err) {
    console.warn(`[IndexedDB] Failed to load snapshot for room ${roomId}:`, err);
    return null;
  }
}

/**
 * Clears canvas snapshot from IndexedDB.
 */
export async function clearCanvasSnapshot(roomId: string): Promise<void> {
  try {
    const db = await getDb();
    await db.delete(STORE_NAME, roomId);
  } catch (err) {
    console.warn(`[IndexedDB] Failed to clear snapshot for room ${roomId}:`, err);
  }
}

/**
 * Periodic persistence worker saving canvas records to IndexedDB every 3 seconds (SYNC-03).
 */
export function startPeriodicPersistence(
  editor: Editor,
  roomId: string,
  intervalMs = 3000
): () => void {
  if (typeof window === "undefined") return () => {};

  let lastSnapshotHash = "";

  const saveTick = async () => {
    try {
      // Get all shape and asset records from tldraw store
      const allRecords = editor.store.allRecords();
      // Filter for relevant shapes to store
      const shapeRecords = allRecords.filter((r) => r.typeName === "shape");

      if (shapeRecords.length === 0) return;

      const serialized = JSON.stringify(shapeRecords);
      if (serialized === lastSnapshotHash) {
        return; // Skip write if records have not changed
      }

      lastSnapshotHash = serialized;
      await saveCanvasSnapshot(roomId, shapeRecords as unknown as Record<string, unknown>[]);
    } catch (err) {
      console.warn("[IndexedDB] Error during periodic persistence tick:", err);
    }
  };

  const timerId = setInterval(saveTick, intervalMs);

  return () => {
    clearInterval(timerId);
  };
}
