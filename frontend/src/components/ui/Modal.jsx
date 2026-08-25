import { useEffect } from 'react';

export default function Modal({ title, onClose, children, footer, maxWidth }) {
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div className="modal-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose?.(); }}>
      <div className="modal-card" style={maxWidth ? { maxWidth } : undefined}>
        <div className="modal-header">
          <div className="modal-title">{title}</div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Fechar">✕</button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}
