import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Filter } from 'lucide-react';
import SetFilterBody from './SetFilterBody';
import { isSetFilterActive } from '../../../utils/gridFilters';
import './SetColumnFilter.css';

const PANEL_WIDTH = 248;
const PANEL_MAX_HEIGHT = 340;

export default function SetColumnFilter({
  label,
  values = [],
  hasBlanks = false,
  model = null,
  onApply,
  onReset,
}) {
  const [open, setOpen] = useState(false);
  const [placement, setPlacement] = useState(null);
  const triggerRef = useRef(null);
  const panelRef = useRef(null);

  const active = isSetFilterActive(model);

  const computePlacement = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const left = Math.max(
      8,
      Math.min(rect.left, window.innerWidth - PANEL_WIDTH - 8),
    );
    const openUp =
      rect.bottom + PANEL_MAX_HEIGHT > window.innerHeight &&
      rect.top > PANEL_MAX_HEIGHT;

    setPlacement(
      openUp
        ? { left, bottom: window.innerHeight - rect.top + 4 }
        : { left, top: rect.bottom + 4 },
    );
  }, []);

  const closePanel = useCallback(() => {
    setOpen(false);
    setPlacement(null);
  }, []);

  useEffect(() => {
    if (!open) return undefined;

    function onPointerDown(e) {
      if (panelRef.current?.contains(e.target)) return;
      if (triggerRef.current?.contains(e.target)) return;
      closePanel();
    }

    function onKeyDown(e) {
      if (e.key !== 'Escape') return;
      e.stopPropagation();
      closePanel();
      triggerRef.current?.focus();
    }

    document.addEventListener('mousedown', onPointerDown, true);
    document.addEventListener('keydown', onKeyDown, true);
    window.addEventListener('resize', computePlacement);
    window.addEventListener('scroll', computePlacement, true);

    return () => {
      document.removeEventListener('mousedown', onPointerDown, true);
      document.removeEventListener('keydown', onKeyDown, true);
      window.removeEventListener('resize', computePlacement);
      window.removeEventListener('scroll', computePlacement, true);
    };
  }, [open, closePanel, computePlacement]);

  function toggleOpen() {
    if (open) {
      closePanel();
      return;
    }
    computePlacement();
    setOpen(true);
  }

  const triggerText = active ? `${model.values.length} selected` : 'All';

  const panel = placement ? (
    <div
      ref={panelRef}
      className="grid-set-filter-panel"
      role="dialog"
      aria-label={`Filter ${label}`}
      style={{
        left: placement.left,
        top: placement.top,
        bottom: placement.bottom,
        width: PANEL_WIDTH,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <SetFilterBody
        label={label}
        values={values}
        hasBlanks={hasBlanks}
        model={model}
        autoFocusSearch
        onApply={(next) => {
          onApply?.(next);
          closePanel();
        }}
        onReset={onReset}
      />
    </div>
  ) : null;

  return (
    <div className="grid-set-filter" onClick={(e) => e.stopPropagation()}>
      <button
        ref={triggerRef}
        type="button"
        className={`grid-set-filter-trigger${active ? ' is-active' : ''}`}
        onClick={toggleOpen}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={`Filter ${label}`}
        title={`Filter ${label}`}
      >
        <Filter size={11} aria-hidden />
        <span className="grid-set-filter-trigger-text">{triggerText}</span>
      </button>
      {open && panel ? createPortal(panel, document.body) : null}
    </div>
  );
}
