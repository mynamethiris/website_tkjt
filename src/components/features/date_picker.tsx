import { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface DatePickerProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

const DAYS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
const MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

function parseDate(dateStr: string): { day: number; month: number; year: number } | null {
  if (!dateStr) return null;
  const parts = dateStr.split('-');
  if (parts.length !== 3) return null;
  return {
    year: parseInt(parts[0], 10),
    month: parseInt(parts[1], 10) - 1,
    day: parseInt(parts[2], 10),
  };
}

function formatDate(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

export default function DatePicker({
  id,
  value,
  onChange,
  placeholder = "Pilih tanggal...",
  disabled = false,
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const parsed = parseDate(value);
  const today = new Date();

  const [viewYear, setViewYear] = useState(parsed?.year ?? today.getFullYear());
  const [viewMonth, setViewMonth] = useState(parsed?.month ?? today.getMonth());

  useEffect(() => {
    if (parsed) {
      setViewYear(parsed.year);
      setViewMonth(parsed.month);
    }
  }, [value]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);
  const calendarDays: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const displayText = parsed
    ? `${parsed.day} ${MONTHS[parsed.month]} ${parsed.year}`
    : '';

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  return (
    <div id={id} ref={containerRef} className="relative w-full text-left font-sans">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`flex w-full items-center justify-between rounded-xl border-2 px-2.5 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium transition-all duration-200 focus:outline-none
          ${disabled
            ? "border-slate-200 bg-slate-50 text-slate-400 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-600 cursor-not-allowed"
            : `bg-white dark:bg-slate-950 text-slate-800 dark:text-white cursor-pointer
               ${isOpen
                 ? "border-blue-500 dark:border-blue-400"
                 : "border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-450 active:border-blue-600 dark:active:border-blue-500"
               }`
          }`}
      >
        <span className={`truncate whitespace-nowrap pr-1 flex items-center gap-2 ${!displayText ? "text-slate-400 dark:text-slate-500" : "font-bold"}`}>
          <Calendar className="h-4 w-4 shrink-0 text-slate-400" />
          {displayText || placeholder}
        </span>
        <ChevronRight className={`h-4 w-4 text-slate-500 shrink-0 transition-transform duration-200 ${isOpen ? "rotate-90 text-blue-500" : ""}`} />
      </button>

      <AnimatePresence>
        {isOpen && !disabled && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute z-50 mt-1.5 w-64 rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-left shadow-xl"
          >
            <div className="p-3">
              <div className="flex items-center justify-between mb-3">
                <button
                  type="button"
                  onClick={prevMonth}
                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors cursor-pointer"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-xs font-bold text-slate-800 dark:text-white">
                  {MONTHS[viewMonth]} {viewYear}
                </span>
                <button
                  type="button"
                  onClick={nextMonth}
                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors cursor-pointer"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              <div className="grid grid-cols-7 gap-0.5 mb-1">
                {DAYS.map((day) => (
                  <div key={day} className="text-center text-[9px] font-bold text-slate-400 dark:text-slate-500 py-1">
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-0.5">
                {calendarDays.map((day, idx) => {
                  if (day === null) {
                    return <div key={`empty-${idx}`} />;
                  }
                  const dateStr = formatDate(viewYear, viewMonth, day);
                  const isSelected = dateStr === value;
                  const isToday =
                    day === today.getDate() &&
                    viewMonth === today.getMonth() &&
                    viewYear === today.getFullYear();

                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => {
                        onChange(dateStr);
                        setIsOpen(false);
                      }}
                      className={`w-full h-7 rounded-lg text-[11px] font-medium transition-all duration-150 cursor-pointer flex items-center justify-center
                        ${isSelected
                          ? "bg-blue-600 text-white font-bold shadow-sm"
                          : isToday
                            ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold"
                            : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60"
                        }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>

              <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    const t = new Date();
                    onChange(formatDate(t.getFullYear(), t.getMonth(), t.getDate()));
                    setIsOpen(false);
                  }}
                  className="w-full text-center text-[10px] font-bold text-blue-500 hover:text-blue-600 py-1 cursor-pointer"
                >
                  Hari Ini
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
