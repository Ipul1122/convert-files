import { useState, useEffect } from 'react';
import {
  Download,
  Trash2,
  Pin,
  Search,
  History,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';
import {
  getConversionJobsSummary,
  getJobBlob,
  deleteConversionJob,
  togglePinJob,
  purgeVaultData,
  getStorageUsageBytes,
  type JobSummary,
} from '../db/vaultDb';
import { formatBytes, formatDate, formatToolLabel, downloadBlob } from '../utils/formatters';

interface VaultViewerProps {
  maxStorageMB: number;
  vaultJobCount: number;
  onStorageChange: () => void;
}

export const VaultViewer: React.FC<VaultViewerProps> = ({
  maxStorageMB,
  vaultJobCount,
  onStorageChange,
}) => {
  const [jobs, setJobs] = useState<JobSummary[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedToolFilter, setSelectedToolFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloadingId, setIsDownloadingId] = useState<number | null>(null);
  const [showPurgeModal, setShowPurgeModal] = useState(false);
  const [purgeIncludePinned, setPurgeIncludePinned] = useState(false);
  const [totalUsedBytes, setTotalUsedBytes] = useState(0);

  const loadVaultData = async () => {
    setIsLoading(true);
    try {
      const summaries = await getConversionJobsSummary();
      setJobs(summaries);
      const usage = await getStorageUsageBytes();
      setTotalUsedBytes(usage.usedBytes);
    } catch (err) {
      console.error('Failed to load vault items:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadVaultData();
  }, [vaultJobCount]);

  const handleDownload = async (job: JobSummary) => {
    if (!job.id) return;
    setIsDownloadingId(job.id);
    try {
      const blob = await getJobBlob(job.id);
      if (blob) {
        downloadBlob(blob, job.title);
      } else {
        alert('File blob not found in local IndexedDB store.');
      }
    } catch (err) {
      console.error('Download error:', err);
      alert('Failed to retrieve file from local storage.');
    } finally {
      setIsDownloadingId(null);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteConversionJob(id);
      await loadVaultData();
      onStorageChange();
    } catch (err) {
      console.error('Failed to delete job:', err);
    }
  };

  const handleTogglePin = async (id: number, currentPinned: boolean) => {
    try {
      await togglePinJob(id, !currentPinned);
      setJobs(prev =>
        prev.map(j => (j.id === id ? { ...j, isPinned: !currentPinned } : j))
      );
    } catch (err) {
      console.error('Failed to toggle pin:', err);
    }
  };

  const handlePurge = async () => {
    try {
      await purgeVaultData(purgeIncludePinned);
      setShowPurgeModal(false);
      await loadVaultData();
      onStorageChange();
    } catch (err) {
      console.error('Failed to purge vault data:', err);
    }
  };

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = selectedToolFilter === 'all' || job.toolType === selectedToolFilter;
    return matchesSearch && matchesFilter;
  });

  const maxBytes = maxStorageMB * 1024 * 1024;
  const storagePercent = Math.min(100, Math.round((totalUsedBytes / maxBytes) * 100));

  return (
    <div className="flex-1 flex flex-col h-full bg-surface-bg select-none overflow-hidden">
      {/* Vault Top Bar */}
      <div className="h-12 px-4 border-b border-border-subtle bg-surface-panel flex items-center justify-between shrink-0 gap-4">
        <div className="flex items-center gap-3">
          <History size={16} className="text-accent-solid" strokeWidth={1.5} />
          <span className="text-xs font-semibold uppercase tracking-wider text-text-primary">
            Riwayat Konversi
          </span>
          <span className="font-mono text-xs px-2 py-0.5 rounded bg-surface-elevated text-accent-solid font-semibold border border-border-subtle">
            {jobs.length} TERSIMPAN
          </span>
        </div>

        {/* Search & Filter */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search
              size={13}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted"
              strokeWidth={1.5}
            />
            <input
              type="text"
              placeholder="Cari nama berkas..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-48 pl-8 pr-3 py-1 rounded bg-surface-bg border border-border-subtle text-xs text-text-primary focus:outline-none focus:border-border-focus font-mono"
            />
          </div>

          <select
            value={selectedToolFilter}
            onChange={e => setSelectedToolFilter(e.target.value)}
            className="px-2 py-1 rounded bg-surface-bg border border-border-subtle text-xs text-text-secondary focus:outline-none focus:border-border-focus font-mono"
          >
            <option value="all">SEMUA TIPE</option>
            <option value="img-to-pdf">GAMBAR → PDF</option>
            <option value="pdf-to-jpg">PDF → JPG</option>
            <option value="pdf-to-png">PDF → PNG</option>
            <option value="pdf-to-webp">PDF → WEBP</option>
            <option value="img-to-webp">GAMBAR → WEBP</option>
            <option value="webp-to-img">WEBP → GAMBAR</option>
            <option value="merge-pdf">GABUNG PDF</option>
            <option value="split-pdf">PISAH PDF</option>
            <option value="word-to-pdf">WORD → PDF</option>
            <option value="excel-to-pdf">EXCEL → PDF</option>
            <option value="pptx-to-pdf">PPTX → PDF</option>
          </select>

          {jobs.length > 0 && (
            <button
              type="button"
              onClick={() => setShowPurgeModal(true)}
              className="text-xs font-mono px-2.5 py-1 rounded bg-surface-elevated hover:bg-red-950/40 border border-border-subtle text-text-muted hover:text-status-err hover:border-red-900 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 size={13} strokeWidth={1.5} />
              BERSIHKAN RIWAYAT
            </button>
          )}
        </div>
      </div>

      {/* Storage Meter Summary Card */}
      <div className="p-4 border-b border-border-subtle bg-surface-panel flex items-center justify-between shrink-0">
        <div className="flex items-center gap-6">
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-mono uppercase text-text-muted">Penyimpanan Terpakai</span>
            <span className="font-mono text-sm font-semibold text-text-primary">
              {formatBytes(totalUsedBytes)} / {maxStorageMB} MB ({storagePercent}%)
            </span>
          </div>

          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-mono uppercase text-text-muted">Mesin Database</span>
            <span className="font-mono text-xs text-text-secondary">
              IndexedDB (Perangkat Lokal Saja)
            </span>
          </div>

          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-mono uppercase text-text-muted">Konektivitas Cloud</span>
            <span className="font-mono text-xs text-status-ok flex items-center gap-1">
              <CheckCircle size={12} strokeWidth={1.5} />
              0 Byte Terkirim ke Cloud (100% Offline)
            </span>
          </div>
        </div>

        <div className="w-48">
          <div className="w-full h-1.5 bg-surface-bg rounded-full overflow-hidden border border-border-subtle">
            <div
              className="h-full bg-accent-solid transition-all duration-300"
              style={{ width: `${storagePercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* History Items Table */}
      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="h-full flex items-center justify-center text-xs font-mono text-text-muted">
            MEMBACA DATABASE LOKAL...
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center gap-2 text-text-muted">
            <History size={32} strokeWidth={1} />
            <span className="text-xs font-mono">
              {searchQuery || selectedToolFilter !== 'all'
                ? 'TIDAK ADA DATA YANG COCOK'
                : 'BELUM ADA BERKAS TERSIMPAN DI RIWAYAT'}
            </span>
            <span className="text-[11px] text-text-muted max-w-sm text-center">
              Berkas yang Anda konversi akan otomatis tercatat di sini dan siap diunduh kembali kapan saja tanpa koneksi internet.
            </span>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {filteredJobs.map(job => (
              <div
                key={job.id}
                className="flex items-center justify-between p-3 rounded bg-surface-panel border border-border-subtle hover:border-border-focus transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Pin Toggle */}
                  <button
                    type="button"
                    onClick={() => job.id && handleTogglePin(job.id, job.isPinned)}
                    title={job.isPinned ? 'Disematkan (Aman dari pembersihan)' : 'Klik untuk menyematkan berkas'}
                    className={`p-1 rounded transition-colors cursor-pointer ${
                      job.isPinned
                        ? 'text-accent-solid bg-accent-solid/10'
                        : 'text-text-muted hover:text-text-primary'
                    }`}
                  >
                    <Pin size={14} strokeWidth={1.5} className={job.isPinned ? 'fill-accent-solid' : ''} />
                  </button>

                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-text-primary truncate">
                        {job.title}
                      </span>
                      <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-surface-elevated text-accent-solid border border-border-subtle shrink-0">
                        {formatToolLabel(job.toolType)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2.5 mt-1 font-mono text-xs text-text-muted">
                      <span>{formatBytes(job.outputBytes)}</span>
                      {job.originalTotalBytes > 0 && job.outputBytes < job.originalTotalBytes && (
                        <span className="text-status-ok font-semibold">
                          (-{Math.round(((job.originalTotalBytes - job.outputBytes) / job.originalTotalBytes) * 100)}%)
                        </span>
                      )}
                      <span>•</span>
                      <span>{job.pageCount} BERKAS/HAL</span>
                      <span>•</span>
                      <span>{formatDate(job.createdAt)}</span>
                    </div>
                  </div>
                </div>

                {/* Actions: Download & Delete */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleDownload(job)}
                    disabled={isDownloadingId === job.id}
                    className="font-mono text-xs px-3 py-1.5 rounded bg-accent-solid hover:bg-accent-hover text-white flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    <Download size={13} strokeWidth={1.5} />
                    {isDownloadingId === job.id ? 'MENGEKSTRAK...' : 'UNDUH'}
                  </button>

                  <button
                    type="button"
                    onClick={() => job.id && handleDelete(job.id)}
                    title="Hapus dari riwayat lokal"
                    className="p-1.5 rounded text-text-muted hover:text-status-err hover:bg-surface-elevated transition-colors cursor-pointer"
                  >
                    <Trash2 size={15} strokeWidth={1.5} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Confirmation Modal for Purging */}
      {showPurgeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
          <div className="w-[420px] rounded-md bg-surface-panel border border-border-subtle p-5 flex flex-col gap-4">
            <div className="flex items-center gap-2.5 text-status-err">
              <AlertTriangle size={18} strokeWidth={1.5} />
              <span className="font-sans font-semibold text-sm">Bersihkan Riwayat Lokal</span>
            </div>

            <p className="text-xs text-text-secondary leading-relaxed">
              Tindakan ini akan menghapus riwayat konversi dan berkas tersimpan secara permanen dari IndexedDB lokal peramban Anda. Tindakan ini tidak dapat dibatalkan.
            </p>

            <label className="flex items-center gap-2 text-xs text-text-secondary cursor-pointer select-none">
              <input
                type="checkbox"
                checked={purgeIncludePinned}
                onChange={e => setPurgeIncludePinned(e.target.checked)}
                className="rounded border-border-subtle bg-surface-bg text-accent-solid focus:ring-0 cursor-pointer"
              />
              <span>Hapus juga berkas yang disematkan / dilindungi</span>
            </label>

            <div className="flex items-center justify-end gap-2 mt-2">
              <button
                type="button"
                onClick={() => setShowPurgeModal(false)}
                className="font-mono text-xs px-3 py-1.5 rounded bg-surface-elevated hover:bg-surface-elevated/80 border border-border-subtle text-text-primary transition-colors cursor-pointer"
              >
                BATAL
              </button>
              <button
                type="button"
                onClick={handlePurge}
                className="font-mono text-xs px-3 py-1.5 rounded bg-status-err hover:bg-red-700 text-white transition-colors cursor-pointer"
              >
                KONFIRMASI BERSIHKAN
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
