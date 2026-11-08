import React from 'react';
import {
  FileText,
  FileImage,
  FileSpreadsheet,
  Presentation,
  Archive,
  ShieldCheck,
  Sparkles,
  Smartphone,
  Scissors,
  CheckCircle2,
  Info,
  ArrowRight,
} from 'lucide-react';
import type { ToolType } from '../types';
import { getToolMetadata } from '../utils/toolMetadata';

interface SupportedFormatsBadgeProps {
  toolType: ToolType;
  variant?: 'hero' | 'strip' | 'inspector' | 'card';
  className?: string;
}

export const SupportedFormatsBadge: React.FC<SupportedFormatsBadgeProps> = ({
  toolType,
  variant = 'strip',
  className = '',
}) => {
  const meta = getToolMetadata(toolType);

  const getToolIcon = () => {
    switch (toolType) {
      case 'pasfoto':
        return <Sparkles size={16} className="text-pink-400" />;
      case 'watermark':
        return <ShieldCheck size={16} className="text-cyan-400" />;
      case 'compress-pdf':
        return <Archive size={16} className="text-amber-400" />;
      case 'heic-to-img':
        return <Smartphone size={16} className="text-emerald-400" />;
      case 'split-pdf':
        return <Scissors size={16} className="text-accent-solid" />;
      case 'word-to-pdf':
      case 'pdf-to-docx':
      case 'word-to-html':
      case 'word-to-txt':
        return <FileText size={16} className="text-blue-400" />;
      case 'excel-to-pdf':
      case 'excel-to-csv':
      case 'csv-to-excel':
      case 'pdf-to-xlsx':
        return <FileSpreadsheet size={16} className="text-emerald-400" />;
      case 'pptx-to-pdf':
      case 'pdf-to-pptx':
        return <Presentation size={16} className="text-orange-400" />;
      case 'office-media':
        return <Archive size={16} className="text-purple-400" />;
      default:
        return <FileImage size={16} className="text-accent-solid" />;
    }
  };

  // 1. Variant 'inspector': Placed at the top of RightInspector panel
  if (variant === 'inspector') {
    return (
      <div className={`p-2.5 rounded bg-surface-bg border border-border-subtle flex flex-col gap-2 ${className}`}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            {getToolIcon()}
            <span className="text-xs font-bold text-text-primary truncate">
              {meta.title}
            </span>
          </div>
          <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-surface-panel border border-border-subtle text-accent-solid font-semibold shrink-0">
            {meta.badge}
          </span>
        </div>

        <div className="flex flex-col gap-1 text-[11px] font-mono">
          <div className="flex items-center gap-1.5 text-text-muted">
            <span className="text-[10px] text-text-secondary uppercase">Mendukung Format:</span>
          </div>
          <div className="flex flex-wrap items-center gap-1">
            {meta.formats.map((f, i) => (
              <span
                key={i}
                className={`text-[10px] px-1.5 py-0.5 rounded border font-semibold ${f.colorClass}`}
                title={f.label}
              >
                .{f.ext}
              </span>
            ))}
          </div>
        </div>

        <div className="pt-1.5 border-t border-border-subtle/50 flex items-center justify-between text-[10px] font-mono text-text-muted">
          <span>Output:</span>
          <span className="text-text-secondary truncate max-w-[170px]" title={meta.outputFormat}>
            {meta.outputFormat}
          </span>
        </div>
      </div>
    );
  }

  // 2. Variant 'strip': Sticky banner at the top of CenterCanvas / FileList when files are loaded
  if (variant === 'strip') {
    return (
      <div className={`px-4 py-2 bg-surface-panel/95 backdrop-blur-xs border-b border-border-subtle flex flex-wrap items-center justify-between gap-2.5 select-none ${className}`}>
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-1.5">
            {getToolIcon()}
            <span className="text-xs font-bold font-mono uppercase text-text-primary">
              {meta.title}
            </span>
          </div>

          <div className="h-3 w-px bg-border-subtle hidden sm:block" />

          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-mono text-text-muted">Format Didukung:</span>
            <div className="flex items-center gap-1 flex-wrap">
              {meta.formats.map((f, i) => (
                <span
                  key={i}
                  className={`text-[10px] font-mono px-1.5 py-0.5 rounded border font-semibold ${f.colorClass}`}
                  title={f.label}
                >
                  .{f.ext}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[11px] font-mono text-text-muted">
          <span className="hidden md:inline">Output:</span>
          <span className="px-1.5 py-0.5 rounded bg-surface-elevated text-text-secondary border border-border-subtle">
            {meta.outputFormat}
          </span>
        </div>
      </div>
    );
  }

  // 3. Variant 'hero': Prominent detailed card for Dropzone view (when no files yet)
  return (
    <div className={`w-full max-w-xl mx-auto flex flex-col gap-3.5 select-none ${className}`}>
      {/* Supported formats showcase box */}
      <div className="p-4 rounded-lg bg-surface-panel border border-border-subtle flex flex-col gap-3 shadow-xs">
        <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-border-subtle">
          <div className="flex items-center gap-2">
            <Info size={15} className="text-accent-solid" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-text-primary">
              Format Berkas yang Didukung
            </span>
          </div>
          <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-surface-elevated text-accent-solid font-semibold border border-border-subtle">
            {meta.badge}
          </span>
        </div>

        {/* Badges Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {meta.formats.map((f, i) => (
            <div
              key={i}
              className="p-2 rounded bg-surface-bg border border-border-subtle flex items-center justify-between gap-2"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded border ${f.colorClass}`}>
                  .{f.ext}
                </span>
                <span className="text-xs text-text-secondary truncate">
                  {f.label}
                </span>
              </div>
              <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
            </div>
          ))}
        </div>

        {/* Output format info */}
        <div className="pt-2 border-t border-border-subtle/50 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
          <div className="flex items-center gap-1.5 text-text-muted">
            <ArrowRight size={13} className="text-accent-solid" />
            <span>Format Hasil (Output):</span>
          </div>
          <span className="px-2 py-0.5 rounded bg-surface-elevated text-text-primary font-semibold border border-border-subtle">
            {meta.outputFormat}
          </span>
        </div>

        {/* Usage Tips */}
        {meta.usageTips && meta.usageTips.length > 0 && (
          <div className="mt-1 pt-2.5 border-t border-border-subtle/50 flex flex-col gap-1.5">
            <span className="text-[11px] font-mono font-bold text-text-muted uppercase tracking-wider">
              Panduan & Catatan:
            </span>
            <ul className="flex flex-col gap-1 text-[11px] text-text-secondary leading-relaxed">
              {meta.usageTips.map((tip, idx) => (
                <li key={idx} className="flex items-start gap-1.5">
                  <span className="text-accent-solid font-bold">•</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

