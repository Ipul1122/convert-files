import React, { useState } from 'react';
import {
  Crown,
  X,
  CheckCircle2,
  Sparkles,
  Smartphone,
  Laptop,
  ShieldCheck,
  Zap,
  ExternalLink,
  Copy,
  Check,
} from 'lucide-react';
import type { LicenseInfo } from '../types';
import { activateLicenseWithSupabase, getPurchaseUrl } from '../services/licenseService';

interface LicenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  licenseInfo: LicenseInfo;
  onLicenseUpdated: () => void;
  quotaExceededMessage?: string | null;
}

export const LicenseModal: React.FC<LicenseModalProps> = ({
  isOpen,
  onClose,
  licenseInfo,
  onLicenseUpdated,
  quotaExceededMessage,
}) => {
  const [inputCode, setInputCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!inputCode.trim()) {
      setErrorMessage('Silakan masukkan kode lisensi Anda.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await activateLicenseWithSupabase(inputCode);
      if (res.success) {
        setSuccessMessage(res.message);
        setInputCode('');
        onLicenseUpdated();
      } else {
        setErrorMessage(res.message);
      }
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMessage(error.message || 'Gagal mengaktifkan kode.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const purchaseUrl = getPurchaseUrl();

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150 select-none"
    >
      <div
        className="relative w-full max-w-lg rounded-xl bg-surface-panel border border-border-subtle shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header Ribbon */}
        <div className="relative px-5 py-4 bg-linear-to-r from-amber-500/15 via-accent-solid/15 to-transparent border-b border-border-subtle flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
              <Crown size={20} className="animate-pulse" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm sm:text-base font-bold text-text-primary tracking-tight">
                {licenseInfo.isVip ? 'Lisensi VIP Seumur Hidup Aktif' : 'Akses VIP Seumur Hidup — Rp 20.000'}
              </span>
              <span className="text-xs text-text-secondary font-mono">
                {licenseInfo.isVip
                  ? 'Perangkat ini terverifikasi bebas batasan'
                  : 'Sekali bayar seumur hidup • Maksimal 2 perangkat'}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-md hover:bg-surface-elevated text-text-muted hover:text-text-primary flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto flex flex-col gap-4 text-xs">
          {/* Quota Exceeded Alert Banner */}
          {quotaExceededMessage && !licenseInfo.isVip && (
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-200 flex items-center gap-2 text-xs font-mono leading-relaxed">
              <Zap size={16} className="text-amber-400 shrink-0" />
              <span>{quotaExceededMessage}</span>
            </div>
          )}

          {/* Active VIP Card (if already activated) */}
          {licenseInfo.isVip ? (
            <div className="p-4 rounded-xl bg-surface-bg border border-amber-500/40 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-amber-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles size={14} />
                  STATUS: VIP LIFETIME MEMBER
                </span>
                <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono text-[10px] font-semibold border border-amber-500/30">
                  AKTIF
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded bg-surface-panel border border-border-subtle font-mono">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] text-text-muted">KODE LISENSI ANDA:</span>
                  <span className="text-xs text-text-primary font-bold">{licenseInfo.code}</span>
                </div>
                <button
                  type="button"
                  onClick={() => licenseInfo.code && handleCopyCode(licenseInfo.code)}
                  className="px-2.5 py-1 rounded bg-surface-elevated hover:bg-border-subtle text-text-secondary hover:text-text-primary text-[11px] flex items-center gap-1 cursor-pointer transition-colors"
                >
                  {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                  <span>{copied ? 'Tersalin' : 'Salin'}</span>
                </button>
              </div>

              <div className="flex items-center gap-3 pt-1 text-text-secondary text-[11px] font-mono">
                <div className="flex items-center gap-1 text-text-primary">
                  <Laptop size={14} className="text-accent-solid" />
                  <span>Laptop & HP (Maks 2)</span>
                </div>
                <div className="flex items-center gap-1 text-emerald-400">
                  <ShieldCheck size={14} />
                  <span>100% Offline Tanpa Batas</span>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Feature Highlights Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-text-secondary font-mono text-[11px]">
                <div className="flex items-center gap-2 p-2 rounded bg-surface-bg border border-border-subtle/70">
                  <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
                  <span>Konversi Unlimited Selamanya</span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded bg-surface-bg border border-border-subtle/70">
                  <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
                  <span>Pas Foto AI (Merah/Biru CPNS)</span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded bg-surface-bg border border-border-subtle/70">
                  <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
                  <span>Kunci 195KB & Watermark KTP</span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded bg-surface-bg border border-border-subtle/70">
                  <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
                  <span>PDF ke Word, Excel, & PPTX</span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded bg-surface-bg border border-border-subtle/70">
                  <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
                  <span>Bisa Dipakai 100% Offline</span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded bg-surface-bg border border-border-subtle/70">
                  <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
                  <span>Aktif di 2 Perangkat (Laptop + HP)</span>
                </div>
              </div>

              {/* Free Quota Tracker */}
              <div className="p-3 rounded-lg bg-surface-bg border border-border-subtle flex items-center justify-between font-mono">
                <span className="text-text-muted">KUOTA GRATIS HARI INI:</span>
                <span className="text-text-primary font-bold">
                  {licenseInfo.dailyQuotaRemaining} / {licenseInfo.dailyQuotaTotal} Konversi Tersisa
                </span>
              </div>

              {/* Activation Form */}
              <form onSubmit={handleActivate} className="flex flex-col gap-2 pt-1">
                <label className="text-xs font-semibold text-text-primary">
                  Sudah punya kode lisensi? Masukkan di sini:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="contoh: LV-8821-A19F"
                    value={inputCode}
                    onChange={e => setInputCode(e.target.value)}
                    disabled={isLoading}
                    className="flex-1 px-3 py-2 rounded-lg bg-surface-bg border border-border-subtle text-text-primary placeholder:text-text-muted font-mono uppercase text-xs focus:outline-none focus:border-accent-solid tracking-wider"
                  />
                  <button
                    type="submit"
                    disabled={isLoading || !inputCode.trim()}
                    className="px-4 py-2 rounded-lg bg-accent-solid hover:bg-accent-solid/90 disabled:opacity-50 text-white font-mono font-semibold text-xs transition-colors cursor-pointer shrink-0"
                  >
                    {isLoading ? 'Memverifikasi...' : 'Aktivasi'}
                  </button>
                </div>
                <span className="text-[10px] font-mono text-text-muted">
                  *Aktivasi mengikat kode ke perangkat ini (maksimal 2 perangkat).
                </span>
              </form>

              {/* Feedback Messages */}
              {errorMessage && (
                <div className="p-2.5 rounded bg-red-950/40 border border-status-err/40 text-status-err font-mono text-[11px] leading-relaxed">
                  {errorMessage}
                </div>
              )}
              {successMessage && (
                <div className="p-2.5 rounded bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 font-mono text-[11px] leading-relaxed">
                  {successMessage}
                </div>
              )}

              {/* Divider & Purchase CTA */}
              <div className="relative my-1">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border-subtle" />
                </div>
                <div className="relative flex justify-center text-[10px] font-mono uppercase">
                  <span className="bg-surface-panel px-2 text-text-muted">
                    Atau belum memiliki kode lisensi?
                  </span>
                </div>
              </div>

              {/* Primary Buy Button */}
              <a
                href={purchaseUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full py-3 px-4 rounded-xl bg-linear-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-stone-950 font-bold font-mono text-center flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-[0.99] cursor-pointer"
              >
                <Crown size={16} />
                <span>Beli Akses VIP — Rp 20.000 (via WhatsApp)</span>
                <ExternalLink size={14} className="opacity-80" />
              </a>

              <div className="flex items-center justify-center gap-2 text-[10px] font-mono text-text-muted text-center">
                <Smartphone size={12} />
                <span>Hubungi WhatsApp: 0856-9367-2730 (Pembayaran QRIS / Transfer Bank)</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

