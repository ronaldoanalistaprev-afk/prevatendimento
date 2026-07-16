'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Loader2 } from 'lucide-react'
import { TELAS } from '@/lib/telas'

export interface PapelColuna {
  codigo: string
  nome: string
}

/**
 * Editor da matriz de permissões (papel × tela). Só o Admin usa.
 * As colunas são os papéis vindos de Configurações → Papéis (o ADMIN fica de fora: vê tudo sempre).
 */
export default function EditorPermissoes({ atual, papeis }: { atual: Record<string, string[]>; papeis: PapelColuna[] }) {
  const router = useRouter()
  // estado: matriz[tela][papel] = true/false
  const inicial: Record<string, Record<string, boolean>> = {}
  for (const t of TELAS) {
    inicial[t.chave] = {}
    for (const p of papeis) inicial[t.chave][p.codigo] = (atual[t.chave] ?? []).includes(p.codigo)
  }
  const [matriz, setMatriz] = useState(inicial)
  const [salvando, setSalvando] = useState(false)
  const [msg, setMsg] = useState<{ tipo: 'ok' | 'erro'; texto: string } | null>(null)

  function toggle(tela: string, papel: string) {
    setMatriz((m) => ({ ...m, [tela]: { ...m[tela], [papel]: !m[tela][papel] } }))
    setMsg(null)
  }

  async function salvar() {
    setSalvando(true)
    setMsg(null)
    const itens: { tela: string; role: string; permitido: boolean }[] = []
    for (const t of TELAS) for (const p of papeis) itens.push({ tela: t.chave, role: p.codigo, permitido: matriz[t.chave][p.codigo] })
    try {
      const res = await fetch('/api/permissoes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ itens }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.erro ?? 'Falha ao salvar')
      setMsg({ tipo: 'ok', texto: 'Permissões salvas. O menu já reflete as mudanças.' })
      router.refresh()
    } catch (e) {
      setMsg({ tipo: 'erro', texto: (e as Error).message })
    } finally {
      setSalvando(false)
    }
  }

  if (papeis.length === 0) {
    return (
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #EEF2F7', padding: '30px 20px', textAlign: 'center', color: '#9CA3AF', fontSize: 13.5 }}>
        Não há papéis para configurar além do Administrador.
      </div>
    )
  }

  return (
    <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #EEF2F7', boxShadow: '0 8px 24px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5, minWidth: 560 }}>
          <thead>
            <tr style={{ background: '#F8FAFC', color: '#6B7280', textAlign: 'left' }}>
              <th style={{ padding: '12px 20px', fontWeight: 600 }}>Tela</th>
              {papeis.map((p) => (
                <th key={p.codigo} style={{ padding: '12px 14px', fontWeight: 600, textAlign: 'center' }}>{p.nome}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TELAS.map((t) => (
              <tr key={t.chave} style={{ borderTop: '1px solid #F1F5F9' }}>
                <td style={{ padding: '12px 20px' }}>
                  <div style={{ fontWeight: 600, color: '#1A3C5A' }}>{t.label}</div>
                  <div style={{ fontSize: 11.5, color: '#9CA3AF' }}>{t.descricao}</div>
                </td>
                {papeis.map((p) => (
                  <td key={p.codigo} style={{ padding: '12px 14px', textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={matriz[t.chave]?.[p.codigo] ?? false}
                      onChange={() => toggle(t.chave, p.codigo)}
                      style={{ width: 20, height: 20, cursor: 'pointer', accentColor: '#16A34A' }}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', borderTop: '1px solid #F1F5F9', flexWrap: 'wrap' }}>
        <button
          onClick={salvar}
          disabled={salvando}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8, height: 42, padding: '0 22px', borderRadius: 12, border: 'none', background: salvando ? '#6B7280' : 'linear-gradient(135deg, #1A3C5A, #16A34A)', color: '#fff', fontWeight: 700, fontSize: 14, cursor: salvando ? 'wait' : 'pointer' }}
        >
          {salvando ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />} Salvar permissões
        </button>
        <span style={{ fontSize: 12.5, color: '#9CA3AF' }}>O Administrador sempre vê tudo (não aparece na tabela).</span>
        {msg && <span style={{ fontSize: 13, fontWeight: 600, color: msg.tipo === 'ok' ? '#15803D' : '#B91C1C' }}>{msg.texto}</span>}
      </div>
    </div>
  )
}
