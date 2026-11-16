/**
 * Esqueleto de carregamento do painel (Documento Mestre — Regra 45: CARREGANDO).
 * Aparece NA HORA em toda troca de tela, enquanto o servidor monta a página — a
 * tela nunca fica "travada" na anterior. Usa a classe .esqueleto (brilho) da skill.
 */
export default function CarregandoDashboard() {
  return (
    <div className="conteudo" aria-busy="true" aria-label="Carregando…">
      {/* Cabeça */}
      <div style={{ margin: '2px 0 18px' }}>
        <span className="esqueleto" style={{ width: 240, height: 30, maxWidth: '70%' }} />
        <span className="esqueleto" style={{ width: 420, height: 15, maxWidth: '90%', marginTop: 10 }} />
      </div>

      {/* Três cartões de número */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 16 }}>
        {[0, 1, 2].map((i) => (
          <div key={i} className="cartao" style={{ padding: '14px 16px' }}>
            <span className="esqueleto" style={{ width: 120, height: 13 }} />
            <span className="esqueleto" style={{ width: 70, height: 28, marginTop: 10 }} />
            <span className="esqueleto" style={{ width: 100, height: 12, marginTop: 8 }} />
          </div>
        ))}
      </div>

      {/* Lista */}
      <div className="cartao">
        <div className="mon-barra" style={{ gap: 10 }}>
          <span className="esqueleto" style={{ width: 240, height: 38, borderRadius: 10, maxWidth: '60%' }} />
          <span className="esqueleto" style={{ width: 180, height: 32, marginLeft: 'auto', borderRadius: 999 }} />
        </div>
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 16, padding: '14px 16px', borderTop: '1px solid var(--linha)' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <span className="esqueleto" style={{ width: 220, height: 16, maxWidth: '70%' }} />
              <span className="esqueleto" style={{ width: 160, height: 13, marginTop: 8, maxWidth: '50%' }} />
              <span className="esqueleto" style={{ width: 320, height: 14, marginTop: 8, maxWidth: '85%' }} />
            </div>
            <span className="esqueleto" style={{ width: 90, height: 24, borderRadius: 999 }} />
          </div>
        ))}
      </div>
    </div>
  )
}
