import React, { useState } from 'react';
import {
  Trash2,
  ChevronUp,
  ChevronDown,
  FileText,
  FileImage,
  FileSpreadsheet,
  Presentation,
  UploadCloud,
  File as GenericFile,
} from 'lucide-react';
import type { SourceFile, ToolType } from '../types';
import { formatBytes } from '../utils/formatters';
import { GoogleDriveButton } from './GoogleDriveButton';

interface FileListProps {
  files: SourceFile[];
  toolType: ToolType;
  onRemoveFile: (id: string) => void;
  onClearFiles: () => void;
  onMoveFile: (index: number, direction: 'up' | 'down') => void;
  onAddFilesClick: () => void;
  onFilesDropped?: (files: File[]) => void;
}

export const FileList: React.FC<FileListProps> = ({
  files,
  toolType,
  onRemoveFile,
  onClearFiles,
  onMoveFile,
  onAddFilesClick,
  onFilesDropped,
}) => {
  const [isDragOverDropStrip, setIsDragOverDropStrip] = useState(false);
  const totalBytes = files.reduce((acc, f) => acc + f.sizeBytes, 0);

  const allowReorder =
    toolType === 'img-to-pdf' ||
    toolType === 'merge-pdf' ||
    toolType === 'img-to-webp' ||
    toolType === 'webp-to-img';

  const isSingleFileTool =
    toolType === 'split-pdf' ||
    toolType === 'pdf-to-jpg' ||
    toolType === 'pdf-to-png' ||
    toolType === 'pdf-to-webp' ||
    toolType === 'word-to-pdf' ||
    toolType === 'word-to-html' ||
    toolType === 'word-to-txt' ||
    toolType === 'excel-to-pdf' ||
    toolType === 'excel-to-csv' ||
    toolType === 'csv-to-excel' ||
    toolType === 'pptx-to-pdf' ||
    toolType === 'office-media';

  const renderFileIcon = (fileName: string, mimeType: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    if (ext === 'pdf' || mimeType === 'application/pdf') {
      return <FileText size={18} className="text-red-400" strokeWidth={1.5} />;
    }
    if (['xlsx', 'xls', 'csv'].includes(ext)) {
      return <FileSpreadsheet size={18} className="text-emerald-400" strokeWidth={1.5} />;
    }
    if (['pptx', 'ppt'].includes(ext)) {
      return <Presentation size={18} className="text-amber-500" strokeWidth={1.5} />;
    }
    if (['docx', 'doc'].includes(ext)) {
      return <FileText size={18} className="text-blue-400" strokeWidth={1.5} />;
    }
    if (['jpg', 'jpeg', 'png', 'webp', 'svg', 'gif'].includes(ext) || mimeType.startsWith('image/')) {
      return <FileImage size={18} className="text-purple-400" strokeWidth={1.5} />;
    }
    return <GenericFile size={18} className="text-text-muted" strokeWidth={1.5} />;
  };

  const handleDropStripDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOverDropStrip(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      if (onFilesDropped) {
        onFilesDropped(Array.from(e.dataTransfer.files));
      }
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-surface-bg select-none">
      {/* List Header Bar */}
      <div className="h-11 px-4 border-b border-border-subtle flex items-center justify-between shrink-0 bg-surface-panel">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
            Berkas Dimuat
          </span>
          <span className="font-mono text-xs px-2 py-0.5 rounded bg-surface-elevated text-accent-solid font-semibold border border-border-subtle">
            {files.length} BERKAS
          </span>
          <span className="font-mono text-xs text-text-muted hidden sm:inline">
            TOTAL {formatBytes(totalBytes)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {isSingleFileTool ? (
            <button
              type="button"
              onClick={onAddFilesClick}
              className="text-xs font-mono px-2.5 py-1 rounded bg-surface-elevated hover:bg-surface-elevated/80 border border-border-subtle text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
              title="Ganti berkas ini dengan berkas lain"
            >
              GANTI BERKAS
            </button>
          ) : (
            <button
              type="button"
              onClick={onAddFilesClick}
              className="text-xs font-mono px-2.5 py-1 rounded bg-surface-elevated hover:bg-surface-elevated/80 border border-border-subtle text-text-primary transition-colors cursor-pointer"
            >
              + TAMBAH BERKAS
            </button>
          )}
          {onFilesDropped && (
            <GoogleDriveButton
              onFilesSelected={files => onFilesDropped(files)}
              variant="minimal"
            />
          )}
          <button
            type="button"
            onClick={onClearFiles}
            className="text-xs font-mono px-2.5 py-1 rounded bg-surface-elevated hover:bg-red-950/40 border border-border-subtle text-text-muted hover:text-status-err hover:border-red-900 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Trash2 size={13} strokeWidth={1.5} />
            <span>HAPUS SEMUA</span>
          </button>
        </div>
      </div>

      {/* Files Scrollable Container */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
        {files.map((item, index) => {
          const extension = item.name.split('.').pop()?.toUpperCase() || '';

          return (
            <div
              key={item.id}
              className="group flex items-center justify-between p-2.5 rounded bg-surface-panel border border-border-subtle hover:border-border-focus transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                {/* Reorder Buttons (for multi-file tools) */}
                {allowReorder && (
                  <div className="flex flex-col gap-0.5 shrink-0">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => onMoveFile(index, 'up')}
                      aria-label="Pindahkan berkas ke atas"
                      title="Pindahkan ke atas"
                      className="p-1 rounded text-text-muted hover:text-text-primary hover:bg-surface-elevated disabled:opacity-20 disabled:hover:bg-transparent cursor-pointer"
                    >
                      <ChevronUp size={12} strokeWidth={2} />
                    </button>
                    <button
                      type="button"
                      disabled={index === files.length - 1}
                      onClick={() => onMoveFile(index, 'down')}
                      aria-label="Pindahkan berkas ke bawah"
                      title="Pindahkan ke bawah"
                      className="p-1 rounded text-text-muted hover:text-text-primary hover:bg-surface-elevated disabled:opacity-20 disabled:hover:bg-transparent cursor-pointer"
                    >
                      <ChevronDown size={12} strokeWidth={2} />
                    </button>
                  </div>
                )}

                {/* Sequence Number */}
                <span className="font-mono text-xs text-text-muted w-5 shrink-0 text-center">
                  #{index + 1}
                </span>

                {/* Thumbnail Preview */}
                <div className="w-10 h-10 rounded bg-surface-bg border border-border-subtle overflow-hidden shrink-0 flex items-center justify-center">
                  {item.previewUrl ? (
                    <img
                      src={item.previewUrl}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    renderFileIcon(item.name, item.mimeType)
                  )}
                </div>

                {/* File Information */}
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-text-primary truncate">
                      {item.name}
                    </span>
                    <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-surface-elevated text-text-secondary border border-border-subtle shrink-0">
                      .{extension}
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5 mt-0.5 font-mono text-xs text-text-muted">
                    <span>{formatBytes(item.sizeBytes)}</span>
                    {item.pageCount !== undefined && (
                      <>
                        <span>•</span>
                        <span className="text-text-secondary">
                          {item.pageCount} HALAMAN
                        </span>
                      </>
                    )}
                    {item.dimensions && (
                      <>
                        <span>•</span>
                        <span>
                          {item.dimensions.width}×{item.dimensions.height}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Delete Single File Button */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => onRemoveFile(item.id)}
                  aria-label="Hapus berkas"
                  title="Hapus berkas"
                  className="p-1.5 rounded text-text-muted hover:text-status-err hover:bg-surface-elevated transition-colors cursor-pointer"
                >
                  <Trash2 size={15} strokeWidth={1.5} />
                </button>
              </div>
            </div>
          );
        })}

        {/* Optional Add More Files Strip (Hanya untuk alat multi-berkas) */}
        {!isSingleFileTool && (
          <div
            onDragOver={e => {
              e.preventDefault();
              setIsDragOverDropStrip(true);
            }}
            onDragLeave={() => setIsDragOverDropStrip(false)}
            onDrop={handleDropStripDrop}
            onClick={onAddFilesClick}
            className={`mt-2 p-3 rounded-md border-2 border-dashed transition-all cursor-pointer flex items-center justify-center gap-2.5 text-xs font-mono ${
              isDragOverDropStrip
                ? 'border-accent-solid bg-accent-solid/10 text-accent-solid scale-[0.99]'
                : 'border-border-subtle hover:border-border-focus bg-surface-panel/30 hover:bg-surface-panel text-text-muted hover:text-text-primary'
            }`}
          >
            <UploadCloud size={16} className={isDragOverDropStrip ? 'text-accent-solid' : 'text-text-muted'} />
            <span>
              {isDragOverDropStrip
                ? 'LEPASKAN BERKAS DI SINI'
                : '+ Tambah berkas lagi via klik atau drag & drop (opsional)'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

