import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface DropdownOption {
  value: string;
  label: string;
}

interface DropdownProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  options: DropdownOption[];
  placeholder?: string;
  disabled?: boolean;
}

export default function Dropdown({
  id,
  value,
  onChange,
  options,
  placeholder = "Pilih item...",
  disabled = false,
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const selectedOption = options.find(opt => opt.value === value);

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
        <span className={`truncate whitespace-nowrap pr-1 ${!selectedOption ? "text-slate-400 dark:text-slate-500" : "font-bold"}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          className={`h-4 w-4 text-slate-500 shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180 text-blue-500" : ""}`}
        />
      </button>

      <AnimatePresence>
        {isOpen && !disabled && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute z-50 mt-1.5 max-h-48 w-full overflow-hidden rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-left"
          >
            <div className="overflow-y-auto max-h-44 py-1 scrollbar-none" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {options.length === 0 ? (
                <div className="px-4 py-3 text-center text-xs text-slate-400 font-medium">Tidak ada pilihan</div>
              ) : (
                options.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      onChange(option.value);
                      setIsOpen(false);
                    }}
                    className={`flex w-full items-center justify-between px-4 py-2.5 text-xs text-left transition-colors duration-150 cursor-pointer
                      ${option.value === value
                        ? "bg-blue-500/5 text-blue-600 dark:text-blue-400 font-bold"
                        : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900/40"
                      }`}
                  >
                    <span>{option.label}</span>
                    {option.value === value && (
                      <Check className="h-4 w-4 flex-shrink-0 text-blue-500 dark:text-blue-400" />
                    )}
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
