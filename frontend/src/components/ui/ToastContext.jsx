import { createContext, useCallback, useContext, useRef, useState } from 'react';

const ToastContext = createContext(null);

let proximoId = 1;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef({});

  const remover = useCallback((id) => {
    setToasts((lista) => lista.filter((t) => t.id !== id));
    clearTimeout(timers.current[id]);
    delete timers.current[id];
  }, []);

  const mostrar = useCallback((mensagem, tipo = 'erro') => {
    const id = proximoId++;
    setToasts((lista) => [...lista, { id, mensagem, tipo }]);
    timers.current[id] = setTimeout(() => remover(id), 5000);
  }, [remover]);

  const toast = {
    erro: (mensagem) => mostrar(mensagem, 'erro'),
    sucesso: (mensagem) => mostrar(mensagem, 'sucesso'),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="toast-stack">
        {toasts.map((t) => (
          <div key={t.id} className={`toast-item toast-${t.tipo}`} onClick={() => remover(t.id)}>
            {t.mensagem}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
