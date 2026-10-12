import React, { useState, useEffect, useRef, useMemo } from 'react';
import './DatePicker.css';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const WEEKDAY_NAMES = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

/**
 * Pure date string parsing without timezone offsets
 * Expects 'YYYY-MM-DD'
 */
function parseDateParts(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const match = dateStr.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const day = parseInt(match[3], 10);
  if (month < 1 || month > 12) return null;
  const daysInMonth = new Date(year, month, 0).getDate();
  if (day < 1 || day > daysInMonth) return null;
  return { year, month, day };
}

/**
 * Format year, month, day into pure ISO 'YYYY-MM-DD'
 */
function formatLocalDate(year, month, day) {
  const y = String(year).padStart(4, '0');
  const m = String(month).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Calculate age based on date parts
 */
function calculateAge(year, month, day) {
  const today = new Date();
  let age = today.getFullYear() - year;
  const m = (today.getMonth() + 1) - month;
  if (m < 0 || (m === 0 && today.getDate() < day)) {
    age--;
  }
  return age;
}

export default function DatePicker({
  value = '',
  onChange,
  label,
  name,
  required = false,
  error: externalError,
  minAge = 18,
  maxAge = 100,
  helperText,
  disabled = false,
  placeholder = 'YYYY-MM-DD',
  className = '',
}) {
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  const [isOpen, setIsOpen] = useState(false);
  const [internalError, setInternalError] = useState('');

  // Today reference
  const today = useMemo(() => new Date(), []);
  const maxYear = today.getFullYear() - minAge;
  const minYear = today.getFullYear() - maxAge;

  // Initial calendar view year and month
  const parsedValue = useMemo(() => parseDateParts(value), [value]);

  const [viewYear, setViewYear] = useState(() => parsedValue ? parsedValue.year : maxYear);
  const [viewMonth, setViewMonth] = useState(() => parsedValue ? parsedValue.month : 1);
  const [inputValue, setInputValue] = useState(value || '');

  // Keep internal input value in sync when prop changes externally
  useEffect(() => {
    setInputValue(value || '');
    if (value) {
      const parts = parseDateParts(value);
      if (parts) {
        setViewYear(parts.year);
        setViewMonth(parts.month);
        const age = calculateAge(parts.year, parts.month, parts.day);
        if (age < minAge) {
          setInternalError(`You must be at least ${minAge} years old to join Sway.`);
        } else {
          setInternalError('');
        }
      }
    } else {
      setInternalError('');
    }
  }, [value, minAge]);

  // Close calendar popup on click outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Handle direct text typing in input
  const handleInputChange = (e) => {
    const raw = e.target.value;
    setInputValue(raw);

    if (!raw.trim()) {
      setInternalError('');
      if (onChange) onChange('');
      return;
    }

    const parts = parseDateParts(raw);
    if (!parts) {
      if (raw.length >= 10) {
        setInternalError('Please enter a valid date in YYYY-MM-DD format.');
      } else {
        setInternalError('');
      }
      return;
    }

    const age = calculateAge(parts.year, parts.month, parts.day);
    if (age < minAge) {
      setInternalError(`You must be at least ${minAge} years old to join Sway.`);
      return;
    }

    if (parts.year < minYear || parts.year > maxYear) {
      setInternalError(`Year must be between ${minYear} and ${maxYear}.`);
      return;
    }

    setInternalError('');
    setViewYear(parts.year);
    setViewMonth(parts.month);
    if (onChange) onChange(formatLocalDate(parts.year, parts.month, parts.day));
  };

  const handleInputBlur = () => {
    if (!inputValue.trim()) {
      setInternalError('');
      return;
    }
    const parts = parseDateParts(inputValue);
    if (!parts) {
      setInternalError('Invalid date. Format: YYYY-MM-DD (e.g. 1998-05-24)');
      return;
    }
    const age = calculateAge(parts.year, parts.month, parts.day);
    if (age < minAge) {
      setInternalError(`You must be at least ${minAge} years old to join Sway.`);
      return;
    }
    setInternalError('');
  };

  // Select day from calendar grid
  const handleSelectDay = (day) => {
    const age = calculateAge(viewYear, viewMonth, day);
    if (age < minAge) {
      setInternalError(`You must be at least ${minAge} years old to join Sway.`);
      return;
    }

    const formatted = formatLocalDate(viewYear, viewMonth, day);
    setInputValue(formatted);
    setInternalError('');
    if (onChange) onChange(formatted);
    setIsOpen(false);
  };

  // Quick navigation
  const handlePrevMonth = () => {
    if (viewMonth === 1) {
      if (viewYear > minYear) {
        setViewYear((y) => y - 1);
        setViewMonth(12);
      }
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 12) {
      if (viewYear < maxYear) {
        setViewYear((y) => y + 1);
        setViewMonth(1);
      }
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  // Calendar grid calculations
  const daysInCurrentMonth = new Date(viewYear, viewMonth, 0).getDate();
  const firstDayWeekday = new Date(viewYear, viewMonth - 1, 1).getDay(); // 0 is Sunday

  // Days list: leading empty slots + valid days
  const calendarCells = [];
  for (let i = 0; i < firstDayWeekday; i++) {
    calendarCells.push({ empty: true, key: `empty-${i}` });
  }
  for (let d = 1; d <= daysInCurrentMonth; d++) {
    const age = calculateAge(viewYear, viewMonth, d);
    const isUnderage = age < minAge;
    const isSelected = parsedValue && parsedValue.year === viewYear && parsedValue.month === viewMonth && parsedValue.day === d;
    const isToday = today.getFullYear() === viewYear && today.getMonth() + 1 === viewMonth && today.getDate() === d;
    calendarCells.push({
      day: d,
      empty: false,
      disabled: isUnderage,
      selected: isSelected,
      today: isToday,
      key: `day-${d}`,
    });
  }

  // Available Years list for quick selector
  const availableYears = [];
  for (let y = maxYear; y >= minYear; y--) {
    availableYears.push(y);
  }

  const effectiveError = externalError || internalError;
  const currentAge = parsedValue ? calculateAge(parsedValue.year, parsedValue.month, parsedValue.day) : null;

  return (
    <div className={`sway-datepicker-container ${className}`} ref={containerRef}>
      {label && (
        <label htmlFor={name} className="sway-datepicker-label">
          {label} {required && <span className="text-danger">*</span>}
        </label>
      )}

      <div className="sway-datepicker-input-group">
        <input
          ref={inputRef}
          id={name}
          name={name}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete="bday"
          className={`sway-datepicker-input ${effectiveError ? 'is-invalid' : ''}`}
          maxLength={10}
        />
        <button
          type="button"
          className="sway-datepicker-icon-btn"
          onClick={() => !disabled && setIsOpen((prev) => !prev)}
          tabIndex={-1}
          aria-label="Open date of birth calendar"
        >
          <i className="bi bi-calendar3" />
        </button>
      </div>

      {effectiveError && (
        <div className="sway-datepicker-error">
          <i className="bi bi-exclamation-circle me-1" />
          {effectiveError}
        </div>
      )}

      {helperText && !effectiveError && (
        <div className="sway-datepicker-helper">{helperText}</div>
      )}

      {/* Floating Accessible Calendar Dropdown */}
      {isOpen && !disabled && (
        <div className="sway-datepicker-dropdown" role="dialog" aria-modal="true">
          {/* Header with Quick Selectors */}
          <div className="sway-dp-header">
            <button
              type="button"
              className="sway-dp-nav-btn"
              onClick={handlePrevMonth}
              disabled={viewYear <= minYear && viewMonth <= 1}
              aria-label="Previous month"
            >
              <i className="bi bi-chevron-left" />
            </button>

            <div className="sway-dp-selectors">
              <select
                className="sway-dp-select"
                value={viewMonth}
                onChange={(e) => setViewMonth(Number(e.target.value))}
                aria-label="Select month"
              >
                {MONTH_NAMES.map((name, idx) => (
                  <option key={name} value={idx + 1}>
                    {name}
                  </option>
                ))}
              </select>

              <select
                className="sway-dp-select"
                value={viewYear}
                onChange={(e) => setViewYear(Number(e.target.value))}
                aria-label="Select birth year"
              >
                {availableYears.map((yr) => (
                  <option key={yr} value={yr}>
                    {yr}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              className="sway-dp-nav-btn"
              onClick={handleNextMonth}
              disabled={viewYear >= maxYear && viewMonth >= 12}
              aria-label="Next month"
            >
              <i className="bi bi-chevron-right" />
            </button>
          </div>

          {/* Weekday headers */}
          <div className="sway-dp-weekdays">
            {WEEKDAY_NAMES.map((wd) => (
              <div key={wd} className="sway-dp-weekday">
                {wd}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="sway-dp-days">
            {calendarCells.map((cell) => {
              if (cell.empty) {
                return <div key={cell.key} className="sway-dp-day empty" />;
              }
              return (
                <button
                  key={cell.key}
                  type="button"
                  disabled={cell.disabled}
                  onClick={() => handleSelectDay(cell.day)}
                  className={`sway-dp-day ${cell.selected ? 'selected' : ''} ${cell.today ? 'today' : ''} ${cell.disabled ? 'disabled' : ''}`}
                >
                  {cell.day}
                </button>
              );
            })}
          </div>

          {/* Footer with calculated age and quick clear */}
          <div className="sway-dp-footer">
            <div>
              {currentAge !== null && currentAge >= minAge ? (
                <span className="sway-dp-badge-age">
                  <i className="bi bi-check2-circle" /> Age: {currentAge} years (18+)
                </span>
              ) : (
                <span className="text-muted" style={{ fontSize: '11px' }}>
                  <i className="bi bi-shield-check me-1 text-danger" /> Must be 18+ to join
                </span>
              )}
            </div>
            {inputValue && (
              <button
                type="button"
                className="sway-dp-clear-btn"
                onClick={() => {
                  setInputValue('');
                  setInternalError('');
                  if (onChange) onChange('');
                }}
              >
                Clear
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
