import React, { useEffect, useRef, useState } from 'react';
import { AlertCircle, UploadCloud } from 'lucide-react';
import type { ToolType, SourceFile, ConversionResult } from '../types';
import type { TargetOption } from '../utils/conversionTargets';
import { Dropzone } from './Dropzone';
import { FileList } from './FileList';
import { PdfPageSplitter } from './PdfPageSplitter';
import { VaultViewer } from './VaultViewer';
import { ResultBanner } from './ResultBanner';
import { TargetSelector } from './TargetSelector';

interface CenterCanvasProps {
  toolType: ToolType;
  effectiveTool: Exclude<ToolType, 'vault' | 'smart'>;
  files: SourceFile[];
  targets: TargetOption[];
  selectedTargetId: string;
  onSelectTarget: (target: TargetOption) => void;
  inputTypeLabel: string;
  fileCountLabel: string;
  onFilesSelected: (files: File[]) => void;
  onRemoveFile: (id: string) => void;
  onClearFiles: () => void;
  onMoveFile: (index: number, direction: 'up' | 'down') => void;
  errorMessage: string | null;
  onClearError: () => void;
  conversionResult: ConversionResult | null;
  onDismissResult: () => void;
  onViewInVault: () => void;
  maxStorageMB: number;
  vaultJobCount: number;
  onStorageChange: () => void;
  onOpenParams?: () => void;
  pageRange?: string;
  onPageRangeChange?: (range: string) => void;
  onOpenPromo?: () => void;
  onSelectTool?: (tool: ToolType) => void;
}

export const CenterCanvas: React.FC<CenterCanvasProps> = ({
  toolType,
  effectiveTool,
  files,
  targets,
  selectedTargetId,
  onSelectTarget,
  inputTypeLabel,
  fileCountLabel,
  onFilesSelected,
  onRemoveFile,
  onClearFiles,
  onMoveFile,
  errorMessage,
  onClearError,
  conversionResult,
  onDismissResult,
  onViewInVault,
  maxStorageMB,
  vaultJobCount,
  onStorageChange,
  onOpenParams,
  pageRange = 'all',
  onPageRangeChange = () => {},
  onOpenPromo,
  onSelectTool,
}) => {
  const hiddenInputRef = useRef<HTMLInputElement>(null);
  const dragCounterRef = useRef<number>(0);
  const [isDragOverCanvas, setIsDragOverCanvas] = useState(false);

  const isSmart = toolType === 'smart';
  const isImageTool = effectiveTool === 'img-to-pdf' || effectiveTool === 'img-to-webp';
  const isWebpOnlyTool = effectiveTool === 'webp-to-img';

  const ALL_OFFICE_ACCEPTS = '.docx,.xlsx,.xls,.csv,.pptx,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.openxmlformats-officedocument.presentationml.presentation,text/csv';

  let acceptedTypes = 'application/pdf,.pdf';
  if (isSmart) {
    acceptedTypes = `application/pdf,image/jpeg,image/png,image/webp,.pdf,.jpg,.jpeg,.png,.webp,${ALL_OFFICE_ACCEPTS}`;
  } else if (isImageTool) {
    acceptedTypes = 'image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp';
  } else if (isWebpOnlyTool) {
    acceptedTypes = 'image/webp,.webp';
  } else if (effectiveTool === 'word-to-pdf' || effectiveTool === 'word-to-html' || effectiveTool === 'word-to-txt') {
    acceptedTypes = '.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  } else if (effectiveTool === 'excel-to-pdf' || effectiveTool === 'excel-to-csv') {
    acceptedTypes = '.xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv';
  } else if (effectiveTool === 'csv-to-excel') {
    acceptedTypes = '.csv,text/csv';
  } else if (effectiveTool === 'pptx-to-pdf') {
    acceptedTypes = '.pptx,application/vnd.openxmlformats-officedocument.presentationml.presentation';
  } else if (effectiveTool === 'office-media') {
    acceptedTypes = '.docx,.pptx';
  }

  // Always reset drag state whenever files change or on unmount
  useEffect(() => {
    setIsDragOverCanvas(false);
    dragCounterRef.current = 0;
  }, [files]);

  // Window-level safety cleanup for drag cancellation or drop
  useEffect(() => {
    const handleReset = () => {
      dragCounterRef.current = 0;
      setIsDragOverCanvas(false);
    };

    window.addEventListener('dragend', handleReset);
    window.addEventListener('drop', handleReset);
    return () => {
      window.removeEventListener('dragend', handleReset);
      window.removeEventListener('drop', handleReset);
    };
  }, []);

  const handleHiddenFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesSelected(Array.from(e.target.files));
      e.target.value = '';
    }
  };

  // Persistent Drag & Drop over canvas (ONLY active when files are already loaded)
  const handleDragEnter = (e: React.DragEvent) => {
    if (files.length === 0) return; // Dropzone handles its own state
    e.preventDefault();
    dragCounterRef.current += 1;
    if (e.dataTransfer?.types?.includes('Files')) {
      setIsDragOverCanvas(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (files.length === 0) return;
    e.preventDefault();
    dragCounterRef.current -= 1;
    if (dragCounterRef.current <= 0) {
      dragCounterRef.current = 0;
      setIsDragOverCanvas(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (files.length === 0) return;
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    dragCounterRef.current = 0;
    setIsDragOverCanvas(false);
    if (files.length === 0) return;
    e.preventDefault();
    if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
      onFilesSelected(Array.from(e.dataTransfer.files));
    }
  };

  if (toolType === 'vault') {
    return (
      <VaultViewer
        maxStorageMB={maxStorageMB}
        vaultJobCount={vaultJobCount}
        onStorageChange={onStorageChange}
      />
    );
  }

  const isPdfFile =
    files.length > 0 &&
    (files[0].mimeType === 'application/pdf' || files[0].name.toLowerCase().endsWith('.pdf'));

  return (
    <main
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={`flex-1 h-full flex flex-col bg-surface-bg overflow-hidden relative ${
        isDragOverCanvas && files.length > 0 ? 'ring-2 ring-accent-solid ring-inset' : ''
      } ${files.length > 0 ? 'pb-28 md:pb-0' : 'pb-16 md:pb-0'}`}
    >
      {/* Hidden file input for "+ Add More" button */}
      <input
        ref={hiddenInputRef}
        type="file"
        multiple={
          effectiveTool !== 'split-pdf' &&
          effectiveTool !== 'pdf-to-jpg' &&
          effectiveTool !== 'pdf-to-png' &&
          effectiveTool !== 'pdf-to-webp' &&
          effectiveTool !== 'word-to-pdf' &&
          effectiveTool !== 'word-to-html' &&
          effectiveTool !== 'word-to-txt' &&
          effectiveTool !== 'excel-to-pdf' &&
          effectiveTool !== 'excel-to-csv' &&
          effectiveTool !== 'csv-to-excel' &&
          effectiveTool !== 'pptx-to-pdf' &&
          effectiveTool !== 'office-media'
        }
        accept={acceptedTypes}
        className="hidden"
        onChange={handleHiddenFileChange}
      />

      {/* Discreet floating drag indicator when user is actively dragging files */}
      {isDragOverCanvas && files.length > 0 && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-50 pointer-events-none flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-accent-solid text-white font-mono text-xs font-semibold shadow-lg animate-in fade-in zoom-in-95 duration-100">
          <UploadCloud size={15} strokeWidth={2.2} />
          <span>Lepaskan berkas untuk menambahkan</span>
        </div>
      )}

      {/* Error Banner */}
      {errorMessage && (
        <div className="m-4 mb-0 p-3 rounded bg-red-950/40 border border-status-err/40 text-status-err flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2">
            <AlertCircle size={15} strokeWidth={1.5} className="shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={onClearError}
            className="text-text-muted hover:text-text-primary underline cursor-pointer"
          >
            TUTUP
          </button>
        </div>
      )}

      {/* Main Work Area */}
      {files.length === 0 ? (
        <Dropzone
          toolType={toolType}
          onFilesSelected={onFilesSelected}
          onSelectTool={onSelectTool}
        />
      ) : (
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          {/* Target Format Selector Bar */}
          {targets.length > 0 && (
            <TargetSelector
              targets={targets}
              selectedTargetId={selectedTargetId}
              onSelectTarget={onSelectTarget}
              inputTypeLabel={inputTypeLabel}
              fileCountLabel={fileCountLabel}
              onOpenParams={onOpenParams}
            />
          )}

          {/* If tool is Split PDF and loaded file is PDF, show visual Splitter grid */}
          {effectiveTool === 'split-pdf' && isPdfFile ? (
            <PdfPageSplitter
              sourceFile={files[0]}
              pageRange={pageRange}
              onPageRangeChange={onPageRangeChange}
              onChangePdf={() => hiddenInputRef.current?.click()}
              onFilesSelected={onFilesSelected}
            />
          ) : (
            <FileList
              files={files}
              toolType={effectiveTool}
              onRemoveFile={onRemoveFile}
              onClearFiles={onClearFiles}
              onMoveFile={onMoveFile}
              onAddFilesClick={() => hiddenInputRef.current?.click()}
              onFilesDropped={onFilesSelected}
            />
          )}
        </div>
      )}

      {/* Success Result Banner */}
      {conversionResult && (
        <ResultBanner
          result={conversionResult}
          onDismiss={onDismissResult}
          onViewInVault={onViewInVault}
          onOpenPromo={onOpenPromo}
        />
      )}
    </main>
  );
};

