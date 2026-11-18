'use client'

import { useMemo, useState } from 'react'
import { CheckCircle2, Search, ChevronDown, ChevronUp } from 'lucide-react'
import { formatarNome, normalizarBusca } from '@/lib/utils'

export interface AtendenteSemFila {
  atendente: string
  finalizadas: number
}

/** Quantos aparecem antes de precisar clicar em "Ver todos". */
const LIMITE = 8
/** A partir daqui a busca por nome aparece (com poucos nomes ela só atrapalha). */
const LIMITE_BUSCA = 9

/** Iniciais para o avatar (mesmo padrão dos cartões da equipe ativa). */
function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/)
  const a = partes[0]?.[0] ?? ''
  const b = partes.length > 1 ? partes[partes.length - 1][0] : ''
  return (a + b).toUpperCase()
}

/**
 * Atendentes que não têm nenhuma conversa em aberto agora — só conversas já encerradas.
 * Lista compacta, ordenada por quem mais encerrou, com busca e "ver todos" para escalar
 * quando a equipe crescer (30+ pessoas).
 */
export default function AtendentesSemConversaAberta({ lista }: { lista: AtendenteSemFila[] }) {
  const [busca, setBusca] = useState('')
  const [expandido, setExpandido] = useState(false)

  const ordenada = useMemo(
    () => [...lista].sort((a, b) => b.finalizadas - a.finalizadas || a.atendente.localeCompare(b.atendente)),
    [lista]
  )

  const buscando = busca.trim().length > 0
  const filtrada = useMemo(() => {
    const q = normalizarBusca(busca)
    if (!q) return ordenada
    return ordenada.filter((c) => normalizarBusca(c.atendente).includes(q))
  }, [ordenada, busca])

  const visiveis = expandido || buscando ? filtrada : filtrada.slice(0, LIMITE)
  const escondidos = filtrada.length - visiveis.length

  if (lista.length === 0) return null

  const totalEncerradas = lista.reduce((s, c) => s + c.finalizadas, 0)

  return (
    <section className="cartao" style={{ padding: '16px 18px', marginTop: 16 }}>
      {/* Cabeçalho do cartão */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, minWidth: 0, flex: 1 }}>
          <CheckCircle2 className="icone" style={{ color: 'var(--sucesso)', flexShrink: 0, marginTop: 2 }} aria-hidden="true" focusable="false" />
          <div style={{ minWidth: 0 }}>
            <div className="sub-titulo">Sem conversa em aberto agora ({lista.length})</div>
            <div className="texto-apoio">
              Ninguém esperando resposta com estes atendentes. O número é de conversas que cada um já encerrou
              ({totalEncerradas.toLocaleString('pt-BR')} no total) — quem mais encerrou aparece primeiro.
            </div>
          </div>
        </div>

        {lista.length >= LIMITE_BUSCA && (
          <div className="campo" style={{ flex: '1 1 220px', maxWidth: 360 }}>
            <label className="so-leitor" htmlFor="busca-sem-conversa">Procurar atendente pelo nome</label>
            <div className="caixa-icone">
              <Search className="icone" aria-hidden="true" focusable="false" />
              <input id="busca-sem-conversa" className="entrada" type="search" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Procurar pelo nome" autoComplete="off" enterKeyHint="search" />
            </div>
          </div>
        )}
      </div>

      {/* Lista */}
      {visiveis.length === 0 ? (
        <div className="vazio-curto" role="status">
          <Search className="icone" aria-hidden="true" focusable="false" />
          <span>Nenhum atendente com “{busca.trim()}”. Confira a grafia ou apague a busca.</span>
        </div>
      ) : (
        <ul id="lista-sem-conversa" style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 8 }}>
          {visiveis.map((c) => (
            <li key={c.atendente} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--recuo)', boxShadow: 'inset 0 0 0 1px var(--linha)', borderRadius: 'var(--raio)', padding: '8px 10px', minWidth: 0 }}>
              <span className="avatar p" aria-hidden="true">{iniciais(c.atendente)}</span>
              <span style={{ flex: 1, minWidth: 0, fontSize: 'var(--t-meta)', fontWeight: 600, color: 'var(--tinta)', overflowWrap: 'anywhere' }}>{formatarNome(c.atendente)}</span>
              <span className="selo selo-sucesso">{c.finalizadas} {c.finalizadas === 1 ? 'encerrada' : 'encerradas'}</span>
            </li>
          ))}
        </ul>
      )}

      {!buscando && filtrada.length > LIMITE && (
        <button type="button" className="botao botao-secundario" aria-expanded={expandido} aria-controls="lista-sem-conversa" onClick={() => setExpandido((v) => !v)} style={{ marginTop: 12 }}>
          {expandido ? (<><ChevronUp className="icone icone-p" aria-hidden="true" focusable="false" /> Mostrar menos</>) : (<><ChevronDown className="icone icone-p" aria-hidden="true" focusable="false" /> Ver todos os {filtrada.length} atendentes ({escondidos} ocultos)</>)}
        </button>
      )}
    </section>
  )
}
