import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client.js';

const SUGESTOES = ['Quais documentos preciso enviar?', 'Qual o prazo de homologação?', 'Falar com analista'];

export default function Chatbot() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [mensagens, setMensagens] = useState([
    { sender: 'bot', text: 'Olá! Sou o assistente local da WATTA. Posso ajudar com dúvidas sobre documentos, prazos e status do seu projeto.' },
  ]);
  const [enviando, setEnviando] = useState(false);

  const enviar = async (textoOverride) => {
    const texto = (typeof textoOverride === 'string' ? textoOverride : input).trim();
    if (!texto || enviando) return;

    setMensagens((m) => [...m, { sender: 'user', text: texto }]);
    setInput('');
    setEnviando(true);

    try {
      const { resposta } = await api.post('/chatbot/mensagem', { texto });
      setMensagens((m) => [...m, { sender: 'bot', text: resposta }]);

      const lower = texto.toLowerCase();
      if (lower.includes('analista') || lower.includes('falar')) {
        setTimeout(() => {
          setOpen(false);
          navigate('/chat');
        }, 900);
      }
    } catch (e) {
      setMensagens((m) => [...m, { sender: 'bot', text: 'Não consegui processar sua mensagem agora. Tente novamente em instantes.' }]);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <>
      <div
        onClick={() => setOpen((v) => !v)}
        style={{
          position: 'fixed', bottom: 24, right: 24, width: 56, height: 56, borderRadius: '50%',
          background: 'var(--color-blue)', boxShadow: '0 8px 24px oklch(42% 0.13 258 / 0.35)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 50,
        }}
      >
        <div style={{ color: '#fff', fontSize: 22 }}>{open ? '✕' : '💬'}</div>
      </div>

      {open && (
        <div className="chatbot-panel fade-in" style={{
          position: 'fixed', bottom: 92, right: 24, width: 360, height: 480, background: '#ffffff',
          borderRadius: 14, boxShadow: '0 16px 48px rgba(0,0,0,0.18)', border: '1px solid var(--color-gray-border)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden', zIndex: 50,
        }}>
          <div style={{ padding: '16px 18px', background: 'var(--color-blue)', color: '#fff', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>☀</div>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 700 }}>Assistente WATTA</div>
              <div style={{ fontSize: 11, opacity: 0.85 }}>Respostas rápidas e locais</div>
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 10, background: 'oklch(98% 0.002 90)' }}>
            {mensagens.map((m, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: m.sender === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  maxWidth: '82%', padding: '9px 13px', borderRadius: 11, fontSize: 12.5, lineHeight: 1.4,
                  background: m.sender === 'user' ? 'var(--color-blue)' : '#ffffff',
                  color: m.sender === 'user' ? '#fff' : 'oklch(22% 0.006 90)',
                  border: m.sender === 'user' ? 'none' : '1px solid var(--color-gray-border)',
                }}>
                  {m.text}
                </div>
              </div>
            ))}
          </div>

          <div style={{ padding: '10px 14px', display: 'flex', gap: 6, flexWrap: 'wrap', borderTop: '1px solid oklch(92% 0.003 90)' }}>
            {SUGESTOES.map((s) => (
              <div key={s} onClick={() => enviar(s)} style={{ padding: '6px 10px', borderRadius: 14, background: 'var(--color-blue-light)', color: 'var(--color-blue)', fontSize: 11.5, fontWeight: 500, cursor: 'pointer' }}>
                {s}
              </div>
            ))}
          </div>

          <div style={{ padding: '12px 14px', borderTop: '1px solid oklch(92% 0.003 90)', display: 'flex', gap: 8 }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') enviar(); }}
              placeholder="Pergunte algo..."
              style={{ flex: 1, padding: '9px 12px', borderRadius: 8, border: '1px solid var(--color-gray-border)', fontSize: 12.5, fontFamily: 'inherit', outline: 'none' }}
            />
            <div onClick={() => enviar()} style={{ padding: '9px 14px', borderRadius: 8, background: 'var(--color-blue)', color: '#fff', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}>➤</div>
          </div>
        </div>
      )}
    </>
  );
}
