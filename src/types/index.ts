export type ToolType =
  | 'smart'
  | 'img-to-pdf'
  | 'pdf-to-jpg'
  | 'pdf-to-png'
  | 'pdf-to-webp'
  | 'img-to-webp'
  | 'webp-to-img'
  | 'merge-pdf'
  | 'split-pdf'
  | 'word-to-pdf'
  | 'word-to-html'
  | 'word-to-txt'
  | 'excel-to-pdf'
  | 'excel-to-csv'
  | 'csv-to-excel'
  | 'pptx-to-pdf'
  | 'office-media'
  | 'vault';

export type SupportedMimeType =
  | 'application/pdf'
  | 'application/zip'
  | 'image/jpeg'
  | 'image/png'
  | 'image/webp'
  | 'text/html'
  | 'text/plain'
  | 'text/csv'
  | 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

export type PageSize = 'fit' | 'a4' | 'letter';
export type PageOrientation = 'portrait' | 'landscape';
export type PageMargin = 'none' | 'small' | 'big';
export type RenderScale = 1.0 | 2.0 | 3.0; // 1x Standard (72 DPI), 2x High-Res (144 DPI), 3x Print (300 DPI)

export interface SourceFile {
  id: string; // internal UUID for tracking in list
  file: File;
  name: string;
  sizeBytes: number;
  mimeType: string;
  previewUrl?: string;
  pageCount?: number;
  dimensions?: { width: number; height: number };
}

export interface ConversionJob {
  id?: number;
  jobUUID: string;
  workspaceId?: string;
  title: string;
  toolType: Exclude<ToolType, 'vault' | 'smart'>;
  originalTotalBytes: number;
  outputBytes: number;
  pageCount: number;
  outputBlob: Blob;
  mimeType: SupportedMimeType;
  isPinned: boolean;
  createdAt: Date;
}

export interface JobInputFile {
  id?: number;
  jobId: number;
  originalName: string;
  sizeBytes: number;
  mimeType: string;
}

export interface AppSetting {
  key: 'singleton_config';
  autoSaveToVault: boolean;
  defaultJpgQuality: number;
  defaultWebpQuality: number;
  defaultRenderScale: number;
  maxVaultStorageMB: number;
}

export interface ConversionOptions {
  // Image to PDF options
  pageSize: PageSize;
  orientation: PageOrientation;
  margin: PageMargin;

  // PDF to Image & WebP options
  format: 'image/jpeg' | 'image/png' | 'image/webp';
  renderScale: RenderScale;
  jpgQuality: number; // 0.1 to 1.0
  webpQuality: number; // 0.1 to 1.0
  pageRange: string; // 'all' or '1-3, 5'

  // Image & WebP transcode options
  targetImageFormat: 'image/webp' | 'image/jpeg' | 'image/png';

  // Output title
  outputTitle: string;
}

export interface ConversionProgressState {
  isProcessing: boolean;
  currentPage: number;
  totalPages: number;
  statusMessage: string;
  percentage: number;
}

export interface ConversionResult {
  jobUUID: string;
  blob: Blob;
  filename: string;
  mimeType: SupportedMimeType;
  outputBytes: number;
  originalTotalBytes: number;
  pageCount: number;
  isZip: boolean;
  downloadUrl: string;
  savedToVault: boolean;
}
