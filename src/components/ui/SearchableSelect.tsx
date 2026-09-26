"use client";
import { useState, useEffect, useRef } from "react";
import { ChevronDown, X, Loader2 } from "lucide-react";

interface Option {
  id: number;
  name: string;
}

interface SearchableSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string, id: number) => void;
  placeholder: string;
  disabled?: boolean;
  loading?: boolean;
  onSearch: (query: string) => void;
}

export default function SearchableSelect({
  options,
  value,
  onChange,
  placeholder,
  disabled = false,
  loading = false,
  onSearch,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState(value);
  const ref = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setInput(value);
  }, [value]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleInputChange = (v: string) => {
    setInput(v);
    onChange("", 0);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => onSearch(v), 300);
  };

  const handleSelect = (opt: Option) => {
    setInput(opt.name);
    onChange(opt.name, opt.id);
    setOpen(false);
  };

  const handleClear = () => {
    setInput("");
    onChange("", 0);
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <input
          className="input pr-16"
          value={input}
          onChange={e => handleInputChange(e.target.value)}
          onFocus={() => { setOpen(true); onSearch(""); }}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete="off"
        />
        {input && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-9 top-1/2 -translate-y-1/2 p-0.5 hover:bg-slate-200 rounded"
          >
            <X className="w-3.5 h-3.5 text-slate-400" />
          </button>
        )}
        <button
          type="button"
          onClick={() => { setOpen(!open); if (!open) onSearch(""); }}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 hover:bg-slate-200 rounded disabled:opacity-50"
          disabled={disabled}
        >
          {loading ? (
            <span className="flex items-center justify-center w-4 h-4">
              <Loader2 className="w-4 h-4 text-primary-600 animate-spin" />
            </span>
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </button>
      </div>
      {open && !disabled && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg max-h-52 overflow-auto animate-fade-in">
          {options.length === 0 ? (
            <div className="px-4 py-3 text-sm text-slate-400 text-center">
              {loading ? "Loading..." : "No results found"}
            </div>
          ) : (
            options.map(opt => (
              <button
                key={opt.id}
                type="button"
                onClick={() => handleSelect(opt)}
                className="w-full text-left px-4 py-2.5 text-sm hover:bg-primary-50 hover:text-primary-700 transition-colors truncate"
              >
                {opt.name}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
