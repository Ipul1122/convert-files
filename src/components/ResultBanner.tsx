import { Download, CheckCircle, History, X } from 'lucide-react';
import type { ConversionResult } from '../types';
import { formatBytes, downloadBlob } from '../utils/formatters';

interface ResultBannerProps {
  result: ConversionResult;
  onDismiss: () => void;
  onViewInVault: () => void;
  onOpenPromo?: () => void;
}

export const ResultBanner: React.FC<ResultBannerProps> = ({
  result,
  onDismiss,
  onViewInVault,
  onOpenPromo,
}) => {
  const handleDownload = () => {
    downloadBlob(result.blob, result.filename);
  };

  const deltaBytes = result.outputBytes - result.originalTotalBytes;
  const isCompressed = deltaBytes < 0;
  const percentChange = result.originalTotalBytes > 0
    ? Math.abs(Math.round((deltaBytes / result.originalTotalBytes) * 100))
    : 0;

  return (
    <div className="mx-2 sm:mx-4 mb-2 sm:mb-4 p-3 sm:p-4 rounded bg-surface-panel border border-border-focus flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 shrink-0 shadow-lg select-none">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-9 h-9 rounded bg-status-ok/10 border border-status-ok/30 flex items-center justify-center text-status-ok shrink-0">
          <CheckCircle size={20} strokeWidth={1.5} />
        </div>

        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-text-primary truncate">
              {result.filename}
            </span>
            <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-surface-elevated text-status-ok border border-border-subtle shrink-0 font-bold">
              BERHASIL
            </span>
            {onOpenPromo && (
              <button
                type="button"
                onClick={onOpenPromo}
                className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-accent-solid/10 text-accent-solid border border-accent-solid/30 hover:bg-accent-solid/20 transition-colors cursor-pointer hidden md:inline-flex"
                title="Lihat info pengembang"
              >
                By M. Syaifulloh
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 mt-0.5 font-mono text-xs text-text-muted">
            <span className="text-text-primary font-semibold">
              {formatBytes(result.outputBytes)}
            </span>
            {result.originalTotalBytes > 0 && (
              <>
                <span>(dari {formatBytes(result.originalTotalBytes)})</span>
                {isCompressed && (
                  <span className="text-status-ok font-semibold">-{percentChange}%</span>
                )}
              </>
            )}
            <span>•</span>
            <span>{result.pageCount} Halaman</span>
            {result.savedToVault && (
              <>
                <span>•</span>
                <span className="text-text-secondary flex items-center gap-1">
                  <History size={11} strokeWidth={1.5} />
                  Tersimpan di Riwayat
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border-subtle/50">
        {result.savedToVault && (
          <button
            type="button"
            onClick={onViewInVault}
            className="text-xs font-mono px-3 py-2 rounded bg-surface-elevated hover:bg-surface-elevated/80 border border-border-subtle text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
          >
            LIHAT RIWAYAT
          </button>
        )}

        <button
          type="button"
          onClick={handleDownload}
          className="text-xs font-mono px-4 py-2 rounded bg-accent-solid hover:bg-accent-solid/90 text-white font-semibold flex items-center gap-1.5 transition-colors shadow cursor-pointer"
        >
          <Download size={14} strokeWidth={2} />
          <span>UNDUH BERKAS</span>
        </button>

        <button
          type="button"
          onClick={onDismiss}
          aria-label="Tutup notifikasi"
          className="p-1.5 rounded text-text-muted hover:text-text-primary hover:bg-surface-elevated transition-colors cursor-pointer"
        >
          <X size={15} strokeWidth={1.5} />
        </button>
      </div>
    </div>
  );
};
