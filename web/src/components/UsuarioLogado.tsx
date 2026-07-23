'use client'

import { useEffect, useState } from 'react'
import { formatarNome, formatarDuracao } from '@/lib/utils'

const CORES: Record<string, string> = {
  ADMIN: '#DC2626',
  GESTOR: '#7C3AED',
  SUPERVISOR: '#2563EB',
  COLABORADOR: '#16A34A',
}

/** Iniciais para o círculo (João Vitor → JV). */
function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/).filter((p) => p.length > 2)
  if (partes.length === 0) return nome.slice(0, 2).toUpperCase()
  const primeira = partes[0][0]
  const ultima = partes.length > 1 ? partes[partes.length - 1][0] : ''
  return (primeira + ultima).toUpperCase()
}

/** Quem está usando o sistema agora: nome, papel, hora de entrada e tempo de sessão. */
export default function UsuarioLogado({
  nome,
  email,
  rotulo,
  role,
  atendente,
  entrouEm,
  recolhido,
}: {
  nome: string | null
  email: string | null
  rotulo: string
  role: string
  atendente: string | null
  entrouEm: string | null
  recolhido: boolean
}) {
  // O "há X min" depende da hora atual, que difere entre servidor e navegador.
  // Só mostramos depois de montar no navegador — senão o texto do HTML do
  // servidor não bate com o do cliente e o React reclama (erro de hidratação #418).
  const [montado, setMontado] = useState(false)
  const [, redesenhar] = useState(0)
  useEffect(() => {
    setMontado(true)
    if (!entrouEm) return
    const t = setInterval(() => redesenhar((n) => n + 1), 30_000)
    return () => clearInterval(t)
  }, [entrouEm])

  const exibido = formatarNome(nome) !== '—' ? formatarNome(nome) : (email ?? 'Usuário')
  const cor = CORES[role] ?? '#4B7BA6'

  const hora = entrouEm
    ? new Date(entrouEm).toLocaleTimeString('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null

  if (recolhido) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0' }}>
        <div
          title={`${exibido} · ${rotulo}${hora ? ` · entrou às ${hora}` : ''}`}
          style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: cor,
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 11,
            fontWeight: 700,
          }}
        >
          {iniciais(exibido)}
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: '50%',
            background: cor,
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 12,
            fontWeight: 700,
            flexShrink: 0,
          }}
        >
          {iniciais(exibido)}
        </div>
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              color: 'white',
              fontSize: 13,
              fontWeight: 600,
              lineHeight: 1.25,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
            title={email ?? undefined}
          >
            {exibido}
          </div>
          <div style={{ display: 'inline-block', marginTop: 3 }}>
            <span
              style={{
                background: cor,
                color: 'white',
                fontSize: 9.5,
                fontWeight: 700,
                padding: '2px 7px',
                borderRadius: 999,
                letterSpacing: 0.3,
                textTransform: 'uppercase',
              }}
            >
              {rotulo}
            </span>
          </div>
        </div>
      </div>

      {atendente && (
        <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 10.5, marginBottom: 4 }}>
          Atendente: {formatarNome(atendente)}
        </div>
      )}

      {hora && (
        <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 10.5, lineHeight: 1.5 }}>
          Entrou às {hora}
          {/* "há X" só depois de montar: depende da hora atual e não pode divergir do servidor. */}
          {montado && entrouEm ? ` · há ${formatarDuracao(entrouEm)}` : ''}
        </div>
      )}
    </div>
  )
}
