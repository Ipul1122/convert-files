import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { openGoogleDrivePicker } from '../services/googleDriveService';

interface GoogleDriveButtonProps {
  onFilesSelected: (files: File[]) => void;
  onError?: (errorMsg: string) => void;
  variant?: 'large' | 'compact' | 'minimal';
  className?: string;
}

export const GoogleDriveIcon: React.FC<{ size?: number; className?: string }> = ({
  size = 16,
  className = '',
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <path d="M7.71 3.5L1.15 15l3.43 6 6.55-11.5L7.71 3.5z" fill="#FFC107" />
    <path d="M16.29 3.5H7.71l6.56 11.5h8.58L16.29 3.5z" fill="#4CAF50" />
    <path d="M14.27 15H1.15L4.58 21h14.84l3.43-6H14.27z" fill="#2196F3" />
  </svg>
);

export const GoogleDriveButton: React.FC<GoogleDriveButtonProps> = ({
  onFilesSelected,
  onError,
  variant = 'compact',
  className = '',
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [statusText, setStatusText] = useState('');

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isLoading) return;

    if (!navigator.onLine) {
      const msg =
        'Koneksi internet / data belum aktif. Silakan aktifkan data atau Wi-Fi untuk mengambil berkas dari Google Drive.';
      if (onError) {
        onError(msg);
      } else {
        alert(msg);
      }
      return;
    }

    setIsLoading(true);
    setStatusText('Menghubungkan...');

    try {
      const files = await openGoogleDrivePicker({
        onProgressMessage: msg => setStatusText(msg),
      });

      if (files && files.length > 0) {
        onFilesSelected(files);
      }
    } catch (err: any) {
      const errorMsg =
        err?.message || 'Gagal mengambil berkas dari Google Drive.';
      if (onError) {
        onError(errorMsg);
      } else {
        alert(errorMsg);
      }
    } finally {
      setIsLoading(false);
      setStatusText('');
    }
  };

  if (variant === 'large') {
    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={isLoading}
        className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded bg-surface-panel border border-border-subtle hover:border-accent-solid/50 hover:bg-surface-elevated text-text-primary text-xs font-mono font-medium transition-all cursor-pointer shadow-xs active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
        title="Ambil berkas dari Google Drive"
      >
        {isLoading ? (
          <>
            <Loader2 size={16} className="animate-spin text-accent-solid" />
            <span className="truncate max-w-[200px] text-accent-solid">
              {statusText || 'Mengunduh...'}
            </span>
          </>
        ) : (
          <>
            <GoogleDriveIcon size={16} />
            <span>Pilih dari Google Drive</span>
          </>
        )}
      </button>
    );
  }

  if (variant === 'minimal') {
    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={isLoading}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-surface-panel/80 hover:bg-surface-panel border border-border-subtle hover:border-border-focus text-text-secondary hover:text-text-primary text-[11px] font-mono transition-colors cursor-pointer disabled:opacity-50 ${className}`}
        title="Ambil berkas dari Google Drive"
      >
        {isLoading ? (
          <Loader2 size={13} className="animate-spin text-accent-solid" />
        ) : (
          <GoogleDriveIcon size={13} />
        )}
        <span>{isLoading ? 'Mengunduh...' : 'Google Drive'}</span>
      </button>
    );
  }

  // Default 'compact'
  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isLoading}
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded bg-surface-panel hover:bg-surface-elevated border border-border-subtle hover:border-border-focus text-text-primary text-xs font-mono font-medium transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      title="Ambil berkas dari Google Drive"
    >
      {isLoading ? (
        <>
          <Loader2 size={14} className="animate-spin text-accent-solid" />
          <span className="text-accent-solid text-[11px]">
            {statusText || 'Mengunduh...'}
          </span>
        </>
      ) : (
        <>
          <GoogleDriveIcon size={14} />
          <span>Google Drive</span>
          <span className="text-[10px] text-accent-solid font-mono font-normal">
            
          </span>
        </>
      )}
    </button>
  );
};
