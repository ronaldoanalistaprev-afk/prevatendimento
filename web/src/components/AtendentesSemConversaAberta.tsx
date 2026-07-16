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
    <div
      style={{
        background: '#fff',
        borderRadius: 16,
        border: '1px solid #EEF2F7',
        boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
        padding: '16px 18px',
        marginTop: 16,
      }}
    >
      {/* Cabeçalho do cartão */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flex: 1 }}>
          <CheckCircle2 size={18} style={{ color: '#16A34A', flexShrink: 0 }} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#1A3C5A' }}>
              Sem conversa em aberto agora ({lista.length})
            </div>
            <div style={{ fontSize: 12.5, color: '#9CA3AF' }}>
              Ninguém esperando resposta com estes atendentes. O número é de conversas que cada um já encerrou
              ({totalEncerradas.toLocaleString('pt-BR')} no total) — quem mais encerrou aparece primeiro.
            </div>
          </div>
        </div>

        {lista.length >= LIMITE_BUSCA && (
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <Search size={15} style={{ position: 'absolute', left: 10, top: 10, color: '#9CA3AF' }} />
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Procurar pelo nome"
              style={{
                height: 36,
                width: 190,
                padding: '0 12px 0 32px',
                borderRadius: 999,
                border: '1px solid #DCE6EF',
                outline: 'none',
                fontSize: 13,
                background: '#fff',
                color: '#1A3C5A',
              }}
            />
          </div>
        )}
      </div>

      {/* Lista */}
      {visiveis.length === 0 ? (
        <div style={{ padding: '18px 4px', color: '#9CA3AF', fontSize: 13.5 }}>
          Nenhum atendente com esse nome.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 8 }}>
          {visiveis.map((c) => (
            <div
              key={c.atendente}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                background: '#F8FAFC',
                border: '1px solid #EEF2F7',
                borderRadius: 12,
                padding: '8px 10px',
                minWidth: 0,
              }}
            >
              <div
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: '50%',
                  background: '#E2E8F0',
                  color: '#475569',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: 11,
                  flexShrink: 0,
                }}
              >
                {iniciais(c.atendente)}
              </div>
              <div
                title={formatarNome(c.atendente)}
                style={{
                  flex: 1,
                  minWidth: 0,
                  fontSize: 13.5,
                  fontWeight: 600,
                  color: '#1A3C5A',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {formatarNome(c.atendente)}
              </div>
              <span
                title={`${c.finalizadas} conversas já encerradas`}
                style={{
                  flexShrink: 0,
                  fontSize: 11.5,
                  fontWeight: 700,
                  color: '#15803D',
                  background: '#DCFCE7',
                  borderRadius: 999,
                  padding: '3px 9px',
                }}
              >
                {c.finalizadas} encerradas
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Ver todos / ver menos — só quando há gente escondida */}
      {!buscando && filtrada.length > LIMITE && (
        <button
          onClick={() => setExpandido((v) => !v)}
          style={{
            marginTop: 12,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            height: 34,
            padding: '0 14px',
            borderRadius: 999,
            border: '1px solid #DCE6EF',
            background: '#fff',
            color: '#1A3C5A',
            fontSize: 12.5,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          {expandido ? (
            <>
              <ChevronUp size={15} /> Mostrar menos
            </>
          ) : (
            <>
              <ChevronDown size={15} /> Ver todos os {filtrada.length} atendentes ({escondidos} ocultos)
            </>
          )}
        </button>
      )}
    </div>
  )
}
