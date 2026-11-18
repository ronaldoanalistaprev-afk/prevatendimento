/** Esqueleto da Minha conta (Regra 45): o título real fica; o formulário vira esqueleto. */
export default function CarregandoConta() {
  return (
    <div className="conteudo" aria-busy="true" style={{ maxWidth: 520 }}>
      <p className="so-leitor" role="status">Carregando…</p>
      <h1 className="titulo" style={{ margin: '4px 0 4px' }}>Minha conta</h1>
      <p className="subtitulo" style={{ marginBottom: 22 }}>Troque a sua senha aqui, na hora — sem precisar de e-mail.</p>
      <div className="cartao" aria-hidden="true" style={{ padding: 24, display: 'grid', gap: 16 }}>
        {[0, 1].map((i) => (
          <div key={i} className="campo">
            <span className="esqueleto" style={{ width: 130, height: 14 }} />
            <span className="esqueleto" style={{ width: '100%', height: 40, borderRadius: 10 }} />
          </div>
        ))}
        <span className="esqueleto" style={{ width: '100%', height: 40, borderRadius: 10 }} />
      </div>
    </div>
  )
}
