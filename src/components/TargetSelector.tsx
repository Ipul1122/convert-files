import React from 'react';
import { ArrowRight, Sparkles, Check } from 'lucide-react';
import type { TargetOption } from '../utils/conversionTargets';

interface TargetSelectorProps {
  targets: TargetOption[];
  selectedTargetId: string;
  onSelectTarget: (target: TargetOption) => void;
  inputTypeLabel: string;
  fileCountLabel: string;
  onOpenParams?: () => void;
}

export const TargetSelector: React.FC<TargetSelectorProps> = ({
  targets,
  selectedTargetId,
  onSelectTarget,
  inputTypeLabel,
  fileCountLabel,
  onOpenParams,
}) => {
  if (targets.length === 0) return null;

  const activeOption = targets.find(t => t.id === selectedTargetId) || targets[0];

  return (
    <div className="w-full bg-surface-panel border-b border-border-subtle px-3 sm:px-4 py-2.5 sm:py-3 shrink-0 flex flex-col gap-2 select-none">
      {/* Top row: Input summary + Target options buttons */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        {/* Left: Input badge */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2 py-0.5 sm:py-1 rounded bg-surface-elevated border border-border-subtle font-mono text-[11px] text-text-primary">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-solid" />
            <span className="font-bold text-accent-solid">{inputTypeLabel}</span>
            <span className="text-text-muted">({fileCountLabel})</span>
          </div>

          <ArrowRight size={14} className="text-text-muted shrink-0" strokeWidth={1.5} />

          <div className="flex items-center gap-1 text-[11px] font-mono uppercase tracking-wider text-text-secondary font-semibold">
            <Sparkles size={13} className="text-accent-solid" strokeWidth={1.5} />
            <span className="hidden xs:inline">UBAH KE:</span>
          </div>
        </div>

        {/* Right: Target option chips (horizontally scrollable on small screens) */}
        <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-0.5">
          {targets.map(target => {
            const isSelected = target.id === selectedTargetId;

            return (
              <button
                key={target.id}
                type="button"
                onClick={() => onSelectTarget(target)}
                className={`group relative flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded text-xs font-mono transition-all cursor-pointer shrink-0 ${
                  isSelected
                    ? 'bg-accent-solid text-white font-bold border border-accent-solid shadow-xs'
                    : 'bg-surface-elevated text-text-secondary hover:text-text-primary hover:bg-surface-elevated/80 border border-border-subtle hover:border-border-focus'
                }`}
              >
                {isSelected && <Check size={12} strokeWidth={2.5} className="shrink-0" />}
                <span className="tracking-tight">{target.label}</span>
                {target.badge && !isSelected && (
                  <span className="text-[9px] px-1 py-0.2 rounded bg-surface-panel text-text-muted border border-border-subtle group-hover:text-text-secondary">
                    {target.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom row: Description of the currently active conversion target */}
      {activeOption && (
        <div className="flex items-center justify-between text-xs font-mono text-text-muted pt-1 border-t border-border-subtle/50">
          <div className="flex items-center gap-2 truncate">
            <span className="text-accent-solid font-semibold">TUJUAN:</span>
            <span className="text-text-secondary truncate">{activeOption.description}</span>
          </div>
          {onOpenParams && (
            <button
              type="button"
              onClick={onOpenParams}
              className="text-[11px] text-accent-solid hover:underline cursor-pointer md:hidden shrink-0 font-bold ml-2"
            >
              Atur Opsi →
            </button>
          )}
          <span className="text-[10px] text-text-muted hidden md:inline shrink-0">
            Atur opsi lanjutan di panel Parameter →
          </span>
        </div>
      )}
    </div>
  );
};
