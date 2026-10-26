import { useState, useEffect, useCallback, useMemo } from 'react';
import { Sliders } from 'lucide-react';
import type {
  ToolType,
  SourceFile,
  ConversionOptions,
  ConversionProgressState,
  ConversionResult,
  SupportedMimeType,
} from './types';
import { LeftRail } from './components/LeftRail';
import { CenterCanvas } from './components/CenterCanvas';
import { RightInspector } from './components/RightInspector';
import {
  imagesToPdf,
  pdfToImages,
  mergePdfs,
  splitPdf,
  inspectPdf,
  generateFileThumbnail,
} from './services/pdfEngine';
import { batchConvertImages } from './services/imageEngine';
import {
  wordToPdf,
  wordToHtml,
  wordToTxt,
  excelToPdf,
  excelToCsv,
  csvToExcel,
  pptxToPdf,
  extractOfficeMedia,
} from './services/officeEngine';
import {
  getAppSettings,
  updateAppSettings,
  saveConversionJob,
  getStorageUsageBytes,
} from './db/vaultDb';
import { generateDefaultFilename, getExecutionCtaState, downloadBlob } from './utils/formatters';
import { getToolFromPath, navigateToTool } from './utils/router';
import { ExportPromoModal } from './components/ExportPromoModal';
import {
  getAvailableTargets,
  getInputTypeSummary,
  type TargetOption,
} from './utils/conversionTargets';

const DEFAULT_OPTIONS: ConversionOptions = {
  pageSize: 'fit',
  orientation: 'portrait',
  margin: 'none',
  format: 'image/jpeg',
  renderScale: 2.0,
  jpgQuality: 0.90,
  webpQuality: 0.85,
  pageRange: 'all',
  targetImageFormat: 'image/webp',
  outputTitle: '',
};

export function App() {
  const [activeTool, setActiveTool] = useState<ToolType>(() => getToolFromPath(window.location.pathname));
  const [smartTargetId, setSmartTargetId] = useState<string>('');
  const [files, setFiles] = useState<SourceFile[]>([]);
  const [options, setOptions] = useState<ConversionOptions>(DEFAULT_OPTIONS);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showMobileParams, setShowMobileParams] = useState(false);
  const [progress, setProgress] = useState<ConversionProgressState>({
    isProcessing: false,
    currentPage: 0,
    totalPages: 0,
    statusMessage: '',
    percentage: 0,
  });
  const [conversionResult, setConversionResult] = useState<ConversionResult | null>(null);
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Vault state
  const [autoSaveToVault, setAutoSaveToVault] = useState(true);
  const [vaultUsageBytes, setVaultUsageBytes] = useState(0);
  const [vaultJobCount, setVaultJobCount] = useState(0);
  const [maxStorageMB, setMaxStorageMB] = useState(500);

  // Network state
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  // Compute dynamic conversion targets based on currently loaded files
  const availableTargets = useMemo(() => getAvailableTargets(files), [files]);
  const inputSummary = useMemo(() => getInputTypeSummary(files), [files]);

  // Determine active target option in smart mode
  const activeTargetOption = useMemo(() => {
    return availableTargets.find(t => t.id === smartTargetId) || availableTargets[0];
  }, [availableTargets, smartTargetId]);

  // Effective tool type: if in smart hub, use activeTargetOption's toolType; otherwise activeTool
  const effectiveTool: Exclude<ToolType, 'vault' | 'smart'> = useMemo(() => {
    if (activeTool === 'smart') {
      return (activeTargetOption?.toolType || 'img-to-pdf');
    }
    return (activeTool as Exclude<ToolType, 'vault' | 'smart'>);
  }, [activeTool, activeTargetOption]);

  // Source PDF page count for range validation
  const sourcePdfPageCount = files.length > 0 ? files[0].pageCount || 0 : 0;

  // Compute execution state for mobile action bar
  const mobileCtaState = useMemo(() => {
    return getExecutionCtaState(
      effectiveTool,
      files.length,
      isProcessing,
      sourcePdfPageCount,
      options.pageRange,
      options.targetImageFormat
    );
  }, [
    effectiveTool,
    files.length,
    isProcessing,
    sourcePdfPageCount,
    options.pageRange,
    options.targetImageFormat,
  ]);

  // When files change, sync smartTargetId to a valid option
  useEffect(() => {
    if (availableTargets.length > 0) {
      const exists = availableTargets.some(t => t.id === smartTargetId);
      if (!exists) {
        const defaultTarget = availableTargets[0];
        setSmartTargetId(defaultTarget.id);
        if (defaultTarget.format) {
          setOptions(prev => ({ ...prev, format: defaultTarget.format! }));
        }
        if (defaultTarget.targetImageFormat) {
          setOptions(prev => ({ ...prev, targetImageFormat: defaultTarget.targetImageFormat! }));
        }
      }
    }
  }, [availableTargets, smartTargetId]);

  // Load initial settings and vault storage stats
  const refreshStorageStats = useCallback(async () => {
    try {
      const stats = await getStorageUsageBytes();
      setVaultUsageBytes(stats.usedBytes);
      setVaultJobCount(stats.jobCount);
    } catch (err) {
      console.error('Failed to load storage stats:', err);
    }
  }, []);

  useEffect(() => {
    async function initSettings() {
      const settings = await getAppSettings();
      setAutoSaveToVault(settings.autoSaveToVault);
      setMaxStorageMB(settings.maxVaultStorageMB);
      setOptions(prev => ({
        ...prev,
        jpgQuality: settings.defaultJpgQuality,
        webpQuality: settings.defaultWebpQuality || 0.85,
        renderScale: settings.defaultRenderScale as any,
      }));
      await refreshStorageStats();
    }
    initSettings();

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [refreshStorageStats]);

  // Sync format with active/effective tool
  useEffect(() => {
    const currentMode = activeTool === 'smart' ? effectiveTool : activeTool;

    if (currentMode === 'pdf-to-jpg') {
      setOptions(prev => ({ ...prev, format: 'image/jpeg' }));
    } else if (currentMode === 'pdf-to-png') {
      setOptions(prev => ({ ...prev, format: 'image/png' }));
    } else if (currentMode === 'pdf-to-webp') {
      setOptions(prev => ({ ...prev, format: 'image/webp' }));
    } else if (currentMode === 'img-to-webp') {
      setOptions(prev => ({ ...prev, targetImageFormat: 'image/webp' }));
    } else if (currentMode === 'webp-to-img' && !options.targetImageFormat) {
      setOptions(prev => ({ ...prev, targetImageFormat: 'image/png' }));
    }
    setConversionResult(null);
    setErrorMessage(null);
  }, [activeTool, effectiveTool]);

  // Automatically update default output filename when files or effective tool change
  useEffect(() => {
    if (files.length > 0 && !options.outputTitle) {
      const defaultName = generateDefaultFilename(files, effectiveTool);
      setOptions(prev => ({ ...prev, outputTitle: defaultName }));
    }
  }, [files, effectiveTool, options.outputTitle]);

  // Handle files selection with thumbnail & metadata extraction
  const handleFilesSelected = useCallback(async (newFiles: File[]) => {
    setErrorMessage(null);
    const newSourceFiles: SourceFile[] = [];

    for (const file of newFiles) {
      const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

      let pageCount: number | undefined;
      let previewUrl = '';

      if (isPdf) {
        try {
          const info = await inspectPdf(file);
          if (info.isEncrypted) {
            setErrorMessage(`"${file.name}" diproteksi kata sandi. Harap buka kuncinya terlebih dahulu.`);
            continue;
          }
          pageCount = info.pageCount;
          previewUrl = await generateFileThumbnail(file);
        } catch (err: unknown) {
          console.warn('PDF inspection failed:', err);
          previewUrl = '';
        }
      } else {
        previewUrl = await generateFileThumbnail(file);
      }

      newSourceFiles.push({
        id,
        file,
        name: file.name,
        sizeBytes: file.size,
        mimeType: file.type,
        previewUrl,
        pageCount,
      });
    }

    if (newSourceFiles.length === 0) return;

    // For single-file tools, replace; for multi-file tools, append
    const isSingleFileTool =
      activeTool === 'split-pdf' ||
      activeTool === 'pdf-to-jpg' ||
      activeTool === 'pdf-to-png' ||
      activeTool === 'pdf-to-webp' ||
      activeTool === 'word-to-pdf' ||
      activeTool === 'word-to-html' ||
      activeTool === 'word-to-txt' ||
      activeTool === 'excel-to-pdf' ||
      activeTool === 'excel-to-csv' ||
      activeTool === 'csv-to-excel' ||
      activeTool === 'pptx-to-pdf' ||
      activeTool === 'office-media';

    if (isSingleFileTool) {
      setFiles([newSourceFiles[0]]);
      setOptions(prev => ({
        ...prev,
        outputTitle: generateDefaultFilename([newSourceFiles[0]], activeTool),
      }));
    } else {
      setFiles(prev => {
        const combined = [...prev, ...newSourceFiles];
        setOptions(opt => ({
          ...opt,
          outputTitle: generateDefaultFilename(combined, activeTool === 'smart' ? effectiveTool : activeTool),
        }));
        return combined;
      });
    }
  }, [activeTool, effectiveTool]);

  // Tool Switcher with automatic file type validation and URL routing
  const handleSelectTool = useCallback((newTool: ToolType, pushHistory = true) => {
    setActiveTool(newTool);
    setConversionResult(null);
    setErrorMessage(null);

    if (pushHistory) {
      navigateToTool(newTool);
    }

    if (newTool === 'vault' || newTool === 'smart') return;

    const isNewToolAllImages = newTool === 'img-to-pdf' || newTool === 'img-to-webp';
    const isNewToolWebpOnly = newTool === 'webp-to-img';
    const isWord = newTool === 'word-to-pdf' || newTool === 'word-to-html' || newTool === 'word-to-txt';
    const isExcel = newTool === 'excel-to-pdf' || newTool === 'excel-to-csv';
    const isCsv = newTool === 'csv-to-excel';
    const isPptx = newTool === 'pptx-to-pdf';
    const isMedia = newTool === 'office-media';

    setFiles(prev => {
      // Filter existing files to only retain those compatible with the selected tool
      const compatible = prev.filter(f => {
        const ext = f.name.split('.').pop()?.toLowerCase() || '';
        const isWebp = f.file.type === 'image/webp' || ext === 'webp';
        const isImg = f.file.type.startsWith('image/') || ['jpg', 'jpeg', 'png', 'webp'].includes(ext);
        const isPdf = f.file.type === 'application/pdf' || ext === 'pdf';

        if (isNewToolAllImages) return isImg;
        if (isNewToolWebpOnly) return isWebp;
        if (isWord) return ext === 'docx' || ext === 'doc';
        if (isExcel) return ['xlsx', 'xls', 'csv'].includes(ext);
        if (isCsv) return ext === 'csv';
        if (isPptx) return ext === 'pptx' || ext === 'ppt';
        if (isMedia) return ['docx', 'pptx'].includes(ext);
        // PDF tools
        return isPdf;
      });

      // For single-file tools, retain at most 1 file
      const isSingle =
        newTool === 'pdf-to-jpg' ||
        newTool === 'pdf-to-png' ||
        newTool === 'pdf-to-webp' ||
        newTool === 'split-pdf' ||
        newTool === 'word-to-pdf' ||
        newTool === 'word-to-html' ||
        newTool === 'word-to-txt' ||
        newTool === 'excel-to-pdf' ||
        newTool === 'excel-to-csv' ||
        newTool === 'csv-to-excel' ||
        newTool === 'pptx-to-pdf' ||
        newTool === 'office-media';

      if (isSingle) {
        const single = compatible.slice(0, 1);
        setOptions(opt => ({
          ...opt,
          outputTitle: single.length > 0 ? generateDefaultFilename(single, newTool) : '',
        }));
        return single;
      }

      setOptions(opt => ({
        ...opt,
        outputTitle: compatible.length > 0 ? generateDefaultFilename(compatible, newTool) : '',
      }));
      return compatible;
    });
  }, []);

  // Handle target format selection from the dynamic TargetSelector bar
  const handleSelectTarget = useCallback((target: TargetOption) => {
    if (activeTool === 'smart') {
      setSmartTargetId(target.id);
      if (target.format) {
        setOptions(prev => ({ ...prev, format: target.format! }));
      }
      if (target.targetImageFormat) {
        setOptions(prev => ({ ...prev, targetImageFormat: target.targetImageFormat! }));
      }
      if (files.length > 0) {
        setOptions(prev => ({
          ...prev,
          outputTitle: generateDefaultFilename(files, target.toolType),
        }));
      }
    } else {
      // In dedicated route, smoothly transition to that tool
      handleSelectTool(target.toolType);
      if (target.format) {
        setOptions(prev => ({ ...prev, format: target.format! }));
      }
      if (target.targetImageFormat) {
        setOptions(prev => ({ ...prev, targetImageFormat: target.targetImageFormat! }));
      }
    }
    setConversionResult(null);
    setErrorMessage(null);
  }, [activeTool, files, handleSelectTool]);

  // Synchronize route and document title on mount & listen to popstate
  useEffect(() => {
    navigateToTool(activeTool, true);

    const handlePopState = () => {
      const toolFromUrl = getToolFromPath(window.location.pathname);
      handleSelectTool(toolFromUrl, false);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [activeTool, handleSelectTool]);

  // Global Clipboard Paste Listener (Ctrl+V image upload)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (isProcessing) return;
      // Do not intercept paste if user is typing in a text input or textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      const items = e.clipboardData?.items;
      if (!items) return;

      const pastedImageFiles: File[] = [];
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile();
          if (file) {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const ext = file.type === 'image/jpeg' ? 'jpg' : file.type === 'image/webp' ? 'webp' : 'png';
            const renamed = new File([file], `pasted_image_${timestamp}.${ext}`, {
              type: file.type || 'image/png',
            });
            pastedImageFiles.push(renamed);
          }
        }
      }

      if (pastedImageFiles.length > 0) {
        if (activeTool !== 'smart' && activeTool !== 'img-to-pdf' && activeTool !== 'img-to-webp') {
          setActiveTool('img-to-pdf');
        }
        handleFilesSelected(pastedImageFiles);
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [activeTool, handleFilesSelected, isProcessing]);

  // File removal and memory cleanup
  const handleRemoveFile = (id: string) => {
    setFiles(prev => {
      const removed = prev.find(f => f.id === id);
      if (removed?.previewUrl) {
        URL.revokeObjectURL(removed.previewUrl);
      }
      const remaining = prev.filter(f => f.id !== id);
      if (remaining.length === 0) {
        setConversionResult(null);
        setOptions(opt => ({ ...opt, outputTitle: '' }));
      }
      return remaining;
    });
  };

  const handleClearFiles = () => {
    files.forEach(f => {
      if (f.previewUrl) URL.revokeObjectURL(f.previewUrl);
    });
    setFiles([]);
    setConversionResult(null);
    setOptions(opt => ({ ...opt, outputTitle: '' }));
  };

  const handleMoveFile = (index: number, direction: 'up' | 'down') => {
    setFiles(prev => {
      const next = [...prev];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= next.length) return prev;
      const temp = next[index];
      next[index] = next[targetIndex];
      next[targetIndex] = temp;
      return next;
    });
  };

  const handleAutoSaveToggle = async (val: boolean) => {
    setAutoSaveToVault(val);
    await updateAppSettings({ autoSaveToVault: val });
  };

  // Execute Conversion
  const handleExecute = async () => {
    if (files.length === 0 || isProcessing) return;

    setIsProcessing(true);
    setErrorMessage(null);
    setConversionResult(null);

    const onProgress = (current: number, total: number, message: string) => {
      setProgress({
        isProcessing: true,
        currentPage: current,
        totalPages: total,
        statusMessage: message,
        percentage: total > 0 ? Math.round((current / total) * 100) : 0,
      });
    };

    try {
      let outputBlob: Blob;
      let outputMimeType: SupportedMimeType = 'application/pdf';
      let pageCount = 1;
      let isZip = false;
      let finalFilename = options.outputTitle.trim();
      if (!finalFilename) {
        finalFilename = generateDefaultFilename(files, effectiveTool);
      }

      const originalTotalBytes = files.reduce((acc, f) => acc + f.sizeBytes, 0);

      if (effectiveTool === 'img-to-pdf') {
        const result = await imagesToPdf(
          files.map(f => f.file),
          {
            pageSize: options.pageSize,
            orientation: options.orientation,
            margin: options.margin,
          },
          onProgress
        );
        outputBlob = result.blob;
        pageCount = result.pageCount;
        outputMimeType = 'application/pdf';
        if (!finalFilename.toLowerCase().endsWith('.pdf')) {
          finalFilename += '.pdf';
        }
      } else if (
        effectiveTool === 'pdf-to-jpg' ||
        effectiveTool === 'pdf-to-png' ||
        effectiveTool === 'pdf-to-webp'
      ) {
        const quality = effectiveTool === 'pdf-to-webp' ? options.webpQuality : options.jpgQuality;
        const result = await pdfToImages(
          files[0].file,
          {
            format: options.format,
            renderScale: options.renderScale,
            jpgQuality: quality,
            pageRange: options.pageRange,
          },
          onProgress
        );
        outputBlob = result.blob;
        isZip = result.isZip;
        pageCount = result.pageCount;
        outputMimeType = isZip ? 'application/zip' : options.format;
        const ext = isZip
          ? '.zip'
          : options.format === 'image/jpeg'
          ? '.jpg'
          : options.format === 'image/webp'
          ? '.webp'
          : '.png';
        if (!isZip && finalFilename.toLowerCase().endsWith('.zip')) {
          finalFilename = finalFilename.replace(/\.zip$/i, ext);
        } else if (!finalFilename.toLowerCase().endsWith(ext)) {
          finalFilename += ext;
        }
      } else if (effectiveTool === 'img-to-webp') {
        const result = await batchConvertImages(
          files.map(f => f.file),
          {
            targetFormat: 'image/webp',
            quality: options.webpQuality,
          },
          onProgress
        );
        outputBlob = result.blob;
        isZip = result.isZip;
        pageCount = result.count;
        outputMimeType = isZip ? 'application/zip' : 'image/webp';
        const ext = isZip ? '.zip' : '.webp';
        if (!isZip && finalFilename.toLowerCase().endsWith('.zip')) {
          finalFilename = finalFilename.replace(/\.zip$/i, ext);
        } else if (!finalFilename.toLowerCase().endsWith(ext)) {
          finalFilename += ext;
        }
      } else if (effectiveTool === 'webp-to-img') {
        const result = await batchConvertImages(
          files.map(f => f.file),
          {
            targetFormat: options.targetImageFormat,
            quality: options.jpgQuality,
          },
          onProgress
        );
        outputBlob = result.blob;
        isZip = result.isZip;
        pageCount = result.count;
        outputMimeType = isZip ? 'application/zip' : options.targetImageFormat;
        const targetExt = options.targetImageFormat === 'image/jpeg' ? '.jpg' : '.png';
        const ext = isZip ? '.zip' : targetExt;
        if (!isZip && finalFilename.toLowerCase().endsWith('.zip')) {
          finalFilename = finalFilename.replace(/\.zip$/i, ext);
        } else if (!finalFilename.toLowerCase().endsWith(ext)) {
          finalFilename += ext;
        }
      } else if (effectiveTool === 'merge-pdf') {
        const result = await mergePdfs(
          files.map(f => f.file),
          onProgress
        );
        outputBlob = result.blob;
        pageCount = result.pageCount;
        outputMimeType = 'application/pdf';
        if (!finalFilename.toLowerCase().endsWith('.pdf')) {
          finalFilename += '.pdf';
        }
      } else if (effectiveTool === 'split-pdf') {
        const result = await splitPdf(files[0].file, options.pageRange, onProgress);
        outputBlob = result.blob;
        pageCount = result.pageCount;
        outputMimeType = 'application/pdf';
        if (!finalFilename.toLowerCase().endsWith('.pdf')) {
          finalFilename += '.pdf';
        }
      } else if (effectiveTool === 'word-to-pdf') {
        const result = await wordToPdf(files[0].file, onProgress);
        outputBlob = result.blob;
        pageCount = result.pageCount;
        outputMimeType = 'application/pdf';
        if (!finalFilename.toLowerCase().endsWith('.pdf')) {
          finalFilename += '.pdf';
        }
      } else if (effectiveTool === 'word-to-html') {
        const result = await wordToHtml(files[0].file, onProgress);
        outputBlob = result.blob;
        outputMimeType = 'text/html';
        if (!finalFilename.toLowerCase().endsWith('.html')) {
          finalFilename += '.html';
        }
      } else if (effectiveTool === 'word-to-txt') {
        const result = await wordToTxt(files[0].file, onProgress);
        outputBlob = result.blob;
        outputMimeType = 'text/plain';
        if (!finalFilename.toLowerCase().endsWith('.txt')) {
          finalFilename += '.txt';
        }
      } else if (effectiveTool === 'excel-to-pdf') {
        const result = await excelToPdf(files[0].file, onProgress);
        outputBlob = result.blob;
        pageCount = result.pageCount;
        outputMimeType = 'application/pdf';
        if (!finalFilename.toLowerCase().endsWith('.pdf')) {
          finalFilename += '.pdf';
        }
      } else if (effectiveTool === 'excel-to-csv') {
        const result = await excelToCsv(files[0].file, onProgress);
        outputBlob = result.blob;
        outputMimeType = 'text/csv';
        if (!finalFilename.toLowerCase().endsWith('.csv')) {
          finalFilename += '.csv';
        }
      } else if (effectiveTool === 'csv-to-excel') {
        const result = await csvToExcel(files[0].file, onProgress);
        outputBlob = result.blob;
        outputMimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        if (!finalFilename.toLowerCase().endsWith('.xlsx')) {
          finalFilename += '.xlsx';
        }
      } else if (effectiveTool === 'pptx-to-pdf') {
        const result = await pptxToPdf(files[0].file, onProgress);
        outputBlob = result.blob;
        pageCount = result.pageCount;
        outputMimeType = 'application/pdf';
        if (!finalFilename.toLowerCase().endsWith('.pdf')) {
          finalFilename += '.pdf';
        }
      } else if (effectiveTool === 'office-media') {
        const result = await extractOfficeMedia(files[0].file, onProgress);
        outputBlob = result.blob;
        isZip = true;
        pageCount = result.pageCount;
        outputMimeType = 'application/zip';
        if (!finalFilename.toLowerCase().endsWith('.zip')) {
          finalFilename += '.zip';
        }
      } else {
        throw new Error('Alat konversi belum didukung.');
      }

      // Save to IndexedDB if auto-save enabled
      const jobUUID = `job-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      let savedToVault = false;

      if (autoSaveToVault) {
        try {
          await saveConversionJob(
            {
              jobUUID,
              title: finalFilename,
              toolType: effectiveTool,
              originalTotalBytes,
              outputBytes: outputBlob.size,
              pageCount,
              outputBlob,
              mimeType: outputMimeType,
              isPinned: false,
              createdAt: new Date(),
            },
            files.map(f => ({
              name: f.name,
              sizeBytes: f.sizeBytes,
              mimeType: f.mimeType,
            }))
          );
          savedToVault = true;
          await refreshStorageStats();
        } catch (dbErr) {
          console.error('Failed to save to Vault:', dbErr);
        }
      }

      const downloadUrl = URL.createObjectURL(outputBlob);
      setConversionResult({
        jobUUID,
        blob: outputBlob,
        filename: finalFilename,
        mimeType: outputMimeType,
        outputBytes: outputBlob.size,
        originalTotalBytes,
        pageCount,
        isZip,
        downloadUrl,
        savedToVault,
      });
      setShowPromoModal(true);
    } catch (err: unknown) {
      console.error('Conversion failed:', err);
      setErrorMessage(err instanceof Error ? err.message : 'Konversi gagal secara tidak terduga.');
    } finally {
      setIsProcessing(false);
      setProgress({
        isProcessing: false,
        currentPage: 0,
        totalPages: 0,
        statusMessage: '',
        percentage: 0,
      });
    }
  };

  return (
    <div className="flex flex-col md:flex-row w-screen h-screen overflow-hidden bg-surface-bg text-text-primary antialiased">
      {/* Left Rail (Desktop Sidebar & Mobile Bottom Navigation Bar) */}
      <LeftRail
        activeTool={activeTool}
        onSelectTool={handleSelectTool}
        vaultUsageBytes={vaultUsageBytes}
        vaultJobCount={vaultJobCount}
        maxStorageMB={maxStorageMB}
        isOffline={isOffline}
      />

      {/* Center Canvas (flex-1) */}
      <CenterCanvas
        toolType={activeTool}
        effectiveTool={effectiveTool}
        files={files}
        targets={availableTargets}
        selectedTargetId={activeTool === 'smart' ? (activeTargetOption?.id || '') : activeTool}
        onSelectTarget={handleSelectTarget}
        inputTypeLabel={inputSummary.typeLabel}
        fileCountLabel={inputSummary.countLabel}
        onFilesSelected={handleFilesSelected}
        onRemoveFile={handleRemoveFile}
        onClearFiles={handleClearFiles}
        onMoveFile={handleMoveFile}
        errorMessage={errorMessage}
        onClearError={() => setErrorMessage(null)}
        conversionResult={conversionResult}
        onDismissResult={() => setConversionResult(null)}
        onViewInVault={() => handleSelectTool('vault')}
        maxStorageMB={maxStorageMB}
        vaultJobCount={vaultJobCount}
        onStorageChange={refreshStorageStats}
        onOpenParams={() => setShowMobileParams(true)}
        pageRange={options.pageRange}
        onPageRangeChange={newRange => setOptions(prev => ({ ...prev, pageRange: newRange }))}
        onOpenPromo={() => setShowPromoModal(true)}
        onSelectTool={handleSelectTool}
      />

      {/* Right Inspector (Parameters) - Appears ONLY when user has input file(s) */}
      {files.length > 0 && activeTool !== 'vault' && (
        <>
          {/* Desktop Right Sidebar (hidden on mobile) */}
          <RightInspector
            toolType={effectiveTool}
            options={options}
            onOptionsChange={newOptions => setOptions(prev => ({ ...prev, ...newOptions }))}
            files={files}
            isProcessing={isProcessing}
            progress={progress}
            onExecute={handleExecute}
            autoSaveToVault={autoSaveToVault}
            onAutoSaveToggle={handleAutoSaveToggle}
          />

          {/* Mobile Bottom Action Bar (Fixed above bottom navigation) */}
          <div className="md:hidden fixed bottom-14 left-0 right-0 z-30 bg-surface-panel/95 backdrop-blur border-t border-border-subtle p-2.5 flex items-center gap-2 select-none shadow-lg">
            <button
              type="button"
              onClick={() => setShowMobileParams(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded bg-surface-elevated hover:bg-surface-elevated/80 border border-border-subtle text-xs font-mono text-text-primary shrink-0 cursor-pointer"
              aria-label="Buka pengaturan parameter"
            >
              <Sliders size={14} className="text-accent-solid" strokeWidth={1.8} />
              <span>PENGATURAN</span>
            </button>
            <button
              type="button"
              disabled={!mobileCtaState.canExecute || isProcessing}
              onClick={handleExecute}
              className={`flex-1 py-2 px-3 rounded font-mono text-xs font-bold tracking-wide uppercase transition-colors truncate cursor-pointer ${
                mobileCtaState.canExecute && !isProcessing
                  ? 'bg-accent-solid hover:bg-accent-hover text-white shadow-xs'
                  : 'bg-surface-elevated text-text-muted border border-border-subtle opacity-60 cursor-not-allowed'
              }`}
            >
              {mobileCtaState.ctaLabel}
            </button>
          </div>

          {/* Mobile Parameters Slide-Up Drawer */}
          {showMobileParams && (
            <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end bg-black/75 backdrop-blur-xs">
              <div
                className="absolute inset-0"
                onClick={() => setShowMobileParams(false)}
                aria-label="Tutup laci parameter"
              />
              <div className="relative z-10 w-full max-h-[85vh] bg-surface-panel border-t border-border-subtle rounded-t-lg shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-200">
                <RightInspector
                  toolType={effectiveTool}
                  options={options}
                  onOptionsChange={newOptions => setOptions(prev => ({ ...prev, ...newOptions }))}
                  files={files}
                  isProcessing={isProcessing}
                  progress={progress}
                  onExecute={() => {
                    setShowMobileParams(false);
                    handleExecute();
                  }}
                  autoSaveToVault={autoSaveToVault}
                  onAutoSaveToggle={handleAutoSaveToggle}
                  isMobileDrawer={true}
                  onClose={() => setShowMobileParams(false)}
                />
              </div>
            </div>
          )}
        </>
      )}

      {/* Watermark & Promotional Popover Modal (Muncul otomatis setelah ekspor berkas) */}
      <ExportPromoModal
        isOpen={showPromoModal}
        onClose={() => setShowPromoModal(false)}
        result={conversionResult}
        onDownload={() => {
          if (conversionResult) {
            downloadBlob(conversionResult.blob, conversionResult.filename);
          }
        }}
      />
    </div>
  );
}

export default App;
