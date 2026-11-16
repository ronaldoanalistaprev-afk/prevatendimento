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
    return <div className="cartao"><div className="vazio"><p className="vazio-texto">Não há papéis para configurar além do Administrador.</p></div></div>
  }

  return (
    <section className="cartao" style={{ overflow: 'hidden' }}>
      <div className="tabela-caixa" style={{ overflowX: 'auto' }}>
        <table className="tabela" style={{ minWidth: 560 }}>
          <thead>
            <tr>
              <th>Tela</th>
              {papeis.map((p) => (<th key={p.codigo} style={{ textAlign: 'center' }}>{p.nome}</th>))}
            </tr>
          </thead>
          <tbody>
            {TELAS.map((t) => (
              <tr key={t.chave}>
                <td>
                  <div style={{ fontWeight: 600, color: 'var(--tinta)' }}>{t.label}</div>
                  <div className="texto-apoio" style={{ fontSize: 'var(--t-pequeno)' }}>{t.descricao}</div>
                </td>
                {papeis.map((p) => (
                  <td key={p.codigo} style={{ textAlign: 'center' }}>
                    <input type="checkbox" checked={matriz[t.chave]?.[p.codigo] ?? false} onChange={() => toggle(t.chave, p.codigo)} aria-label={`${p.nome} vê ${t.label}`} style={{ width: 20, height: 20, cursor: 'pointer', accentColor: 'var(--acao)' }} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="janela-pe" style={{ justifyContent: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
        <button className="botao botao-principal" onClick={salvar} disabled={salvando}>
          {salvando ? <Loader2 className="icone icone-p animate-spin" aria-hidden="true" focusable="false" /> : <Check className="icone icone-p" aria-hidden="true" focusable="false" />} Salvar permissões
        </button>
        <span className="texto-apoio">O Administrador sempre vê tudo (não aparece na tabela).</span>
        {msg && <span style={{ fontSize: 13.5, fontWeight: 600, color: msg.tipo === 'ok' ? 'var(--sucesso)' : 'var(--perigo)' }}>{msg.texto}</span>}
      </div>
    </section>
  )
}
