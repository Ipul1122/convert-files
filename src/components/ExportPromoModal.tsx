import React, { useState } from 'react';
import {
  CheckCircle2,
  Download,
  Mail,
  MessageCircle,
  X,
  Code2,
  Sparkles,
  Copy,
  Check,
} from 'lucide-react';
import type { ConversionResult } from '../types';
import { formatBytes } from '../utils/formatters';

interface ExportPromoModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: ConversionResult | null;
  onDownload: () => void;
}

export const ExportPromoModal: React.FC<ExportPromoModalProps> = ({
  isOpen,
  onClose,
  result,
  onDownload,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen || !result) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.origin);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const deltaBytes = result.outputBytes - result.originalTotalBytes;
  const isCompressed = deltaBytes < 0;
  const percentChange =
    result.originalTotalBytes > 0
      ? Math.abs(Math.round((deltaBytes / result.originalTotalBytes) * 100))
      : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150 select-none">
      <div
        className="w-full max-w-lg bg-surface-panel border border-border-focus rounded-md shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* Header Bar */}
        <div className="px-5 py-4 bg-surface-elevated/70 border-b border-border-subtle flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-accent-solid/15 text-accent-solid flex items-center justify-center">
              <Sparkles size={16} strokeWidth={2} />
            </div>
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-text-primary">
              Ekspor Berkas Berhasil
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded text-text-muted hover:text-text-primary hover:bg-surface-elevated transition-colors cursor-pointer"
            aria-label="Tutup popover"
          >
            <X size={16} strokeWidth={1.8} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 flex flex-col gap-4 max-h-[80vh] overflow-y-auto">
          {/* File Summary Card */}
          <div className="p-3.5 rounded bg-surface-bg border border-border-subtle flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded bg-status-ok/15 text-status-ok flex items-center justify-center shrink-0">
                <CheckCircle2 size={22} strokeWidth={2} />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-semibold text-text-primary truncate" title={result.filename}>
                  {result.filename}
                </span>
                <div className="flex items-center gap-2 font-mono text-[11px] text-text-muted">
                  <span className="text-text-primary font-bold">
                    {formatBytes(result.outputBytes)}
                  </span>
                  {result.originalTotalBytes > 0 && isCompressed && (
                    <span className="text-status-ok">(-{percentChange}%)</span>
                  )}
                  <span>•</span>
                  <span>{result.pageCount} Halaman</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onDownload}
              className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded bg-accent-solid hover:bg-accent-solid/90 text-white text-xs font-mono font-bold transition-all cursor-pointer shadow-xs active:scale-[0.98]"
            >
              <Download size={14} strokeWidth={2} />
              <span>UNDUH</span>
            </button>
          </div>

          {/* Watermark & Developer Promotional Showcase */}
          <div className="p-4 rounded-md bg-gradient-to-b from-surface-elevated/90 to-surface-bg border-2 border-accent-solid/40 flex flex-col gap-3 relative overflow-hidden">
            {/* Top Badge Watermark */}
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded bg-accent-solid text-white">
                DEVELOPER SHOWCASE &amp; WATERMARK
              </span>
              <span className="font-mono text-[10px] text-text-muted">
                Portfolio Feature
              </span>
            </div>

            {/* Author Branding */}
            <div className="flex items-start gap-3 pt-1">
              <div className="w-11 h-11 rounded-md bg-accent-solid/20 border border-accent-solid/50 flex items-center justify-center text-accent-solid font-mono font-bold text-base shrink-0">
                <Code2 size={22} strokeWidth={2} />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-text-primary">
                    Muhammad Syaifulloh
                  </span>
                  <span className="font-mono text-[9px] px-1.5 py-0.2 rounded bg-surface-panel border border-border-subtle text-accent-solid">
                    Creator
                  </span>
                </div>
                <span className="text-xs text-text-secondary leading-snug">
                  Software Engineer &amp; Fullstack Web Developer
                </span>
              </div>
            </div>

            {/* Promotional Pitch */}
            <div className="text-xs text-text-secondary leading-relaxed bg-surface-bg/80 p-3 rounded border border-border-subtle">
              <p>
                Aplikasi konversi berkas ini dirancang &amp; dikembangkan oleh{' '}
                <strong className="text-text-primary">Muhammad Syaifulloh</strong> dengan fokus pada kecepatan, privasi tanpa server luar, dan kemudahan pengguna.
              </p>
              <p className="mt-1.5 text-text-muted text-[11px]">
                Tertarik membuat aplikasi web modern, sistem otomasi berkas, atau ingin berkolaborasi untuk proyek teknologi Anda?
              </p>
            </div>

            {/* Contact & Promotion CTAs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <a
                href="mailto:msyaifulloh2024@gmail.com?subject=Tawaran%20Kerjasama%20/%20Pembuatan%20Web%20App"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded bg-surface-panel hover:bg-surface-elevated border border-border-subtle hover:border-accent-solid text-text-primary text-xs font-mono transition-colors cursor-pointer"
              >
                <Mail size={14} className="text-accent-solid" />
                <span>msyaifulloh2024@gmail.com</span>
              </a>

              <a
                href="https://wa.me/?text=Halo%20Muhammad%20Syaifulloh%2C%20saya%20melihat%20aplikasi%20converter%20karya%20Anda%20dan%20tertarik%20untuk%20berdiskusi."
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded bg-[#25D366]/15 hover:bg-[#25D366]/25 border border-[#25D366]/40 text-[#25D366] text-xs font-mono font-medium transition-colors cursor-pointer"
              >
                <MessageCircle size={14} />
                <span>Hubungi via WhatsApp</span>
              </a>
            </div>

            {/* Share / Copy Link Button */}
            <button
              type="button"
              onClick={handleCopyLink}
              className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded bg-surface-panel hover:bg-surface-elevated border border-border-subtle text-text-secondary hover:text-text-primary text-xs font-mono transition-colors cursor-pointer"
            >
              {copiedLink ? (
                <>
                  <Check size={14} className="text-status-ok" />
                  <span className="text-status-ok font-semibold">Tautan Aplikasi Berhasil Disalin!</span>
                </>
              ) : (
                <>
                  <Copy size={14} />
                  <span>Salin Tautan Aplikasi untuk Berbagi</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 bg-surface-bg border-t border-border-subtle flex items-center justify-between">
          <span className="font-mono text-[10px] text-text-muted">
            LocalVault Converter • Watermark by M. Syaifulloh
          </span>
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-mono px-3.5 py-1.5 rounded bg-surface-elevated hover:bg-surface-panel border border-border-subtle text-text-primary transition-colors cursor-pointer"
          >
            Lanjut
          </button>
        </div>
      </div>
    </div>
  );
};
