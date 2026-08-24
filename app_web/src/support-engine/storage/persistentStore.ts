/**
 * FIJAS IA SUPPORT ENGINE — DISK PERSISTENCE STORAGE
 * Respaldos automáticos en JSON para garantizar que los suscriptores y estados nunca se pierdan
 */
import fs from 'fs';
import path from 'path';

const DB_FILE_PATH = path.join(process.cwd(), 'fijas_ia_crm_store.json');

export interface StoredDataSchema {
  subscribers: any[];
  customers: any[];
  auditLogs: any[];
  lastSavedAt: string;
}

export function saveStateToDisk(subscribers: any[], customers: any[], auditLogs: any[] = []): boolean {
  try {
    const data: StoredDataSchema = {
      subscribers,
      customers,
      auditLogs,
      lastSavedAt: new Date().toISOString()
    };
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('[Persistence] Error saving CRM store to disk:', err);
    return false;
  }
}

export function loadStateFromDisk(): StoredDataSchema | null {
  try {
    if (!fs.existsSync(DB_FILE_PATH)) return null;
    const content = fs.readFileSync(DB_FILE_PATH, 'utf-8');
    return JSON.parse(content);
  } catch (err) {
    console.warn('[Persistence] Could not load CRM store from disk:', err);
    return null;
  }
}
