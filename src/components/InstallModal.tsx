import React, { useState } from 'react';
import {
  X,
  Monitor,
  Smartphone,
  Apple,
  Download,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Zap,
} from 'lucide-react';

interface InstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  isInstallable: boolean;
  isInstalled: boolean;
  onTriggerInstall: () => Promise<boolean>;
}

export const InstallModal: React.FC<InstallModalProps> = ({
  isOpen,
  onClose,
  isInstallable,
  isInstalled,
  onTriggerInstall,
}) => {
  const [activeTab, setActiveTab] = useState<'desktop' | 'android' | 'ios'>('desktop');
  const [justInstalled, setJustInstalled] = useState(false);

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    const success = await onTriggerInstall();
    if (success) {
      setJustInstalled(true);
      setTimeout(() => {
        onClose();
      }, 1800);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs select-none animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-lg bg-surface-panel border border-border-subtle rounded-lg shadow-2xl flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-border-subtle flex items-center justify-between bg-surface-bg">
          <div className="flex items-center gap-2.5">
            <img
              src="icon.webp"
              alt="LocalVault"
              className="w-7 h-7 rounded border border-border-subtle object-cover"
              onError={e => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-sans font-bold text-sm tracking-tight text-text-primary">
                  PASANG LOCALVAULT
                </span>
                <span className="font-mono text-[9px] px-1.5 py-0.2 rounded bg-accent-solid/20 text-accent-solid border border-accent-solid/30 font-bold">
                  PWA STANDALONE
                </span>
              </div>
              <p className="text-[11px] font-mono text-text-muted">
                Jalankan seperti aplikasi asli di Desktop &amp; HP tanpa browser bar
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded text-text-muted hover:text-text-primary hover:bg-surface-elevated transition-colors cursor-pointer"
            aria-label="Tutup modal"
          >
            <X size={16} />
          </button>
        </div>

        {/* Benefits bar */}
        <div className="grid grid-cols-3 divide-x divide-border-subtle border-b border-border-subtle bg-surface-panel text-center py-2 px-2 text-[10px] font-mono">
          <div className="flex flex-col items-center gap-1">
            <Zap size={13} className="text-accent-solid" />
            <span className="text-text-secondary">Buka Instan</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <ShieldCheck size={13} className="text-status-ok" />
            <span className="text-text-secondary">100% Offline</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <Sparkles size={13} className="text-blue-400" />
            <span className="text-text-secondary">Bebas Iklan &amp; Cloud</span>
          </div>
        </div>

        {/* Status / Direct Action banner if installable */}
        {isInstalled || justInstalled ? (
          <div className="m-4 p-3 rounded bg-status-ok/10 border border-status-ok/30 flex items-center gap-2.5 text-status-ok text-xs font-mono">
            <CheckCircle2 size={18} className="shrink-0" />
            <div>
              <div className="font-bold">Aplikasi Sudah Terpasang!</div>
              <div className="text-[11px] text-text-secondary">
                Anda dapat membukanya langsung dari Desktop, Start Menu, atau Beranda HP.
              </div>
            </div>
          </div>
        ) : isInstallable ? (
          <div className="m-4 p-3.5 rounded bg-surface-elevated border border-border-subtle flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-text-primary">
                Perangkat Mendukung Instalasi Langsung
              </span>
              <span className="w-2 h-2 rounded-full bg-status-ok animate-pulse" />
            </div>
            <p className="text-[11px] text-text-muted">
              Klik tombol di bawah untuk memasang LocalVault ke Desktop / Layar Utama perangkat Anda dengan satu klik.
            </p>
            <button
              type="button"
              onClick={handleInstallClick}
              className="mt-1 w-full py-2.5 px-4 rounded bg-accent-solid hover:bg-accent-hover text-white font-mono text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md active:scale-98"
            >
              <Download size={15} strokeWidth={2.5} />
              <span>PASANG SEKARANG KE PERANGKAT</span>
            </button>
          </div>
        ) : null}

        {/* Platform Tabs */}
        <div className="px-4 pt-2">
          <div className="flex border-b border-border-subtle">
            <button
              type="button"
              onClick={() => setActiveTab('desktop')}
              className={`flex items-center gap-2 px-3 py-2 text-xs font-mono font-medium border-b-2 -mb-px transition-colors cursor-pointer ${
                activeTab === 'desktop'
                  ? 'border-accent-solid text-accent-solid font-bold'
                  : 'border-transparent text-text-muted hover:text-text-secondary'
              }`}
            >
              <Monitor size={14} />
              <span>Windows / Mac</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('android')}
              className={`flex items-center gap-2 px-3 py-2 text-xs font-mono font-medium border-b-2 -mb-px transition-colors cursor-pointer ${
                activeTab === 'android'
                  ? 'border-accent-solid text-accent-solid font-bold'
                  : 'border-transparent text-text-muted hover:text-text-secondary'
              }`}
            >
              <Smartphone size={14} />
              <span>Android</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('ios')}
              className={`flex items-center gap-2 px-3 py-2 text-xs font-mono font-medium border-b-2 -mb-px transition-colors cursor-pointer ${
                activeTab === 'ios'
                  ? 'border-accent-solid text-accent-solid font-bold'
                  : 'border-transparent text-text-muted hover:text-text-secondary'
              }`}
            >
              <Apple size={14} />
              <span>iPhone / iPad</span>
            </button>
          </div>
        </div>

        {/* Tab Content Instructions */}
        <div className="p-4 text-xs font-sans text-text-secondary flex flex-col gap-3 min-h-[160px]">
          {activeTab === 'desktop' && (
            <div className="flex flex-col gap-2.5">
              <div className="font-mono text-xs font-semibold text-text-primary">
                Cara Pasang di Laptop / Komputer (Google Chrome / Microsoft Edge):
              </div>
              <ol className="list-decimal list-inside space-y-1.5 text-[12px] leading-relaxed text-text-secondary font-mono">
                <li>
                  Buka website LocalVault di <span className="text-text-primary font-bold">Google Chrome</span> atau <span className="text-text-primary font-bold">Microsoft Edge</span>.
                </li>
                <li>
                  Lihat ke pojok kanan bilah alamat URL (Omnibox), klik ikon <span className="text-accent-solid font-bold">📥 [Instal LocalVault]</span> atau ikon komputer dengan panah ke bawah.
                </li>
                <li>
                  Klik tombol konfirmasi <span className="text-text-primary font-bold">"Instal"</span>.
                </li>
                <li>
                  LocalVault akan terbuka di jendela tersendiri tanpa tab browser dan shortcut otomatis dibuat di Desktop serta Start Menu Anda!
                </li>
              </ol>
            </div>
          )}

          {activeTab === 'android' && (
            <div className="flex flex-col gap-2.5">
              <div className="font-mono text-xs font-semibold text-text-primary">
                Cara Pasang di Android (Chrome / Samsung Internet):
              </div>
              <ol className="list-decimal list-inside space-y-1.5 text-[12px] leading-relaxed text-text-secondary font-mono">
                <li>
                  Buka link LocalVault di browser Chrome pada perangkat Android Anda.
                </li>
                <li>
                  Ketuk ikon menu titik tiga <span className="text-text-primary font-bold">(⋮)</span> di pojok kanan atas layar.
                </li>
                <li>
                  Pilih menu <span className="text-accent-solid font-bold">"Instal aplikasi"</span> atau <span className="text-text-primary font-bold">"Tambahkan ke Layar Utama"</span>.
                </li>
                <li>
                  Ikon LocalVault akan otomatis muncul di laci aplikasi HP Anda layaknya aplikasi dari Play Store.
                </li>
              </ol>
            </div>
          )}

          {activeTab === 'ios' && (
            <div className="flex flex-col gap-2.5">
              <div className="font-mono text-xs font-semibold text-text-primary">
                Cara Pasang di iPhone &amp; iPad (Safari):
              </div>
              <ol className="list-decimal list-inside space-y-1.5 text-[12px] leading-relaxed text-text-secondary font-mono">
                <li>
                  Buka website LocalVault di browser bawaan <span className="text-text-primary font-bold">Safari</span>.
                </li>
                <li>
                  Ketuk tombol <span className="text-accent-solid font-bold">Bagikan (Share)</span> — ikon kotak dengan panah ke atas di bilah bawah.
                </li>
                <li>
                  Gulir ke bawah dan ketuk opsi <span className="text-text-primary font-bold">"Tambahkan ke Layar Utama" (Add to Home Screen)</span>.
                </li>
                <li>
                  Ketuk <span className="text-text-primary font-bold">"Tambah"</span> di pojok kanan atas. Aplikasi siap dijalankan dari home screen iPhone Anda!
                </li>
              </ol>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-border-subtle bg-surface-bg flex items-center justify-between">
          <span className="font-mono text-[10px] text-text-muted">
            Engine: Progressive Web App (PWA)
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded bg-surface-elevated hover:bg-surface-elevated/80 border border-border-subtle text-xs font-mono text-text-primary transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
