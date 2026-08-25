import { useState } from 'react';
import Modal from './Modal.jsx';

export default function PromptDialog({
  title = 'Informe um valor',
  label,
  placeholder,
  multiline,
  confirmLabel = 'Confirmar',
  required = true,
  onConfirm,
  onCancel,
}) {
  const [valor, setValor] = useState('');
  const [erro, setErro] = useState('');
  const [processando, setProcessando] = useState(false);

  const confirmar = async () => {
    const texto = valor.trim();
    if (required && !texto) {
      setErro('Este campo é obrigatório.');
      return;
    }
    setErro('');
    setProcessando(true);
    try {
      await onConfirm(texto);
    } finally {
      setProcessando(false);
    }
  };

  return (
    <Modal
      title={title}
      onClose={onCancel}
      maxWidth={420}
      footer={(
        <>
          <button type="button" className="btn" onClick={onCancel} disabled={processando}>Cancelar</button>
          <button type="button" className="btn btn-primary" onClick={confirmar} disabled={processando}>
            {processando ? 'Aguarde…' : confirmLabel}
          </button>
        </>
      )}
    >
      <div className="form-field">
        {label && <label>{label}</label>}
        {multiline ? (
          <textarea
            autoFocus
            rows={4}
            value={valor}
            placeholder={placeholder}
            onChange={(e) => setValor(e.target.value)}
          />
        ) : (
          <input
            autoFocus
            value={valor}
            placeholder={placeholder}
            onChange={(e) => setValor(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') confirmar(); }}
          />
        )}
        {erro && <div style={{ color: 'var(--color-red)', fontSize: 12, marginTop: 6 }}>{erro}</div>}
      </div>
    </Modal>
  );
}
