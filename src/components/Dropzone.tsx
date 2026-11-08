import React, { useRef, useState } from 'react';
import {
  UploadCloud,
  FilePlus,
  Copy,
  Folder,
  Wifi,
  FileText,
  FileSpreadsheet,
  Presentation,
  Archive,
  Scissors,
  FolderSync,
  Layers,
  FileImage,
  ArrowRightLeft,
  Sparkles,
  ShieldCheck,
  Smartphone,
  FileCode,
  ArrowUpRight,
  ChevronDown,
  ArrowLeft,
  Lock,
} from 'lucide-react';
import type { ToolType } from '../types';
import { GoogleDriveButton } from './GoogleDriveButton';
import { SupportedFormatsBadge } from './SupportedFormatsBadge';
import { getToolMetadata, filterFilesForTool, getFormatRejectionMessage } from '../utils/toolMetadata';

interface DropzoneProps {
  toolType: ToolType;
  onFilesSelected: (files: File[]) => void;
  isCompact?: boolean;
  onSelectTool?: (tool: ToolType) => void;
  onError?: (errorMessage: string) => void;
}

export const Dropzone: React.FC<DropzoneProps> = ({
  toolType,
  onFilesSelected,
  isCompact = false,
  onSelectTool,
  onError,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const meta = getToolMetadata(toolType);
  const isSmart = toolType === 'smart';
  const acceptedTypes = meta.acceptAttribute;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files);
      filterAndEmitFiles(files);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      filterAndEmitFiles(files);
      e.target.value = '';
    }
  };

  const filterAndEmitFiles = (files: File[]) => {
    const { valid, rejected } = filterFilesForTool(files, toolType);

    if (rejected.length > 0 && onError) {
      onError(getFormatRejectionMessage(rejected, toolType));
    }

    if (valid.length > 0) {
      onFilesSelected(valid);
    }
  };

  // Compact variant for embedded strips
  if (isCompact) {
    return (
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`border border-dashed rounded p-3 flex items-center justify-between gap-3 cursor-pointer transition-colors ${
          isDragOver
            ? 'border-accent-solid bg-surface-elevated'
            : 'border-border-subtle hover:border-border-focus bg-surface-panel'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          multiple={meta.isMultiFile}
          accept={acceptedTypes}
          className="hidden"
          onChange={handleFileChange}
        />
        <div className="flex items-center gap-2 min-w-0">
          <FilePlus size={15} className="text-text-secondary shrink-0" strokeWidth={1.5} />
          <span className="text-xs font-mono text-text-secondary truncate">
            Klik atau tarik berkas ke sini ({meta.formats.map(f => `.${f.ext}`).join(', ')})
          </span>
        </div>
        <div onClick={e => e.stopPropagation()} className="shrink-0">
          <GoogleDriveButton onFilesSelected={filterAndEmitFiles} variant="minimal" />
        </div>
      </div>
    );
  }

  // Capability showcase directory with explicit supported format badges for each tool
  const capabilities = [
    {
      category: 'Fitur Spesial Administrasi & Keamanan (CPNS / KTP)',
      items: [
        {
          id: 'pasfoto' as ToolType,
          title: 'Pasfoto AI Studio',
          ext: 'GANTI LATAR & CROP',
          supportedFormats: ['JPG', 'PNG', 'WEBP'],
          desc: 'Ganti latar merah/biru otomatis via WebAssembly AI, auto-crop 2x3/3x4/4x6, & kunci target KB.',
          icon: <Sparkles size={18} className="text-pink-400" />,
        },
        {
          id: 'watermark' as ToolType,
          title: 'Watermark Pengaman KTP',
          ext: 'ANTI-PINJOL / PENIPUAN',
          supportedFormats: ['JPG', 'PNG', 'WEBP', 'PDF'],
          desc: 'Beri cap teks pengaman diagonal atau berulang pada scan foto KTP, KK, SIM, atau PDF.',
          icon: <ShieldCheck size={18} className="text-cyan-400" />,
        },
        {
          id: 'compress-pdf' as ToolType,
          title: 'Kunci Target KB (CPNS)',
          ext: 'KUNCI 195KB / 290KB / 480KB',
          supportedFormats: ['PDF'],
          desc: 'Kecilkan PDF & gambar tepat di bawah batas unggah SSCASN/BKN tanpa gagal sistem.',
          icon: <Archive size={18} className="text-amber-400" />,
        },
        {
          id: 'heic-to-img' as ToolType,
          title: 'Konverter Apple HEIC',
          ext: '.HEIC → JPG / PNG / PDF',
          supportedFormats: ['HEIC', 'HEIF'],
          desc: 'Ubah foto dari iPhone/iPad menjadi JPG/PNG universal atau satukan langsung ke PDF.',
          icon: <Smartphone size={18} className="text-emerald-400" />,
        },
      ],
    },
    {
      category: 'Alat Dokumen PDF Lengkap',
      items: [
        {
          id: 'pdf-to-docx' as ToolType,
          title: 'PDF ke Word (.docx)',
          ext: '.PDF → .DOCX',
          supportedFormats: ['PDF'],
          desc: 'Ekstrak teks, baris, dan struktur layout PDF ke dokumen Microsoft Word yang dapat diedit.',
          icon: <FileText size={18} className="text-blue-400" />,
        },
        {
          id: 'pdf-to-xlsx' as ToolType,
          title: 'PDF ke Excel (.xlsx)',
          ext: '.PDF → .XLSX',
          supportedFormats: ['PDF'],
          desc: 'Ekstrak tabel dan data spreadsheet PDF ke Microsoft Excel (.xlsx) per sheet halaman.',
          icon: <FileSpreadsheet size={18} className="text-emerald-400" />,
        },
        {
          id: 'pdf-to-pptx' as ToolType,
          title: 'PDF ke PowerPoint (.pptx)',
          ext: '.PDF → .PPTX',
          supportedFormats: ['PDF'],
          desc: 'Ubah lembaran PDF menjadi slide presentasi Microsoft PowerPoint (.pptx) beresolusi tinggi.',
          icon: <Presentation size={18} className="text-orange-400" />,
        },
        {
          id: 'compress-pdf' as ToolType,
          title: 'Kompres Ukuran PDF',
          ext: 'REDUKSI UKURAN',
          supportedFormats: ['PDF'],
          desc: 'Kecilkan ukuran dokumen PDF agar hemat kuota dan mudah dikirim via email/chat.',
          icon: <Archive size={18} className="text-amber-400" />,
        },
        {
          id: 'split-pdf' as ToolType,
          title: 'Pecah & Pratinjau PDF',
          ext: 'VISUAL SPLIT',
          supportedFormats: ['PDF'],
          desc: 'Lihat pratinjau thumbnail setiap halaman, centang halaman yang dipilih, & ekstrak.',
          icon: <Scissors size={18} className="text-accent-solid" />,
        },
        {
          id: 'merge-pdf' as ToolType,
          title: 'Gabungkan PDF',
          ext: 'MULTI-PDF → 1 PDF',
          supportedFormats: ['PDF'],
          desc: 'Satukan beberapa file PDF terpisah menjadi satu dokumen urut tanpa batasan.',
          icon: <FolderSync size={18} className="text-amber-400" />,
        },
        {
          id: 'img-to-pdf' as ToolType,
          title: 'Gambar ke PDF',
          ext: 'GAMBAR → .PDF',
          supportedFormats: ['JPG', 'PNG', 'WEBP', 'HEIC'],
          desc: 'Susun kumpulan foto atau hasil scan menjadi dokumen PDF A4/Letter/Fit.',
          icon: <FileImage size={18} className="text-cyan-400" />,
        },
        {
          id: 'pdf-to-jpg' as ToolType,
          title: 'PDF ke Gambar',
          ext: '.PDF → GAMBAR',
          supportedFormats: ['PDF'],
          desc: 'Ekstrak setiap halaman PDF menjadi gambar beresolusi tinggi (hingga 300 DPI).',
          icon: <Layers size={18} className="text-indigo-400" />,
        },
        {
          id: 'pdf-to-txt' as ToolType,
          title: 'Ekstrak Teks PDF',
          ext: '.PDF → .TXT',
          supportedFormats: ['PDF'],
          desc: 'Ekstrak seluruh teks murni UTF-8 dari PDF untuk pengolahan data atau prompt AI.',
          icon: <FileCode size={18} className="text-text-secondary" />,
        },
      ],
    },
    {
      category: 'Dokumen Microsoft Office',
      items: [
        {
          id: 'word-to-pdf' as ToolType,
          title: 'Word ke PDF',
          ext: '.DOCX → .PDF',
          supportedFormats: ['DOCX'],
          desc: 'Ubah dokumen Microsoft Word (.docx) menjadi berkas PDF rapi siap cetak.',
          icon: <FileText size={18} className="text-blue-400" />,
        },
        {
          id: 'excel-to-pdf' as ToolType,
          title: 'Excel ke PDF',
          ext: 'EXCEL → .PDF',
          supportedFormats: ['XLSX', 'XLS', 'CSV'],
          desc: 'Render tabel spreadsheet Excel menjadi lembar dokumen PDF bergaris rapi.',
          icon: <FileSpreadsheet size={18} className="text-emerald-400" />,
        },
        {
          id: 'pptx-to-pdf' as ToolType,
          title: 'PowerPoint ke PDF',
          ext: '.PPTX → .PDF',
          supportedFormats: ['PPTX'],
          desc: 'Ekstrak slide presentasi PowerPoint menjadi lembar halaman PDF.',
          icon: <Presentation size={18} className="text-orange-400" />,
        },
        {
          id: 'office-media' as ToolType,
          title: 'Ekstrak Media Dokumen',
          ext: 'OFFICE → .ZIP',
          supportedFormats: ['DOCX', 'PPTX'],
          desc: 'Ambil semua aset gambar & foto dari dalam dokumen Word atau PPTX dalam bentuk ZIP.',
          icon: <Archive size={18} className="text-purple-400" />,
        },
      ],
    },
    {
      category: 'Format & Optimasi Gambar',
      items: [
        {
          id: 'img-to-webp' as ToolType,
          title: 'Kompresi Gambar ke WebP',
          ext: 'JPG / PNG → .WEBP',
          supportedFormats: ['JPG', 'PNG'],
          desc: 'Perkecil ukuran berkas gambar secara drastis untuk website tanpa kehilangan kualitas.',
          icon: <Sparkles size={18} className="text-rose-400" />,
        },
        {
          id: 'webp-to-img' as ToolType,
          title: 'WebP ke JPG / PNG',
          ext: '.WEBP → JPG / PNG',
          supportedFormats: ['WEBP'],
          desc: 'Kembalikan format WebP ke format gambar standar agar kompatibel di semua aplikasi.',
          icon: <ArrowRightLeft size={18} className="text-yellow-400" />,
        },
      ],
    },
  ];

  // 1. SMART HUB / DASHBOARD VIEW
  if (isSmart) {
    return (
      <div className="flex-1 h-full overflow-y-auto p-2.5 sm:p-4 flex flex-col gap-6 select-none scroll-smooth">
        {/* Upload Hero Card - Takes full viewport height on initial load */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`min-h-[calc(100vh-5.5rem)] md:min-h-[calc(100vh-2.2rem)] border-2 border-dashed rounded-md p-6 sm:p-10 flex flex-col items-center justify-between cursor-pointer transition-colors relative shrink-0 ${
            isDragOver
              ? 'border-accent-solid bg-surface-elevated'
              : 'border-border-subtle hover:border-border-focus bg-surface-panel/40 hover:bg-surface-panel/60'
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            multiple
            accept={acceptedTypes}
            className="hidden"
            onChange={handleFileChange}
          />

          {/* Top subtle badge for vertical balance */}
          <div className="w-full flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-mono text-text-muted">
              <Lock size={12} className="text-accent-solid" />
              <span>100% Client-Side Privacy</span>
            </div>
            <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-surface-elevated text-accent-solid font-semibold border border-border-subtle">
              100% OFFLINE READY
            </span>
          </div>

          {/* Centered Main Drag & Drop Hero Box */}
          <div className="flex flex-col items-center max-w-lg text-center gap-4 my-auto">
            <div className="w-16 h-16 rounded-md bg-surface-panel border border-border-subtle flex items-center justify-center text-text-primary shadow-xs">
              <UploadCloud size={32} strokeWidth={1.5} className="text-accent-solid" />
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-lg sm:text-xl font-bold text-text-primary tracking-tight">
                Pilih atau Tarik Berkas ke Sini
              </span>
              <span className="text-xs sm:text-sm text-text-secondary leading-relaxed max-w-md">
                Konversi berkas PDF, Gambar, Excel, Word, atau PowerPoint secara cepat dan privat.
              </span>
            </div>

            {/* Format Information Chips */}
            <div className="flex flex-col items-center gap-1.5">
              <span className="text-[10px] font-mono uppercase text-text-muted">
                Format Berkas yang Didukung:
              </span>
              <div className="flex flex-wrap items-center justify-center gap-1.5">
                <span className="font-mono text-[10px] px-2.5 py-1 rounded bg-surface-panel border border-border-subtle text-accent-solid font-semibold">
                  .PDF
                </span>
                <span className="font-mono text-[10px] px-2.5 py-1 rounded bg-surface-panel border border-border-subtle text-blue-400 font-semibold">
                  .DOCX (WORD)
                </span>
                <span className="font-mono text-[10px] px-2.5 py-1 rounded bg-surface-panel border border-border-subtle text-pink-400 font-semibold flex items-center gap-1">
                  <Sparkles size={11} />
                  PASFOTO AI
                </span>
                <span className="font-mono text-[10px] px-2.5 py-1 rounded bg-surface-panel border border-border-subtle text-cyan-400 font-semibold flex items-center gap-1">
                  <ShieldCheck size={11} />
                  WATERMARK KTP
                </span>
                <span className="font-mono text-[10px] px-2.5 py-1 rounded bg-surface-panel border border-border-subtle text-amber-400 font-semibold">
                  KUNCI 195KB CPNS
                </span>
                <span className="font-mono text-[10px] px-2.5 py-1 rounded bg-surface-panel border border-border-subtle text-emerald-400 font-semibold">
                  .XLSX / .CSV
                </span>
                <span className="font-mono text-[10px] px-2.5 py-1 rounded bg-surface-panel border border-border-subtle text-orange-400 font-semibold">
                  .PPTX
                </span>
                <span className="font-mono text-[10px] px-2.5 py-1 rounded bg-surface-panel border border-border-subtle text-emerald-300">
                  .HEIC (APPLE)
                </span>
                <span className="font-mono text-[10px] px-2.5 py-1 rounded bg-surface-panel border border-border-subtle text-text-secondary">
                  .JPG / .PNG / .WEBP
                </span>
                <span className="font-mono text-[10px] px-2.5 py-1 rounded bg-surface-panel border border-border-subtle text-text-muted flex items-center gap-1">
                  <Copy size={11} strokeWidth={1.5} />
                  CTRL+V TEMPEL
                </span>
              </div>
            </div>

            {/* Action Buttons: Local File Explorer + Google Drive */}
            <div
              className="flex flex-wrap items-center justify-center gap-3 mt-2"
              onClick={e => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded bg-surface-panel hover:bg-surface-elevated border border-border-subtle hover:border-accent-solid/50 text-text-primary text-xs font-mono font-medium transition-all cursor-pointer shadow-xs active:scale-[0.98]"
                title="Pilih berkas dari komputer (Bisa Offline)"
              >
                <Folder size={16} className="text-accent-solid" strokeWidth={1.8} />
                <span>Pilih Berkas</span>
              </button>
              <GoogleDriveButton onFilesSelected={filterAndEmitFiles} variant="compact" />
            </div>

            {/* Info Box: Google Drive requires active data/internet */}
            <div className="mt-2 px-3 py-1.5 rounded-md bg-surface-panel border border-border-subtle flex items-center gap-2 text-[11px] font-mono text-text-secondary">
              <Wifi size={13} className="text-accent-solid shrink-0" strokeWidth={2} />
              <span>Khusus Google Drive: Pastikan koneksi internet / data aktif</span>
            </div>
          </div>

          {/* Bottom Scroll Indicator (Prompts user to scroll down for features) */}
          <div
            className="pt-2 pb-1 flex flex-col items-center gap-1 text-[11px] font-mono text-text-muted hover:text-accent-solid transition-colors cursor-pointer group"
            onClick={(e) => {
              e.stopPropagation();
              document.getElementById('features-catalog')?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            <span className="group-hover:underline">Gulir ke bawah untuk melihat daftar alat dan format berkas yang didukung</span>
            <ChevronDown size={16} className="text-accent-solid animate-bounce" />
          </div>
        </div>

        {/* Feature & Capability Directory Showcase */}
        <div id="features-catalog" className="flex flex-col gap-4 pb-8 pt-2">
          <div className="flex items-center justify-between pb-2 border-b border-border-subtle">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-accent-solid" />
              <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-text-primary">
                Katalog Alat & Format yang Didukung
              </h2>
            </div>
            <span className="text-[11px] font-mono text-text-muted hidden sm:inline">
              Klik kartu fitur untuk langsung membuka halamannya
            </span>
          </div>

          <div className="flex flex-col gap-5">
            {capabilities.map((cat, catIdx) => (
              <div key={catIdx} className="flex flex-col gap-2.5">
                <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-text-muted">
                  {cat.category}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                  {cat.items.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => onSelectTool?.(item.id)}
                      className="group p-3.5 rounded bg-surface-panel border border-border-subtle hover:border-accent-solid/60 hover:bg-surface-elevated transition-all flex flex-col justify-between gap-2.5 text-left cursor-pointer shadow-xs active:scale-[0.99]"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded bg-surface-bg border border-border-subtle flex items-center justify-center shrink-0 group-hover:border-accent-solid/40 transition-colors">
                            {item.icon}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-text-primary group-hover:text-accent-solid transition-colors">
                              {item.title}
                            </span>
                            <span className="font-mono text-[10px] text-accent-solid font-semibold">
                              {item.ext}
                            </span>
                          </div>
                        </div>
                        <ArrowUpRight size={14} className="text-text-muted group-hover:text-accent-solid transition-colors shrink-0" />
                      </div>

                      <p className="text-[11px] text-text-secondary leading-relaxed">
                        {item.desc}
                      </p>

                      {/* Explicit Supported Formats Badges */}
                      <div className="flex flex-col gap-1 pt-2 border-t border-border-subtle/50">
                        <span className="text-[10px] font-mono text-text-muted uppercase">
                          Mendukung Format:
                        </span>
                        <div className="flex flex-wrap items-center gap-1">
                          {item.supportedFormats.map(fmt => (
                            <span
                              key={fmt}
                              className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-surface-bg border border-border-subtle text-text-primary"
                            >
                              .{fmt}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="pt-1 flex items-center justify-end text-[10px] font-mono text-text-muted">
                        <span className="text-accent-solid font-medium group-hover:underline">Buka Alat →</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // 2. DEDICATED TOOL PAGE VIEW (toolType !== 'smart')
  // Shows rich tool hero, dropzone, and explicit format information
  return (
    <div className="flex-1 h-full overflow-y-auto p-3 sm:p-5 flex flex-col gap-4 select-none">
      {/* Top Header / Breadcrumb navigation */}
      <div className="flex items-center justify-between pb-2 border-b border-border-subtle shrink-0">
        <button
          type="button"
          onClick={() => onSelectTool?.('smart')}
          className="inline-flex items-center gap-1.5 text-xs font-mono text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
        >
          <ArrowLeft size={14} />
          <span>Kembali ke Semua Fitur</span>
        </button>

        <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-surface-elevated text-accent-solid font-semibold border border-border-subtle">
          {meta.badge}
        </span>
      </div>

      {/* Dedicated Tool Title Header */}
      <div className="flex flex-col items-center text-center gap-1.5 pt-1">
        <h1 className="text-lg sm:text-xl font-bold text-text-primary tracking-tight">
          {meta.title}
        </h1>
        <p className="text-xs sm:text-sm text-text-secondary max-w-lg leading-relaxed">
          {meta.description}
        </p>
      </div>

      {/* Main Drag & Drop Box */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-6 sm:p-8 flex flex-col items-center justify-center cursor-pointer transition-colors ${
          isDragOver
            ? 'border-accent-solid bg-surface-elevated'
            : 'border-border-subtle hover:border-border-focus bg-surface-panel/40 hover:bg-surface-panel/70'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          multiple={meta.isMultiFile}
          accept={acceptedTypes}
          className="hidden"
          onChange={handleFileChange}
        />

        <div className="flex flex-col items-center max-w-md text-center gap-3">
          <div className="w-14 h-14 rounded-md bg-surface-panel border border-border-subtle flex items-center justify-center text-text-primary shadow-xs">
            <UploadCloud size={28} strokeWidth={1.5} className="text-accent-solid" />
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-base font-bold text-text-primary tracking-tight">
              Pilih atau Tarik Berkas ke Sini
            </span>
            <span className="text-xs text-text-secondary leading-relaxed">
              Tarik berkas langsung atau klik tombol di bawah untuk memilih berkas dari perangkat Anda.
            </span>
          </div>

          {/* Quick Format Chips */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 mt-1">
            <span className="text-[10px] font-mono text-text-muted mr-1">FORMAT DITERIMA:</span>
            {meta.formats.map((f, idx) => (
              <span
                key={idx}
                className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${f.colorClass}`}
              >
                .{f.ext}
              </span>
            ))}
          </div>

          {/* Action Buttons: Local File Explorer + Google Drive */}
          <div
            className="flex flex-wrap items-center justify-center gap-2.5 mt-2"
            onClick={e => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded bg-surface-panel hover:bg-surface-elevated border border-border-subtle hover:border-accent-solid/50 text-text-primary text-xs font-mono font-medium transition-all cursor-pointer shadow-xs active:scale-[0.98]"
              title="Pilih berkas dari komputer (Bisa Offline)"
            >
              <Folder size={15} className="text-accent-solid" strokeWidth={1.8} />
              <span>Pilih Berkas</span>
            </button>
            <GoogleDriveButton onFilesSelected={filterAndEmitFiles} variant="compact" />
          </div>

          {/* Info Box: Google Drive requires active data/internet */}
          <div className="mt-1 px-3 py-1.5 rounded-md bg-surface-panel/90 border border-border-subtle flex items-center gap-2 text-[11px] font-mono text-text-secondary">
            <Wifi size={13} className="text-accent-solid shrink-0" strokeWidth={2} />
            <span>Khusus Google Drive: Pastikan koneksi internet aktif</span>
          </div>
        </div>
      </div>

      {/* Prominent Format Specifications & Guidelines Box */}
      <SupportedFormatsBadge toolType={toolType} variant="hero" />
    </div>
  );
};
