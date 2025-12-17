'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Calendar } from 'lucide-react';

export type DateRangePreset = 'mtd' | 'qtd' | 'ytd' | 'last30' | 'last90' | 'custom';

export interface DateRange {
  start: Date;
  end: Date;
  preset: DateRangePreset;
}

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

const presets: { label: string; value: DateRangePreset }[] = [
  { label: 'MTD', value: 'mtd' },
  { label: 'QTD', value: 'qtd' },
  { label: 'YTD', value: 'ytd' },
  { label: 'Last 30 days', value: 'last30' },
  { label: 'Last 90 days', value: 'last90' },
  { label: 'Custom', value: 'custom' },
];

export function calculateDateRange(preset: DateRangePreset): { start: Date; end: Date } {
  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  let start: Date;

  switch (preset) {
    case 'mtd':
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case 'qtd':
      const quarter = Math.floor(now.getMonth() / 3);
      start = new Date(now.getFullYear(), quarter * 3, 1);
      break;
    case 'ytd':
      start = new Date(now.getFullYear(), 0, 1);
      break;
    case 'last30':
      start = new Date(now);
      start.setDate(start.getDate() - 30);
      start.setHours(0, 0, 0, 0);
      break;
    case 'last90':
      start = new Date(now);
      start.setDate(start.getDate() - 90);
      start.setHours(0, 0, 0, 0);
      break;
    case 'custom':
      // Return current range (will be updated via date inputs)
      return { start: new Date(now.getFullYear(), now.getMonth(), 1), end };
    default:
      start = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  start.setHours(0, 0, 0, 0);
  return { start, end };
}

export default function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [customStart, setCustomStart] = useState(
    value.preset === 'custom' 
      ? value.start.toISOString().split('T')[0]
      : ''
  );
  const [customEnd, setCustomEnd] = useState(
    value.preset === 'custom'
      ? value.end.toISOString().split('T')[0]
      : ''
  );
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handlePresetSelect = (preset: DateRangePreset) => {
    if (preset === 'custom') {
      setIsOpen(true);
      onChange({
        ...value,
        preset: 'custom',
      });
    } else {
      const { start, end } = calculateDateRange(preset);
      onChange({ start, end, preset });
      setIsOpen(false);
    }
  };

  // Sync custom dates when value changes externally
  useEffect(() => {
    if (value.preset === 'custom') {
      setCustomStart(value.start.toISOString().split('T')[0]);
      setCustomEnd(value.end.toISOString().split('T')[0]);
    }
  }, [value.preset, value.start, value.end]);

  useEffect(() => {
    if (value.preset === 'custom' && customStart && customEnd) {
      const start = new Date(customStart);
      const end = new Date(customEnd);
      end.setHours(23, 59, 59, 999);
      
      if (start <= end) {
        onChange({ start, end, preset: 'custom' });
      }
    }
  }, [customStart, customEnd, value.preset, onChange]);

  const getDisplayLabel = () => {
    const preset = presets.find(p => p.value === value.preset);
    return preset?.label || 'MTD';
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="rounded-xl border border-border/50 bg-surface-1 px-3 py-2 text-sm text-text-secondary hover:bg-surface-2 transition-colors flex items-center gap-1"
      >
        {getDisplayLabel()}
        <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 z-50 rounded-xl border border-border/50 bg-surface-1 shadow-lg min-w-[200px]">
          <div className="p-2">
            {presets.map((preset) => (
              <button
                key={preset.value}
                onClick={() => handlePresetSelect(preset.value)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  value.preset === preset.value
                    ? 'bg-accent/20 text-accent'
                    : 'text-text-secondary hover:bg-surface-2'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {value.preset === 'custom' && (
            <div className="p-3 border-t border-border/30 space-y-2">
              <div>
                <label className="block text-xs text-text-muted mb-1">Start Date</label>
                <input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="w-full px-2 py-1.5 text-xs rounded-lg border border-border/50 bg-surface-2 text-text-primary focus:outline-none focus:ring-1 focus:ring-accent/50"
                />
              </div>
              <div>
                <label className="block text-xs text-text-muted mb-1">End Date</label>
                <input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="w-full px-2 py-1.5 text-xs rounded-lg border border-border/50 bg-surface-2 text-text-primary focus:outline-none focus:ring-1 focus:ring-accent/50"
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

