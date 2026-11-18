'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, RotateCw, Loader2 } from 'lucide-react'

/**
 * Aviso quando os dados não puderam ser lidos (Documento Mestre — Regra 43 item 3 e Regra 45, ERRO):
 * diz em linguagem simples o que aconteceu e o que fazer. O detalhe técnico fica recolhido,
 * só para o administrador, nunca na frente do usuário.
 */
export default function BannerConfig({ erro }: { erro?: string | null }) {
  const router = useRouter()
  const [carregando, iniciar] = useTransition()
  const [tentou, setTentou] = useState(false)

  function tentarDeNovo() {
    setTentou(true)
    iniciar(() => router.refresh())
  }

  return (
    <div className="aviso aviso-atencao" role="alert" style={{ marginBottom: 16 }}>
      <AlertTriangle className="icone" aria-hidden="true" focusable="false" />
      <div style={{ flex: 1, minWidth: 0 }}>
        {erro ? (
          <>
            <strong>Não foi possível ler os dados agora.</strong>{' '}
            A tela aparece com os números zerados até a leitura voltar. Tente de novo em alguns instantes; se continuar, avise o administrador do sistema.
          </>
        ) : (
          <>
            <strong>O sistema ainda não está ligado ao banco de dados.</strong>{' '}
            A tela aparece com os números zerados até o administrador concluir essa configuração.
          </>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginTop: 10 }}>
          <button type="button" className="botao botao-secundario" onClick={tentarDeNovo} disabled={carregando}>
            {carregando
              ? <Loader2 className="icone icone-p animate-spin" aria-hidden="true" focusable="false" />
              : <RotateCw className="icone icone-p" aria-hidden="true" focusable="false" />}
            {carregando ? 'Tentando de novo…' : 'Tentar de novo'}
          </button>
          {tentou && !carregando && <span role="status">Tentativa feita. Se o aviso continuar, avise o administrador.</span>}
        </div>
        {erro && (
          <details style={{ marginTop: 8, color: 'var(--tinta-2)', fontSize: 'var(--t-pequeno)' }}>
            <summary style={{ cursor: 'pointer', minHeight: 'var(--alvo)', display: 'inline-flex', alignItems: 'center' }}>Detalhe técnico (para o administrador)</summary>
            <p style={{ marginTop: 4, overflowWrap: 'anywhere' }}>{erro}</p>
          </details>
        )}
      </div>
    </div>
  )
}
