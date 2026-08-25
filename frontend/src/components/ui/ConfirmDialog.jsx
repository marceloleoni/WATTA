import { useState } from 'react';
import Modal from './Modal.jsx';

export default function ConfirmDialog({ title = 'Confirmar', message, confirmLabel = 'Confirmar', danger, onConfirm, onCancel }) {
  const [processando, setProcessando] = useState(false);

  const confirmar = async () => {
    setProcessando(true);
    try {
      await onConfirm();
    } finally {
      setProcessando(false);
    }
  };

  return (
    <Modal
      title={title}
      onClose={onCancel}
      maxWidth={400}
      footer={(
        <>
          <button type="button" className="btn" onClick={onCancel} disabled={processando}>Cancelar</button>
          <button
            type="button"
            className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`}
            onClick={confirmar}
            disabled={processando}
          >
            {processando ? 'Aguarde…' : confirmLabel}
          </button>
        </>
      )}
    >
      <div style={{ fontSize: 13.5, lineHeight: 1.5 }}>{message}</div>
    </Modal>
  );
}
