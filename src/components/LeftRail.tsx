import React, { useState } from 'react';
import {
  FileImage,
  FileText,
  FileSpreadsheet,
  Presentation,
  Archive,
  Layers,
  FolderSync,
  Scissors,
  ShieldCheck,
  Sparkles,
  FileCode,
  ArrowRightLeft,
  LayoutDashboard,
  Files,
  History,
  X,
  Download,
  Monitor,
  CheckCircle,
  Smartphone,
  Crown,
} from 'lucide-react';
import type { ToolType, LicenseInfo } from '../types';
import { formatBytes } from '../utils/formatters';
import { usePwaInstall } from '../hooks/usePwaInstall';
import { InstallModal } from './InstallModal';

interface LeftRailProps {
  activeTool: ToolType;
  onSelectTool: (tool: ToolType) => void;
  vaultUsageBytes: number;
  vaultJobCount: number;
  maxStorageMB: number;
  isOffline: boolean;
  licenseInfo?: LicenseInfo;
  onOpenLicenseModal?: () => void;
}

export const LeftRail: React.FC<LeftRailProps> = ({
  activeTool,
  onSelectTool,
  vaultUsageBytes,
  vaultJobCount,
  maxStorageMB,
  isOffline,
  licenseInfo,
  onOpenLicenseModal,
}) => {
  const [mobileFileSheetOpen, setMobileFileSheetOpen] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const { isInstallable, isInstalled, triggerInstall } = usePwaInstall();

  // 1. Fitur Spesial & Administrasi CPNS
  const specialTools: Array<{ id: ToolType; label: string; badge: string; icon: React.ReactNode }> = [
    {
      id: 'pasfoto',
      label: 'PASFOTO AI',
      badge: 'GANTI LATAR',
      icon: <Sparkles size={15} strokeWidth={1.5} className="text-pink-400" />,
    },
    {
      id: 'watermark',
      label: 'WATERMARK',
      badge: 'KTP / PDF',
      icon: <ShieldCheck size={15} strokeWidth={1.5} className="text-cyan-400" />,
    },
    {
      id: 'compress-pdf',
      label: 'KOMPRES PDF',
      badge: '195KB',
      icon: <Archive size={15} strokeWidth={1.5} className="text-amber-400" />,
    },
    {
      id: 'heic-to-img',
      label: 'APPLE HEIC',
      badge: '.HEIC',
      icon: <Smartphone size={15} strokeWidth={1.5} className="text-emerald-400" />,
    },
  ];

  // 2. PDF ↔ Microsoft Office (Bidirectional Pairs)
  const officeTools: Array<{ id: ToolType; label: string; badge: string; icon: React.ReactNode }> = [
    {
      id: 'pdf-to-docx',
      label: 'PDF → WORD',
      badge: '.DOCX',
      icon: <FileText size={15} strokeWidth={1.5} className="text-blue-400" />,
    },
    {
      id: 'word-to-pdf',
      label: 'WORD → PDF',
      badge: '.PDF',
      icon: <FileText size={15} strokeWidth={1.5} className="text-blue-400" />,
    },
    {
      id: 'pdf-to-xlsx',
      label: 'PDF → EXCEL',
      badge: '.XLSX',
      icon: <FileSpreadsheet size={15} strokeWidth={1.5} className="text-emerald-400" />,
    },
    {
      id: 'excel-to-pdf',
      label: 'EXCEL → PDF',
      badge: '.PDF',
      icon: <FileSpreadsheet size={15} strokeWidth={1.5} className="text-emerald-400" />,
    },
    {
      id: 'pdf-to-pptx',
      label: 'PDF → PPT',
      badge: '.PPTX',
      icon: <Presentation size={15} strokeWidth={1.5} className="text-orange-400" />,
    },
    {
      id: 'pptx-to-pdf',
      label: 'PPTX → PDF',
      badge: '.PDF',
      icon: <Presentation size={15} strokeWidth={1.5} className="text-orange-400" />,
    },
    {
      id: 'pdf-to-txt',
      label: 'PDF → TEKS',
      badge: '.TXT',
      icon: <FileCode size={15} strokeWidth={1.5} className="text-text-secondary" />,
    },
    {
      id: 'office-media',
      label: 'EKSTRAK MEDIA',
      badge: '.ZIP',
      icon: <Archive size={15} strokeWidth={1.5} className="text-purple-400" />,
    },
  ];

  // 3. Kelola Halaman PDF
  const pdfOrganizeTools: Array<{ id: ToolType; label: string; badge: string; icon: React.ReactNode }> = [
    {
      id: 'merge-pdf',
      label: 'GABUNG PDF',
      badge: 'GABUNG',
      icon: <FolderSync size={15} strokeWidth={1.5} className="text-amber-400" />,
    },
    {
      id: 'split-pdf',
      label: 'PISAH PDF',
      badge: 'PISAH',
      icon: <Scissors size={15} strokeWidth={1.5} className="text-accent-solid" />,
    },
  ];

  // 4. Format Gambar & WebP
  const imageTools: Array<{ id: ToolType; label: string; badge: string; icon: React.ReactNode }> = [
    {
      id: 'img-to-pdf',
      label: 'GAMBAR → PDF',
      badge: 'GAMBAR',
      icon: <FileImage size={15} strokeWidth={1.5} className="text-cyan-400" />,
    },
    {
      id: 'pdf-to-jpg',
      label: 'PDF → JPG',
      badge: '300DPI',
      icon: <FileText size={15} strokeWidth={1.5} className="text-indigo-400" />,
    },
    {
      id: 'pdf-to-png',
      label: 'PDF → PNG',
      badge: 'LOSSLESS',
      icon: <Layers size={15} strokeWidth={1.5} className="text-indigo-400" />,
    },
    {
      id: 'pdf-to-webp',
      label: 'PDF → WEBP',
      badge: 'WEBP',
      icon: <FileCode size={15} strokeWidth={1.5} className="text-indigo-400" />,
    },
    {
      id: 'img-to-webp',
      label: 'GAMBAR → WEBP',
      badge: 'KOMPRES',
      icon: <FileCode size={15} strokeWidth={1.5} className="text-rose-400" />,
    },
    {
      id: 'webp-to-img',
      label: 'WEBP → GAMBAR',
      badge: 'JPG/PNG',
      icon: <ArrowRightLeft size={15} strokeWidth={1.5} className="text-yellow-400" />,
    },
  ];

  const allTools = [...specialTools, ...officeTools, ...pdfOrganizeTools, ...imageTools];
  const maxBytes = maxStorageMB * 1024 * 1024;
  const storagePercent = Math.min(100, Math.round((vaultUsageBytes / maxBytes) * 100));

  const isFileToolActive = allTools.some(t => t.id === activeTool);

  return (
    <>
      {/* Mobile Top Header (< md) */}
      <header className="md:hidden h-12 px-3.5 bg-surface-panel border-b border-border-subtle flex items-center justify-between shrink-0 select-none">
        <button
          type="button"
          onClick={() => onSelectTool('smart')}
          className="flex items-center gap-2 cursor-pointer text-left"
          title="Go to Dashboard"
        >
          <img
            src="/icon.webp"
            alt="LocalVault"
            className="w-5 h-5 rounded object-cover border border-border-subtle"
            onError={e => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
          <span className="font-sans font-bold text-xs tracking-tight text-text-primary">
            LOCALVAULT
          </span>
          <span className="font-mono text-[9px] px-1 py-0.2 rounded bg-surface-elevated text-text-muted border border-border-subtle">
            v1.1
          </span>
        </button>

        <div className="flex items-center gap-2">
          {!isInstalled && (
            <button
              type="button"
              onClick={() => {
                if (isInstallable) {
                  triggerInstall();
                } else {
                  setShowInstallModal(true);
                }
              }}
              className="flex items-center gap-1 px-2 py-0.5 rounded bg-accent-solid text-white text-[10px] font-mono font-bold cursor-pointer shadow-xs active:scale-95"
              title="Pasang aplikasi LocalVault"
            >
              <Download size={10} strokeWidth={2.5} />
              <span>PASANG</span>
            </button>
          )}
          {/* Mobile VIP Status or Upgrade Button */}
          {onOpenLicenseModal && (
            <button
              type="button"
              onClick={onOpenLicenseModal}
              className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold cursor-pointer shadow-xs active:scale-95 transition-all ${
                licenseInfo?.isVip
                  ? 'bg-amber-500/15 border border-amber-500/40 text-amber-300'
                  : 'bg-linear-to-r from-amber-500/20 to-amber-600/15 border border-amber-500/50 text-amber-300'
              }`}
            >
              <Crown size={11} className={licenseInfo?.isVip ? 'text-amber-400' : 'text-amber-400 animate-pulse'} />
              <span>{licenseInfo?.isVip ? 'VIP' : 'VIP 20K'}</span>
            </button>
          )}

          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-surface-bg border border-border-subtle text-[10px] font-mono text-text-secondary">
            <span className="w-1.5 h-1.5 rounded-full bg-status-ok shrink-0 animate-pulse" />
            <span>{isOffline ? 'AIRPLANE OK' : '100% OFFLINE'}</span>
          </div>
        </div>
      </header>

      {/* Desktop Left Rail (>= md) */}
      <aside className="hidden md:flex w-[220px] h-full bg-surface-panel border-r border-border-subtle flex-col justify-between shrink-0 select-none">
        {/* App Branding & Status */}
        <div className="flex flex-col">
          <div className="p-3.5 border-b border-border-subtle flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => onSelectTool('smart')}
                className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity text-left"
                title="Go to Dashboard"
              >
                <img
                  src="/icon.webp"
                  alt="LocalVault"
                  className="w-6 h-6 rounded object-cover border border-border-subtle"
                  onError={e => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
                <span className="font-sans font-bold text-sm tracking-tight text-text-primary">
                  LOCALVAULT
                </span>
              </button>
              <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-surface-elevated text-text-muted border border-border-subtle">
                v1.1
              </span>
            </div>

            {/* 100% Offline Status Badge */}
            <div className="flex items-center gap-2 px-2 py-1 rounded bg-surface-bg border border-border-subtle text-xs">
              <span className="w-2 h-2 rounded-full bg-status-ok shrink-0 animate-pulse" />
              <span className="font-mono text-[11px] text-text-secondary truncate">
                {isOffline ? 'OFFLINE • AIRPLANE OK' : '100% OFFLINE READY'}
              </span>
            </div>

            {/* PWA Install Button or Desktop Standalone Status */}
            {isInstalled ? (
              <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-surface-bg border border-status-ok/30 text-[10px] font-mono text-status-ok">
                <CheckCircle size={12} className="shrink-0" />
                <span className="truncate">MODE DESKTOP AKTIF</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  if (isInstallable) {
                    triggerInstall();
                  } else {
                    setShowInstallModal(true);
                  }
                }}
                className="w-full flex items-center justify-between px-2 py-1.5 rounded bg-accent-solid/10 hover:bg-accent-solid/20 border border-accent-solid/35 text-accent-solid text-[10px] font-mono font-bold transition-all cursor-pointer shadow-xs active:scale-98"
                title="Pasang aplikasi LocalVault ke Desktop"
              >
                <div className="flex items-center gap-1.5">
                  <Monitor size={12} strokeWidth={2} />
                  <span>PASANG KE DESKTOP</span>
                </div>
                <Download size={11} strokeWidth={2.5} />
              </button>
            )}

            {/* Desktop VIP Lifetime Access Banner / Status */}
            {onOpenLicenseModal && (
              licenseInfo?.isVip ? (
                <button
                  type="button"
                  onClick={onOpenLicenseModal}
                  className="w-full flex items-center justify-between px-2 py-1.5 rounded bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-mono font-bold transition-all cursor-pointer shadow-xs active:scale-98"
                  title="Lihat Rincian Lisensi VIP Anda"
                >
                  <div className="flex items-center gap-1.5">
                    <Crown size={12} className="text-amber-400" />
                    <span>VIP SEUMUR HIDUP</span>
                  </div>
                  <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    AKTIF
                  </span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onOpenLicenseModal}
                  className="w-full flex items-center justify-between px-2 py-1.5 rounded bg-linear-to-r from-amber-500/15 via-amber-600/10 to-transparent hover:from-amber-500/25 hover:to-amber-600/20 border border-amber-500/40 text-amber-300 text-[10px] font-mono font-bold transition-all cursor-pointer shadow-xs active:scale-98"
                  title="Aktivasi Akses Seumur Hidup Rp 20.000"
                >
                  <div className="flex items-center gap-1.5">
                    <Crown size={12} className="text-amber-400 animate-pulse" />
                    <span>BUKA VIP (RP 20K)</span>
                  </div>
                  <span className="text-[9px] font-mono text-amber-400/90">
                    {licenseInfo?.dailyQuotaRemaining ?? 5}/5
                  </span>
                </button>
              )
            )}
          </div>

          {/* Navigation Tools List */}
          <nav className="p-2 flex flex-col gap-1 overflow-y-auto max-h-[calc(100vh-190px)]">
            {/* Dashboard (Smart Hub) */}
            <button
              type="button"
              onClick={() => onSelectTool('smart')}
              className={`w-full flex items-center justify-between px-2.5 py-2 rounded text-xs font-medium transition-colors mb-1 cursor-pointer ${
                activeTool === 'smart'
                  ? 'bg-accent-solid text-white font-bold shadow-xs'
                  : 'bg-surface-elevated text-text-primary hover:bg-surface-elevated/80 border border-border-subtle hover:border-border-focus'
              }`}
            >
              <div className="flex items-center gap-2">
                <LayoutDashboard
                  size={14}
                  className={activeTool === 'smart' ? 'text-white' : 'text-accent-solid'}
                  strokeWidth={2}
                />
                <span className="font-mono tracking-tight font-semibold">DASHBOARD</span>
              </div>
              <span
                className={`font-mono text-[9px] px-1.5 py-0.5 rounded ${
                  activeTool === 'smart'
                    ? 'bg-black/30 text-white'
                    : 'bg-surface-panel text-text-muted border border-border-subtle'
                }`}
              >
                INDEX
              </span>
            </button>

            {/* Kategori 1: Fitur Spesial & CPNS */}
            <div className="px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-text-muted mt-2">
              Fitur Spesial &amp; CPNS
            </div>
            {specialTools.map(tool => {
              const isActive = activeTool === tool.id;
              return (
                <button
                  key={tool.id}
                  type="button"
                  onClick={() => onSelectTool(tool.id)}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded text-xs font-medium transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-accent-solid text-white font-semibold'
                      : 'text-text-secondary hover:text-text-primary hover:bg-surface-elevated'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className={isActive ? 'text-white' : ''}>
                      {tool.icon}
                    </span>
                    <span className="font-mono tracking-tight truncate">{tool.label}</span>
                  </div>
                  <span
                    className={`font-mono text-[9px] px-1 py-0.2 rounded border shrink-0 ${
                      isActive
                        ? 'bg-black/30 text-white border-white/20'
                        : 'bg-surface-bg text-text-muted border-border-subtle'
                    }`}
                  >
                    {tool.badge}
                  </span>
                </button>
              );
            })}

            {/* Kategori 2: PDF ↔ Microsoft Office */}
            <div className="px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-text-muted mt-2">
              PDF ↔ Office
            </div>
            {officeTools.map(tool => {
              const isActive = activeTool === tool.id;
              return (
                <button
                  key={tool.id}
                  type="button"
                  onClick={() => onSelectTool(tool.id)}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded text-xs font-medium transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-accent-solid text-white font-semibold'
                      : 'text-text-secondary hover:text-text-primary hover:bg-surface-elevated'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className={isActive ? 'text-white' : ''}>
                      {tool.icon}
                    </span>
                    <span className="font-mono tracking-tight truncate">{tool.label}</span>
                  </div>
                  <span
                    className={`font-mono text-[9px] px-1 py-0.2 rounded border shrink-0 ${
                      isActive
                        ? 'bg-black/30 text-white border-white/20'
                        : 'bg-surface-bg text-text-muted border-border-subtle'
                    }`}
                  >
                    {tool.badge}
                  </span>
                </button>
              );
            })}

            {/* Kategori 3: Kelola Halaman PDF */}
            <div className="px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-text-muted mt-2">
              Kelola PDF
            </div>
            {pdfOrganizeTools.map(tool => {
              const isActive = activeTool === tool.id;
              return (
                <button
                  key={tool.id}
                  type="button"
                  onClick={() => onSelectTool(tool.id)}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded text-xs font-medium transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-accent-solid text-white font-semibold'
                      : 'text-text-secondary hover:text-text-primary hover:bg-surface-elevated'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className={isActive ? 'text-white' : 'text-text-secondary'}>
                      {tool.icon}
                    </span>
                    <span className="font-mono tracking-tight truncate">{tool.label}</span>
                  </div>
                  <span
                    className={`font-mono text-[9px] px-1 py-0.2 rounded border shrink-0 ${
                      isActive
                        ? 'bg-black/30 text-white border-white/20'
                        : 'bg-surface-bg text-text-muted border-border-subtle'
                    }`}
                  >
                    {tool.badge}
                  </span>
                </button>
              );
            })}

            {/* Kategori 4: Gambar & WebP */}
            <div className="px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-text-muted mt-2">
              Gambar &amp; WebP
            </div>
            {imageTools.map(tool => {
              const isActive = activeTool === tool.id;
              return (
                <button
                  key={tool.id}
                  type="button"
                  onClick={() => onSelectTool(tool.id)}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded text-xs font-medium transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-accent-solid text-white font-semibold'
                      : 'text-text-secondary hover:text-text-primary hover:bg-surface-elevated'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className={isActive ? 'text-white' : 'text-text-secondary'}>
                      {tool.icon}
                    </span>
                    <span className="font-mono tracking-tight truncate">{tool.label}</span>
                  </div>
                  <span
                    className={`font-mono text-[9px] px-1 py-0.2 rounded border shrink-0 ${
                      isActive
                        ? 'bg-black/30 text-white border-white/20'
                        : 'bg-surface-bg text-text-muted border-border-subtle'
                    }`}
                  >
                    {tool.badge}
                  </span>
                </button>
              );
            })}

            <div className="my-1.5 border-b border-border-subtle" />

            {/* History Section */}
            <div className="px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-text-muted">
              History
            </div>
            <button
              type="button"
              onClick={() => onSelectTool('vault')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded text-xs font-medium transition-colors cursor-pointer ${
                activeTool === 'vault'
                  ? 'bg-accent-solid text-white font-semibold'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-elevated'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className={activeTool === 'vault' ? 'text-white' : 'text-text-secondary'}>
                  <History size={15} strokeWidth={1.5} />
                </span>
                <span className="font-mono tracking-tight">HISTORY</span>
              </div>
              {vaultJobCount > 0 && (
                <span
                  className={`font-mono text-[10px] px-1.5 py-0.2 rounded ${
                    activeTool === 'vault'
                      ? 'bg-black/30 text-white'
                      : 'bg-surface-elevated text-text-muted border border-border-subtle'
                  }`}
                >
                  {vaultJobCount}
                </span>
              )}
            </button>
          </nav>
        </div>

        {/* Storage Quota & Zero-Cloud Guarantee */}
        <div className="p-3 border-t border-border-subtle bg-surface-bg flex flex-col gap-2 shrink-0">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-text-muted">INTERNAL STORAGE</span>
              <span className="text-text-secondary">{storagePercent}%</span>
            </div>

            {/* Simple Solid Progress Bar */}
            <div className="w-full h-1.5 bg-surface-panel rounded-full overflow-hidden border border-border-subtle">
              <div
                className="h-full bg-accent-solid transition-all duration-300"
                style={{ width: `${storagePercent}%` }}
              />
            </div>

            <div className="flex items-center justify-between font-mono text-[10px] text-text-muted">
              <span>{formatBytes(vaultUsageBytes)}</span>
              <span>{maxStorageMB} MB LIMIT</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 pt-1 text-[10px] text-text-muted border-t border-border-subtle">
            <ShieldCheck size={13} className="text-status-ok shrink-0" strokeWidth={1.5} />
            <span className="truncate">Privat &amp; Aman di Perangkat</span>
          </div>
        </div>
      </aside>

      {/* Mobile Unified File Tools Sheet Drawer */}
      {mobileFileSheetOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end bg-black/75 backdrop-blur-xs">
          <div className="absolute inset-0" onClick={() => setMobileFileSheetOpen(false)} />
          <div className="relative z-10 w-full bg-surface-panel border-t border-border-subtle rounded-t-lg p-4 pb-6 flex flex-col gap-3 max-h-[75vh] overflow-y-auto animate-in slide-in-from-bottom duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-border-subtle">
              <div className="flex items-center gap-2">
                <Files size={15} className="text-accent-solid" strokeWidth={1.8} />
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-text-primary">
                  File Conversion Tools
                </span>
              </div>
              <button
                type="button"
                onClick={() => setMobileFileSheetOpen(false)}
                className="p-1 rounded text-text-muted hover:text-text-primary cursor-pointer"
                aria-label="Close menu"
              >
                <X size={16} strokeWidth={1.5} />
              </button>
            </div>

            {/* Fitur Spesial & CPNS */}
            <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-text-muted mt-1">
              Fitur Spesial &amp; CPNS
            </div>
            <div className="grid grid-cols-2 gap-2">
              {specialTools.map(tool => {
                const isActive = activeTool === tool.id;
                return (
                  <button
                    key={tool.id}
                    type="button"
                    onClick={() => {
                      onSelectTool(tool.id);
                      setMobileFileSheetOpen(false);
                    }}
                    className={`flex items-center justify-between gap-1.5 p-2 rounded text-xs font-mono transition-colors text-left cursor-pointer ${
                      isActive
                        ? 'bg-accent-solid text-white font-bold shadow-xs'
                        : 'bg-surface-elevated text-text-secondary hover:text-text-primary border border-border-subtle'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className={isActive ? 'text-white' : ''}>
                        {tool.icon}
                      </span>
                      <span className="truncate">{tool.label}</span>
                    </div>
                    <span
                      className={`text-[9px] px-1 py-0.2 rounded border shrink-0 ${
                        isActive
                          ? 'bg-black/30 text-white border-white/20'
                          : 'bg-surface-panel text-text-muted border-border-subtle'
                      }`}
                    >
                      {tool.badge}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* PDF ↔ Microsoft Office */}
            <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-text-muted mt-2">
              PDF ↔ Microsoft Office
            </div>
            <div className="grid grid-cols-2 gap-2">
              {officeTools.map(tool => {
                const isActive = activeTool === tool.id;
                return (
                  <button
                    key={tool.id}
                    type="button"
                    onClick={() => {
                      onSelectTool(tool.id);
                      setMobileFileSheetOpen(false);
                    }}
                    className={`flex items-center justify-between gap-1.5 p-2 rounded text-xs font-mono transition-colors text-left cursor-pointer ${
                      isActive
                        ? 'bg-accent-solid text-white font-bold shadow-xs'
                        : 'bg-surface-elevated text-text-secondary hover:text-text-primary border border-border-subtle'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className={isActive ? 'text-white' : ''}>
                        {tool.icon}
                      </span>
                      <span className="truncate">{tool.label}</span>
                    </div>
                    <span
                      className={`text-[9px] px-1 py-0.2 rounded border shrink-0 ${
                        isActive
                          ? 'bg-black/30 text-white border-white/20'
                          : 'bg-surface-panel text-text-muted border-border-subtle'
                      }`}
                    >
                      {tool.badge}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Kelola PDF */}
            <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-text-muted mt-2">
              Kelola PDF
            </div>
            <div className="grid grid-cols-2 gap-2">
              {pdfOrganizeTools.map(tool => {
                const isActive = activeTool === tool.id;
                return (
                  <button
                    key={tool.id}
                    type="button"
                    onClick={() => {
                      onSelectTool(tool.id);
                      setMobileFileSheetOpen(false);
                    }}
                    className={`flex items-center justify-between gap-1.5 p-2 rounded text-xs font-mono transition-colors text-left cursor-pointer ${
                      isActive
                        ? 'bg-accent-solid text-white font-bold shadow-xs'
                        : 'bg-surface-elevated text-text-secondary hover:text-text-primary border border-border-subtle'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className={isActive ? 'text-white' : 'text-text-secondary'}>
                        {tool.icon}
                      </span>
                      <span className="truncate">{tool.label}</span>
                    </div>
                    <span
                      className={`text-[9px] px-1 py-0.2 rounded border shrink-0 ${
                        isActive
                          ? 'bg-black/30 text-white border-white/20'
                          : 'bg-surface-panel text-text-muted border-border-subtle'
                      }`}
                    >
                      {tool.badge}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Format Gambar & WebP */}
            <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-text-muted mt-2">
              Gambar &amp; WebP
            </div>
            <div className="grid grid-cols-2 gap-2">
              {imageTools.map(tool => {
                const isActive = activeTool === tool.id;
                return (
                  <button
                    key={tool.id}
                    type="button"
                    onClick={() => {
                      onSelectTool(tool.id);
                      setMobileFileSheetOpen(false);
                    }}
                    className={`flex items-center justify-between gap-1.5 p-2 rounded text-xs font-mono transition-colors text-left cursor-pointer ${
                      isActive
                        ? 'bg-accent-solid text-white font-bold shadow-xs'
                        : 'bg-surface-elevated text-text-secondary hover:text-text-primary border border-border-subtle'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className={isActive ? 'text-white' : 'text-text-secondary'}>
                        {tool.icon}
                      </span>
                      <span className="truncate">{tool.label}</span>
                    </div>
                    <span
                      className={`text-[9px] px-1 py-0.2 rounded border shrink-0 ${
                        isActive
                          ? 'bg-black/30 text-white border-white/20'
                          : 'bg-surface-panel text-text-muted border-border-subtle'
                      }`}
                    >
                      {tool.badge}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation Bar (3 items: Dashboard, File, History) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface-panel/95 backdrop-blur border-t border-border-subtle h-14 flex items-center justify-around px-4 select-none">
        {/* Tab 1: Dashboard */}
        <button
          type="button"
          onClick={() => {
            setMobileFileSheetOpen(false);
            onSelectTool('smart');
          }}
          className={`flex flex-col items-center justify-center gap-1 w-20 py-1 rounded transition-colors cursor-pointer ${
            activeTool === 'smart'
              ? 'text-accent-solid font-bold'
              : 'text-text-muted hover:text-text-primary'
          }`}
        >
          <LayoutDashboard size={18} strokeWidth={activeTool === 'smart' ? 2.5 : 1.8} />
          <span className="text-[10px] font-mono leading-none">Dashboard</span>
        </button>

        {/* Tab 2: File (Unified PDF + Images) */}
        <button
          type="button"
          onClick={() => setMobileFileSheetOpen(prev => !prev)}
          className={`flex flex-col items-center justify-center gap-1 w-20 py-1 rounded transition-colors cursor-pointer ${
            isFileToolActive
              ? 'text-accent-solid font-bold'
              : 'text-text-muted hover:text-text-primary'
          }`}
        >
          <Files size={18} strokeWidth={isFileToolActive ? 2.5 : 1.8} />
          <span className="text-[10px] font-mono leading-none">File</span>
        </button>

        {/* Tab 3: History */}
        <button
          type="button"
          onClick={() => {
            setMobileFileSheetOpen(false);
            onSelectTool('vault');
          }}
          className={`relative flex flex-col items-center justify-center gap-1 w-20 py-1 rounded transition-colors cursor-pointer ${
            activeTool === 'vault'
              ? 'text-accent-solid font-bold'
              : 'text-text-muted hover:text-text-primary'
          }`}
        >
          <History size={18} strokeWidth={activeTool === 'vault' ? 2.5 : 1.8} />
          <span className="text-[10px] font-mono leading-none">History</span>
          {vaultJobCount > 0 && (
            <span className="absolute top-0.5 right-4 w-4 h-4 rounded-full bg-accent-solid text-white text-[9px] font-mono font-bold flex items-center justify-center">
              {vaultJobCount}
            </span>
          )}
        </button>
      </nav>

      {/* PWA Install Modal */}
      <InstallModal
        isOpen={showInstallModal}
        onClose={() => setShowInstallModal(false)}
        isInstallable={isInstallable}
        isInstalled={isInstalled}
        onTriggerInstall={triggerInstall}
      />
    </>
  );
};
