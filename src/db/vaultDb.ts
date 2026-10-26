import Dexie, { type Table } from 'dexie';
import type { ConversionJob, JobInputFile, AppSetting } from '../types';

export class LocalVaultDB extends Dexie {
  conversionJobs!: Table<ConversionJob, number>;
  jobInputFiles!: Table<JobInputFile, number>;
  appSettings!: Table<AppSetting, string>;

  constructor() {
    super('LocalVaultConverterDB');
    this.version(1).stores({
      conversionJobs: '++id, &jobUUID, workspaceId, toolType, isPinned, createdAt',
      jobInputFiles: '++id, jobId',
      appSettings: 'key',
    });
  }
}

export const db = new LocalVaultDB();

const DEFAULT_SETTINGS: AppSetting = {
  key: 'singleton_config',
  autoSaveToVault: true,
  defaultJpgQuality: 0.90,
  defaultWebpQuality: 0.85,
  defaultRenderScale: 2.0,
  maxVaultStorageMB: 500,
};

/**
 * Retrieve application settings or initialize defaults
 */
export async function getAppSettings(): Promise<AppSetting> {
  try {
    const setting = await db.appSettings.get('singleton_config');
    if (setting) return setting;
    await db.appSettings.put(DEFAULT_SETTINGS);
    return DEFAULT_SETTINGS;
  } catch (err) {
    console.error('Failed to get app settings:', err);
    return DEFAULT_SETTINGS;
  }
}

/**
 * Update application settings
 */
export async function updateAppSettings(updates: Partial<Omit<AppSetting, 'key'>>): Promise<AppSetting> {
  const current = await getAppSettings();
  const updated: AppSetting = { ...current, ...updates };
  await db.appSettings.put(updated);
  return updated;
}

/**
 * Save a conversion job along with its input files in a single transaction
 */
export async function saveConversionJob(
  jobData: Omit<ConversionJob, 'id'>,
  inputFiles: Array<{ name: string; sizeBytes: number; mimeType: string }>
): Promise<number> {
  return await db.transaction('rw', db.conversionJobs, db.jobInputFiles, async () => {
    const jobId = await db.conversionJobs.add(jobData as ConversionJob);
    if (inputFiles && inputFiles.length > 0) {
      const records: JobInputFile[] = inputFiles.map(file => ({
        jobId,
        originalName: file.name,
        sizeBytes: file.sizeBytes,
        mimeType: file.mimeType,
      }));
      await db.jobInputFiles.bulkAdd(records);
    }
    return jobId;
  });
}

export type JobSummary = Omit<ConversionJob, 'outputBlob'> & {
  hasBlob: boolean;
};

/**
 * Get all conversion jobs sorted by createdAt desc, keeping list rendering fast
 */
export async function getConversionJobsSummary(): Promise<JobSummary[]> {
  const jobs = await db.conversionJobs.orderBy('createdAt').reverse().toArray();
  return jobs.map(j => ({
    id: j.id,
    jobUUID: j.jobUUID,
    workspaceId: j.workspaceId,
    title: j.title,
    toolType: j.toolType,
    originalTotalBytes: j.originalTotalBytes,
    outputBytes: j.outputBytes,
    pageCount: j.pageCount,
    mimeType: j.mimeType,
    isPinned: j.isPinned,
    createdAt: j.createdAt,
    hasBlob: !!j.outputBlob,
  }));
}

/**
 * Retrieve the binary outputBlob for a specific job on-demand
 */
export async function getJobBlob(id: number): Promise<Blob | null> {
  const job = await db.conversionJobs.get(id);
  return job ? job.outputBlob : null;
}

/**
 * Toggle pin state for a job
 */
export async function togglePinJob(id: number, isPinned: boolean): Promise<void> {
  await db.conversionJobs.update(id, { isPinned });
}

/**
 * Cascade delete a job and its related input files in a single transaction
 */
export async function deleteConversionJob(id: number): Promise<void> {
  await db.transaction('rw', db.conversionJobs, db.jobInputFiles, async () => {
    await db.conversionJobs.delete(id);
    await db.jobInputFiles.where('jobId').equals(id).delete();
  });
}

/**
 * Purge all vault data except pinned jobs (or all if force = true)
 */
export async function purgeVaultData(includePinned = false): Promise<number> {
  return await db.transaction('rw', db.conversionJobs, db.jobInputFiles, async () => {
    if (includePinned) {
      const count = await db.conversionJobs.count();
      await db.conversionJobs.clear();
      await db.jobInputFiles.clear();
      return count;
    } else {
      const unpinned = await db.conversionJobs.filter(j => !j.isPinned).toArray();
      const ids = unpinned.map(j => j.id!).filter(Boolean);
      for (const id of ids) {
        await db.conversionJobs.delete(id);
        await db.jobInputFiles.where('jobId').equals(id).delete();
      }
      return ids.length;
    }
  });
}

/**
 * Calculate total storage used in IndexedDB by output blobs
 */
export async function getStorageUsageBytes(): Promise<{ usedBytes: number; jobCount: number }> {
  try {
    const jobs = await db.conversionJobs.toArray();
    let totalBytes = 0;
    for (const job of jobs) {
      totalBytes += job.outputBytes || 0;
    }
    return { usedBytes: totalBytes, jobCount: jobs.length };
  } catch (err) {
    console.error('Failed to calculate storage usage:', err);
    return { usedBytes: 0, jobCount: 0 };
  }
}
