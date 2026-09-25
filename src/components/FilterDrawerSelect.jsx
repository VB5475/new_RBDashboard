import { useEffect, useId, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';

export default function FilterDrawerSelect({
  value = '',
  options = [],
  disabled = false,
  active = false,
  onChange,
  placeholder = 'All',
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const listId = useId();

  useEffect(() => {
    if (!open) return undefined;
    function onDocMouseDown(e) {
      if (!rootRef.current?.contains(e.target)) setOpen(false);
    }
    function onKey(e) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onDocMouseDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocMouseDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const selectedLabel =
    value === '' || value == null
      ? placeholder
      : options.find((o) => String(o.value) === String(value))?.label ??
        placeholder;

  function pick(nextValue, label) {
    onChange(nextValue, label);
    setOpen(false);
  }

  return (
    <div
      ref={rootRef}
      className={`filter-drawer-select-wrap${active ? ' is-active' : ''}${
        disabled ? ' is-disabled' : ''
      }${open ? ' is-open' : ''}`}
    >
      <button
        type="button"
        className="filter-drawer-select-trigger"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => {
          if (!disabled) setOpen((v) => !v);
        }}
      >
        <span className="filter-drawer-select-trigger-label">{selectedLabel}</span>
        <ChevronDown
          size={18}
          className="filter-drawer-select-chevron"
          aria-hidden
        />
      </button>

      {open && !disabled ? (
        <ul id={listId} className="filter-drawer-select-menu" role="listbox">
          <li role="presentation">
            <button
              type="button"
              role="option"
              className={`filter-drawer-select-option${
                value === '' || value == null ? ' is-selected' : ''
              }`}
              aria-selected={value === '' || value == null}
              onClick={() => pick('', placeholder)}
            >
              {placeholder}
            </button>
          </li>
          {options.map((opt) => {
            const isSelected = String(opt.value) === String(value);
            return (
              <li key={`${opt.value}-${opt.label}`} role="presentation">
                <button
                  type="button"
                  role="option"
                  className={`filter-drawer-select-option${
                    isSelected ? ' is-selected' : ''
                  }`}
                  aria-selected={isSelected}
                  onClick={() => pick(String(opt.value), opt.label)}
                >
                  {opt.label}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
